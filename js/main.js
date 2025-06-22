// Main page initialization
document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedCourses();
    initializeAnimations();
    initializeStats();
});

// Load featured courses
async function loadFeaturedCourses() {
    const container = document.getElementById('featured-courses');
    if (!container) return;
    
    utils.showLoading(container);
    
    try {
        const courses = await dbHelpers.getCourses({ featured: true });
        
        if (courses.length === 0) {
            container.innerHTML = '<p class="text-center">현재 추천 과정이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = courses.slice(0, 3).map(course => `
            <div class="course-card fade-in" onclick="window.location.href='${BASE_PATH}/course-detail.html?id=${course.id}'">
                <div class="course-card-image">
                    <img src="${course.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'}" 
                         alt="${course.name}"
                         loading="lazy">
                    <div class="course-type-badge">${course.type}</div>
                </div>
                <div class="course-card-content">
                    <h3 class="course-card-title">${course.name}</h3>
                    <p class="course-card-price">${utils.formatPrice(course.price)}</p>
                </div>
            </div>
        `).join('');
        
        // Trigger animations
        observeElements();
        
    } catch (error) {
        console.error('Error loading featured courses:', error);
        utils.showError(container, '추천 과정을 불러오는 중 오류가 발생했습니다.');
    }
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    observeElements();
    
    // Parallax effect for hero
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = hero.querySelector('.hero-video');
            if (parallax) {
                parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
            }
        });
    }
}

// Observe elements for animations
function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
}

// Initialize stats counter
function initializeStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, {
        threshold: 0.5
    });
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// Animate counter
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Hero video error handling
document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('.hero-video video');
    if (video) {
        video.addEventListener('error', function() {
            // Fallback to static image if video fails
            const heroVideo = document.querySelector('.hero-video');
            if (heroVideo) {
                heroVideo.innerHTML = `
                    <img src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600" 
                         alt="Hero background"
                         style="width: 100%; height: 100%; object-fit: cover; opacity: 0.5;">
                `;
            }
        });
    }
});

// Add smooth reveal for sections
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.8) {
            section.classList.add('section-visible');
        }
    });
});

// CTA button hover effect
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mouseenter', function(e) {
        const x = e.pageX - this.offsetLeft;
        const y = e.pageY - this.offsetTop;
        
        const ripple = document.createElement('span');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});
