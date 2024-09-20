import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVtMeyc-5EmeCbFsEtJGHEYzyuuLcT8bA",
    authDomain: "shot-tracker-f9823.firebaseapp.com",
    projectId: "shot-tracker-f9823",
    storageBucket: "shot-tracker-f9823.appspot.com",
    messagingSenderId: "28405149666",
    appId: "1:28405149666:web:ef08e8add96e603838d3bb",
    measurementId: "G-FCJ9MQMQZJ"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // where `app` is your initialized Firebase app

document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continue-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loggedInContainer = document.getElementById('logged-in-container');
    const messageArea = document.getElementById('message');

    let currentUserUid = null;

    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            currentUserUid = user.uid; // Set the user ID when logged in
            console.log('User is signed in:', user);
            messageArea.textContent = '';
            loggedInContainer.classList.remove('hidden'); // Show the logged-in container
            document.getElementById('auth-form').classList.add('hidden'); // Hide the auth form
        } else {
            // No user is signed in
            loggedInContainer.classList.add('hidden'); // Hide the logged-in container
            document.getElementById('auth-form').classList.remove('hidden'); // Show the auth form
            currentUserUid = null; // Reset when logged out
        }
    });

    // Add event listeners for the buttons
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await loginUser(email, password);
    });

    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await registerUser(email, password);
    });

    // Continue to Shot Tracker
    continueBtn.addEventListener('click', () => {
        window.location.href = 'shot-tracker.html'; // Change this to your actual app page
    });

    // Logout functionality
    logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        auth.onAuthStateChanged(); // This might not be necessary, but it ensures the state is checked.
        window.location.reload(); // Reload the page after logout
    });
});

// Function to register a new user
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', userCredential.user);
        // Redirect to the main app page after successful signup
        window.location.href = 'shot-tracker.html'; // Change this to your actual app page
    } catch (error) {
        console.error('Registration error:', error);
        document.getElementById('message').textContent = `Registration failed: ${error.message}`; // Show error message
    }
}

// Function to log in a user
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        localStorage.setItem('currentUserUid', userCredential.user.uid); // Store UID
        // Redirect to the main app page after successful login
        window.location.href = 'shot-tracker.html'; // Change this to your actual app page
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('message').textContent = `Login failed: ${error.message}`; // Show error message
    }
}

// Function to log out a user
async function logoutUser() {
    try {
        await signOut(auth);
        console.log('User logged out');
    } catch (error) {
        console.error('Logout error:', error);
    }
}
