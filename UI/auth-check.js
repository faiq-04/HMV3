import { auth, onAuthStateChanged } from './auth.js';

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Not logged in, redirect to login
        window.location.href = '/login';
    }
});