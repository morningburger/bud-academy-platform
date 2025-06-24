// Auth page functionality

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordValidation();
    
    // Check if user is already logged in
    if (currentUser) {
        window.location.href = `${BASE_PATH}/`;
    }
});

// Switch between forms
function switchToLogin() {
    hideAllForms();
    document.getElementById('login-form').classList.remove('hidden');
}

function switchToSignup() {
    hideAllForms();
    document.getElementById('signup-form').classList.remove('hidden');
}

function showForgotPassword() {
    hideAllForms();
    document.getElementById('forgot-form').classList.remove('hidden');
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
    
    if (password && confirmPassword) {
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
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    try {
        // Set persistence based on remember me
        const persistence = rememberMe ? 
            firebase.auth.Auth.Persistence.LOCAL : 
            firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        utils.showSuccess('로그인 성공!');
        
        // Redirect after a short delay
        setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || `${BASE_PATH}/`;
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
        }
        
        alert(message);
    } finally {
        // Reset button
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        // Create user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update display name
        await user.updateProfile({
            displayName: name
        });
        
        // Create user profile in Firestore
        await dbHelpers.createUserProfile({
            uid: user.uid,
            name: name,
            email: email,
            role: 'student'
        });
        
        // Send verification email
        await user.sendEmailVerification();
        
        utils.showSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = `${BASE_PATH}/`;
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
        }
        
        alert(message);
    } finally {
        // Reset button
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Handle forgot password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const loading = submitBtn.querySelector('.loading');
    
    // Show loading
    btnText.classList.add('hidden');
    loading.classList.remove('hidden');
    submitBtn.disabled = true;
    
    const email = document.getElementById('forgot-email').value;
    
    try {
        await auth.sendPasswordResetEmail(email);
        
        utils.showSuccess('비밀번호 재설정 링크를 이메일로 보냈습니다.');
        
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
        }
        
        alert(message);
    } finally {
        // Reset button
        btnText.classList.remove('hidden');
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user profile exists
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create user profile
            await dbHelpers.createUserProfile({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                role: 'student'
            });
        }
        
        utils.showSuccess('로그인 성공!');
        
        // Redirect
        setTimeout(() => {
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || `${BASE_PATH}/`;
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        console.error('Google login error:', error);
        alert('Google 로그인 중 오류가 발생했습니다.');
    }
}

// Admin login functions
function showAdminLogin() {
    document.getElementById('admin-modal').classList.remove('hidden');
}

function closeAdminModal() {
    document.getElementById('admin-modal').classList.add('hidden');
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-password').value = '';
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const adminId = document.getElementById('admin-id').value;
    const adminPassword = document.getElementById('admin-password').value;
    
    // Check admin credentials (in production, this should be done server-side)
    if (adminId === 'igcorp' && adminPassword === 'Igcorp192837!') {
        // 임시로 관리자 정보를 세션에 저장
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminUser', adminId);
        
        utils.showSuccess('관리자 로그인 성공!');
        
        setTimeout(() => {
            window.location.href = `${BASE_PATH}/admin/dashboard.html`;
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
