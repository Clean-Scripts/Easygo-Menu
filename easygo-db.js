// easygo-db.js - Unified Database Operations for EasyGo
class EasyGoDB {
    constructor() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.database();
        console.log("Firebase Database Connected!");
    }

    // ================= ORDER MANAGEMENT =================
    async createOrder(orderData) {
        try {
            const orderId = 'EG' + Date.now().toString().slice(-8);
            const timestamp = firebase.database.ServerValue.TIMESTAMP;
            
            const completeOrder = {
                ...orderData,
                orderId: orderId,
                status: 'pending',
                createdAt: timestamp,
                updatedAt: timestamp,
                orderType: orderData.orderType || 'delivery',
                paymentStatus: 'paid'
            };
            
            await this.db.ref('orders/' + orderId).set(completeOrder);
            console.log("✅ Order created:", orderId);
            return { orderId, ...completeOrder };
        } catch (error) {
            console.error("❌ Error creating order:", error);
            throw error;
        }
    }

    async getOrder(orderId) {
        try {
            const snapshot = await this.db.ref('orders/' + orderId).once('value');
            return snapshot.val();
        } catch (error) {
            console.error("Error getting order:", error);
            return null;
        }
    }

    async updateOrderStatus(orderId, status, updateData = {}) {
        try {
            const updates = {
                status: status,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                ...updateData
            };
            
            await this.db.ref('orders/' + orderId).update(updates);
            
            // Add tracking update
            await this.addTrackingUpdate(orderId, {
                status: status,
                message: `Status: ${status.replace('_', ' ')}`,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log("✅ Order updated:", orderId, status);
            return true;
        } catch (error) {
            console.error("Error updating order:", error);
            return false;
        }
    }

    async getAllOrders() {
        try {
            const snapshot = await this.db.ref('orders').once('value');
            let orders = [];
            
            snapshot.forEach(child => {
                orders.push(child.val());
            });
            
            return orders.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error("Error getting orders:", error);
            return [];
        }
    }

    async getTodayOrders() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = today.getTime();
            
            const snapshot = await this.db.ref('orders').once('value');
            let orders = [];
            
            snapshot.forEach(child => {
                const order = child.val();
                if (order.createdAt >= todayTimestamp) {
                    orders.push(order);
                }
            });
            
            return orders.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error("Error getting today's orders:", error);
            return [];
        }
    }

    async getAvailableOrders() {
        try {
            const snapshot = await this.db.ref('orders').orderByChild('status').equalTo('ready').once('value');
            let orders = [];
            
            snapshot.forEach(child => {
                const order = child.val();
                if (!order.riderAssigned) {
                    orders.push(order);
                }
            });
            
            return orders;
        } catch (error) {
            console.error("Error getting available orders:", error);
            return [];
        }
    }

    // ================= CART MANAGEMENT =================
    async saveCart(userId, cartData) {
        try {
            await this.db.ref('carts/' + userId).set({
                ...cartData,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log("✅ Cart saved for:", userId);
            return true;
        } catch (error) {
            console.error("Error saving cart:", error);
            return false;
        }
    }

    async getCart(userId) {
        try {
            const snapshot = await this.db.ref('carts/' + userId).once('value');
            return snapshot.val();
        } catch (error) {
            console.error("Error getting cart:", error);
            return null;
        }
    }

    // ================= TRACKING UPDATES =================
    async addTrackingUpdate(orderId, updateData) {
        try {
            const updateId = 'U' + Date.now().toString().slice(-6);
            await this.db.ref('tracking/' + orderId + '/updates/' + updateId).set({
                ...updateData,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            return updateId;
        } catch (error) {
            console.error("Error adding tracking update:", error);
            return null;
        }
    }

    async getTrackingUpdates(orderId) {
        try {
            const snapshot = await this.db.ref('tracking/' + orderId + '/updates').once('value');
            const updates = [];
            
            snapshot.forEach(child => {
                updates.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            return updates.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error("Error getting tracking updates:", error);
            return [];
        }
    }

    // ================= RIDER MANAGEMENT =================
    async assignRider(orderId, riderData) {
        try {
            await this.db.ref('orders/' + orderId).update({
                riderAssigned: true,
                riderId: riderData.riderId,
                riderName: riderData.name,
                riderPhone: riderData.phone,
                status: 'assigned_to_rider',
                assignedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            await this.addTrackingUpdate(orderId, {
                status: 'assigned_to_rider',
                message: `Rider ${riderData.name} assigned`,
                riderName: riderData.name,
                riderPhone: riderData.phone
            });
            
            return true;
        } catch (error) {
            console.error("Error assigning rider:", error);
            return false;
        }
    }

    async updateRiderLocation(riderId, location) {
        try {
            await this.db.ref('riders/' + riderId + '/location').set({
                ...location,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } catch (error) {
            console.error("Error updating rider location:", error);
            return false;
        }
    }

    // ================= REAL-TIME LISTENERS =================
    onOrderUpdate(orderId, callback) {
        this.db.ref('orders/' + orderId).on('value', (snapshot) => {
            callback(snapshot.val());
        });
    }

    onNewOrders(callback) {
        this.db.ref('orders').orderByChild('createdAt').startAt(Date.now()).on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }

    onTrackingUpdates(orderId, callback) {
        this.db.ref('tracking/' + orderId + '/updates').on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }

    // ================= ANALYTICS =================
    async logEvent(eventName, data = {}) {
        try {
            await this.db.ref('analytics/' + eventName).push({
                ...data,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        } catch (error) {
            console.error("Error logging event:", error);
        }
    }
}

// Initialize global instance
window.easygoDB = new EasyGoDB();
