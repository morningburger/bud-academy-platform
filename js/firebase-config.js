// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5FWKbT5_D-XcP2lgmDQeQfzbskEcUrC8",
  authDomain: "bud-academy.firebaseapp.com",
  projectId: "bud-academy",
  storageBucket: "bud-academy.firebasestorage.app",
  messagingSenderId: "841659917747",
  appId: "1:841659917747:web:345ca8d4bec9c192c017c6",
  measurementId: "G-XBDN5JT4N5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support offline persistence');
        }
    });

// Auth state observer
let currentUser = null;

auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI(user);
});

// Update UI based on auth state
function updateAuthUI(user) {
    const authButtons = document.querySelectorAll('.auth-required');
    const guestButtons = document.querySelectorAll('.guest-only');
    const userInfo = document.querySelector('.user-info');
    
    if (user) {
        authButtons.forEach(btn => btn.classList.remove('hidden'));
        guestButtons.forEach(btn => btn.classList.add('hidden'));
        
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">${user.displayName || user.email}</span>
                <button onclick="logout()" class="btn-logout">로그아웃</button>
            `;
        }
    } else {
        authButtons.forEach(btn => btn.classList.add('hidden'));
        guestButtons.forEach(btn => btn.classList.remove('hidden'));
        
        if (userInfo) {
            userInfo.innerHTML = '';
        }
    }
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        window.location.href = window.BASE_PATH ? `${window.BASE_PATH}/` : '/';
    } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// Database helpers
const dbHelpers = {
    // Get all courses
    async getCourses(filters = {}) {
        try {
            let query = db.collection('courses');
            
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            
            if (filters.type) {
                query = query.where('type', '==', filters.type);
            }
            
            if (filters.featured) {
                query = query.where('featured', '==', true);
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting courses:', error);
            return [];
        }
    },
    
    // Get single course
    async getCourse(courseId) {
        try {
            const doc = await db.collection('courses').doc(courseId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting course:', error);
            return null;
        }
    },
    
    // Add enrollment
    async enrollCourse(courseId) {
        if (!currentUser) {
            window.location.href = window.BASE_PATH ? `${window.BASE_PATH}/login.html` : '/login.html';
            return false;
        }
        
        try {
            const enrollmentData = {
                userId: currentUser.uid,
                courseId: courseId,
                enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };
            
            await db.collection('enrollments').add(enrollmentData);
            
            // Update course enrollment count
            await db.collection('courses').doc(courseId).update({
                enrollments: firebase.firestore.FieldValue.increment(1)
            });
            
            return true;
        } catch (error) {
            console.error('Error enrolling course:', error);
            return false;
        }
    },
    
    // Check enrollment
    async checkEnrollment(courseId) {
        if (!currentUser) return false;
        
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
    async getUserEnrollments() {
        if (!currentUser) return [];
        
        try {
            const snapshot = await db.collection('enrollments')
                .where('userId', '==', currentUser.uid)
                .get();
            
            const enrollments = [];
            for (const doc of snapshot.docs) {
                const enrollment = doc.data();
                const course = await dbHelpers.getCourse(enrollment.courseId);
                if (course) {
                    enrollments.push({
                        ...enrollment,
                        course: course
                    });
                }
            }
            
            return enrollments;
        } catch (error) {
            console.error('Error getting enrollments:', error);
            return [];
        }
    },
    
    // Add user profile
    async createUserProfile(userData) {
        try {
            await db.collection('users').doc(userData.uid).set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error creating user profile:', error);
            return false;
        }
    },
    
    // Update user profile
    async updateUserProfile(updates) {
        if (!currentUser) return false;
        
        try {
            await db.collection('users').doc(currentUser.uid).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }
};

// Export for use in other files
window.firebaseAuth = auth;
window.firebaseDB = db;
window.dbHelpers = dbHelpers;
