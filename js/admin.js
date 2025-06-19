// Admin Dashboard JavaScript

// Global variables
let currentTab = 'dashboard';
let editingCourseId = null;
let charts = {};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', async function() {
    // Check admin authentication
    const isAdmin = sessionStorage.getItem('isAdmin');
    const adminUser = sessionStorage.getItem('adminUser');
    
    if (!isAdmin || isAdmin !== 'true') {
        alert('관리자 권한이 필요합니다.');
        window.location.href = `${BASE_PATH}/login.html`;
        return;
    }
    
    // Set admin username
    document.getElementById('admin-username').textContent = currentUser.displayName || '관리자';
    
    // Initialize dashboard
    initializeSidebar();
    loadDashboard();
});

// Initialize sidebar navigation
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

// Switch between tabs
function switchTab(tab) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tab) {
            item.classList.add('active');
        }
    });
    
    // Hide all tabs
    document.querySelectorAll('.admin-tab').forEach(tabEl => {
        tabEl.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    currentTab = tab;
    
    // Load tab content
    switch (tab) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'students':
            loadStudents();
            break;
        case 'enrollments':
            loadEnrollments();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Load dashboard
async function loadDashboard() {
    try {
        // Load stats
        const [users, courses, enrollments] = await Promise.all([
            db.collection('users').get(),
            db.collection('courses').get(),
            db.collection('enrollments').where('status', '==', 'active').get()
        ]);
        
        document.getElementById('total-users').textContent = users.size;
        document.getElementById('active-courses').textContent = courses.size;
        document.getElementById('active-enrollments').textContent = enrollments.size;
        
        // Calculate monthly revenue (mock data for demo)
        const monthlyRevenue = enrollments.size * 250000;
        document.getElementById('monthly-revenue').textContent = utils.formatPrice(monthlyRevenue);
        
        // Load charts
        loadDashboardCharts();
        
        // Load recent activities
        loadRecentActivities();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load dashboard charts
function loadDashboardCharts() {
    // Enrollment chart
    const enrollmentCtx = document.getElementById('enrollment-chart').getContext('2d');
    
    if (charts.enrollment) {
        charts.enrollment.destroy();
    }
    
    charts.enrollment = new Chart(enrollmentCtx, {
        type: 'line',
        data: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
            datasets: [{
                label: '수강신청',
                data: [12, 19, 15, 25, 22, 30],
                borderColor: '#000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Category chart
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['컷', '컬러', '펌', '염색', '마케팅'],
            datasets: [{
                data: [30, 25, 20, 15, 10],
                backgroundColor: [
                    '#000',
                    '#dc2626',
                    '#6b7280',
                    '#d1d5db',
                    '#f3f4f6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load recent activities
async function loadRecentActivities() {
    const container = document.getElementById('recent-activities');
    
    // Mock activities for demo
    const activities = [
        {
            icon: 'fa-user-plus',
            content: '새로운 회원 가입: 김민수',
            time: '5분 전'
        },
        {
            icon: 'fa-shopping-cart',
            content: '수강신청: 기초 헤어컷 마스터클래스',
            time: '30분 전'
        },
        {
            icon: 'fa-graduation-cap',
            content: '새 과정 추가: 트렌드 컬러링 2024',
            time: '2시간 전'
        }
    ];
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.content}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
}

// Load courses
async function loadCourses() {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">로딩 중...</td></tr>';
    
    try {
        const courses = await dbHelpers.getCourses();
        
        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.id}</td>
                <td>${course.name}</td>
                <td>${getCategoryName(course.category)}</td>
                <td>${utils.formatPrice(course.price)}</td>
                <td>${formatDate(course.startDate)} ~ ${formatDate(course.endDate)}</td>
                <td>${course.enrollments || 0}/${course.maxEnrollments || 20}</td>
                <td><span class="status-badge active">활성</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="editCourse('${course.id}')">
                            <i class="fas fa-edit"></i> 수정
                        </button>
                        <button class="action-btn delete" onclick="deleteCourse('${course.id}')">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading courses:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">과정을 불러올 수 없습니다.</td></tr>';
    }
}

// Load students
async function loadStudents() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">로딩 중...</td></tr>';
    
    try {
        const users = await db.collection('users').where('role', '==', 'student').get();
        
        const students = [];
        users.forEach(doc => {
            students.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        tbody.innerHTML = students.map(student => `
            <tr>
                <td>${student.id.substring(0, 8)}...</td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${formatDate(student.createdAt?.toDate())}</td>
                <td>3개</td>
                <td><span class="status-badge active">활성</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewStudent('${student.id}')">
                            <i class="fas fa-eye"></i> 상세
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading students:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">수강생을 불러올 수 없습니다.</td></tr>';
    }
}

// Load enrollments
async function loadEnrollments() {
    const tbody = document.getElementById('enrollments-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">로딩 중...</td></tr>';
    
    try {
        const enrollments = await db.collection('enrollments').orderBy('enrolledAt', 'desc').limit(50).get();
        
        const enrollmentList = [];
        for (const doc of enrollments.docs) {
            const enrollment = doc.data();
            const [user, course] = await Promise.all([
                db.collection('users').doc(enrollment.userId).get(),
                dbHelpers.getCourse(enrollment.courseId)
            ]);
            
            if (user.exists && course) {
                enrollmentList.push({
                    id: doc.id,
                    ...enrollment,
                    userName: user.data().name,
                    courseName: course.name,
                    coursePrice: course.price
                });
            }
        }
        
        tbody.innerHTML = enrollmentList.map(enrollment => `
            <tr>
                <td>${enrollment.id.substring(0, 8)}...</td>
                <td>${enrollment.userName}</td>
                <td>${enrollment.courseName}</td>
                <td>${formatDate(enrollment.enrolledAt?.toDate())}</td>
                <td>${utils.formatPrice(enrollment.coursePrice)}</td>
                <td><span class="status-badge active">확정</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="viewEnrollment('${enrollment.id}')">
                            <i class="fas fa-eye"></i> 상세
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading enrollments:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">수강신청을 불러올 수 없습니다.</td></tr>';
    }
}

// Load analytics
async function loadAnalytics() {
    // Revenue chart
    const revenueCtx = document.getElementById('revenue-chart').getContext('2d');
    
    if (charts.revenue) {
        charts.revenue.destroy();
    }
    
    charts.revenue = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
            datasets: [{
                label: '매출',
                data: [3000000, 4750000, 3750000, 6250000, 5500000, 7500000],
                backgroundColor: '#000'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₩' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    // Growth chart
    const growthCtx = document.getElementById('growth-chart').getContext('2d');
    
    if (charts.growth) {
        charts.growth.destroy();
    }
    
    charts.growth = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
            datasets: [{
                label: '신규 회원',
                data: [15, 23, 18, 32, 28, 40],
                borderColor: '#dc2626',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Top courses
    loadTopCourses();
    
    // Completion chart
    const completionCtx = document.getElementById('completion-chart').getContext('2d');
    
    if (charts.completion) {
        charts.completion.destroy();
    }
    
    charts.completion = new Chart(completionCtx, {
        type: 'radar',
        data: {
            labels: ['컷', '컬러', '펌', '염색', '마케팅'],
            datasets: [{
                label: '완료율',
                data: [85, 78, 92, 88, 75],
                borderColor: '#000',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Load top courses
async function loadTopCourses() {
    const container = document.getElementById('top-courses');
    
    try {
        const courses = await dbHelpers.getCourses();
        const sorted = courses.sort((a, b) => (b.enrollments || 0) - (a.enrollments || 0)).slice(0, 5);
        
        container.innerHTML = sorted.map((course, index) => `
            <div class="top-course-item">
                <span class="top-course-rank">${index + 1}</span>
                <span class="top-course-name">${course.name}</span>
                <span class="top-course-count">${course.enrollments || 0}명</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading top courses:', error);
    }
}

// Course modal functions
function showCourseModal() {
    editingCourseId = null;
    document.getElementById('course-modal-title').textContent = '새 교육과정 추가';
    document.getElementById('course-form').reset();
    document.getElementById('image-preview').innerHTML = '';
    document.getElementById('course-modal').classList.add('active');
}

function closeCourseModal() {
    document.getElementById('course-modal').classList.remove('active');
}

async function editCourse(courseId) {
    editingCourseId = courseId;
    document.getElementById('course-modal-title').textContent = '교육과정 수정';
    
    try {
        const course = await dbHelpers.getCourse(courseId);
        
        if (course) {
            const form = document.getElementById('course-form');
            form.name.value = course.name;
            form.category.value = course.category;
            form.type.value = course.type;
            form.price.value = course.price;
            form.startDate.value = course.startDate;
            form.endDate.value = course.endDate;
            form.startTime.value = course.startTime;
            form.endTime.value = course.endTime;
            form.sessions.value = course.sessions;
            form.maxEnrollments.value = course.maxEnrollments || 20;
            form.description.value = course.description;
            
            if (course.image) {
                document.getElementById('image-preview').innerHTML = `
                    <img src="${course.image}" alt="Current image">
                `;
            }
            
            document.getElementById('course-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading course:', error);
        alert('과정을 불러올 수 없습니다.');
    }
}

async function saveCourse(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';
    
    try {
        const formData = {
            name: form.name.value,
            category: form.category.value,
            type: form.type.value,
            price: parseInt(form.price.value),
            startDate: form.startDate.value,
            endDate: form.endDate.value,
            startTime: form.startTime.value,
            endTime: form.endTime.value,
            sessions: parseInt(form.sessions.value),
            maxEnrollments: parseInt(form.maxEnrollments.value),
            description: form.description.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Handle image upload if there's a new image
        const imageFile = form.image.files[0];
        if (imageFile) {
            // In a real app, upload to Firebase Storage
            // For now, use a placeholder
            formData.image = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800';
        }
        
        if (editingCourseId) {
            // Update existing course
            await db.collection('courses').doc(editingCourseId).update(formData);
            utils.showSuccess('과정이 수정되었습니다.');
        } else {
            // Add new course
            formData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            formData.enrollments = 0;
            formData.featured = false;
            
            await db.collection('courses').add(formData);
            utils.showSuccess('새 과정이 추가되었습니다.');
        }
        
        closeCourseModal();
        loadCourses();
        
    } catch (error) {
        console.error('Error saving course:', error);
        alert('저장 중 오류가 발생했습니다.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function deleteCourse(courseId) {
    if (confirm('정말로 이 과정을 삭제하시겠습니까?')) {
        try {
            await db.collection('courses').doc(courseId).delete();
            utils.showSuccess('과정이 삭제되었습니다.');
            loadCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    }
}

// Preview image
function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Utility functions
function formatDate(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ko-KR');
}

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

// Admin logout
async function adminLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        try {
            await auth.signOut();
            window.location.href = `${BASE_PATH}/`;
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Placeholder functions
function viewStudent(studentId) {
    alert('수강생 상세 정보 기능은 준비 중입니다.');
}

function viewEnrollment(enrollmentId) {
    alert('수강신청 상세 정보 기능은 준비 중입니다.');
}

function loadSettings() {
    // Settings functionality would be implemented here
}
