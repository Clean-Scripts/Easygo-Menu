// EasyGo Menu - Common Functions

// Cart management
const CartManager = {
    getCart() {
        return JSON.parse(localStorage.getItem('easygo_cart') || '[]');
    },
    
    addToCart(item) {
        const cart = this.getCart();
        const existingItem = cart.find(cartItem => 
            cartItem.id === item.id && cartItem.pack === item.pack
        );
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.total = existingItem.quantity * (existingItem.price / existingItem.quantity);
        } else {
            cart.push(item);
        }
        
        localStorage.setItem('easygo_cart', JSON.stringify(cart));
        this.updateCartBadge();
        return cart;
    },
    
    removeFromCart(itemId) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('easygo_cart', JSON.stringify(cart));
        this.updateCartBadge();
        return cart;
    },
    
    clearCart() {
        localStorage.removeItem('easygo_cart');
        this.updateCartBadge();
    },
    
    getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.price, 0);
    },
    
    updateCartBadge() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Update badge if exists
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = totalItems;
            badge.classList.toggle('hidden', totalItems === 0);
        }
    },
    
    saveOrder(orderData) {
        const orders = JSON.parse(localStorage.getItem('easygo_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('easygo_orders', JSON.stringify(orders));
        return orderData;
    }
};

// Visitor analytics
const Analytics = {
    trackEvent(eventName, data = {}) {
        const events = JSON.parse(localStorage.getItem('easygo_analytics') || '[]');
        const event = {
            name: eventName,
            data: data,
            timestamp: new Date().toISOString(),
            visitorId: localStorage.getItem('easygo_visitor_id'),
            page: window.location.pathname
        };
        events.push(event);
        localStorage.setItem('easygo_analytics', JSON.stringify(events.slice(-1000))); // Keep last 1000 events
    },
    
    getUniqueVisitors() {
        const events = JSON.parse(localStorage.getItem('easygo_analytics') || '[]');
        const visitorIds = [...new Set(events.map(event => event.visitorId))];
        return visitorIds.length;
    },
    
    getPopularItems() {
        const events = JSON.parse(localStorage.getItem('easygo_analytics') || '[]');
        const itemViews = events
            .filter(event => event.name === 'item_view')
            .reduce((acc, event) => {
                const itemId = event.data.itemId;
                acc[itemId] = (acc[itemId] || 0) + 1;
                return acc;
            }, {});
        
        return Object.entries(itemViews)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
};

// Utility functions
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    },
    
    formatDate(date) {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `EASYGO-${timestamp}-${random}`;
    },
    
    validatePhone(phone) {
        return /^[6-9]\d{9}$/.test(phone);
    },
    
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.CartManager = CartManager;
    window.Analytics = Analytics;
    window.Utils = Utils;
}
