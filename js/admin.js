// Admin functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check admin access
    const hasAccess = await commonUtils.checkAdminAccess();
    if (!hasAccess) return;
    
    // Initialize admin dashboard
    initializeAdminDashboard();
    loadDashboardData();
    initializeCharts();
});

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Update admin user info
    const user = firebase.auth().currentUser;
    if (user) {
        const adminName = document.getElementById('admin-name');
        const adminAvatar = document.getElementById('admin-avatar');
        
        if (adminName) adminName.textContent = user.displayName || user.email;
        if (adminAvatar) adminAvatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
    }
    
    // Set active nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        }
    });
}

// Toggle sidebar for mobile
function toggleSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    sidebar.classList.toggle('active');
}

// Refresh data
async function refreshData() {
    const refreshBtn = event.target;
    refreshBtn.disabled = true;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 새로고침 중...';
    
    await loadDashboardData();
    await updateCharts();
    
    refreshBtn.disabled = false;
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 새로고침';
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load statistics
        await Promise.all([
            loadTotalStudents(),
            loadActiveCourses(),
            loadMonthlyEnrollments(),
            loadMonthlyRevenue(),
            loadRecentEnrollments()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load total students
async function loadTotalStudents() {
    try {
        const snapshot = await firebaseDB.db.collection('users')
            .where('role', '==', 'student')
            .get();
        
        const totalStudents = document.getElementById('total-students');
        if (totalStudents) {
            animateValue(totalStudents, 0, snapshot.size, 1000);
        }
    } catch (error) {
        console.error('Error loading total students:', error);
    }
}

// Load active courses
async function loadActiveCourses() {
    try {
        const snapshot = await firebaseDB.db.collection('courses')
            .where('isActive', '==', true)
            .get();
        
        const activeCourses = document.getElementById('active-courses');
        if (activeCourses) {
            animateValue(activeCourses, 0, snapshot.size, 1000);
        }
    } catch (error) {
        console.error('Error loading active courses:', error);
    }
}

// Load monthly enrollments
async function loadMonthlyEnrollments() {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const snapshot = await firebaseDB.db.collection('enrollments')
            .where('enrolledAt', '>=', startOfMonth)
            .get();
        
        const monthlyEnrollments = document.getElementById('monthly-enrollments');
        if (monthlyEnrollments) {
            animateValue(monthlyEnrollments, 0, snapshot.size, 1000);
        }
    } catch (error) {
        console.error('Error loading monthly enrollments:', error);
    }
}

// Load monthly revenue
async function loadMonthlyRevenue() {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const enrollmentsSnapshot = await firebaseDB.db.collection('enrollments')
            .where('enrolledAt', '>=', startOfMonth)
            .get();
        
        let totalRevenue = 0;
        for (const doc of enrollmentsSnapshot.docs) {
            const enrollment = doc.data();
            const courseDoc = await firebaseDB.db.collection('courses')
                .doc(enrollment.courseId)
                .get();
            
            if (courseDoc.exists) {
                totalRevenue += courseDoc.data().price || 0;
            }
        }
        
        const monthlyRevenue = document.getElementById('monthly-revenue');
        if (monthlyRevenue) {
            monthlyRevenue.textContent = commonUtils.formatCurrency(totalRevenue);
        }
    } catch (error) {
        console.error('Error loading monthly revenue:', error);
    }
}

// Load recent enrollments
async function loadRecentEnrollments() {
    try {
        const snapshot = await firebaseDB.db.collection('enrollments')
            .orderBy('enrolledAt', 'desc')
            .limit(5)
            .get();
        
        const tbody = document.getElementById('recent-enrollments');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const enrollment = doc.data();
            
            // Get user info
            const userDoc = await firebaseDB.db.collection('users')
                .doc(enrollment.userId)
                .get();
            const user = userDoc.exists ? userDoc.data() : { name: 'Unknown User' };
            
            // Get course info
            const courseDoc = await firebaseDB.db.collection('courses')
                .doc(enrollment.courseId)
                .get();
            const course = courseDoc.exists ? courseDoc.data() : { name: 'Unknown Course' };
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="table-user-info">
                        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                             alt="${user.name}" 
                             class="table-user-avatar">
                        <div>
                            <div>${user.name}</div>
                            <div style="font-size: 0.85rem; color: var(--color-gray)">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${course.name}</td>
                <td>${commonUtils.formatDate(enrollment.enrolledAt)}</td>
                <td>
                    <span class="status-badge ${enrollment.status}">
                        ${enrollment.status === 'active' ? '수강중' : enrollment.status}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="table-action-btn" onclick="viewEnrollment('${doc.id}')">
                            <i class="fas fa-eye"></i> 보기
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        }
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-gray)">최근 수강 신청이 없습니다.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading recent enrollments:', error);
    }
}

// Initialize charts
function initializeCharts() {
    initializeEnrollmentTrendChart();
    initializeCategoryPopularityChart();
}

// Initialize enrollment trend chart
async function initializeEnrollmentTrendChart() {
    const ctx = document.getElementById('enrollment-trend-chart');
    if (!ctx) return;
    
    try {
        // Get data for last 6 months
        const months = [];
        const enrollmentCounts = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const snapshot = await firebaseDB.db.collection('enrollments')
                .where('enrolledAt', '>=', startOfMonth)
                .where('enrolledAt', '<=', endOfMonth)
                .get();
            
            months.push(startOfMonth.toLocaleDateString('ko-KR', { month: 'short' }));
            enrollmentCounts.push(snapshot.size);
        }
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '수강 신청',
                    data: enrollmentCounts,
                    borderColor: '#ff6900',
                    backgroundColor: 'rgba(255, 105, 0, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#ff6900'
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
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing enrollment trend chart:', error);
    }
}

// Initialize category popularity chart
async function initializeCategoryPopularityChart() {
    const ctx = document.getElementById('category-popularity-chart');
    if (!ctx) return;
    
    try {
        // Get enrollment counts by category
        const categories = ['cut', 'color', 'perm', 'styling', 'marketing', 'management'];
        const categoryLabels = ['헤어컷', '컬러링', '펌', '스타일링', '마케팅', '경영'];
        const enrollmentCounts = [];
        
        for (const category of categories) {
            // Get courses in this category
            const coursesSnapshot = await firebaseDB.db.collection('courses')
                .where('category', '==', category)
                .get();
            
            let totalEnrollments = 0;
            coursesSnapshot.forEach(doc => {
                totalEnrollments += doc.data().enrollmentCount || 0;
            });
            
            enrollmentCounts.push(totalEnrollments);
        }
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: enrollmentCounts,
                    backgroundColor: [
                        '#ff6900',
                        '#000000',
                        '#757575',
                        '#f5f5f5',
                        '#d43f21',
                        '#128a09'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing category popularity chart:', error);
    }
}

// Update charts
async function updateCharts() {
    // Clear existing charts
    Chart.helpers.each(Chart.instances, function(instance) {
        instance.destroy();
    });
    
    // Reinitialize charts
    initializeCharts();
}

// View enrollment details
function viewEnrollment(enrollmentId) {
    window.location.href = `/pages/admin/enrollments.html?id=${enrollmentId}`;
}

// Animate value
function animateValue(element, start, end, duration) {
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

// Add styles for quick actions
const style = document.createElement('style');
style.textContent = `
    .quick-actions {
        margin-top: 40px;
    }
    
    .quick-actions .section-title {
        font-size: 1.2rem;
        margin-bottom: 20px;
    }
    
    .action-buttons {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .action-buttons .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
`;
document.head.appendChild(style);