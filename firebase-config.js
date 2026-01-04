<script>
// Firebase Configuration - CORRECTED
const firebaseConfig = {
    apiKey: "AIzaSyA2xQx9D7dNlLfIvR2MYtxcG_YTIGdSQqI",
    authDomain: "easygoooo.firebaseapp.com",
    databaseURL: "https://easygoooo.firebaseio.com/",
    projectId: "easygoooo",
    storageBucket: "easygoooo.appspot.com",
    messagingSenderId: "817708705026",
    appId: "1:817708705026:web:14bb952506eaef8e0ec1e5",
    measurementId: "G-7PC3YY3FK0"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const easygoDB = firebase.database();
</script>
