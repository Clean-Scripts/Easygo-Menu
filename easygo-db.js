// easygo-db.js - Shared Database Service
class EasyGoDB {
    constructor() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.database();
        this.auth = firebase.auth();
    }

    // =============== ORDER MANAGEMENT ===============
    createOrder(orderData) {
        return new Promise((resolve, reject) => {
            const orderId = 'EG' + Date.now() + Math.floor(Math.random() * 1000);
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            
            const completeOrder = {
                ...orderData,
                orderId: orderId,
                status: 'pending',
                createdAt: timestamp,
                updatedAt: timestamp,
                orderType: orderData.orderType || 'delivery', // 'delivery' or 'pickup'
                paymentStatus: 'pending'
            };
            
            this.db.ref('orders/' + orderId).set(completeOrder)
                .then(() => resolve({ orderId, ...completeOrder }))
                .catch(reject);
        });
    }

    getOrder(orderId) {
        return this.db.ref('orders/' + orderId).once('value')
            .then(snapshot => snapshot.val());
    }

    updateOrderStatus(orderId, status, updateData = {}) {
        const updates = {
            status: status,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            ...updateData
        };
        
        return this.db.ref('orders/' + orderId).update(updates);
    }

    // =============== CART MANAGEMENT ===============
    saveCart(userId, cartData) {
        return this.db.ref('carts/' + userId).set({
            ...cartData,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
    }

    getCart(userId) {
        return this.db.ref('carts/' + userId).once('value')
            .then(snapshot => snapshot.val());
    }

    // =============== USER/ADMIN MANAGEMENT ===============
    saveUserProfile(phone, userData) {
        return this.db.ref('users/' + phone).set({
            ...userData,
            phone: phone,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        });
    }

    getUserProfile(phone) {
        return this.db.ref('users/' + phone).once('value')
            .then(snapshot => snapshot.val());
    }

    // =============== RIDER MANAGEMENT ===============
    assignRider(orderId, riderData) {
        return this.db.ref('orders/' + orderId).update({
            riderAssigned: true,
            riderName: riderData.name,
            riderPhone: riderData.phone,
            riderLocation: riderData.location,
            estimatedDeliveryTime: riderData.eta,
            deliveryFee: riderData.fee,
            status: 'assigned_to_rider'
        });
    }

    updateRiderLocation(orderId, location) {
        return this.db.ref('orders/' + orderId + '/riderCurrentLocation').set(location);
    }

    // =============== ADMIN FUNCTIONS ===============
    getAllOrders(status = null) {
        return this.db.ref('orders').once('value')
            .then(snapshot => {
                let orders = [];
                snapshot.forEach(child => {
                    const order = child.val();
                    if (!status || order.status === status) {
                        orders.push(order);
                    }
                });
                return orders.sort((a, b) => b.createdAt - a.createdAt);
            });
    }

    getTodaysOrders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = today.getTime();
        
        return this.db.ref('orders').once('value')
            .then(snapshot => {
                let orders = [];
                snapshot.forEach(child => {
                    const order = child.val();
                    if (order.createdAt >= todayTimestamp) {
                        orders.push(order);
                    }
                });
                return orders.sort((a, b) => b.createdAt - a.createdAt);
            });
    }

    // =============== TRACKING ===============
    getOrderTracking(orderId) {
        return this.db.ref('orderTracking/' + orderId).once('value')
            .then(snapshot => snapshot.val());
    }

    addTrackingUpdate(orderId, update) {
        const trackingRef = this.db.ref('orderTracking/' + orderId + '/updates').push();
        return trackingRef.set({
            ...update,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    // =============== UTILITIES ===============
    getOrderStats() {
        return this.db.ref('orders').once('value')
            .then(snapshot => {
                let stats = {
                    total: 0,
                    pending: 0,
                    preparing: 0,
                    ready: 0,
                    in_transit: 0,
                    delivered: 0,
                    cancelled: 0,
                    todayRevenue: 0
                };
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayTimestamp = today.getTime();
                
                snapshot.forEach(child => {
                    const order = child.val();
                    stats.total++;
                    stats[order.status] = (stats[order.status] || 0) + 1;
                    
                    // Today's revenue
                    if (order.createdAt >= todayTimestamp && order.total) {
                        stats.todayRevenue += order.total;
                    }
                });
                
                return stats;
            });
    }
}

// Initialize global instance
window.easygoDB = new EasyGoDB();
