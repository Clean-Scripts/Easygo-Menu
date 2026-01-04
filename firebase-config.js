// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCU_wJYBTwEwMZQ-iTYOjUZuEHEphA0DXc",
    authDomain: "easygo-10f4b.firebaseapp.com",
    projectId: "easygo-10f4b",
    storageBucket: "easygo-10f4b.firebasestorage.app",
    messagingSenderId: "197660067542",
    appId: "1:197660067542:web:6c616efb479b122f1f6b77",
    databaseURL: "https://easygo-10f4b-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
let database;
let firebaseApp;
let isFirebaseConnected = false;

function initializeFirebase() {
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Set up connection state listener
        const connectedRef = database.ref(".info/connected");
        connectedRef.on("value", function(snap) {
            isFirebaseConnected = snap.val() === true;
            console.log("Firebase connected:", isFirebaseConnected);
        });
        
        return database;
    } catch (error) {
        console.error("Firebase initialization error:", error);
        return null;
    }
}

// Database Helper Functions
const dbHelper = {
    // Save order to Firebase
    async saveOrder(orderData) {
        if (!isFirebaseConnected) return null;
        
        try {
            const orderRef = database.ref('orders').push();
            await orderRef.set({
                ...orderData,
                createdAt: Date.now(),
                date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                status: 'pending'
            });
            
            return orderRef.key;
        } catch (error) {
            console.error("Error saving order:", error);
            return null;
        }
    },
    
    // Update order status
    async updateOrderStatus(orderId, status, updateData = {}) {
        if (!isFirebaseConnected) return false;
        
        try {
            await database.ref(`orders/${orderId}`).update({
                status: status,
                updatedAt: Date.now(),
                ...updateData
            });
            return true;
        } catch (error) {
            console.error("Error updating order:", error);
            return false;
        }
    },
    
    // Get order by ID
    async getOrder(orderId) {
        if (!isFirebaseConnected) return null;
        
        try {
            const snapshot = await database.ref(`orders/${orderId}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error("Error getting order:", error);
            return null;
        }
    },
    
    // Get active orders (pending, preparing, out-for-delivery)
    async getActiveOrders() {
        if (!isFirebaseConnected) return [];
        
        try {
            const snapshot = await database.ref('orders').orderByChild('status')
                .startAt('pending')
                .endAt('out-for-delivery')
                .once('value');
            return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
        } catch (error) {
            console.error("Error getting active orders:", error);
            return [];
        }
    },
    
    // Get orders by status
    async getOrdersByStatus(status) {
        if (!isFirebaseConnected) return [];
        
        try {
            const snapshot = await database.ref('orders').orderByChild('status')
                .equalTo(status)
                .once('value');
            return snapshot.val() ? Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data })) : [];
        } catch (error) {
            console.error("Error getting orders by status:", error);
            return [];
        }
    },
    
    // Save customer notification request
    async saveNotification(name, phone) {
        if (!isFirebaseConnected) return false;
        
        try {
            await database.ref('notifications').push().set({
                name: name,
                phone: phone,
                timestamp: Date.now(),
                date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                status: 'pending'
            });
            return true;
        } catch (error) {
            console.error("Error saving notification:", error);
            return false;
        }
    },
    
    // Save bug report
    async saveBugReport(description, specs) {
        if (!isFirebaseConnected) return false;
        
        try {
            await database.ref('bug_reports').push().set({
                description: description,
                specs: specs,
                timestamp: Date.now(),
                date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                status: 'new'
            });
            return true;
        } catch (error) {
            console.error("Error saving bug report:", error);
            return false;
        }
    },
    
    // Track page view/click
    async trackEvent(eventType, eventData = {}) {
        if (!isFirebaseConnected) return;
        
        try {
            await database.ref('analytics').push().set({
                event: eventType,
                ...eventData,
                timestamp: Date.now(),
                date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                userAgent: navigator.userAgent.substring(0, 150),
                screen: `${window.screen.width}x${window.screen.height}`,
                url: window.location.href
            });
        } catch (error) {
            console.error("Error tracking event:", error);
        }
    }
};
