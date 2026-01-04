// EasyGo Orders Database Handler
const orderDB = {
    // Save an order to Firebase
    saveOrder: function(orderData) {
        return new Promise((resolve, reject) => {
            try {
                // Create a new order reference
                const newOrderRef = database.ref('orders').push();
                
                // Add timestamp
                orderData.timestamp = firebase.database.ServerValue.TIMESTAMP;
                orderData.status = "pending";
                orderData.id = newOrderRef.key;
                
                // Save to Firebase
                newOrderRef.set(orderData)
                    .then(() => {
                        console.log("Order saved to Firebase:", newOrderRef.key);
                        resolve({
                            orderId: newOrderRef.key,
                            ...orderData
                        });
                    })
                    .catch((error) => {
                        console.error("Error saving order:", error);
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Save notification lead
    saveNotificationLead: function(leadData) {
        return database.ref('notifications').push(leadData);
    },
    
    // Save bug report
    saveBugReport: function(bugData) {
        return database.ref('bugs').push(bugData);
    },
    
    // Get all orders (for admin)
    getAllOrders: function() {
        return database.ref('orders').once('value');
    },
    
    // Update order status
    updateOrderStatus: function(orderId, newStatus) {
        return database.ref('orders/' + orderId + '/status').set(newStatus);
    }
};
