// Base path configuration for GitHub Pages
const BASE_PATH = '/bud-academy-platform';

// Global variables for Firebase
let auth = null;
let db = null;
let currentUser = null;

// Load header and footer
document.addEventListener('DOMContentLoaded', function() {
    loadHeader();
    loadFooter();
    initializeCommon();
});

// Header HTML
function getHeaderHTML() {
    return `
        <header class="header" id="header">
            <div class="container">
                <div class="header-inner">
                    <a href="${BASE_PATH}/" class="logo">
                        BUD<span>ACADEMY</span>
                    </a>
                    
                    <nav class="nav-main" id="navMain">
                        <ul class="nav-links">
                            <li><a href="${BASE_PATH}/" class="nav-link">홈</a></li>
                            <li><a href="${BASE_PATH}/courses.html" class="nav-link">교육과정</a></li>
                            <li><a href="${BASE_PATH}/about.html" class="nav-link">소개</a></li>
                            <li class="auth-required hidden"><a href="${BASE_PATH}/my-courses.html" class="nav-link">내 강의</a></li>
                        </ul>
                        
                        <div class="nav-actions">
                            <div class="user-info"></div>
                            <a href="${BASE_PATH}/login.html" class="btn btn-secondary guest-only">로그인</a>
                            <a href="${BASE_PATH}/admin/dashboard.html" class="btn btn-primary auth-required hidden admin-only">관리자</a>
                        </div>
                    </nav>
                    
                    <button class="mobile-menu-toggle" id="mobileMenuToggle">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>
        </header>
    `;
}

// Footer HTML
function getFooterHTML() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-brand">
                        <h3>BUD ACADEMY</h3>
                        <p>전문 미용교육의 새로운 기준을 제시합니다.</p>
                        <div class="footer-social">
                            <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                            <a href="#" class="social-link"><i class="fab fa-facebook"></i></a>
                            <a href="#" class="social-link"><i class="fab fa-youtube"></i></a>
                        </div>
                    </div>
                    
                    <div class="footer-column">
                        <h4>교육과정</h4>
                        <ul class="footer-links">
                            <li><a href="${BASE_PATH}/courses.html?category=cut">헤어컷</a></li>
                            <li><a href="${BASE_PATH}/courses.html?category=color">컬러링</a></li>
                            <li><a href="${BASE_PATH}/courses.html?category=perm">펌</a></li>
                            <li><a href="${BASE_PATH}/courses.html?category=marketing">마케팅</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h4>아카데미</h4>
                        <ul class="footer-links">
                            <li><a href="${BASE_PATH}/about.html">소개</a></li>
                            <li><a href="${BASE_PATH}/instructors.html">강사진</a></li>
                            <li><a href="${BASE_PATH}/location.html">오시는 길</a></li>
                            <li><a href="${BASE_PATH}/contact.html">문의하기</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-column">
                        <h4>지원</h4>
                        <ul class="footer-links">
                            <li><a href="${BASE_PATH}/faq.html">자주 묻는 질문</a></li>
                            <li><a href="${BASE_PATH}/terms.html">이용약관</a></li>
                            <li><a href="${BASE_PATH}/privacy.html">개인정보처리방침</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p class="footer-copy">&copy; 2024 BUD ACADEMY. All rights reserved.</p>
                    <p class="footer-copy">Made with passion for beauty education</p>
                </div>
            </div>
        </footer>
    `;
}

// Load header
function loadHeader() {
    const headerElement = document.getElementById('main-header');
    if (headerElement) {
        headerElement.innerHTML = getHeaderHTML();
    }
}

// Load footer
function loadFooter() {
    const footerElement = document.getElementById('main-footer');
    if (footerElement) {
        footerElement.innerHTML = getFooterHTML();
    }
}

// Initialize Firebase (Firebase 설정을 여기에 추가하세요)
function initializeFirebase() {
    // Firebase 설정 - 실제 프로젝트 정보로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyD5FWKbT5_D-XcP2lgmDQeQfzbskEcUrC8",
  authDomain: "bud-academy.firebaseapp.com",
  projectId: "bud-academy",
  storageBucket: "bud-academy.firebasestorage.app",
  messagingSenderId: "841659917747",
  appId: "1:841659917747:web:345ca8d4bec9c192c017c6",
  measurementId: "G-XBDN5JT4N5"
};

    // Firebase 초기화
    if (typeof firebase !== 'undefined') {
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
            
            // Auth state listener
            auth.onAuthStateChanged((user) => {
                currentUser = user;
                updateUserInterface();
                checkAdminRole();
            });
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    } else {
        console.warn('Firebase SDK not loaded');
    }
}

// Update user interface based on auth state
function updateUserInterface() {
    const guestElements = document.querySelectorAll('.guest-only');
    const authElements = document.querySelectorAll('.auth-required');
    const userInfoElement = document.querySelector('.user-info');
    
    if (currentUser) {
        // User is signed in
        guestElements.forEach(el => el.classList.add('hidden'));
        authElements.forEach(el => el.classList.remove('hidden'));
        
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <span class="user-name">${currentUser.displayName || currentUser.email}</span>
                <button onclick="handleLogout()" class="btn btn-outline">로그아웃</button>
            `;
        }
    } else {
        // User is signed out
        guestElements.forEach(el => el.classList.remove('hidden'));
        authElements.forEach(el => el.classList.add('hidden'));
        
        if (userInfoElement) {
            userInfoElement.innerHTML = '';
        }
    }
}

// Logout function
async function handleLogout() {
    try {
        if (auth) {
            await auth.signOut();
            sessionStorage.removeItem('isAdmin');
            sessionStorage.removeItem('adminUser');
            utils.showSuccess('로그아웃되었습니다.');
            setTimeout(() => {
                window.location.href = `${BASE_PATH}/`;
            }, 1000);
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// Initialize common functionality
function initializeCommon() {
    // Initialize Firebase first
    initializeFirebase();
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMain = document.getElementById('navMain');
    
    if (mobileMenuToggle && navMain) {
        mobileMenuToggle.addEventListener('click', () => {
            navMain.classList.toggle('active');
            
            // Change icon
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (navMain.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }
    
    // Smooth scroll for anchor links - 수정된 부분
    setTimeout(() => {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        anchorLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href !== '#') {
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }, 100);
}

// Check if user is admin
async function checkAdminRole() {
    if (currentUser && db) {
        try {
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists && userDoc.data().role === 'admin') {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.remove('hidden');
                });
            }
        } catch (error) {
            console.error('Error checking admin role:', error);
        }
    }
    
    // Check session admin status
    if (sessionStorage.getItem('isAdmin') === 'true') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    }
}

// Database helpers
const dbHelpers = {
    async createUserProfile(userData) {
        if (!db) {
            throw new Error('Database not initialized');
        }
        
        try {
            await db.collection('users').doc(userData.uid).set({
                name: userData.name,
                email: userData.email,
                role: userData.role || 'student',
                photoURL: userData.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    }
};

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(price);
}

// Format date
function formatDate(date) {
    if (!date) return '';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(d);
}

// Show loading
function showLoading(container) {
    if (container) {
        container.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
    }
}

// Show error message
function showError(container, message) {
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-toast';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => {
            successDiv.remove();
        }, 300);
    }, 3000);
}

// Utility functions
const utils = {
    formatPrice,
    formatDate,
    showLoading,
    showError,
    showSuccess
};

// Export for use in other files
window.utils = utils;
window.BASE_PATH = BASE_PATH;
window.dbHelpers = dbHelpers;
window.handleLogout = handleLogout;
