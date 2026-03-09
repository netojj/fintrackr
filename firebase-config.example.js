// Firebase init example. Substitute with your own keys before running locally.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "1:YOUR_APP_ID:web:YOUR_WEB_APP_ID"
};

window.firebase.initializeApp(firebaseConfig);
