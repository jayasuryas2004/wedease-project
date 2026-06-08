/**
 * API Utility Functions for Wedease Frontend
 * Provides consistent API communication and error handling
 */

// API Base URL
const API_BASE_URL = '/api';

/**
 * Get authentication token
 */
function getAuthToken() {
    return localStorage.getItem('wedeaseToken');
}

/**
 * Get authorization headers
 */
function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Handle API response
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response data
 */
async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
        // Create error object with details
        const error = new Error(data.message || 'An error occurred');
        error.status = response.status;
        error.data = data;
        error.errorCode = data.errorCode;
        
        throw error;
    }
    
    return data;
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
function getErrorMessage(error) {
    // Handle rate limiting
    if (error.status === 429) {
        const retryAfter = error.data?.retryAfter || 60;
        if (retryAfter > 60) {
            const minutes = Math.ceil(retryAfter / 60);
            return `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
        }
        return `Too many requests. Please try again in ${retryAfter} seconds.`;
    }
    
    // Handle authentication errors
    if (error.status === 401) {
        return 'Your session has expired. Please log in again.';
    }
    
    // Handle authorization errors
    if (error.status === 403) {
        return 'You do not have permission to perform this action.';
    }
    
    // Handle not found errors
    if (error.status === 404) {
        return error.message || 'The requested resource was not found.';
    }
    
    // Handle validation errors
    if (error.status === 400 && error.data?.errors) {
        return error.data.errors.map(e => e.message).join('. ');
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Unable to connect to server. Please check your internet connection.';
    }
    
    // Handle server errors
    if (error.status >= 500) {
        return 'Server error. Please try again later.';
    }
    
    // Default message
    return error.message || 'An unexpected error occurred.';
}

/**
 * API Client
 */
const api = {
    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        return handleResponse(response);
    },
    
    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     */
    async post(endpoint, data = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(data)
        });
        
        return handleResponse(response);
    },
    
    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body
     */
    async put(endpoint, data = {}) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(data)
        });
        
        return handleResponse(response);
    },
    
    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     */
    async delete(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        return handleResponse(response);
    },
    
    /**
     * Upload file
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data with files
     */
    async upload(endpoint, formData) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders()
            },
            body: formData
        });
        
        return handleResponse(response);
    }
};

/**
 * Toast notification system
 */
const toast = {
    container: null,
    
    /**
     * Initialize toast container
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(this.container);
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    show(message, type = 'info', duration = 5000) {
        this.init();
        
        const colors = {
            success: { bg: '#10b981', icon: '✓' },
            error: { bg: '#ef4444', icon: '✕' },
            warning: { bg: '#f59e0b', icon: '⚠' },
            info: { bg: '#3b82f6', icon: 'ℹ' }
        };
        
        const color = colors[type] || colors.info;
        
        const toastEl = document.createElement('div');
        toastEl.style.cssText = `
            background: ${color.bg};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
            animation: slideIn 0.3s ease;
        `;
        
        toastEl.innerHTML = `
            <span style="font-weight: bold;">${color.icon}</span>
            <span>${message}</span>
        `;
        
        this.container.appendChild(toastEl);
        
        // Add animation styles if not present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove toast after duration
        setTimeout(() => {
            toastEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
    },
    
    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};

/**
 * Loading spinner utility
 */
const loader = {
    overlay: null,
    
    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    show(message = 'Loading...') {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'loading-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        this.overlay.innerHTML = `
            <div style="
                background: white;
                padding: 30px 50px;
                border-radius: 10px;
                text-align: center;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #D4AF37;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    animation: spin 1s linear infinite;
                "></div>
                <p style="margin: 0; color: #333;">${message}</p>
            </div>
        `;
        
        // Add spin animation if not present
        if (!document.getElementById('loader-styles')) {
            const style = document.createElement('style');
            style.id = 'loader-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(this.overlay);
    },
    
    /**
     * Hide loading overlay
     */
    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
};

/**
 * Form validation helper
 */
const validation = {
    /**
     * Validate email format
     * @param {string} email
     * @returns {boolean}
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    /**
     * Validate phone number
     * @param {string} phone
     * @returns {boolean}
     */
    isValidPhone(phone) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(phone);
    },
    
    /**
     * Validate password strength
     * @param {string} password
     * @returns {Object} Validation result with score and message
     */
    passwordStrength(password) {
        let score = 0;
        const issues = [];
        
        if (password.length >= 8) score++;
        else issues.push('at least 8 characters');
        
        if (password.length >= 12) score++;
        
        if (/[a-z]/.test(password)) score++;
        else issues.push('lowercase letter');
        
        if (/[A-Z]/.test(password)) score++;
        else issues.push('uppercase letter');
        
        if (/[0-9]/.test(password)) score++;
        else issues.push('number');
        
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        else issues.push('special character');
        
        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        
        return {
            score,
            level: levels[Math.min(score, 5)],
            issues,
            isValid: password.length >= 6
        };
    },
    
    /**
     * Validate required fields in a form
     * @param {HTMLFormElement} form
     * @returns {Object} Validation result
     */
    validateForm(form) {
        const errors = [];
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push({
                    field: field.name || field.id,
                    message: `${field.placeholder || 'This field'} is required`
                });
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

// Make utilities globally available
window.api = api;
window.toast = toast;
window.loader = loader;
window.validation = validation;
window.getErrorMessage = getErrorMessage;
