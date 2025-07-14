// Course detail page functionality
let currentCourse = null;
let isEnrolled = false;
let isWishlisted = false;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    const courseId = getCourseIdFromURL();
    
    if (!courseId) {
        window.location.href = `${BASE_PATH}/courses.html`;
        return;
    }
    
    await loadCourseDetail(courseId);
    await checkEnrollmentStatus(courseId);
    await loadRelatedCourses();
});
    


// Get course ID from URL
function getCourseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load course detail
async function loadCourseDetail(courseId) {
    try {
        showLoadingState();
        
        // Firebase에서 직접 코스 데이터 가져오기
        const courseDoc = await db.collection('courses').doc(courseId).get();
        
        if (!courseDoc.exists) {
            throw new Error('Course not found');
        }
        
        currentCourse = {
            id: courseDoc.id,
            ...courseDoc.data()
        };
        
        displayCourseDetail();
        
    } catch (error) {
        console.error('Error loading course:', error);
        
        const heroSection = document.querySelector('.course-hero');
        const contentMain = document.querySelector('.content-main');
        
        if (heroSection && contentMain) {
            heroSection.innerHTML = '';
            contentMain.innerHTML = `
                <div class="error-message">
                    <h2>교육과정을 불러올 수 없습니다</h2>
                    <p>잠시 후 다시 시도해주세요.</p>
                    <button class="retry-btn" onclick="window.location.reload()">다시 시도</button>
                </div>
            `;
        } else {
            alert('교육과정을 불러올 수 없습니다.');
            window.location.href = `${BASE_PATH}/courses.html`;
        }
    }
}
// Display course detail
function displayCourseDetail() {
    // Update page title
    document.title = `${currentCourse.name} - BUD ACADEMY`;
    
    // Hero section
    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground && currentCourse.image) {
        heroBackground.style.setProperty('--hero-bg-image', `url('${currentCourse.image}')`);
    }
    
    document.querySelector('.course-badges').innerHTML = `
        <span class="badge">${currentCourse.type}</span>
        <span class="badge">${getCategoryName(currentCourse.category)}</span>
        ${currentCourse.featured ? '<span class="badge">FEATURED</span>' : ''}
    `;
    
document.querySelector('.course-title').textContent = currentCourse.name;
document.querySelector('.course-subtitle').textContent = 
    currentCourse.subtitle || currentCourse.description || '교육과정 소개';
    
    // Course description
    document.getElementById('course-description').innerHTML = `
        <p>${currentCourse.description}</p>
        ${currentCourse.highlights ? `
            <h3>교육 특징</h3>
            <ul>
                ${currentCourse.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
        ` : ''}
    `;
    
    // Curriculum
    if (currentCourse.curriculum && currentCourse.curriculum.length > 0) {
        document.getElementById('curriculum-list').innerHTML = currentCourse.curriculum.map((item, index) => `
            <div class="curriculum-item">
                <div class="curriculum-number">${String(index + 1).padStart(2, '0')}</div>
                <div class="curriculum-content">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('curriculum-list').innerHTML = '<p>커리큘럼 정보가 준비 중입니다.</p>';
    }
    
    // Instructor
    if (currentCourse.instructor) {
        document.getElementById('instructor-info').innerHTML = `
            <div class="instructor-image">
                ${currentCourse.instructor.image ? 
                    `<img src="${currentCourse.instructor.image}" alt="${currentCourse.instructor.name}">` : 
                    '<div class="instructor-placeholder">사진 준비중</div>'
                }
            </div>
            <div class="instructor-details">
                <h3>${currentCourse.instructor.name}</h3>
                <p class="instructor-title">${currentCourse.instructor.title || '전문 강사'}</p>
                <p class="instructor-bio">${currentCourse.instructor.bio || '경력 10년 이상의 전문 강사입니다.'}</p>
            </div>
        `;
    } else {
        document.getElementById('instructor-info').innerHTML = '<p>강사 정보가 준비 중입니다.</p>';
    }
    
    // Gallery
    if (currentCourse.gallery && currentCourse.gallery.length > 0) {
        document.getElementById('course-gallery').innerHTML = currentCourse.gallery.map(img => `
            <div class="gallery-item" onclick="openLightbox('${img}')">
                <img src="${img}" alt="교육 현장">
            </div>
        `).join('');
    } else {
        document.getElementById('course-gallery').innerHTML = '<p>갤러리가 준비 중입니다.</p>';
    }
    
    // Sidebar card
    const courseImageElement = document.getElementById('course-image');
    if (currentCourse.image) {
        courseImageElement.style.backgroundImage = `url('${currentCourse.image}')`;
    } else {
        courseImageElement.innerHTML = '<div class="image-placeholder">이미지 준비중</div>';
    }
    
    document.getElementById('course-price').textContent = utils.formatPrice(currentCourse.price);
const startDate = currentCourse.startDate ? formatDate(currentCourse.startDate) : '날짜 미정';
const endDate = currentCourse.endDate ? formatDate(currentCourse.endDate) : '날짜 미정';

document.getElementById('course-dates').textContent = `${startDate} ~ ${endDate}`;
document.getElementById('course-time').textContent = 
    `${currentCourse.startTime || '시간 미정'} ~ ${currentCourse.endTime || '시간 미정'}`;
    document.getElementById('course-capacity').textContent = 
        `${currentCourse.maxEnrollments || 20}명`;
    document.getElementById('course-sessions').textContent = 
        `${currentCourse.sessions}회 ${currentCourse.extraSessions ? `(+${currentCourse.extraSessions}회)` : ''}`;
    
    // Enrollment status
    updateEnrollmentStatus();
}

// Update enrollment status
function updateEnrollmentStatus() {
    const enrollments = currentCourse.enrollments || 0;
    const maxEnrollments = currentCourse.maxEnrollments || 20;
    const percentage = (enrollments / maxEnrollments) * 100;
    
    document.getElementById('enrollment-bar').style.width = `${percentage}%`;
    document.getElementById('enrollment-text').textContent = 
        `${enrollments}/${maxEnrollments}명 신청 (${Math.round(percentage)}%)`;
    
    // Update button state
    const enrollBtn = document.getElementById('enroll-btn');
    
    if (enrollments >= maxEnrollments) {
        enrollBtn.textContent = '모집 마감';
        enrollBtn.disabled = true;
        enrollBtn.classList.add('btn-disabled');
    } else if (isEnrolled) {
        enrollBtn.textContent = '신청 완료';
        enrollBtn.disabled = true;
        enrollBtn.classList.add('btn-success');
    }
}

// Check enrollment status
async function checkEnrollmentStatus(courseId) {
    if (currentUser) {
        try {
            // Firebase에서 직접 수강신청 상태 확인
            const enrollmentDoc = await db.collection('enrollments')
                .where('userId', '==', currentUser.uid)
                .where('courseId', '==', courseId)
                .where('status', '==', 'active')
                .get();
            
            isEnrolled = !enrollmentDoc.empty;
            updateEnrollmentStatus();
            
            // Check wishlist status
            await checkWishlistStatus(courseId);
        } catch (error) {
            console.error('Error checking enrollment:', error);
        }
    }
}

// Check wishlist status
async function checkWishlistStatus(courseId) {
    if (!currentUser) return;
    
    try {
        const wishlistDoc = await db.collection('wishlists')
            .where('userId', '==', currentUser.uid)
            .where('courseId', '==', courseId)
            .get();
        
        isWishlisted = !wishlistDoc.empty;
        updateWishlistIcon();
    } catch (error) {
        console.error('Error checking wishlist:', error);
    }
}

// Update wishlist icon
function updateWishlistIcon() {
    const icon = document.getElementById('wishlist-icon');
    if (isWishlisted) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = 'var(--red)';
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
    }
}

// Enroll in cours   
async function enrollCourse() {
    if (!currentUser) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
            window.location.href = `${BASE_PATH}/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }
        return;
    }
    
    if (isEnrolled) {
        alert('이미 신청한 교육과정입니다.');
        return;
    }
    
    const enrollBtn = document.getElementById('enroll-btn');
    const originalText = enrollBtn.textContent;
    
    try {
        enrollBtn.disabled = true;
        enrollBtn.innerHTML = '<div class="loading"></div>';
        
        // 수강신청 문서 생성
        await db.collection('enrollments').add({
            userId: currentUser.uid,
            courseId: currentCourse.id,
            courseName: currentCourse.name,
            coursePrice: currentCourse.price,
            status: 'active',
            enrolledAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 코스의 enrollments 수 증가
        await db.collection('courses').doc(currentCourse.id).update({
            enrollments: firebase.firestore.FieldValue.increment(1)
        });
        
        utils.showSuccess('수강신청이 완료되었습니다!');
        isEnrolled = true;
        currentCourse.enrollments = (currentCourse.enrollments || 0) + 1;
        updateEnrollmentStatus();
        
    } catch (error) {
        console.error('Error enrolling course:', error);
        alert('수강신청 중 오류가 발생했습니다.');
        enrollBtn.textContent = originalText;
        enrollBtn.disabled = false;
    }
}


// Toggle wishlist
async function toggleWishlist() {
    if (!currentUser) {
        if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
            window.location.href = `${BASE_PATH}/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        }
        return;
    }
    
    try {
        if (isWishlisted) {
            // Remove from wishlist
            const wishlistDoc = await db.collection('wishlists')
                .where('userId', '==', currentUser.uid)
                .where('courseId', '==', currentCourse.id)
                .get();
            
            if (!wishlistDoc.empty) {
                await wishlistDoc.docs[0].ref.delete();
                isWishlisted = false;
                utils.showSuccess('찜 목록에서 제거되었습니다.');
            }
        } else {
            // Add to wishlist
            await db.collection('wishlists').add({
                userId: currentUser.uid,
                courseId: currentCourse.id,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            isWishlisted = true;
            utils.showSuccess('찜 목록에 추가되었습니다.');
        }
        
        updateWishlistIcon();
        
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        alert('찜하기 처리 중 오류가 발생했습니다.');
    }
}

// Share course
function shareCourse() {
    if (navigator.share) {
        navigator.share({
            title: currentCourse.name,
            text: currentCourse.description,
            url: window.location.href
        }).catch(err => console.log('Share cancelled:', err));
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            utils.showSuccess('링크가 클립보드에 복사되었습니다.');
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }
}

// Load related courses
async function loadRelatedCourses() {
    try {
// Firebase에서 직접 관련 코스 가져오기
const coursesSnapshot = await db.collection('courses')
    .where('category', '==', currentCourse.category)
    .limit(10)
    .get();

const courses = [];
coursesSnapshot.forEach(doc => {
    courses.push({
        id: doc.id,
        ...doc.data()
    });
});
        
        // Filter out current course and limit to 3
        const relatedCourses = courses
            .filter(c => c.id !== currentCourse.id)
            .slice(0, 3);
        
        const container = document.getElementById('related-courses');
        
        if (relatedCourses.length === 0) {
            container.innerHTML = '<p class="text-center">관련 교육과정이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = relatedCourses.map(course => `
            <div class="course-card" onclick="window.location.href='${BASE_PATH}/course-detail.html?id=${course.id}'">
                <div class="course-card-image">
                    ${course.image ? 
                        `<img src="${course.image}" alt="${course.name}">` : 
                        '<div class="course-placeholder">이미지 준비중</div>'
                    }
                    <div class="course-type-badge">${course.type}</div>
                </div>
                <div class="course-card-content">
                    <h3 class="course-card-title">${course.name}</h3>
                    <p class="course-card-price">${utils.formatPrice(course.price)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading related courses:', error);
    }
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Get category name
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

// Show loading state
function showLoadingState() {
    const heroSection = document.querySelector('.course-hero');
    const contentMain = document.querySelector('.content-main');
    
    if (heroSection) {
        heroSection.innerHTML = '<div class="skeleton-hero"></div>';
    }
    
    if (contentMain) {
        contentMain.innerHTML = `
            <div class="skeleton-content">
                <div class="skeleton-block"></div>
                <div class="skeleton-block"></div>
                <div class="skeleton-block"></div>
            </div>
        `;
    }
}

// Open lightbox (placeholder)
function openLightbox(imageSrc) {
    // In a real implementation, this would open a lightbox/modal
    window.open(imageSrc, '_blank');
}
