// User Profile JavaScript for Wedease
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Tab navigation
    initTabNavigation();
    
    // Initialize profile edit functionality
    initProfileEdit();
    
    // Initialize bookings functionality
    initBookings();
    
    // Initialize e-invites functionality
    initInvites();
    
    // Initialize favorites functionality
    initFavorites();
    
    // Initialize settings functionality
    initSettings();
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Check authentication status
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        if (!token) {
            window.location.href = '/login.html?redirect=profile';
            return;
        }

        // Verify token with backend
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            updateProfileUI(userData);
        } else {
            // Token invalid or expired
            localStorage.removeItem('wedeaseToken');
            window.location.href = '/login.html?redirect=profile';
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showErrorMessage('Failed to load profile data. Please try again later.');
    }
}

// Update profile UI with user data
function updateProfileUI(userData) {
    // Update sidebar
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    
    if (profileName) profileName.textContent = userData.name;
    if (profileEmail) profileEmail.textContent = userData.email;
    
    // Update personal info tab
    const infoName = document.getElementById('info-name');
    const infoEmail = document.getElementById('info-email');
    const infoPhone = document.getElementById('info-phone');
    const infoAddress = document.getElementById('info-address');
    const infoMemberSince = document.getElementById('info-member-since');
    
    if (infoName) infoName.textContent = userData.name;
    if (infoEmail) infoEmail.textContent = userData.email;
    if (infoPhone) infoPhone.textContent = userData.phone || 'Not provided';
    if (infoAddress) infoAddress.textContent = userData.address || 'Not provided';
    if (infoMemberSince) {
        const createdAt = new Date(userData.createdAt || Date.now());
        infoMemberSince.textContent = createdAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Update edit form
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    const editPhone = document.getElementById('edit-phone');
    const editAddress = document.getElementById('edit-address');
    
    if (editName) editName.value = userData.name;
    if (editEmail) editEmail.value = userData.email;
    if (editPhone) editPhone.value = userData.phone || '';
    if (editAddress) editAddress.value = userData.address || '';
    
    // Load user data for other tabs
    loadUserBookings();
    loadUserInvites();
    loadUserFavorites();
}

// Initialize tab navigation
function initTabNavigation() {
    const menuItems = document.querySelectorAll('.profile-menu li');
    const tabs = document.querySelectorAll('.profile-tab');
    
    // Check for hash in URL
    const hash = window.location.hash;
    if (hash) {
        const targetTab = document.querySelector(hash);
        if (targetTab) {
            tabs.forEach(tab => tab.classList.remove('active'));
            targetTab.classList.add('active');
            
            menuItems.forEach(item => item.classList.remove('active'));
            document.querySelector(`[data-tab="${hash.substring(1)}"]`).classList.add('active');
        }
    }
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const tabId = this.dataset.tab;
            
            // Update active tab
            tabs.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Update active menu item
            menuItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // Update URL hash
            window.location.hash = tabId;
            
            e.preventDefault();
        });
    });
}

// Initialize profile edit functionality
function initProfileEdit() {
    const editBtn = document.getElementById('edit-profile-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const profileForm = document.getElementById('profile-edit-form');
    const profileInfoView = document.getElementById('profile-info-view');
    const profileInfoEdit = document.getElementById('profile-info-edit');
    
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            profileInfoView.style.display = 'none';
            profileInfoEdit.style.display = 'block';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            profileInfoView.style.display = 'block';
            profileInfoEdit.style.display = 'none';
        });
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(profileForm);
            const userData = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address')
            };
            
            try {
                const token = localStorage.getItem('wedeaseToken');
                
                const response = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                if (response.ok) {
                    const updatedUser = await response.json();
                    updateProfileUI(updatedUser);
                    
                    // Show success message
                    showMessage('Profile updated successfully!', 'success');
                    
                    // Switch back to view mode
                    profileInfoView.style.display = 'block';
                    profileInfoEdit.style.display = 'none';
                } else {
                    const error = await response.json();
                    showMessage(error.message || 'Failed to update profile. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Profile update error:', error);
                showMessage('An error occurred. Please try again later.', 'error');
            }
        });
    }
}

// Initialize bookings functionality
function initBookings() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const filter = this.dataset.filter;
                filterBookings(filter);
            });
        });
    }
}

// Load user bookings
async function loadUserBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;
    
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock bookings data
        const bookings = [
            { id: 'BK001', vendor: 'Royal Palace', category: 'Venue', date: '2025-05-15', time: '6:00 PM', package: 'Premium', amount: '₹120,000', status: 'confirmed' },
            { id: 'BK002', vendor: 'Dream Photography', category: 'Photography', date: '2025-05-10', time: '3:00 PM', package: 'Standard', amount: '₹45,000', status: 'pending' },
            { id: 'BK003', vendor: 'Glamour Makeup', category: 'Makeup', date: '2025-05-08', time: '10:00 AM', package: 'Bridal', amount: '₹25,000', status: 'confirmed' },
            { id: 'BK004', vendor: 'Spice Catering', category: 'Catering', date: '2025-05-05', time: '7:00 PM', package: 'Deluxe', amount: '₹80,000', status: 'cancelled' }
        ];
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-calendar-times"></i>
                    <h4>No Bookings Found</h4>
                    <p>You haven't made any bookings yet.</p>
                </div>
            `;
            return;
        }
        
        // Clear loading state
        bookingsList.innerHTML = '';
        
        // Add bookings
        bookings.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = `booking-card ${booking.status}`;
            bookingCard.dataset.status = booking.status;
            
            let statusClass = 'status-pending';
            if (booking.status === 'confirmed') {
                statusClass = 'status-confirmed';
            } else if (booking.status === 'cancelled') {
                statusClass = 'status-cancelled';
            }
            
            bookingCard.innerHTML = `
                <div class="booking-header">
                    <h3 class="booking-title">${booking.vendor}</h3>
                    <span class="booking-status ${statusClass}">${capitalizeFirstLetter(booking.status)}</span>
                </div>
                <div class="booking-details">
                    <div class="booking-detail">
                        <div class="booking-detail-label">Booking ID</div>
                        <div class="booking-detail-value">${booking.id}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Category</div>
                        <div class="booking-detail-value">${booking.category}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Date</div>
                        <div class="booking-detail-value">${formatDate(booking.date)}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Time</div>
                        <div class="booking-detail-value">${booking.time}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Package</div>
                        <div class="booking-detail-value">${booking.package}</div>
                    </div>
                    <div class="booking-detail">
                        <div class="booking-detail-label">Amount</div>
                        <div class="booking-detail-value">${booking.amount}</div>
                    </div>
                </div>
                <div class="booking-actions">
                    <button class="booking-action-btn view" data-id="${booking.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${booking.status === 'pending' ? `
                        <button class="booking-action-btn cancel" data-id="${booking.id}">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                </div>
            `;
            
            bookingsList.appendChild(bookingCard);
        });
        
        // Add event listeners to action buttons
        const viewBtns = bookingsList.querySelectorAll('.view');
        const cancelBtns = bookingsList.querySelectorAll('.cancel');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => viewBooking(btn.dataset.id));
        });
        
        cancelBtns.forEach(btn => {
            btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = `
            <div class="error-message">
                <p>Failed to load bookings. Please try again later.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        const retryBtn = bookingsList.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadUserBookings);
        }
    }
}

// Filter bookings by status
function filterBookings(filter) {
    const bookingCards = document.querySelectorAll('.booking-card');
    
    bookingCards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else if (filter === 'upcoming') {
            card.style.display = (card.dataset.status === 'confirmed' || card.dataset.status === 'pending') ? 'block' : 'none';
        } else {
            card.style.display = card.dataset.status === filter ? 'block' : 'none';
        }
    });
}

// Initialize e-invites functionality
function initInvites() {
    // This will be implemented with actual API calls in production
}

// Load user invites
async function loadUserInvites() {
    const invitesGrid = document.getElementById('invites-grid');
    if (!invitesGrid) return;
    
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock invites data
        const invites = [
            { id: 'INV001', title: 'Wedding Invitation - Rahul & Priya', date: '2025-05-15', imageUrl: '/images/invite-templates/template1.jpg' },
            { id: 'INV002', title: 'Engagement Invitation', date: '2025-04-20', imageUrl: '/images/invite-templates/template2.jpg' }
        ];
        
        if (invites.length === 0) {
            invitesGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-envelope-open"></i>
                    <h4>No E-Invites Found</h4>
                    <p>You haven't created any e-invites yet.</p>
                </div>
            `;
            return;
        }
        
        // Clear loading state
        invitesGrid.innerHTML = '';
        
        // Add invites
        invites.forEach(invite => {
            const inviteCard = document.createElement('div');
            inviteCard.className = 'invite-card';
            
            inviteCard.innerHTML = `
                <div class="invite-image">
                    <img src="${invite.imageUrl}" alt="${invite.title}">
                </div>
                <div class="invite-details">
                    <h3 class="invite-title">${invite.title}</h3>
                    <p class="invite-date">Created: ${formatDate(invite.date)}</p>
                    <div class="invite-actions">
                        <button class="invite-action-btn view" data-id="${invite.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="invite-action-btn share" data-id="${invite.id}">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
            `;
            
            invitesGrid.appendChild(inviteCard);
        });
        
        // Add event listeners to action buttons
        const viewBtns = invitesGrid.querySelectorAll('.view');
        const shareBtns = invitesGrid.querySelectorAll('.share');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => viewInvite(btn.dataset.id));
        });
        
        shareBtns.forEach(btn => {
            btn.addEventListener('click', () => shareInvite(btn.dataset.id));
        });
    } catch (error) {
        console.error('Error loading invites:', error);
        invitesGrid.innerHTML = `
            <div class="error-message">
                <p>Failed to load e-invites. Please try again later.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        const retryBtn = invitesGrid.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadUserInvites);
        }
    }
}

// Initialize favorites functionality
function initFavorites() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    if (categoryBtns.length > 0) {
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.dataset.category;
                filterFavorites(category);
            });
        });
    }
}

// Load user favorites
async function loadUserFavorites() {
    const favoritesGrid = document.getElementById('favorites-grid');
    if (!favoritesGrid) return;
    
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock favorites data
        const favorites = [
            { id: 'VEN001', name: 'Royal Palace', category: 'Venue', rating: 4.8, price: '₹1,20,000 onwards', imageUrl: '/images/vendor-placeholder.jpg' },
            { id: 'PHO001', name: 'Dream Photography', category: 'Photography', rating: 4.9, price: '₹45,000 onwards', imageUrl: '/images/vendor-placeholder.jpg' },
            { id: 'MAK001', name: 'Glamour Makeup', category: 'Makeup', rating: 4.7, price: '₹25,000 onwards', imageUrl: '/images/vendor-placeholder.jpg' }
        ];
        
        if (favorites.length === 0) {
            favoritesGrid.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-heart-broken"></i>
                    <h4>No Favorites Found</h4>
                    <p>You haven't added any vendors to your favorites yet.</p>
                </div>
            `;
            return;
        }
        
        // Clear loading state
        favoritesGrid.innerHTML = '';
        
        // Add favorites
        favorites.forEach(favorite => {
            const favoriteCard = document.createElement('div');
            favoriteCard.className = 'favorite-card';
            favoriteCard.dataset.category = favorite.category.toLowerCase();
            
            favoriteCard.innerHTML = `
                <div class="favorite-image">
                    <img src="${favorite.imageUrl}" alt="${favorite.name}">
                    <span class="favorite-category">${favorite.category}</span>
                </div>
                <div class="favorite-details">
                    <h3 class="favorite-title">${favorite.name}</h3>
                    <div class="favorite-rating">
                        ${getStarRating(favorite.rating)}
                        <span>${favorite.rating}</span>
                    </div>
                    <p class="favorite-price">${favorite.price}</p>
                    <div class="favorite-actions">
                        <button class="favorite-action-btn view" data-id="${favorite.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="favorite-action-btn remove" data-id="${favorite.id}">
                            <i class="fas fa-heart-broken"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            
            favoritesGrid.appendChild(favoriteCard);
        });
        
        // Add event listeners to action buttons
        const viewBtns = favoritesGrid.querySelectorAll('.view');
        const removeBtns = favoritesGrid.querySelectorAll('.remove');
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => viewVendor(btn.dataset.id));
        });
        
        removeBtns.forEach(btn => {
            btn.addEventListener('click', () => removeFavorite(btn.dataset.id));
        });
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesGrid.innerHTML = `
            <div class="error-message">
                <p>Failed to load favorites. Please try again later.</p>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        
        const retryBtn = favoritesGrid.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', loadUserFavorites);
        }
    }
}

// Filter favorites by category
function filterFavorites(category) {
    const favoriteCards = document.querySelectorAll('.favorite-card');
    
    favoriteCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            card.style.display = card.dataset.category === category ? 'block' : 'none';
        }
    });
}

// Initialize settings functionality
function initSettings() {
    const changePasswordForm = document.getElementById('change-password-form');
    const notificationForm = document.getElementById('notification-form');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(changePasswordForm);
            const passwordData = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword'),
                confirmPassword: formData.get('confirmPassword')
            };
            
            // Validate passwords
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                showMessage('New passwords do not match!', 'error', changePasswordForm);
                return;
            }
            
            // In a real implementation, this would be an API call
            // For now, we'll just show a success message
            showMessage('Password updated successfully!', 'success', changePasswordForm);
            changePasswordForm.reset();
        });
    }
    
    if (notificationForm) {
        notificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // In a real implementation, this would be an API call
            // For now, we'll just show a success message
            showMessage('Notification preferences saved!', 'success', notificationForm);
        });
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // In a real implementation, this would be an API call
                alert('Account deletion would be processed in a real implementation.');
            }
        });
    }
}

// Action functions
function viewBooking(id) {
    alert(`View booking details for ID: ${id}`);
    // In a real implementation, this would open a modal with booking details
}

function cancelBooking(id) {
    if (confirm(`Are you sure you want to cancel booking ${id}?`)) {
        alert(`Booking ${id} cancelled successfully`);
        // In a real implementation, this would call an API to cancel the booking
    }
}

function viewInvite(id) {
    alert(`View invite details for ID: ${id}`);
    // In a real implementation, this would open the invite in a new page
}

function shareInvite(id) {
    alert(`Share invite with ID: ${id}`);
    // In a real implementation, this would open a sharing modal
}

function viewVendor(id) {
    alert(`View vendor details for ID: ${id}`);
    // In a real implementation, this would navigate to the vendor page
}

function removeFavorite(id) {
    if (confirm(`Are you sure you want to remove this vendor from your favorites?`)) {
        alert(`Vendor removed from favorites successfully`);
        // In a real implementation, this would call an API to remove the favorite
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('wedeaseToken');
    window.location.href = '/index.html';
}

// Show message
function showMessage(message, type, form) {
    // Create message element if it doesn't exist
    let messageContainer = form ? form.nextElementSibling : null;
    if (!messageContainer || !messageContainer.classList.contains('message-container')) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        form.parentNode.insertBefore(messageContainer, form.nextSibling);
    }
    
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    messageContainer.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

// Show error message
function showErrorMessage(message) {
    const profileContent = document.querySelector('.profile-content');
    if (!profileContent) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button class="retry-btn">Retry</button>
    `;
    
    profileContent.innerHTML = '';
    profileContent.appendChild(errorDiv);
    
    const retryBtn = errorDiv.querySelector('.retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', checkAuthStatus);
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function getStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
