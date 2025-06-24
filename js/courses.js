// Courses page functionality
let allCourses = [];
let filteredCourses = [];
let displayedCourses = 0;
const coursesPerPage = 9;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        document.querySelector(`input[name="category"][value="${category}"]`).checked = true;
    }
    
    loadCourses();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group')) {
            closeAllDropdowns();
        }
    });
}

// Toggle filter dropdown
function toggleFilterDropdown(type) {
    const dropdown = document.getElementById(`${type}-dropdown`);
    const toggle = dropdown.previousElementSibling;
    
    // Close other dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(d => {
        if (d !== dropdown) {
            d.classList.remove('active');
            d.previousElementSibling.classList.remove('active');
        }
    });
    
    // Toggle current dropdown
    dropdown.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Close all dropdowns
function closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown').forEach(d => {
        d.classList.remove('active');
        d.previousElementSibling.classList.remove('active');
    });
}

// Load courses from Firebase
async function loadCourses() {
    const container = document.getElementById('courses-grid');
    showLoadingSkeleton(container);
    
    try {
        allCourses = await dbHelpers.getCourses();
        applyFilters();
    } catch (error) {
        console.error('Error loading courses:', error);
        showEmptyState(container, '교육과정을 불러오는 중 오류가 발생했습니다.');
    }
}

// Apply filters
function applyFilters() {
    const category = document.querySelector('input[name="category"]:checked').value;
    const type = document.querySelector('input[name="type"]:checked').value;
    const sort = document.querySelector('input[name="sort"]:checked').value;
    
    // Filter courses
    filteredCourses = allCourses.filter(course => {
        if (category !== 'all' && course.category !== category) return false;
        if (type !== 'all' && course.type !== type) return false;
        return true;
    });
    
    // Sort courses
    switch (sort) {
        case 'popular':
            filteredCourses.sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0));
            break;
        case 'price-low':
            filteredCourses.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredCourses.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
        default:
            filteredCourses.sort((a, b) => {
                const dateA = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            break;
    }
    
    // Reset displayed courses
    displayedCourses = 0;
    displayCourses();
    
    // Update results count
    document.getElementById('results-count').textContent = `${filteredCourses.length}개의 교육과정`;
    
    // Close dropdowns
    closeAllDropdowns();
}
// Clear filters
function clearFilters() {
    document.querySelector('input[name="category"][value="all"]').checked = true;
    document.querySelector('input[name="type"][value="all"]').checked = true;
    document.querySelector('input[name="sort"][value="newest"]').checked = true;
    applyFilters();
}

// Display courses
function displayCourses() {
    const container = document.getElementById('courses-grid');
    const loadMoreWrapper = document.getElementById('load-more-wrapper');
    
    if (filteredCourses.length === 0) {
        showEmptyState(container, '조건에 맞는 교육과정이 없습니다.');
        loadMoreWrapper.style.display = 'none';
        return;
    }
    
    // Get courses to display
    const start = displayedCourses;
    const end = Math.min(displayedCourses + coursesPerPage, filteredCourses.length);
    const coursesToShow = filteredCourses.slice(start, end);
    
    // Create HTML
    const html = coursesToShow.map(course => createCourseHTML(course)).join('');
    
    if (displayedCourses === 0) {
        container.innerHTML = html;
    } else {
        container.insertAdjacentHTML('beforeend', html);
    }
    
    displayedCourses = end;
    
    // Show/hide load more button
    if (displayedCourses >= filteredCourses.length) {
        loadMoreWrapper.style.display = 'none';
    } else {
        loadMoreWrapper.style.display = 'block';
    }
    
    // Trigger animations
    observeElements();
}

// Load more courses
function loadMoreCourses() {
    displayCourses();
}

// Create course HTML
function createCourseHTML(course) {
    const enrollmentRate = course.maxEnrollments ? 
        Math.round((course.enrollments || 0) / course.maxEnrollments * 100) : 0;
    
    return `
        <div class="course-item fade-in" onclick="window.location.href='${BASE_PATH}/course-detail.html?id=${course.id}'">
            <div class="course-image">
                ${course.image ? 
                    `<img src="${course.image}" alt="${course.name}" loading="lazy">` : 
                    '<div class="course-placeholder">이미지 준비중</div>'
                }
                <div class="course-badges">
                    <span class="badge badge-type">${course.type}</span>
                    ${course.featured ? '<span class="badge">FEATURED</span>' : ''}
                </div>
            </div>
            <div class="course-info">
                <div class="course-category">${getCategoryName(course.category)}</div>
                <h3 class="course-name">${course.name}</h3>
                <div class="course-meta">
                    <span class="course-price">${utils.formatPrice(course.price)}</span>
                    <span class="course-duration">${course.sessions}회</span>
                </div>
                <div class="course-progress">
                    <div class="progress-bar" style="width: ${enrollmentRate}%"></div>
                </div>
                <div class="course-enrollment">
                    ${course.enrollments || 0}/${course.maxEnrollments || 20}명 신청
                </div>
            </div>
        </div>
    `;
}

// Get category display name
function getCategoryName(category) {
    const names = {
        'cut': '컷',
        'color': '컬러',
        'perm': '펌',
        'dye': '염색',
        'marketing': '마케팅',
        'management': '관리자교육'
    };
    return names[category] || category;
}

// Show loading skeleton
function showLoadingSkeleton(container) {
    const skeletons = Array(6).fill('').map(() => `
        <div class="course-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
        </div>
    `).join('');
    
    container.innerHTML = skeletons;
}

// Show empty state
function showEmptyState(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>${message}</h3>
            <p>다른 조건으로 검색해보세요.</p>
            <button class="btn btn-primary" onclick="clearFilters()">필터 초기화</button>
        </div>
    `;
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
    
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
        observer.observe(el);
    });
}
