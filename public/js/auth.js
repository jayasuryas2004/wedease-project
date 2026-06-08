const API_BASE_URL = 'http://localhost:5000/api/auth'; // Ensure this matches your backend

document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize global features
    initPasswordToggles();
    checkAuthStatus();
    restoreRememberedEmail();

    // 2. Attach event listeners to forms (if they exist on the current page)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const wrapper = btn.closest('.password-input-wrapper') || btn.parentElement;
            const input = wrapper.querySelector('input');
            const icon = btn.querySelector('i');
            
            if (input && input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else if (input) {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

function restoreRememberedEmail() {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const rememberedEmail = localStorage.getItem('rememberEmail');
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            const rememberCheckbox = document.getElementById('remember');
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    }
}

function createMessageContainer() {
    const container = document.createElement('div');
    container.className = 'message-container';
    container.style.marginTop = '15px';
    container.style.padding = '10px';
    container.style.borderRadius = '6px';
    container.style.textAlign = 'center';
    container.style.fontWeight = '500';
    
    const form = document.querySelector('form');
    if (form && form.parentNode) {
        form.parentNode.insertBefore(container, form.nextSibling);
    }
    return container;
}

function showMessage(container, message, type) {
    container.innerHTML = message;
    container.style.display = 'block';
    
    if (type === 'error') {
        container.style.backgroundColor = '#ffebee';
        container.style.color = '#c62828';
        container.style.border = '1px solid #ffcdd2';
    } else if (type === 'success') {
        container.style.backgroundColor = '#e8f5e9';
        container.style.color = '#2e7d32';
        container.style.border = '1px solid #c8e6c9';
    } else {
        container.style.backgroundColor = '#e3f2fd';
        container.style.color = '#1565c0';
        container.style.border = '1px solid #bbdefb';
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => { container.style.display = 'none'; }, 5000);
}

// ==========================================
// API HANDLERS (LOGIN / REGISTER)
// ==========================================

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember')?.checked;
    const messageContainer = document.querySelector('.message-container') || createMessageContainer();

    if (!email || !password) {
        showMessage(messageContainer, 'Please enter both email and password', 'error');
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('wedeaseToken', data.token);
            if (data.user) localStorage.setItem('wedeaseUser', JSON.stringify(data.user));
            
            if (rememberMe) {
                localStorage.setItem('rememberEmail', email);
            } else {
                localStorage.removeItem('rememberEmail');
            }
            
            showMessage(messageContainer, 'Login successful! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            showMessage(messageContainer, data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(messageContainer, 'Unable to connect to server. Ensure backend is running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageContainer = document.querySelector('.message-container') || createMessageContainer();

    // Check if passwords match if you have a confirm password field
    const confirmPasswordObj = document.getElementById('confirm-password');
    if (confirmPasswordObj && password !== confirmPasswordObj.value) {
        showMessage(messageContainer, 'Passwords do not match!', 'error');
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('wedeaseToken', data.token);
            if (data.user) localStorage.setItem('wedeaseUser', JSON.stringify(data.user));
            
            showMessage(messageContainer, 'Registration successful! Redirecting...', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1500);
        } else {
            showMessage(messageContainer, data.message || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(messageContainer, 'Unable to connect to server.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==========================================
// GLOBAL UI SESSION MANAGEMENT
// ==========================================

function checkAuthStatus() {
    const token = localStorage.getItem('wedeaseToken');
    const userStr = localStorage.getItem('wedeaseUser');
    
    if (token && userStr) {
        const userData = JSON.parse(userStr);
        updateUIForUser(userData);
    } else {
        updateUIForGuest();
    }
}

function updateUIForUser(userData) {
    // Target the specific container in your header
    const authContainer = document.querySelector('.auth-buttons'); 
    
    if (authContainer) {
        // Find and hide the existing Login/Register button
        const loginBtn = authContainer.querySelector('.login-btn');
        if (loginBtn) loginBtn.style.display = 'none';
        
        // Check if user menu already exists to prevent duplicates
        if (!document.querySelector('.user-menu')) {
            // Create user menu
            const userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.style.cssText = 'display: flex; align-items: center; gap: 15px; margin-left: 15px; color: white; font-weight: 500;';
            
            userMenu.innerHTML = `
                <div class="user-avatar" style="font-size: 1.5rem; color: var(--secondary-color);">
                    <i class="fas fa-user-circle"></i>
                </div>
                <span class="user-greeting">Hi, ${userData.name.split(' ')[0]}</span>
                <button class="logout-btn" style="background: transparent; border: 1px solid var(--secondary-color); color: var(--secondary-color); padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: 0.3s;">
                    Logout
                </button>
            `;
            
            // Append the new menu to the header
            authContainer.appendChild(userMenu);
            
            // Attach Logout Event
            userMenu.querySelector('.logout-btn').addEventListener('click', handleLogout);
        }
    }
}

function updateUIForGuest() {
    const authContainer = document.querySelector('.auth-buttons');
    if (authContainer) {
        const loginBtn = authContainer.querySelector('.login-btn');
        if (loginBtn) loginBtn.style.display = 'inline-block';
        
        const userMenu = authContainer.querySelector('.user-menu');
        if (userMenu) userMenu.remove();
    }
}

function handleLogout() {
    localStorage.removeItem('wedeaseToken');
    localStorage.removeItem('wedeaseUser');
    window.location.href = 'index.html';
}   