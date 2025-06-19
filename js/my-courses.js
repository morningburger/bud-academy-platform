// My Courses Page functionality
let userEnrollments = [];
let userWishlist = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            await loadUserData();
            initializeTabs();
        } else {
            // Redirect to login if not logged in
            window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }
    });
});

// Initialize tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter and display courses
            currentFilter = this.dataset.status;
            displayCourses();
        });
    });
}

// Load user data
async function loadUserData() {
    showLoadingState();
    
    try {
        const user = firebase.auth().currentUser;
        
        // Load enrollments
        userEnrollments = await firebaseDB.getUserEnrollments();
        
        // Load wishlist
        const userDoc = await firebaseDB.db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const wishlistIds = userDoc.data().wishlist || [];
            userWishlist = await loadWishlistCourses(wishlistIds);
        }
        
        // Update stats
        updateStats();
        
        // Display courses
        displayCourses();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// Load wishlist courses
async function loadWishlistCourses(courseIds) {
    const courses = [];
    for (const courseId of courseIds) {
        const course = await firebaseDB.getCourseById(courseId);
        if (course) {
            courses.push({ course, isWishlist: true });
        }
    }
    return courses;
}

// Update statistics
function updateStats() {
    const totalCourses = userEnrollments.length;
    const completedCourses = userEnrollments.filter(e => e.status === 'completed').length;
    const totalHours = userEnrollments.reduce((sum, e) => {
        return sum + ((e.course.duration || 0) * 40); // Assuming 40 hours per course duration week
    }, 0);
    const certificates = completedCourses; // Same as completed courses
    
    // Animate stats
    animateValue('total-courses', 0, totalCourses, 1000);
    animateValue('completed-courses', 0, completedCourses, 1000);
    animateValue('total-hours', 0, totalHours, 1000);
    animateValue('certificates', 0, certificates, 1000);
}

// Animate value
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Display courses based on filter
function displayCourses() {
    const grid = document.getElementById('my-courses-grid');
    const emptyState = document.getElementById('empty-state');
    
    // Filter courses
    let filteredCourses = [];
    
    switch (currentFilter) {
        case 'active':
            filteredCourses = userEnrollments.filter(e => e.status === 'active');
            break;
        case 'completed':
            filteredCourses = userEnrollments.filter(e => e.status === 'completed');
            break;
        case 'wishlist':
            filteredCourses = userWishlist;
            break;
        case 'all':
        default:
            filteredCourses = [...userEnrollments, ...userWishlist];
    }
    
    // Show empty state if no courses
    if (filteredCourses.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        
        // Update empty state message based on filter
        const emptyMessage = document.querySelector('.empty-state h3');
        const emptyDescription = document.querySelector('.empty-state p');
        
        switch (currentFilter) {
            case 'active':
                emptyMessage.textContent = '수강 중인 강좌가 없습니다';
                emptyDescription.textContent = '새로운 강좌를 시작하고 전문가로 성장하세요!';
                break;
            case 'completed':
                emptyMessage.textContent = '아직 수료한 강좌가 없습니다';
                emptyDescription.textContent = '첫 번째 강좌를 완료하고 수료증을 받아보세요!';
                break;
            case 'wishlist':
                emptyMessage.textContent = '찜한 강좌가 없습니다';
                emptyDescription.textContent = '관심 있는 강좌를 찜하고 나중에 확인하세요!';
                break;
        }
        return;
    }
    
    // Show courses
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';
    
    filteredCourses.forEach(item => {
        const courseCard = createMyCourseCard(item);
        grid.appendChild(courseCard);
    });
}

// Create course card for my courses
function createMyCourseCard(enrollmentData) {
    const card = document.createElement('div');
    card.className = 'my-course-card';
    
    const course = enrollmentData.course;
    const isWishlist = enrollmentData.isWishlist || false;
    const progress = enrollmentData.progress || 0;
    const status = enrollmentData.status || 'wishlist';
    
    // Determine status badge
    let statusBadge = '';
    if (isWishlist) {
        statusBadge = '<span class="course-status-badge wishlist">찜한 강좌</span>';
    } else if (status === 'completed') {
        statusBadge = '<span class="course-status-badge completed">수료 완료</span>';
    } else {
        statusBadge = '<span class="course-status-badge">수강 중</span>';
    }
    
    // Determine actions
    let actions = '';
    if (isWishlist) {
        actions = `
            <a href="/pages/course-detail.html?id=${course.id}" class="btn btn-continue">
                자세히 보기
            </a>
            <button class="btn btn-secondary" onclick="removeFromWishlist('${course.id}')">
                찜 해제
            </button>
        `;
    } else if (status === 'completed') {
        actions = `
            <button class="btn btn-certificate" onclick="downloadCertificate('${enrollmentData.id}')">
                <i class="fas fa-download"></i> 수료증
            </button>
            <button class="btn btn-secondary" onclick="viewCourseDetails('${course.id}')">
                복습하기
            </button>
        `;
    } else {
        actions = `
            <button class="btn btn-continue" onclick="continueLearning('${course.id}')">
                이어서 학습
            </button>
            <button class="btn btn-secondary" onclick="viewCourseDetails('${course.id}')">
                상세보기
            </button>
        `;
    }
    
    card.innerHTML = `
        <div class="my-course-image">
            <img src="${course.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}" 
                 alt="${course.name}">
            ${statusBadge}
        </div>
        <div class="my-course-content">
            <h3 class="my-course-title">${course.name}</h3>
            <div class="my-course-instructor">
                <i class="fas fa-user-graduate"></i>
                <span>${course.instructor}</span>
            </div>
            
            ${!isWishlist ? `
                <div class="course-progress">
                    <div class="progress-info">
                        <span class="progress-label">진도율</span>
                        <span class="progress-value">${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            ` : ''}
            
            <div class="my-course-actions">
                ${actions}
            </div>
        </div>
    `;
    
    return card;
}

// Continue learning
function continueLearning(courseId) {
    // In a real app, this would go to a learning platform
    window.location.href = `/pages/course-detail.html?id=${courseId}`;
}

// View course details
function viewCourseDetails(courseId) {
    window.location.href = `/pages/course-detail.html?id=${courseId}`;
}

// Download certificate
async function downloadCertificate(enrollmentId) {
    try {
        // In a real app, this would generate and download a PDF certificate
        alert('수료증 다운로드 기능은 준비 중입니다.');
    } catch (error) {
        console.error('Error downloading certificate:', error);
        alert('수료증 다운로드 중 오류가 발생했습니다.');
    }
}

// Remove from wishlist
async function removeFromWishlist(courseId) {
    if (!confirm('이 강좌를 찜 목록에서 제거하시겠습니까?')) {
        return;
    }
    
    try {
        const user = firebase.auth().currentUser;
        await firebaseDB.db.collection('users').doc(user.uid).update({
            wishlist: firebase.firestore.FieldValue.arrayRemove(courseId)
        });
        
        // Remove from local array
        userWishlist = userWishlist.filter(item => item.course.id !== courseId);
        
        // Update display
        displayCourses();
        
        alert('찜 목록에서 제거되었습니다.');
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// Show loading state
function showLoadingState() {
    const grid = document.getElementById('my-courses-grid');
    const emptyState = document.getElementById('empty-state');
    
    emptyState.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = '';
    
    // Show skeleton cards
    for (let i = 0; i < 6; i++) {
        grid.innerHTML += `
            <div class="course-card-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line"></div>
                </div>
            </div>
        `;
    }
}

// Show error
function showError(message) {
    const grid = document.getElementById('my-courses-grid');
    const emptyState = document.getElementById('empty-state');
    
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    
    const emptyMessage = document.querySelector('.empty-state h3');
    const emptyDescription = document.querySelector('.empty-state p');
    const emptyButton = document.querySelector('.empty-state .btn');
    
    emptyMessage.textContent = '오류가 발생했습니다';
    emptyDescription.textContent = message;
    emptyButton.textContent = '새로고침';
    emptyButton.onclick = () => location.reload();
}