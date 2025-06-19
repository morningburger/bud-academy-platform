// About page functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeCounters();
    initializeTimeline();
    updateLinks();
});

// Update links with BASE_PATH
function updateLinks() {
    // Update navigation links
    document.querySelectorAll('a[href="courses.html"]').forEach(link => {
        link.href = `${BASE_PATH}/courses.html`;
    });
    
    document.querySelectorAll('a[href="contact.html"]').forEach(link => {
        link.href = `${BASE_PATH}/contact.html`;
    });
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special animation for value cards
                if (entry.target.classList.contains('value-card')) {
                    animateValueCard(entry.target);
                }
                
                // Special animation for timeline items
                if (entry.target.classList.contains('timeline-item')) {
                    animateTimelineItem(entry.target);
                }
            }
        });
    }, {
        threshold: 0.1
    });
    
    // Observe elements
    document.querySelectorAll('.value-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
    
    document.querySelectorAll('.timeline-item').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
    
    document.querySelectorAll('.team-member').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Animate value cards
function animateValueCard(card) {
    const cards = Array.from(document.querySelectorAll('.value-card'));
    const index = cards.indexOf(card);
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, index * 100);
}

// Animate timeline items
function animateTimelineItem(item) {
    const items = Array.from(document.querySelectorAll('.timeline-item'));
    const index = items.indexOf(item);
    
    setTimeout(() => {
        item.style.transition = 'all 0.6s ease-out';
        item.style.opacity = '1';
    }, index * 150);
}

// Initialize counters
function initializeCounters() {
    const stats = [
        { element: document.querySelector('.stat h3'), target: 15, suffix: '+' },
        { element: document.querySelectorAll('.stat h3')[1], target: 5000, suffix: '+' },
        { element: document.querySelectorAll('.stat h3')[2], target: 98, suffix: '%' }
    ];
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const stat = stats.find(s => s.element === entry.target);
                if (stat) {
                    animateCounter(stat.element, stat.target, stat.suffix);
                }
            }
        });
    }, {
        threshold: 0.5
    });
    
    stats.forEach(stat => {
        if (stat.element) {
            observer.observe(stat.element);
        }
    });
}

// Animate counter
function animateCounter(element, target, suffix = '') {
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// Initialize timeline
function initializeTimeline() {
    // Add hover effects to timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.querySelector('.timeline-year').style.transform = 'translate(-50%, -50%) scale(1.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.querySelector('.timeline-year').style.transform = 'translate(-50%, -50%) scale(1)';
        });
    });
}

// Parallax effect for hero image
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroImage = document.querySelector('.hero-image img');
    
    if (heroImage) {
        heroImage.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Team member hover effect
document.querySelectorAll('.team-member').forEach(member => {
    member.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    member.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Smooth reveal for sections
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.8 && !section.classList.contains('visible')) {
            section.classList.add('visible');
        }
    });
});

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});