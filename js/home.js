// Home page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadPopularCourses();
    initializeAnimations();
    setupCategoryCards();
});

// Load popular courses from Firebase
async function loadPopularCourses() {
    const coursesGrid = document.getElementById('popular-courses-grid');
    if (!coursesGrid) return;
    
    commonUtils.showLoading('popular-courses-grid');
    
    try {
        // Get popular courses (top 6 by enrollment count)
        const courses = await firebaseDB.db.collection(firebaseDB.collections.courses)
            .where('isActive', '==', true)
            .orderBy('enrollmentCount', 'desc')
            .limit(6)
            .get();
        
        if (courses.empty) {
            coursesGrid.innerHTML = '<p class="no-courses">현재 등록된 강의가 없습니다.</p>';
            return;
        }
        
        coursesGrid.innerHTML = '';
        courses.forEach(doc => {
            const course = { id: doc.id, ...doc.data() };
            coursesGrid.innerHTML += commonUtils.createCourseCard(course);
        });
        
    } catch (error) {
        console.error('Error loading popular courses:', error);
        commonUtils.showError('popular-courses-grid', '강의를 불러오는 중 오류가 발생했습니다.');
    }
}

// Initialize animations
function initializeAnimations() {
    // Animate numbers
    commonUtils.animateNumbers();
    
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        }
        
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * parallaxSpeed * 0.8}px)`;
            heroContent.style.opacity = 1 - (scrolled * 0.002);
        }
    });
    
    // Fade in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, observerOptions);
    
    // Add fade-in class to sections
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        section.classList.add('fade-in');
        observer.observe(section);
    });
}

// Setup category cards
function setupCategoryCards() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            window.location.href = `/pages/courses.html?category=${category}`;
        });
    });
}

// Add fade-in animation styles
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    .fade-in-visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .no-courses {
        text-align: center;
        padding: 60px 20px;
        color: var(--color-gray);
        font-size: 1.2rem;
    }
    
    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 300px;
    }
    
    .error-message {
        text-align: center;
        padding: 40px 20px;
        color: var(--color-error);
    }
    
    .error-message i {
        font-size: 3rem;
        margin-bottom: 20px;
        display: block;
    }
`;
document.head.appendChild(style);