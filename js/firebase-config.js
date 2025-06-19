// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

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
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User logged in:', user.email);
        updateUIForLoggedInUser(user);
    } else {
        // User is signed out
        console.log('User logged out');
        updateUIForLoggedOutUser();
    }
});

// Update UI based on auth state
function updateUIForLoggedInUser(user) {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userMenu) {
        userMenu.style.display = 'block';
        userMenu.querySelector('.user-email').textContent = user.email;
    }
}

function updateUIForLoggedOutUser() {
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenu = document.getElementById('user-menu');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (signupBtn) signupBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';
}

// Firestore Collections
const collections = {
    courses: 'courses',
    users: 'users',
    enrollments: 'enrollments',
    categories: 'categories',
    reviews: 'reviews'
};

// Helper Functions
async function getAllCourses() {
    try {
        const snapshot = await db.collection(collections.courses)
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting courses:', error);
        return [];
    }
}

async function getCourseById(courseId) {
    try {
        const doc = await db.collection(collections.courses).doc(courseId).get();
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
}

async function getCoursesByCategory(category) {
    try {
        const snapshot = await db.collection(collections.courses)
            .where('category', '==', category)
            .where('isActive', '==', true)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting courses by category:', error);
        return [];
    }
}

async function enrollInCourse(courseId) {
    const user = auth.currentUser;
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = '/pages/login.html';
        return false;
    }
    
    try {
        // Check if already enrolled
        const existingEnrollment = await db.collection(collections.enrollments)
            .where('userId', '==', user.uid)
            .where('courseId', '==', courseId)
            .get();
        
        if (!existingEnrollment.empty) {
            alert('이미 수강 신청한 과정입니다.');
            return false;
        }
        
        // Create enrollment
        await db.collection(collections.enrollments).add({
            userId: user.uid,
            courseId: courseId,
            enrolledAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            progress: 0
        });
        
        // Update course enrollment count
        await db.collection(collections.courses).doc(courseId).update({
            enrollmentCount: firebase.firestore.FieldValue.increment(1)
        });
        
        alert('수강 신청이 완료되었습니다!');
        return true;
    } catch (error) {
        console.error('Error enrolling in course:', error);
        alert('수강 신청 중 오류가 발생했습니다.');
        return false;
    }
}

async function getUserEnrollments() {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
        const snapshot = await db.collection(collections.enrollments)
            .where('userId', '==', user.uid)
            .orderBy('enrolledAt', 'desc')
            .get();
        
        const enrollments = [];
        for (const doc of snapshot.docs) {
            const enrollment = doc.data();
            const course = await getCourseById(enrollment.courseId);
            if (course) {
                enrollments.push({
                    id: doc.id,
                    ...enrollment,
                    course: course
                });
            }
        }
        
        return enrollments;
    } catch (error) {
        console.error('Error getting user enrollments:', error);
        return [];
    }
}

// Export for use in other files
window.firebaseDB = {
    auth,
    db,
    storage,
    collections,
    getAllCourses,
    getCourseById,
    getCoursesByCategory,
    enrollInCourse,
    getUserEnrollments
};