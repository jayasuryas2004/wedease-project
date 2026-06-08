// Admin Dashboard JavaScript for Wedease
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is admin, redirect if not
    checkAdminAccess();
    
    // Initialize dashboard components
    initDashboard();
    
    // Handle logout
    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Handle chart period buttons
    const periodBtns = document.querySelectorAll('.period-btn');
    if (periodBtns.length > 0) {
        periodBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                periodBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                updateBookingChart(this.dataset.period);
            });
        });
    }
});

// Check if user has admin access
async function checkAdminAccess() {
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        if (!token) {
            window.location.href = '/login.html?redirect=admin';
            return;
        }

        // Verify token and admin role with backend
        const response = await fetch('/api/users/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userData = await response.json();
            
            // Update admin name in header
            const adminName = document.querySelector('.admin-name');
            if (adminName && userData.name) {
                adminName.textContent = userData.name;
            }
            
            // Check if user is admin
            if (userData.role !== 'admin') {
                alert('You do not have permission to access the admin dashboard.');
                window.location.href = '/index.html';
            }
        } else {
            // Token invalid or expired
            localStorage.removeItem('wedeaseToken');
            window.location.href = '/login.html?redirect=admin';
        }
    } catch (error) {
        console.error('Admin access check error:', error);
        window.location.href = '/login.html?redirect=admin';
    }
}

// Initialize dashboard data and components
async function initDashboard() {
    try {
        // Fetch dashboard data
        const dashboardData = await fetchDashboardData();
        
        // Update stats counts
        updateStatCounts(dashboardData);
        
        // Load recent activities
        loadRecentActivities(dashboardData.recentActivities);
        
        // Load recent bookings
        loadRecentBookings(dashboardData.recentBookings);
        
        // Load popular vendors
        loadPopularVendors(dashboardData.popularVendors);
        
        // Initialize booking chart
        initBookingChart(dashboardData.bookingStats);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showErrorMessage('Failed to load dashboard data. Please try again later.');
    }
}

// Fetch dashboard data from API
async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('wedeaseToken');
        
        // In a real implementation, this would be an API call
        // For now, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock dashboard data
        return {
            stats: {
                users: 248,
                vendors: 53,
                bookings: 186,
                revenue: 1250000
            },
            recentActivities: [
                { type: 'user', action: 'New user registered', user: 'Rahul Sharma', time: '10 minutes ago' },
                { type: 'booking', action: 'New booking created', user: 'Priya Patel', vendor: 'Royal Palace', time: '1 hour ago' },
                { type: 'vendor', action: 'New vendor added', vendor: 'Dream Photography', time: '3 hours ago' },
                { type: 'payment', action: 'Payment received', amount: '₹45,000', user: 'Vikram Singh', time: '5 hours ago' },
                { type: 'review', action: 'New review added', rating: 5, user: 'Ananya Desai', vendor: 'Glamour Makeup', time: '1 day ago' }
            ],
            recentBookings: [
                { id: 'BK001', user: 'Priya Patel', vendor: 'Royal Palace', date: '2025-05-15', status: 'confirmed' },
                { id: 'BK002', user: 'Vikram Singh', vendor: 'Dream Photography', date: '2025-05-10', status: 'pending' },
                { id: 'BK003', user: 'Ananya Desai', vendor: 'Glamour Makeup', date: '2025-05-08', status: 'confirmed' },
                { id: 'BK004', user: 'Raj Malhotra', vendor: 'Spice Catering', date: '2025-05-05', status: 'cancelled' },
                { id: 'BK005', user: 'Neha Kapoor', vendor: 'Flower Decor', date: '2025-05-01', status: 'confirmed' }
            ],
            popularVendors: [
                { name: 'Royal Palace', category: 'Venue', rating: 4.8, bookings: 32 },
                { name: 'Dream Photography', category: 'Photography', rating: 4.9, bookings: 28 },
                { name: 'Glamour Makeup', category: 'Makeup', rating: 4.7, bookings: 25 },
                { name: 'Flower Decor', category: 'Decor', rating: 4.6, bookings: 22 },
                { name: 'Spice Catering', category: 'Catering', rating: 4.5, bookings: 20 }
            ],
            bookingStats: {
                week: [12, 15, 18, 14, 20, 25, 22],
                month: [45, 52, 49, 60],
                year: [180, 220, 210, 240, 280, 250, 300, 320, 290, 340, 360, 380]
            }
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error;
    }
}

// Update stats count elements
function updateStatCounts(data) {
    const userCount = document.getElementById('user-count');
    const vendorCount = document.getElementById('vendor-count');
    const bookingCount = document.getElementById('booking-count');
    const revenueCount = document.getElementById('revenue-count');
    
    if (userCount) userCount.textContent = data.stats.users;
    if (vendorCount) vendorCount.textContent = data.stats.vendors;
    if (bookingCount) bookingCount.textContent = data.stats.bookings;
    if (revenueCount) revenueCount.textContent = `₹${formatNumber(data.stats.revenue)}`;
}

// Load recent activities
function loadRecentActivities(activities) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Clear loading state
    activityList.innerHTML = '';
    
    // Add activities
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        
        let iconClass = 'fas fa-info-circle';
        switch (activity.type) {
            case 'user':
                iconClass = 'fas fa-user-plus';
                break;
            case 'booking':
                iconClass = 'fas fa-calendar-check';
                break;
            case 'vendor':
                iconClass = 'fas fa-store';
                break;
            case 'payment':
                iconClass = 'fas fa-rupee-sign';
                break;
            case 'review':
                iconClass = 'fas fa-star';
                break;
        }
        
        li.innerHTML = `
            <div class="activity-icon"><i class="${iconClass}"></i></div>
            <div class="activity-details">
                <h4>${activity.action}</h4>
                <p>${getActivityDescription(activity)}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        `;
        
        activityList.appendChild(li);
    });
}

// Get activity description based on type
function getActivityDescription(activity) {
    switch (activity.type) {
        case 'user':
            return `User: ${activity.user}`;
        case 'booking':
            return `User: ${activity.user}, Vendor: ${activity.vendor}`;
        case 'vendor':
            return `Vendor: ${activity.vendor}`;
        case 'payment':
            return `Amount: ${activity.amount}, User: ${activity.user}`;
        case 'review':
            return `Rating: ${getStarRating(activity.rating)}, User: ${activity.user}, Vendor: ${activity.vendor}`;
        default:
            return '';
    }
}

// Generate star rating HTML
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

// Load recent bookings
function loadRecentBookings(bookings) {
    const bookingsTable = document.getElementById('recent-bookings-table');
    if (!bookingsTable) return;
    
    // Clear loading state
    bookingsTable.innerHTML = '';
    
    // Add bookings
    bookings.forEach(booking => {
        const tr = document.createElement('tr');
        
        let statusClass = 'status-pending';
        if (booking.status === 'confirmed') {
            statusClass = 'status-confirmed';
        } else if (booking.status === 'cancelled') {
            statusClass = 'status-cancelled';
        }
        
        tr.innerHTML = `
            <td>${booking.id}</td>
            <td>${booking.user}</td>
            <td>${booking.vendor}</td>
            <td>${formatDate(booking.date)}</td>
            <td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(booking.status)}</span></td>
            <td>
                <button class="action-btn view-btn" data-id="${booking.id}"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit-btn" data-id="${booking.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${booking.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        bookingsTable.appendChild(tr);
    });
    
    // Add event listeners to action buttons
    const viewBtns = bookingsTable.querySelectorAll('.view-btn');
    const editBtns = bookingsTable.querySelectorAll('.edit-btn');
    const deleteBtns = bookingsTable.querySelectorAll('.delete-btn');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => viewBooking(btn.dataset.id));
    });
    
    editBtns.forEach(btn => {
        btn.addEventListener('click', () => editBooking(btn.dataset.id));
    });
    
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => deleteBooking(btn.dataset.id));
    });
}

// Load popular vendors
function loadPopularVendors(vendors) {
    const vendorsList = document.getElementById('popular-vendors-list');
    if (!vendorsList) return;
    
    // Clear loading state
    vendorsList.innerHTML = '';
    
    // Add vendors
    vendors.forEach(vendor => {
        const li = document.createElement('li');
        li.className = 'vendor-item';
        
        li.innerHTML = `
            <div class="vendor-avatar">
                <img src="../images/vendor-placeholder.jpg" alt="${vendor.name}">
            </div>
            <div class="vendor-details">
                <h4>${vendor.name}</h4>
                <p>${vendor.category}</p>
                <div class="vendor-rating">
                    ${getStarRating(vendor.rating)}
                    <span>${vendor.rating}</span>
                </div>
            </div>
            <div class="vendor-bookings">
                ${vendor.bookings} Bookings
            </div>
        `;
        
        vendorsList.appendChild(li);
    });
}

// Initialize booking chart
function initBookingChart(bookingStats) {
    const ctx = document.getElementById('bookingChart');
    if (!ctx) return;
    
    // Create chart
    window.bookingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Bookings',
                data: bookingStats.week,
                backgroundColor: 'rgba(86, 71, 255, 0.1)',
                borderColor: '#5647ff',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#5647ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#0c1e35',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    displayColors: false
                }
            }
        }
    });
}

// Update booking chart based on selected period
function updateBookingChart(period) {
    if (!window.bookingChart) return;
    
    let labels = [];
    let data = [];
    
    switch (period) {
        case 'week':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            data = [12, 15, 18, 14, 20, 25, 22];
            break;
        case 'month':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            data = [45, 52, 49, 60];
            break;
        case 'year':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            data = [180, 220, 210, 240, 280, 250, 300, 320, 290, 340, 360, 380];
            break;
    }
    
    window.bookingChart.data.labels = labels;
    window.bookingChart.data.datasets[0].data = data;
    window.bookingChart.update();
}

// View booking details
function viewBooking(id) {
    alert(`View booking details for ID: ${id}`);
    // In a real implementation, this would open a modal with booking details
}

// Edit booking
function editBooking(id) {
    alert(`Edit booking with ID: ${id}`);
    // In a real implementation, this would open a form to edit the booking
}

// Delete booking
function deleteBooking(id) {
    if (confirm(`Are you sure you want to delete booking ${id}?`)) {
        alert(`Booking ${id} deleted successfully`);
        // In a real implementation, this would call an API to delete the booking
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('wedeaseToken');
    window.location.href = '/login.html';
}

// Show error message
function showErrorMessage(message) {
    const dashboardContent = document.querySelector('.dashboard-content');
    if (!dashboardContent) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button class="retry-btn">Retry</button>
    `;
    
    dashboardContent.innerHTML = '';
    dashboardContent.appendChild(errorDiv);
    
    const retryBtn = errorDiv.querySelector('.retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', initDashboard);
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
