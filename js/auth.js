// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
});

// Toggle password visibility
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleBtn = passwordField.nextElementSibling.nextElementSibling;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passwordField.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    showLoadingButton(e.target.querySelector('button[type="submit"]'), '로그인 중...');
    clearMessages();
    
    try {
        // Set persistence based on remember me
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await firebase.auth().setPersistence(persistence);
        
        // Sign in
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
            showError('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
            await firebase.auth().signOut();
            return;
        }
        
        // Check if user document exists
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(userCredential.user.uid)
            .get();
        
        if (!userDoc.exists) {
            // Create user document if it doesn't exist
            await createUserDocument(userCredential.user);
        }
        
        showSuccess('로그인 성공! 잠시 후 이동합니다...');
        
        // Redirect after successful login
        setTimeout(() => {
            const redirectUrl = getUrlParameter('redirect') || '/';
            window.location.href = redirectUrl;
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
    } finally {
        resetButton(e.target.querySelector('button[type="submit"]'), '로그인');
    }
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const phone = document.getElementById('phone').value;
    const agreeTerms = document.getElementById('agree-terms').checked;
    
    // Validation
    if (password !== confirmPassword) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (password.length < 6) {
        showError('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
    }
    
    if (!agreeTerms) {
        showError('이용약관에 동의해주세요.');
        return;
    }
    
    showLoadingButton(e.target.querySelector('button[type="submit"]'), '가입 중...');
    clearMessages();
    
    try {
        // Create user account
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Send email verification
        await userCredential.user.sendEmailVerification();
        
        // Create user document in Firestore
        await firebase.firestore().collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            phone: phone,
            role: 'student',
            isAdmin: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            emailVerified: false
        });
        
        // Sign out immediately after signup
        await firebase.auth().signOut();
        
        showSuccess('회원가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해주세요.');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        handleAuthError(error);
    } finally {
        resetButton(e.target.querySelector('button[type="submit"]'), '회원가입');
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    
    showLoadingButton(e.target.querySelector('button[type="submit"]'), '전송 중...');
    clearMessages();
    
    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showSuccess('비밀번호 재설정 이메일을 전송했습니다. 이메일을 확인해주세요.');
        
        // Clear form
        e.target.reset();
        
    } catch (error) {
        console.error('Password reset error:', error);
        handleAuthError(error);
    } finally {
        resetButton(e.target.querySelector('button[type="submit"]'), '비밀번호 재설정');
    }
}

// Login with Google
async function loginWithGoogle() {
    clearMessages();
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        
        // Check if user document exists
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(result.user.uid)
            .get();
        
        if (!userDoc.exists) {
            // Create user document for Google users
            await createUserDocument(result.user);
        }
        
        showSuccess('로그인 성공! 잠시 후 이동합니다...');
        
        setTimeout(() => {
            const redirectUrl = getUrlParameter('redirect') || '/';
            window.location.href = redirectUrl;
        }, 1500);
        
    } catch (error) {
        console.error('Google login error:', error);
        handleAuthError(error);
    }
}

// Create user document
async function createUserDocument(user) {
    return firebase.firestore().collection('users').doc(user.uid).set({
        name: user.displayName || 'Google User',
        email: user.email,
        photoURL: user.photoURL || null,
        role: 'student',
        isAdmin: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        emailVerified: user.emailVerified
    });
}

// Handle authentication errors
function handleAuthError(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            showError('등록되지 않은 이메일입니다.');
            break;
        case 'auth/wrong-password':
            showError('비밀번호가 올바르지 않습니다.');
            break;
        case 'auth/email-already-in-use':
            showError('이미 사용 중인 이메일입니다.');
            break;
        case 'auth/weak-password':
            showError('비밀번호가 너무 약합니다.');
            break;
        case 'auth/invalid-email':
            showError('올바른 이메일 형식이 아닙니다.');
            break;
        case 'auth/operation-not-allowed':
            showError('이 작업은 현재 허용되지 않습니다.');
            break;
        case 'auth/popup-closed-by-user':
            showError('로그인이 취소되었습니다.');
            break;
        default:
            showError('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// UI Helper Functions
function showLoadingButton(button, text) {
    button.disabled = true;
    button.innerHTML = `<span class="loading"></span> ${text}`;
}

function resetButton(button, text) {
    button.disabled = false;
    button.innerHTML = text;
}

function showError(message) {
    const container = document.querySelector('.auth-form-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    container.insertBefore(errorDiv, container.querySelector('.auth-form'));
}

function showSuccess(message) {
    const container = document.querySelector('.auth-form-container');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    container.insertBefore(successDiv, container.querySelector('.auth-form'));
}

function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}