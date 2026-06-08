/**
 * Vendor Registration Page JavaScript
 * Handles flash message, multi-step form, image uploads, and submission
 */

document.addEventListener('DOMContentLoaded', () => {
    // Show flash message
    showFlashMessage();
    
    // Animate stats counter
    animateCounters();
    
    // Setup form functionality
    setupFormNavigation();
    setupImageUpload();
    setupFormSubmission();
});

// ==========================================
// Flash Message
// ==========================================
function showFlashMessage() {
    const flashMessage = document.getElementById('flashMessage');
    if (!flashMessage) return;
    
    // Show after a small delay
    setTimeout(() => {
        flashMessage.classList.add('show');
    }, 300);
    
    // Hide after 2.5 seconds
    setTimeout(() => {
        flashMessage.classList.remove('show');
    }, 2800);
}

// ==========================================
// Stats Counter Animation
// ==========================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        // Start animation when element is in view
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                updateCounter();
                observer.disconnect();
            }
        });
        
        observer.observe(counter);
    });
}

// ==========================================
// Multi-step Form Navigation
// ==========================================
let currentStep = 1;
const totalSteps = 4;

function setupFormNavigation() {
    // Update step indicator
    updateStepIndicator();
}

function nextStep(step) {
    if (validateStep(currentStep)) {
        // Update current step
        document.getElementById(`step${currentStep}`).classList.remove('active');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
        
        currentStep = step;
        
        // Show new step
        document.getElementById(`step${currentStep}`).classList.add('active');
        document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
        
        // Scroll to top of form
        document.querySelector('.vendor-registration-form').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function prevStep(step) {
    // Update current step
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
    
    currentStep = step;
    
    // Show previous step
    document.getElementById(`step${currentStep}`).classList.add('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('active');
    document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('completed');
    
    // Scroll to top of form
    document.querySelector('.vendor-registration-form').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function updateStepIndicator() {
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.querySelector(`.step[data-step="${i}"]`);
        if (i < currentStep) {
            stepElement.classList.add('completed');
            stepElement.classList.remove('active');
        } else if (i === currentStep) {
            stepElement.classList.add('active');
            stepElement.classList.remove('completed');
        } else {
            stepElement.classList.remove('active', 'completed');
        }
    }
}

function validateStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    const requiredFields = stepElement.querySelectorAll('[required]');
    let isValid = true;
    let firstError = null;
    
    requiredFields.forEach(field => {
        // Remove previous error styling
        field.classList.remove('error');
        
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
            if (!firstError) firstError = field;
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
            field.classList.add('error');
            isValid = false;
            if (!firstError) firstError = field;
        } else if (field.type === 'tel' && !isValidPhone(field.value)) {
            field.classList.add('error');
            isValid = false;
            if (!firstError) firstError = field;
        }
    });
    
    if (!isValid) {
        showToast('Please fill in all required fields correctly', 'error');
        if (firstError) {
            firstError.focus();
        }
    }
    
    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

// ==========================================
// Package Management
// ==========================================
let packageCount = 1;

function addPackage() {
    packageCount++;
    const container = document.getElementById('packagesContainer');
    
    const newPackage = document.createElement('div');
    newPackage.className = 'package-input';
    newPackage.id = `package-${packageCount}`;
    newPackage.style.cssText = 'background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 10px; margin-bottom: 1rem; position: relative;';
    
    newPackage.innerHTML = `
        <button type="button" onclick="removePackage(${packageCount})" 
            style="position: absolute; top: 0.5rem; right: 0.5rem; background: #ef4444; border: none; color: #fff; width: 25px; height: 25px; border-radius: 50%; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-row" style="margin-bottom: 0.5rem;">
            <input type="text" name="packages[${packageCount - 1}][name]" placeholder="Package Name (e.g., Gold Package)">
            <input type="number" name="packages[${packageCount - 1}][price]" placeholder="Price (₹)">
        </div>
        <textarea name="packages[${packageCount - 1}][description]" placeholder="What's included in this package?" rows="2" style="width: 100%;"></textarea>
    `;
    
    container.appendChild(newPackage);
}

function removePackage(id) {
    const packageElement = document.getElementById(`package-${id}`);
    if (packageElement && packageCount > 1) {
        packageElement.remove();
    }
}

// ==========================================
// Image Upload & Preview
// ==========================================
function setupImageUpload() {
    const uploadArea = document.getElementById('portfolioUpload');
    const fileInput = document.getElementById('portfolioImages');
    const previewGrid = document.getElementById('imagePreview');
    
    if (!uploadArea || !fileInput) return;
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    function handleFiles(files) {
        previewGrid.innerHTML = '';
        
        const validFiles = Array.from(files).filter(file => {
            // Check file type
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                showToast(`${file.name} is not a valid image format`, 'error');
                return false;
            }
            // Check file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast(`${file.name} is too large (max 5MB)`, 'error');
                return false;
            }
            return true;
        });
        
        if (validFiles.length > 20) {
            showToast('Maximum 20 images allowed', 'warning');
            validFiles.length = 20;
        }
        
        validFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button type="button" class="remove-preview" onclick="removePreview(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewGrid.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
        
        // Show count
        if (validFiles.length > 0) {
            showToast(`${validFiles.length} image(s) selected`, 'success');
        }
    }
}

function removePreview(button) {
    button.parentElement.remove();
}

// ==========================================
// Form Submission
// ==========================================
function setupFormSubmission() {
    const form = document.getElementById('vendorRegistrationForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate final step
        if (!validateStep(4)) return;
        
        // Password validation
        const password = document.getElementById('vendorPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            document.getElementById('confirmPassword').classList.add('error');
            return;
        }
        
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            document.getElementById('vendorPassword').classList.add('error');
            return;
        }
        
        // Prepare form data
        const formData = new FormData(form);
        
        // Show loading state
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/vendors/register', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast('Registration successful! Redirecting...', 'success');
                
                // Show success modal
                showSuccessModal();
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/vendor-login.html?registered=true';
                }, 3000);
            } else {
                showToast(result.message || 'Registration failed. Please try again.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Something went wrong. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function showSuccessModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            max-width: 500px;
            border: 1px solid rgba(16, 185, 129, 0.3);
            animation: scaleIn 0.5s ease;
        ">
            <div style="
                width: 100px;
                height: 100px;
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;
            ">
                <i class="fas fa-check" style="font-size: 3rem; color: #fff;"></i>
            </div>
            <h2 style="color: #10b981; font-family: 'Playfair Display', serif; font-size: 2rem; margin-bottom: 1rem;">
                Registration Successful!
            </h2>
            <p style="color: #aaa; margin-bottom: 1.5rem;">
                Thank you for registering with Wedease! Our team will verify your account within 24 hours. 
                You'll receive a confirmation email once your account is activated.
            </p>
            <p style="color: #D4AF37;">
                <i class="fas fa-spinner fa-spin"></i> Redirecting to login page...
            </p>
        </div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
}

// ==========================================
// Toast Notification
// ==========================================
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
