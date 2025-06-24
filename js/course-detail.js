// Enroll in course
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
        
        const success = await dbHelpers.enrollCourse(currentCourse.id);
        
        if (success) {
            utils.showSuccess('수강신청이 완료되었습니다!');
            isEnrolled = true;
            currentCourse.enrollments = (currentCourse.enrollments || 0) + 1;
            updateEnrollmentStatus();
        } else {
            throw new Error('Enrollment failed');
        }
        
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
        const courses = await dbHelpers.getCourses({ 
            category: currentCourse.category 
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
                    <img src="${course.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800'}" 
                         alt="${course.name}">
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
    document.querySelector('.course-hero').innerHTML = '<div class="skeleton-hero"></div>';
    document.querySelector('.content-main').innerHTML = '<div class="skeleton-content"></div>';
}

// Open lightbox (placeholder)
function openLightbox(imageSrc) {
    // In a real implementation, this would open a lightbox/modal
    window.open(imageSrc, '_blank');
}
