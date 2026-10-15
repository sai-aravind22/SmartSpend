/**
 * SmartSpend - Centralized API Client & Global Helpers
 */

const API_BASE_URL = ''; // Relative URL since Spring Boot serves the frontend

const SmartSpend = {
    // Current user settings loaded from localStorage
    settings: {
        currency: localStorage.getItem('smartspend_currency') || '₹',
        currencyCode: localStorage.getItem('smartspend_currency_code') || 'INR',
        dateFormat: localStorage.getItem('smartspend_date_format') || 'DD/MM/YYYY',
        theme: localStorage.getItem('smartspend_theme') || 'light',
        numberFormat: localStorage.getItem('smartspend_number_format') || 'indian'
    },

    // Category Metadata
    categories: {
        EXPENSE: [
            { name: 'Food', icon: 'fa-utensils', color: '#f97316' },
            { name: 'Transportation', icon: 'fa-car-side', color: '#0ea5e9' },
            { name: 'Shopping', icon: 'fa-bag-shopping', color: '#ec4899' },
            { name: 'Education', icon: 'fa-graduation-cap', color: '#8b5cf6' },
            { name: 'Entertainment', icon: 'fa-film', color: '#a855f7' },
            { name: 'Health', icon: 'fa-heart-pulse', color: '#ef4444' },
            { name: 'Bills and Utilities', icon: 'fa-bolt', color: '#eab308' },
            { name: 'Housing', icon: 'fa-house', color: '#14b8a6' },
            { name: 'Travel', icon: 'fa-plane', color: '#06b6d4' },
            { name: 'Personal Care', icon: 'fa-user-check', color: '#f43f5e' },
            { name: 'Other', icon: 'fa-layer-group', color: '#64748b' }
        ],
        INCOME: [
            { name: 'Salary', icon: 'fa-briefcase', color: '#10b981' },
            { name: 'Freelancing', icon: 'fa-laptop-code', color: '#3b82f6' },
            { name: 'Business', icon: 'fa-store', color: '#6366f1' },
            { name: 'Scholarship', icon: 'fa-award', color: '#eab308' },
            { name: 'Investment Returns', icon: 'fa-chart-line', color: '#059669' },
            { name: 'Gifts', icon: 'fa-gift', color: '#ec4899' },
            { name: 'Other', icon: 'fa-layer-group', color: '#64748b' }
        ]
    },

    paymentMethods: [
        { name: 'UPI', icon: 'fa-mobile-screen-button' },
        { name: 'Credit Card', icon: 'fa-credit-card' },
        { name: 'Debit Card', icon: 'fa-id-card' },
        { name: 'Bank Transfer', icon: 'fa-building-columns' },
        { name: 'Net Banking', icon: 'fa-globe' },
        { name: 'Cash', icon: 'fa-money-bill-wave' }
    ],

    // Auth Token & User Helpers
    getToken() {
        return localStorage.getItem('smartspend_token');
    },

    setToken(token) {
        localStorage.setItem('smartspend_token', token);
    },

    getUser() {
        try {
            const raw = localStorage.getItem('smartspend_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setUser(user) {
        localStorage.setItem('smartspend_user', JSON.stringify(user));
    },

    clearAuth() {
        localStorage.removeItem('smartspend_token');
        localStorage.removeItem('smartspend_user');
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    // Auth Operations
    async login(email, password) {
        const res = await this.post('/api/auth/login', { email, password });
        const authData = (res && res.data) ? res.data : res;
        if (authData && authData.token) {
            this.setToken(authData.token);
            const user = authData.user || {
                id: authData.id,
                fullName: authData.fullName,
                email: authData.email
            };
            this.setUser(user);
            return authData;
        }
        throw new Error((res && res.message) || 'Login failed');
    },

    async register(fullName, email, password) {
        const res = await this.post('/api/auth/register', { fullName, email, password });
        const authData = (res && res.data) ? res.data : res;
        if (authData && authData.token) {
            this.setToken(authData.token);
            const user = authData.user || {
                id: authData.id,
                fullName: authData.fullName,
                email: authData.email
            };
            this.setUser(user);
            return authData;
        }
        throw new Error((res && res.message) || 'Registration failed');
    },

    async logout(callApi = true) {
        if (callApi && this.getToken()) {
            try {
                await this.post('/api/auth/logout', {});
            } catch (e) {
                console.warn('Logout API error:', e);
            }
        }
        this.clearAuth();
        window.location.href = 'login.html';
    },

    async fetchCurrentUser() {
        if (!this.isAuthenticated()) return null;
        try {
            const res = await this.get('/api/auth/me');
            const user = (res && res.data) ? res.data : res;
            if (user && user.email) {
                this.setUser(user);
                this.updateUserBadge();
                return user;
            }
        } catch (e) {
            console.warn('Could not refresh user profile:', e);
        }
        return null;
    },

    updateUserBadge() {
        const user = this.getUser();
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        const emailEl = document.getElementById('userEmail');

        if (user) {
            const initials = user.fullName
                ? user.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                : 'U';
            if (avatarEl) avatarEl.textContent = initials || 'SS';
            if (nameEl) nameEl.textContent = user.fullName || 'User';
            if (emailEl) emailEl.textContent = user.email || '';
        } else {
            if (avatarEl) avatarEl.textContent = 'SS';
            if (nameEl) nameEl.textContent = 'Personal Account';
            if (emailEl) emailEl.textContent = 'SmartSpend v1.0';
        }
    },

    initAuth() {
        const path = window.location.pathname.toLowerCase();
        const isAuthPage = path.endsWith('login.html') || path.endsWith('register.html');

        if (!isAuthPage) {
            if (!this.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            this.updateUserBadge();
            this.fetchCurrentUser();

            const logoutBtn = document.getElementById('btnLogout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to log out of SmartSpend?')) {
                        this.logout();
                    }
                });
            }
        }
    },

    // API Helper
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                const path = window.location.pathname.toLowerCase();
                if (!path.includes('login.html') && !path.includes('register.html')) {
                    this.clearAuth();
                    window.location.href = 'login.html';
                    return null;
                }
            }

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                let errorMessage = (data && data.message) ? data.message : `HTTP error: ${response.status}`;
                if (data && data.details && data.details.length > 0) {
                    errorMessage += ': ' + data.details.join(', ');
                }
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
            throw error;
        }
    },

    get(endpoint, params = {}) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
                query.append(key, val);
            }
        });
        const qs = query.toString() ? `?${query.toString()}` : '';
        return this.request(`${endpoint}${qs}`, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    // Currency Formatter
    formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            amount = 0;
        }
        const num = Number(amount);
        const curr = this.settings.currency || '₹';

        let formatted = '';
        if (this.settings.numberFormat === 'indian') {
            formatted = num.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            formatted = num.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        return `${curr}${formatted}`;
    },

    // Date Formatter
    formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            if (this.settings.dateFormat === 'MM/DD/YYYY') {
                return `${month}/${day}/${year}`;
            } else if (this.settings.dateFormat === 'YYYY-MM-DD') {
                return `${year}-${month}-${day}`;
            } else {
                return `${day}/${month}/${year}`;
            }
        }
        return dateStr;
    },

    formatDisplayDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    },

    // Category Icon Helper
    getCategoryIcon(categoryName, type = 'EXPENSE') {
        const list = this.categories[type] || this.categories.EXPENSE;
        const item = list.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
        return item ? item.icon : 'fa-tag';
    },

    getCategoryColor(categoryName, type = 'EXPENSE') {
        const list = this.categories[type] || this.categories.EXPENSE;
        const item = list.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
        return item ? item.color : '#6366f1';
    },

    getPaymentIcon(methodName) {
        const item = this.paymentMethods.find(m => m.name.toLowerCase() === (methodName || '').toLowerCase());
        return item ? item.icon : 'fa-wallet';
    },

    // Toast Notifications
    showToast(message, type = 'success', title = '') {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            document.body.appendChild(container);
        }

        const icon = type === 'success' ? 'fa-circle-check text-success' :
                     type === 'danger' ? 'fa-circle-xmark text-danger' :
                     type === 'warning' ? 'fa-triangle-exclamation text-warning' :
                     'fa-circle-info text-info';

        const toastTitle = title || (type === 'success' ? 'Success' :
                           type === 'danger' ? 'Error' :
                           type === 'warning' ? 'Warning' : 'Information');

        const toastEl = document.createElement('div');
        toastEl.className = 'toast shadow-lg rounded-3 border-0 mb-2';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="toast-header bg-white border-bottom-0 py-2">
                <i class="fa-solid ${icon} me-2 fs-5"></i>
                <strong class="me-auto text-dark">${toastTitle}</strong>
                <small class="text-muted">Just now</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body pt-0 pb-3 text-secondary">
                ${message}
            </div>
        `;

        container.appendChild(toastEl);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
        bsToast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    },

    // Theme Management
    initTheme() {
        const currentTheme = this.settings.theme;
        document.documentElement.setAttribute('data-theme', currentTheme);

        const themeToggles = document.querySelectorAll('.theme-toggle-btn');
        themeToggles.forEach(btn => {
            btn.innerHTML = currentTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            btn.addEventListener('click', () => this.toggleTheme());
        });
    },

    toggleTheme() {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.settings.theme = newTheme;
        localStorage.setItem('smartspend_theme', newTheme);

        const themeToggles = document.querySelectorAll('.theme-toggle-btn');
        themeToggles.forEach(btn => {
            btn.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    },

    // Mobile Drawer Toggle
    initMobileNav() {
        const toggleBtn = document.getElementById('mobileNavToggle');
        const sidebar = document.querySelector('.sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                }
            });
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    SmartSpend.initAuth();
    SmartSpend.initTheme();
    SmartSpend.initMobileNav();
});
