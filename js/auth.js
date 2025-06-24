// Auth page functionality

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        setupPasswordValidation();
        
        // Check if user is already logged in
        if (window.currentUser) {
            window.location.href = `${window.BASE_PATH}/`;
        }
    }, 500);
});

// Switch between forms
function switchToLogin() {
    hideAllForms();
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.classList.remove('hidden');
    }
}

function switchToSignup() {
    hideAllForms();
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.classList.remove('hidden');
    }
}

function showForgotPassword() {
    hideAllForms();
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.classList.remove('hidden');
    }
}

function hideAllForms() {
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
}

// Setup password validation
function setupPasswordValidation() {
    const password = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-password-confirm');
    const errorMessage = document.getElementById('password-error');
    
    if (password && confirmPassword && errorMessage) {
        const validatePasswords = () => {
            if (confirmPassword.value && password.value !== confirmPassword.value) {
                errorMessage.classList.remove('hidden');
                confirmPassword.setCustomValidity('Passwords do not match');
            } else {
                errorMessage.classList.add('hidden');
                confirmPassword.setCustomValidity('');
            }
        };
        
        password.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert('Firebase가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    if (btnText) btnText.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberMeInput = document.getElementById('remember-me');
    
    if (!emailInput || !passwordInput) {
        alert('입력 필드를 찾을 수 없습니다.');
        resetButton();
        return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;
    
    try {
        const auth = firebase.auth();
        
        // Set persistence based on remember me
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        if (window.utils) {
            window.utils.showSuccess('로그인 성공!');
        } else {
            alert('로그인 성공!');
        }
        
        // Redirect after a short delay
        setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || `${window.BASE_PATH}/`;
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        
        let message = '로그인 중 오류가 발생했습니다.';
        if (error.code === 'auth/user-not-found') {
            message = '등록되지 않은 이메일입니다.';
        } else if (error.code === 'auth/wrong-password') {
            message = '비밀번호가 올바르지 않습니다.';
        } else if (error.code === 'auth/invalid-email') {
            message = '올바른 이메일 형식이 아닙니다.';
        } else if (error.code === 'auth/too-many-requests') {
            message = '너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.';
        }
        
        alert(message);
    } finally {
        resetButton();
    }
    
    function resetButton() {
        // Reset button
        if (btnText) btnText.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert('Firebase가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    if (btnText) btnText.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    
    if (!nameInput || !emailInput || !passwordInput) {
        alert('입력 필드를 찾을 수 없습니다.');
        resetButton();
        return;
    }
    
    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    
    try {
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // Create user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: name
        });
        
        // Create user profile in Firestore
        if (window.dbHelpers) {
            await window.dbHelpers.createUserProfile({
                uid: user.uid,
                name: name,
                email: email,
                role: 'student'
            });
        } else {
            // Fallback if dbHelpers is not available
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'student',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Send verification email
        await user.sendEmailVerification();
        
        if (window.utils) {
            window.utils.showSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        } else {
            alert('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        }
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = `${window.BASE_PATH}/`;
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        let message = '회원가입 중 오류가 발생했습니다.';
        if (error.code === 'auth/email-already-in-use') {
            message = '이미 사용 중인 이메일입니다.';
        } else if (error.code === 'auth/weak-password') {
            message = '비밀번호는 최소 6자 이상이어야 합니다.';
        } else if (error.code === 'auth/invalid-email') {
            message = '올바른 이메일 형식이 아닙니다.';
        } else if (error.code === 'auth/operation-not-allowed') {
            message = '이메일 회원가입이 비활성화되어 있습니다.';
        }
        
        alert(message);
    } finally {
        resetButton();
    }
    
    function resetButton() {
        // Reset button
        if (btnText) btnText.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Handle forgot password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert('Firebase가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
        return;
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    if (btnText) btnText.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const emailInput = document.getElementById('forgot-email');
    
    if (!emailInput) {
        alert('이메일 입력 필드를 찾을 수 없습니다.');
        resetButton();
        return;
    }
    
    const email = emailInput.value;
    
    if (!email) {
        alert('이메일을 입력해주세요.');
        resetButton();
        return;
    }
    
    try {
        const auth = firebase.auth();
        await auth.sendPasswordResetEmail(email);
        
        if (window.utils) {
            window.utils.showSuccess('비밀번호 재설정 링크를 이메일로 보냈습니다.');
        } else {
            alert('비밀번호 재설정 링크를 이메일로 보냈습니다.');
        }
        
        // Clear form and switch to login
        form.reset();
        setTimeout(() => {
            switchToLogin();
        }, 2000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let message = '비밀번호 재설정 중 오류가 발생했습니다.';
        if (error.code === 'auth/user-not-found') {
            message = '등록되지 않은 이메일입니다.';
        } else if (error.code === 'auth/invalid-email') {
            message = '올바른 이메일 형식이 아닙니다.';
        } else if (error.code === 'auth/too-many-requests') {
            message = '너무 많은 요청이 있었습니다. 나중에 다시 시도해주세요.';
        }
        
        alert(message);
    } finally {
        resetButton();
    }
    
    function resetButton() {
        // Reset button
        if (btnText) btnText.classList.remove('hidden');
        if (loading) loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined' || !firebase.auth) {
            alert('Firebase가 로드되지 않았습니다. 페이지를 새로고침해주세요.');
            return;
        }
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user profile exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create user profile
            if (window.dbHelpers) {
                await window.dbHelpers.createUserProfile({
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    role: 'student'
                });
            } else {
                // Fallback
                await db.collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    role: 'student',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        if (window.utils) {
            window.utils.showSuccess('로그인 성공!');
        } else {
            alert('로그인 성공!');
        }
        
        // Redirect
        setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || `${window.BASE_PATH}/`;
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Google login error:', error);
        
        let message = 'Google 로그인 중 오류가 발생했습니다.';
        if (error.code === 'auth/popup-closed-by-user') {
            message = '로그인이 취소되었습니다.';
        } else if (error.code === 'auth/popup-blocked') {
            message = '팝업이 차단되었습니다. 팝업을 허용해주세요.';
        }
        
        alert(message);
    }
}

// Admin login functions
function showAdminLogin() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    const adminId = document.getElementById('admin-id');
    const adminPassword = document.getElementById('admin-password');
    
    if (modal) modal.classList.add('hidden');
    if (adminId) adminId.value = '';
    if (adminPassword) adminPassword.value = '';
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const adminIdInput = document.getElementById('admin-id');
    const adminPasswordInput = document.getElementById('admin-password');
    
    if (!adminIdInput || !adminPasswordInput) {
        alert('입력 필드를 찾을 수 없습니다.');
        return;
    }
    
    const adminId = adminIdInput.value;
    const adminPassword = adminPasswordInput.value;
    
    // Check admin credentials (in production, this should be done server-side)
    if (adminId === 'igcorp' && adminPassword === 'Igcorp192837!') {
        // 임시로 관리자 정보를 세션에 저장
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminUser', adminId);
        
        if (window.utils) {
            window.utils.showSuccess('관리자 로그인 성공!');
        } else {
            alert('관리자 로그인 성공!');
        }
        
        setTimeout(() => {
            window.location.href = `${window.BASE_PATH}/admin/dashboard.html`;
        }, 1000);
    } else {
        alert('관리자 ID 또는 비밀번호가 올바르지 않습니다.');
    }
}

// Close modal on outside click
document.addEventListener('click', function(event) {
    const modal = document.getElementById('admin-modal');
    if (event.target === modal) {
        closeAdminModal();
    }
});

// Make functions globally available
window.switchToLogin = switchToLogin;
window.switchToSignup = switchToSignup;
window.showForgotPassword = showForgotPassword;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleForgotPassword = handleForgotPassword;
window.loginWithGoogle = loginWithGoogle;
window.showAdminLogin = showAdminLogin;
window.closeAdminModal = closeAdminModal;
window.handleAdminLogin = handleAdminLogin;
