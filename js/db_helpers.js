// Database helper functions
const dbHelpers = {
    // Get all courses
    getCourses: async function(filters = {}) {
        try {
            let query = db.collection('courses');
            
            // Apply filters
            if (filters.category && filters.category !== 'all') {
                query = query.where('category', '==', filters.category);
            }
            
            if (filters.type && filters.type !== 'all') {
                query = query.where('type', '==', filters.type);
            }
            
            if (filters.featured) {
                query = query.where('featured', '==', true);
            }
            
            const snapshot = await query.get();
            const courses = [];
            
            snapshot.forEach(doc => {
                courses.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return courses;
        } catch (error) {
            console.error('Error getting courses:', error);
            return [];
        }
    },
    
    // Get single course
    getCourse: async function(courseId) {
        try {
            const doc = await db.collection('courses').doc(courseId).get();
            
            if (!doc.exists) {
                return null;
            }
            
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting course:', error);
            return null;
        }
    },
    
    // Enroll in course
    enrollCourse: async function(courseId) {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        try {
            // Check if already enrolled
            const existingEnrollment = await db.collection('enrollments')
                .where('userId', '==', currentUser.uid)
                .where('courseId', '==', courseId)
                .get();
            
            if (!existingEnrollment.empty) {
                throw new Error('Already enrolled');
            }
            
            // Add enrollment
            await db.collection('enrollments').add({
                userId: currentUser.uid,
                courseId: courseId,
                enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
            
            // Update course enrollment count
            const courseRef = db.collection('courses').doc(courseId);
            await courseRef.update({
                enrollments: firebase.firestore.FieldValue.increment(1)
            });
            
            return true;
        } catch (error) {
            console.error('Error enrolling course:', error);
            return false;
        }
    },
    
    // Check if user is enrolled
    checkEnrollment: async function(courseId) {
        if (!currentUser) {
            return false;
        }
        
        try {
            const snapshot = await db.collection('enrollments')
                .where('userId', '==', currentUser.uid)
                .where('courseId', '==', courseId)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking enrollment:', error);
            return false;
        }
    },
    
    // Get user enrollments
    getUserEnrollments: async function() {
        if (!currentUser) {
            return [];
        }
        
        try {
            const snapshot = await db.collection('enrollments')
                .where('userId', '==', currentUser.uid)
                .get();
            
            const enrollments = [];
            snapshot.forEach(doc => {
                enrollments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return enrollments;
        } catch (error) {
            console.error('Error getting user enrollments:', error);
            return [];
        }
    },
    
    // Save user profile
    saveUserProfile: async function(userData) {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        try {
            await db.collection('users').doc(currentUser.uid).set({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            return true;
        } catch (error) {
            console.error('Error saving user profile:', error);
            return false;
        }
    },
    
    // Get user profile
    getUserProfile: async function() {
        if (!currentUser) {
            return null;
        }
        
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            
            if (!doc.exists) {
                return null;
            }
            
            return doc.data();
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },
    
    // Add review
    addReview: async function(courseId, reviewData) {
        if (!currentUser) {
            throw new Error('User not authenticated');
        }
        
        try {
            await db.collection('reviews').add({
                userId: currentUser.uid,
                courseId: courseId,
                ...reviewData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return true;
        } catch (error) {
            console.error('Error adding review:', error);
            return false;
        }
    },
    
    // Get course reviews
    getCourseReviews: async function(courseId) {
        try {
            const snapshot = await db.collection('reviews')
                .where('courseId', '==', courseId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const reviews = [];
            snapshot.forEach(doc => {
                reviews.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return reviews;
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }
};