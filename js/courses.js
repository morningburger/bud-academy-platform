// Courses page functionality
let allCourses = [];
let filteredCourses = [];
let currentPage = 1;
const coursesPerPage = 9;
let currentFilters = {
    category: 'all',
    type: 'all',
    sort: 'popularity'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    loadCourses();
    
    // Check for category parameter in URL
    const urlCategory = commonUtils.getUrlParameter('category');
    if (urlCategory) {
        setFilter('category', urlCategory);
    }
});

// Initialize filters
function initializeFilters() {
    // Category filters
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter('category', this.dataset.category);
        });
    });
    
    // Type filters
    document.querySelectorAll('[data-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            setFilter('type', this.dataset.type);
        });
    });
    
    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentFilters.sort = this.value;
            applyFiltersAndSort();
        });
    }
}

// Set filter
function setFilter(filterType, value) {
    currentFilters[filterType] = value;
    
    // Update active states
    document.querySelectorAll(`[data-${filterType}]`).forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset[filterType] === value) {
            btn.classList.add('active');
        }
    });
    
    applyFiltersAndSort();
}

// Load courses from Firebase
async function loadCourses() {
    showLoadingState();
    
    try {
        const courses = await firebaseDB.getAllCourses();
        allCourses = courses;
        applyFiltersAndSort();
    } catch (error) {
        console.error('Error loading courses:', error);
        showEmptyState('강의를 불러오는 중 오류가 발생했습니다.');
    }
}

// Apply filters and sorting
function applyFiltersAndSort() {
    // Filter courses
    filteredCourses = allCourses.filter(course => {
        let matchCategory = currentFilters.category === 'all' || course.category === currentFilters.category;
        let matchType = currentFilters.type === 'all' || course.type === currentFilters.type;
        return matchCategory && matchType;
    });
    
    // Sort courses
    switch (currentFilters.sort) {
        case 'newest':
            filteredCourses.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'price-low':
            filteredCourses.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredCourses.sort((a, b) => b.price - a.price);
            break;
        case 'popularity':
        default:
            filteredCourses.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
    }
    
    // Reset to first page
    currentPage = 1;
    displayCourses();
}

// Display courses
function displayCourses() {
    const coursesGrid = document.getElementById('courses-grid');
    const resultsCount = document.getElementById('results-count');
    
    if (!coursesGrid) return;
    
    // Update results count
    if (resultsCount) {
        resultsCount.textContent = filteredCourses.length;
    }
    
    if (filteredCourses.length === 0) {
        showEmptyState('조건에 맞는 강의가 없습니다.');
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = filteredCourses.slice(0, endIndex);
    
    // Clear grid if starting fresh
    if (currentPage === 1) {
        coursesGrid.innerHTML = '';
    }
    
    // Display courses
    coursesToShow.slice(startIndex).forEach(course => {
        const courseCard = createEnhancedCourseCard(course);
        coursesGrid.appendChild(courseCard);
    });
    
    // Show/hide load more button
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        if (endIndex < filteredCourses.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
    }
}

// Create enhanced course card
function createEnhancedCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const enrollmentPercent = course.maxEnrollments 
        ? Math.round((course.enrollmentCount / course.maxEnrollments) * 100)
        : 0;
    
    const isFull = enrollmentPercent >= 100;
    
    card.innerHTML = `
        <div class="course-image">
            <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}" 
                 alt="${course.name}">
            <span class="course-type ${course.type === 'hands-on' ? 'hands-on' : 'look-learn'}">
                ${course.type === 'hands-on' ? 'HANDS-ON' : 'LOOK & LEARN'}
            </span>
            ${course.isNew ? '<span class="course-badge">NEW</span>' : ''}
            ${isFull ? '<span class="course-badge">마감</span>' : ''}
        </div>
        <div class="course-content">
            <h3 class="course-title">${course.name}</h3>
            <p class="course-description">${course.description}</p>
            
            <div class="course-meta">
                <div class="course-meta-item">
                    <i class="far fa-calendar"></i>
                    <span>${course.duration}주</span>
                </div>
                <div class="course-meta-item">
                    <i class="far fa-clock"></i>
                    <span>${course.schedule}</span>
                </div>
                <div class="course-meta-item">
                    <i class="fas fa-user-graduate"></i>
                    <span>${course.instructor}</span>
                </div>
            </div>
            
            <div class="course-info">
                <span class="course-price">${commonUtils.formatCurrency(course.price)}</span>
                <span class="course-duration">${course.sessions}회</span>
            </div>
            
            <div class="course-enrollment">
                <div class="enrollment-bar">
                    <div class="enrollment-progress" style="width: ${enrollmentPercent}%"></div>
                </div>
                <span class="enrollment-text">${course.enrollmentCount}/${course.maxEnrollments}명</span>
            </div>
            
            <a href="/pages/course-detail.html?id=${course.id}" 
               class="course-action ${isFull ? 'disabled' : ''}">
                ${isFull ? '마감되었습니다' : '자세히 보기'} <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
    
    return card;
}

// Load more courses
function loadMoreCourses() {
    currentPage++;
    displayCourses();
}

// Toggle view (grid/list)
function toggleView() {
    const coursesGrid = document.getElementById('courses-grid');
    const viewToggle = document.querySelector('.view-toggle');
    
    if (coursesGrid.classList.contains('list-view')) {
        coursesGrid.classList.remove('list-view');
        viewToggle.innerHTML = '<i class="fas fa-th-large"></i>';
    } else {
        coursesGrid.classList.add('list-view');
        viewToggle.innerHTML = '<i class="fas fa-list"></i>';
    }
}

// Show loading state
function showLoadingState() {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    coursesGrid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        coursesGrid.innerHTML += `
            <div class="course-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text" style="width: 60%;"></div>
                </div>
            </div>
        `;
    }
}

// Show empty state
function showEmptyState(message) {
    const coursesGrid = document.getElementById('courses-grid');
    if (!coursesGrid) return;
    
    coursesGrid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>강의를 찾을 수 없습니다</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="resetFilters()">필터 초기화</button>
        </div>
    `;
    
    // Hide load more button
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) {
        loadMoreContainer.style.display = 'none';
    }
}

// Reset filters
function resetFilters() {
    currentFilters = {
        category: 'all',
        type: 'all',
        sort: 'popularity'
    };
    
    // Reset UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all' || btn.dataset.type === 'all') {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('sort-select').value = 'popularity';
    
    applyFiltersAndSort();
}