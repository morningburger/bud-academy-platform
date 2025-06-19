// Course Detail Page functionality
let currentCourse = null;
let isEnrolled = false;
let isWishlisted = false;

document.addEventListener('DOMContentLoaded', async function() {
    const courseId = commonUtils.getUrlParameter('id');
    if (!courseId) {
        window.location.href = '/pages/courses.html';
        return;
    }
    
    await loadCourseDetails(courseId);
    checkEnrollmentStatus();
    loadRelatedCourses();
});

// Load course details
async function loadCourseDetails(courseId) {
    try {
        // Show loading state
        document.getElementById('course-title').textContent = 'Loading...';
        
        // Get course data
        currentCourse = await firebaseDB.getCourseById(courseId);
        
        if (!currentCourse) {
            alert('강좌를 찾을 수 없습니다.');
            window.location.href = '/pages/courses.html';
            return;
        }
        
        // Update page title
        document.title = `${currentCourse.name} - BUD ACADEMY`;
        
        // Update hero section
        updateHeroSection();
        
        // Load additional data
        loadCurriculum();
        loadInstructor();
        loadReviews();
        
    } catch (error) {
        console.error('Error loading course details:', error);
        alert('강좌 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// Update hero section
function updateHeroSection() {
    // Course type badge
    const typeBadge = document.getElementById('course-type-badge');
    typeBadge.textContent = currentCourse.type === 'hands-on' ? 'HANDS-ON' : 'LOOK & LEARN';
    typeBadge.className = `course-type-badge ${currentCourse.type === 'hands-on' ? 'hands-on' : ''}`;
    
    // Course info
    document.getElementById('course-title').textContent = currentCourse.name;
    document.getElementById('course-description').textContent = currentCourse.description;
    document.getElementById('course-duration').textContent = `${currentCourse.duration}주`;
    document.getElementById('course-schedule').textContent = currentCourse.schedule;
    document.getElementById('course-instructor').textContent = currentCourse.instructor;
    document.getElementById('course-capacity').textContent = `${currentCourse.maxEnrollments}명`;
    
    // Price
    document.getElementById('course-price').textContent = commonUtils.formatCurrency(currentCourse.price);
    
    // Enrollment status
    const enrollmentPercent = (currentCourse.enrollmentCount / currentCourse.maxEnrollments) * 100;
    document.getElementById('enrollment-progress').style.width = `${enrollmentPercent}%`;
    document.getElementById('enrollment-text').textContent = 
        `${currentCourse.enrollmentCount}/${currentCourse.maxEnrollments}명 신청`;
    
    // Check if course is full
    if (currentCourse.enrollmentCount >= currentCourse.maxEnrollments) {
        const enrollBtn = document.getElementById('enroll-btn');
        enrollBtn.textContent = '마감되었습니다';
        enrollBtn.disabled = true;
        enrollBtn.classList.add('disabled');
    }
}

// Check enrollment status
async function checkEnrollmentStatus() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        // Check if already enrolled
        const enrollmentSnapshot = await firebaseDB.db.collection('enrollments')
            .where('userId', '==', user.uid)
            .where('courseId', '==', currentCourse.id)
            .get();
        
        if (!enrollmentSnapshot.empty) {
            isEnrolled = true;
            const enrollBtn = document.getElementById('enroll-btn');
            enrollBtn.textContent = '수강 중';
            enrollBtn.disabled = true;
            enrollBtn.classList.add('enrolled');
        }
        
        // Check wishlist status
        const userDoc = await firebaseDB.db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const wishlist = userDoc.data().wishlist || [];
            isWishlisted = wishlist.includes(currentCourse.id);
            updateWishlistButton();
        }
    } catch (error) {
        console.error('Error checking enrollment status:', error);
    }
}

// Enroll in course
async function enrollInCourse() {
    const user = firebase.auth().currentUser;
    if (!user) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
            window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }
        return;
    }
    
    if (isEnrolled) {
        alert('이미 수강 중인 강좌입니다.');
        return;
    }
    
    if (currentCourse.enrollmentCount >= currentCourse.maxEnrollments) {
        alert('수강 정원이 마감되었습니다.');
        return;
    }
    
    const enrollBtn = document.getElementById('enroll-btn');
    enrollBtn.disabled = true;
    enrollBtn.innerHTML = '<span class="loading"></span> 처리 중...';
    
    try {
        const success = await firebaseDB.enrollInCourse(currentCourse.id);
        if (success) {
            isEnrolled = true;
            enrollBtn.textContent = '수강 중';
            enrollBtn.classList.add('enrolled');
            
            // Update enrollment count
            currentCourse.enrollmentCount++;
            updateHeroSection();
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        enrollBtn.disabled = false;
        enrollBtn.textContent = '지금 수강 신청하기';
    }
}

// Toggle wishlist
async function toggleWishlist() {
    const user = firebase.auth().currentUser;
    if (!user) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
            window.location.href = `/pages/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }
        return;
    }
    
    try {
        const userRef = firebaseDB.db.collection('users').doc(user.uid);
        
        if (isWishlisted) {
            // Remove from wishlist
            await userRef.update({
                wishlist: firebase.firestore.FieldValue.arrayRemove(currentCourse.id)
            });
            isWishlisted = false;
        } else {
            // Add to wishlist
            await userRef.update({
                wishlist: firebase.firestore.FieldValue.arrayUnion(currentCourse.id)
            });
            isWishlisted = true;
        }
        
        updateWishlistButton();
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
}

// Update wishlist button
function updateWishlistButton() {
    const wishlistBtn = document.querySelector('.action-btn:nth-child(2)');
    if (isWishlisted) {
        wishlistBtn.classList.add('active');
        wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> 찜한 강좌';
    } else {
        wishlistBtn.classList.remove('active');
        wishlistBtn.innerHTML = '<i class="far fa-heart"></i> 찜하기';
    }
}

// Share course
function shareCourse() {
    if (navigator.share) {
        navigator.share({
            title: currentCourse.name,
            text: currentCourse.description,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('링크가 복사되었습니다!');
        });
    }
}

// Show tab
function showTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Load curriculum
function loadCurriculum() {
    const curriculumList = document.getElementById('curriculum-list');
    
    // Sample curriculum data (in real app, this would come from Firebase)
    const curriculum = [
        {
            week: 'Week 1-2',
            title: '기초 이론 및 도구 사용법',
            description: '미용의 기본 이론과 각종 도구의 올바른 사용법을 배웁니다.'
        },
        {
            week: 'Week 3-4',
            title: '기본 기법 실습',
            description: '가장 기본적인 기법들을 반복 실습하며 손에 익힙니다.'
        },
        {
            week: 'Week 5-6',
            title: '응용 기법 및 스타일링',
            description: '다양한 응용 기법과 최신 스타일링 트렌드를 학습합니다.'
        },
        {
            week: 'Week 7-8',
            title: '포트폴리오 제작 및 평가',
            description: '개인 포트폴리오를 제작하고 최종 평가를 진행합니다.'
        }
    ];
    
    curriculumList.innerHTML = curriculum.map(item => `
        <div class="curriculum-item">
            <div class="curriculum-header">
                <span class="curriculum-week">${item.week}</span>
            </div>
            <h3 class="curriculum-title">${item.title}</h3>
            <p class="curriculum-description">${item.description}</p>
        </div>
    `).join('');
}

// Load instructor info
function loadInstructor() {
    const instructorProfile = document.getElementById('instructor-profile');
    
    // Sample instructor data (in real app, this would come from Firebase)
    instructorProfile.innerHTML = `
        <img src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400" 
             alt="${currentCourse.instructor}" 
             class="instructor-image">
        <div class="instructor-info">
            <h3>${currentCourse.instructor}</h3>
            <p class="instructor-title">수석 강사 / 15년 경력</p>
            <p class="instructor-bio">
                국내 최고의 미용 전문가로 다수의 대회 수상 경력과 함께 
                유명 살롱에서의 실무 경험을 바탕으로 실전에 강한 교육을 제공합니다.
            </p>
            <ul class="instructor-credentials">
                <li><i class="fas fa-trophy"></i> 2023 K-Beauty Championship 대상</li>
                <li><i class="fas fa-certificate"></i> 국가공인 미용사 자격증</li>
                <li><i class="fas fa-graduation-cap"></i> 미용학 석사</li>
                <li><i class="fas fa-briefcase"></i> 전) 강남 프리미엄 살롱 원장</li>
            </ul>
        </div>
    `;
}

// Load reviews
async function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    
    try {
        // Get reviews from Firebase
        const reviewsSnapshot = await firebaseDB.db.collection('reviews')
            .where('courseId', '==', currentCourse.id)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (reviewsSnapshot.empty) {
            reviewsList.innerHTML = '<p style="text-align: center; color: var(--color-gray)">아직 작성된 후기가 없습니다.</p>';
            return;
        }
        
        reviewsList.innerHTML = '';
        for (const doc of reviewsSnapshot.docs) {
            const review = doc.data();
            const userDoc = await firebaseDB.db.collection('users').doc(review.userId).get();
            const user = userDoc.exists ? userDoc.data() : { name: 'Anonymous' };
            
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            reviewItem.innerHTML = `
                <div class="review-header">
                    <div class="review-author">
                        <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name)}" 
                             alt="${user.name}">
                        <div>
                            <div class="review-author-name">${user.name}</div>
                            <div class="review-date">${commonUtils.formatDate(review.createdAt)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">${review.content}</div>
            `;
            reviewsList.appendChild(reviewItem);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<p style="text-align: center; color: var(--color-error)">후기를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// Generate star rating
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Load related courses
async function loadRelatedCourses() {
    const relatedCoursesGrid = document.getElementById('related-courses-grid');
    if (!relatedCoursesGrid) return;
    
    try {
        // Get courses in the same category
        const relatedCourses = await firebaseDB.getCoursesByCategory(currentCourse.category);
        
        // Filter out current course and limit to 3
        const filteredCourses = relatedCourses
            .filter(course => course.id !== currentCourse.id)
            .slice(0, 3);
        
        if (filteredCourses.length === 0) {
            relatedCoursesGrid.innerHTML = '<p style="text-align: center; color: var(--color-gray)">관련 강좌가 없습니다.</p>';
            return;
        }
        
        relatedCoursesGrid.innerHTML = filteredCourses
            .map(course => commonUtils.createCourseCard(course))
            .join('');
            
    } catch (error) {
        console.error('Error loading related courses:', error);
    }
}