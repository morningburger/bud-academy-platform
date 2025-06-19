// Load header and footer components
document.addEventListener('DOMContentLoaded', async function() {
    // Load header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const headerResponse = await fetch('/components/header.html');
        const headerHTML = await headerResponse.text();
        headerContainer.innerHTML = headerHTML;
        initializeHeader();
    }
    
    // Load footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        const footerResponse = await fetch('/components/footer.html');
        const footerHTML = await footerResponse.text();
        footerContainer.innerHTML = footerHTML;
    }
});

// Initialize header functionality
function initializeHeader() {
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Header scroll effect
    const header = document.querySelector('.header');
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

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
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

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
    }
}

// Show error message
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Logout function
async function logout() {
    try {
        await firebase.auth().signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// Create course card HTML
function createCourseCard(course) {
    const typeClass = course.type === 'hands-on' ? 'hands-on' : 'look-learn';
    
    return `
        <div class="course-card" onclick="window.location.href='/pages/course-detail.html?id=${course.id}'">
            <div class="course-image">
                <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}" 
                     alt="${course.name}">
                <span class="course-type ${typeClass}">${course.type === 'hands-on' ? 'HANDS-ON' : 'LOOK & LEARN'}</span>
            </div>
            <div class="course-content">
                <h3 class="course-title">${course.name}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-info">
                    <span class="course-price">${formatCurrency(course.price)}</span>
                    <span class="course-duration">${course.duration}주 과정</span>
                </div>
                <a href="/pages/course-detail.html?id=${course.id}" class="course-action">
                    자세히 보기 <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
}

// Animate numbers on scroll
function animateNumbers() {
    const numberElements = document.querySelectorAll('[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const target = parseInt(element.getAttribute('data-count'));
                let current = 0;
                const increment = target / 100;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    element.textContent = Math.floor(current);
                }, 20);
                observer.unobserve(element);
            }
        });
    });
    
    numberElements.forEach(element => {
        observer.observe(element);
    });
}

// Smooth scroll to section
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Check if user is admin
async function checkAdminAccess() {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = '/pages/login.html';
        return false;
    }
    
    try {
        const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();
        
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            alert('관리자 권한이 필요합니다.');
            window.location.href = '/';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error checking admin access:', error);
        window.location.href = '/';
        return false;
    }
}

// Export functions for use in other files
window.commonUtils = {
    formatCurrency,
    formatDate,
    showLoading,
    showError,
    logout,
    createCourseCard,
    animateNumbers,
    smoothScrollTo,
    getUrlParameter,
    checkAdminAccess
};