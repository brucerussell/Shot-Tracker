// Accept the Firebase Auth instance as a parameter
export function setupAuth(auth) {
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('User logged in:', user.email);
            localStorage.setItem('currentUserUid', user.uid);
            document.getElementById('user-email').textContent = `User: ${user.email}`;
        } else {
            console.log('User logged out');
            localStorage.removeItem('currentUserUid');
            document.getElementById('user-email').textContent = '';
        }
    });
}

// Function to log out the user, receiving the `auth` instance
export async function logoutUser(auth) {
    try {
        await auth.signOut();
        console.log('User logged out');
        window.location.href = 'index.html'; // Redirect to login
    } catch (error) {
        console.error('Logout error:', error);
    }
}
