import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBAwLWA01CrXvDAhXyKH9ZJ8Ry7HyCjf9g",
  authDomain: "agritech-project-aa348.firebaseapp.com",
  projectId: "agritech-project-aa348",
  storageBucket: "agritech-project-aa348.firebasestorage.app",
  messagingSenderId: "638799724010",
  appId: "1:638799724010:web:b49501a3924a90a4bf8693",
  measurementId: "G-KFTFVVT079"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { app, auth };
