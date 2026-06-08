/**
 * Payment and Booking System for Wedease
 * Handles "Book Now" and "Request Pricing" functionality
 * Uses Wedease color scheme: Primary #0f1b33 (Dark Blue), Secondary #f0c14b (Gold)
 */

// Initialize Razorpay
let razorpayInstance = null;

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

// Initialize payment system
async function initPaymentSystem() {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    showNotification('Payment system could not be initialized. Please try again later.', 'error');
    return false;
  }
  return true;
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="close-btn">&times;</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Add close button functionality
  const closeBtn = notification.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}

// Format currency
function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Book Now functionality
async function bookNow(vendorId, packageName) {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      showLoginModal('Please log in to book this vendor');
      return;
    }
    
    // Get booking details from form
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) {
      showBookingModal(vendorId, packageName);
      return;
    }
    
    // Validate form
    const date = bookingForm.querySelector('#booking-date').value;
    const startTime = bookingForm.querySelector('#booking-start-time').value;
    const endTime = bookingForm.querySelector('#booking-end-time').value;
    const customRequests = bookingForm.querySelector('#booking-requests').value;
    
    if (!date || !startTime || !endTime) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Get package details
    const packageSelect = bookingForm.querySelector('#booking-package');
    const selectedPackage = packageSelect ? packageSelect.value : packageName;
    
    // Create booking
    const bookingData = {
      vendorId,
      date,
      time: {
        start: startTime,
        end: endTime
      },
      customRequests,
      packageName: selectedPackage
    };
    
    // Submit booking
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create booking');
    }
    
    const data = await response.json();
    
    // Show success message
    showNotification('Booking created successfully! Proceeding to payment...');
    
    // Proceed to payment
    initiatePayment(data.booking._id, data.booking.totalAmount);
    
  } catch (error) {
    console.error('Error booking vendor:', error);
    showNotification(error.message || 'Failed to book vendor', 'error');
  }
}

// Request Pricing functionality
async function requestPricing(vendorId, packageName) {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      showLoginModal('Please log in to request pricing');
      return;
    }
    
    // Show pricing request modal
    showPricingRequestModal(vendorId, packageName);
    
  } catch (error) {
    console.error('Error requesting pricing:', error);
    showNotification(error.message || 'Failed to request pricing', 'error');
  }
}

// Submit pricing request
async function submitPricingRequest(vendorId) {
  try {
    // Get request details from form
    const requestForm = document.getElementById('pricing-request-form');
    if (!requestForm) {
      showNotification('Form not found', 'error');
      return;
    }
    
    // Validate form
    const date = requestForm.querySelector('#request-date').value;
    const startTime = requestForm.querySelector('#request-start-time').value;
    const endTime = requestForm.querySelector('#request-end-time').value;
    const customRequests = requestForm.querySelector('#request-details').value;
    
    if (!date || !startTime || !endTime) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    
    // Get package details if available
    const packageSelect = requestForm.querySelector('#request-package');
    const selectedPackage = packageSelect ? packageSelect.value : null;
    
    // Create pricing request
    const requestData = {
      vendorId,
      date,
      time: {
        start: startTime,
        end: endTime
      },
      customRequests,
      packageName: selectedPackage
    };
    
    // Submit request
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/payments/request-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit pricing request');
    }
    
    const data = await response.json();
    
    // Close modal
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();
    
    // Show success message
    showNotification('Pricing request submitted successfully! The vendor will contact you shortly.');
    
    // Redirect to bookings page
    setTimeout(() => {
      window.location.href = '/bookings.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error submitting pricing request:', error);
    showNotification(error.message || 'Failed to submit pricing request', 'error');
  }
}

// Initiate payment process
async function initiatePayment(bookingId, amount) {
  try {
    // Initialize Razorpay if not already done
    const initialized = await initPaymentSystem();
    if (!initialized) return;
    
    // Get payment order from server
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId,
        amount,
        currency: 'INR',
        notes: 'Payment for Wedease booking'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment order');
    }
    
    const data = await response.json();
    
    // Configure Razorpay options
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: 'Wedease',
      description: 'Wedding Service Booking',
      order_id: data.order.id,
      image: '/images/wedeaselogo.png',
      theme: {
        color: '#0f1b33'
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
        contact: localStorage.getItem('userPhone') || ''
      },
      handler: function(response) {
        // Verify payment on server
        verifyPayment(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature,
          'credit_card' // Default payment method, can be updated based on actual method
        );
      },
      modal: {
        ondismiss: function() {
          showNotification('Payment cancelled. You can complete the payment later from your bookings page.', 'warning');
        }
      }
    };
    
    // Open Razorpay checkout
    const razorpay = new Razorpay(options);
    razorpay.open();
    
  } catch (error) {
    console.error('Error initiating payment:', error);
    showNotification(error.message || 'Failed to initiate payment', 'error');
  }
}

// Verify payment with server
async function verifyPayment(paymentId, orderId, signature, paymentMethod) {
  try {
    // Send verification request to server
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentId,
        orderId,
        signature,
        paymentMethod
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to verify payment');
    }
    
    const data = await response.json();
    
    // Show success message
    showNotification('Payment successful! Your booking is confirmed.');
    
    // Redirect to bookings page
    setTimeout(() => {
      window.location.href = '/bookings.html';
    }, 2000);
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    showNotification(error.message || 'Failed to verify payment', 'error');
  }
}

// Show login modal
function showLoginModal(message) {
  const modalHtml = `
    <div class="modal">
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Login Required</h2>
        <p>${message}</p>
        <div class="modal-actions">
          <a href="/login.html" class="primary-btn">Login</a>
          <a href="/register.html" class="secondary-btn">Register</a>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add close functionality
  const modal = document.querySelector('.modal');
  const closeBtn = modal.querySelector('.close-modal');
  
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  // Close when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

// Show booking modal
function showBookingModal(vendorId, packageName) {
  // Fetch vendor details first
  fetchVendorDetails(vendorId).then(vendor => {
    if (!vendor) {
      showNotification('Could not load vendor details', 'error');
      return;
    }
    
    // Create package options HTML
    let packageOptionsHtml = '';
    if (vendor.pricing && vendor.pricing.packages && vendor.pricing.packages.length > 0) {
      packageOptionsHtml = vendor.pricing.packages.map(pkg => {
        const selected = pkg.name === packageName ? 'selected' : '';
        return `<option value="${pkg.name}" ${selected}>${pkg.name} - ${formatCurrency(pkg.price)}</option>`;
      }).join('');
    }
    
    // If no specific package was selected, add base price option
    if (!packageName) {
      packageOptionsHtml = `<option value="base" selected>Base Package - ${formatCurrency(vendor.pricing.basePrice)}</option>` + packageOptionsHtml;
    }
    
    const modalHtml = `
      <div class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Book ${vendor.name}</h2>
          <p>Please fill in the details below to book this vendor.</p>
          
          <form id="booking-form">
            <div class="form-group">
              <label for="booking-date">Event Date *</label>
              <input type="date" id="booking-date" required min="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="booking-start-time">Start Time *</label>
                <input type="time" id="booking-start-time" required>
              </div>
              <div class="form-group">
                <label for="booking-end-time">End Time *</label>
                <input type="time" id="booking-end-time" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="booking-package">Select Package</label>
              <select id="booking-package">
                ${packageOptionsHtml}
              </select>
            </div>
            
            <div class="form-group">
              <label for="booking-requests">Special Requests</label>
              <textarea id="booking-requests" rows="3" placeholder="Any special requirements or requests?"></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="primary-btn" onclick="bookNow('${vendorId}')">Proceed to Payment</button>
              <button type="button" class="secondary-btn" onclick="requestPricing('${vendorId}')">Request Pricing</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add close functionality
    const modal = document.querySelector('.modal');
    const closeBtn = modal.querySelector('.close-modal');
    
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Close when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  });
}

// Show pricing request modal
function showPricingRequestModal(vendorId, packageName) {
  // Fetch vendor details first
  fetchVendorDetails(vendorId).then(vendor => {
    if (!vendor) {
      showNotification('Could not load vendor details', 'error');
      return;
    }
    
    // Create package options HTML
    let packageOptionsHtml = '';
    if (vendor.pricing && vendor.pricing.packages && vendor.pricing.packages.length > 0) {
      packageOptionsHtml = vendor.pricing.packages.map(pkg => {
        const selected = pkg.name === packageName ? 'selected' : '';
        return `<option value="${pkg.name}" ${selected}>${pkg.name}</option>`;
      }).join('');
    }
    
    // If no specific package was selected, add "custom" option
    packageOptionsHtml = `<option value="custom" ${!packageName ? 'selected' : ''}>Custom Package</option>` + packageOptionsHtml;
    
    const modalHtml = `
      <div class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Request Pricing from ${vendor.name}</h2>
          <p>Please provide details about your event to get a customized quote.</p>
          
          <form id="pricing-request-form">
            <div class="form-group">
              <label for="request-date">Event Date *</label>
              <input type="date" id="request-date" required min="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="request-start-time">Start Time *</label>
                <input type="time" id="request-start-time" required>
              </div>
              <div class="form-group">
                <label for="request-end-time">End Time *</label>
                <input type="time" id="request-end-time" required>
              </div>
            </div>
            
            <div class="form-group">
              <label for="request-package">Interested Package</label>
              <select id="request-package">
                ${packageOptionsHtml}
              </select>
            </div>
            
            <div class="form-group">
              <label for="request-details">Event Details *</label>
              <textarea id="request-details" rows="4" required placeholder="Please describe your event, number of guests, and any specific requirements"></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="primary-btn" onclick="submitPricingRequest('${vendorId}')">Submit Request</button>
              <button type="button" class="secondary-btn close-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add close functionality
    const modal = document.querySelector('.modal');
    const closeBtns = modal.querySelectorAll('.close-modal');
    
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.remove();
      });
    });
    
    // Close when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  });
}

// Fetch vendor details
async function fetchVendorDetails(vendorId) {
  try {
    const response = await fetch(`/api/vendors/${vendorId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching vendor details:', error);
    return null;
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners to Book Now buttons
  const bookNowButtons = document.querySelectorAll('.book-now-btn');
  bookNowButtons.forEach(button => {
    const vendorId = button.getAttribute('data-vendor-id');
    const packageName = button.getAttribute('data-package');
    
    button.addEventListener('click', () => {
      bookNow(vendorId, packageName);
    });
  });
  
  // Add event listeners to Request Pricing buttons
  const requestPricingButtons = document.querySelectorAll('.request-pricing-btn');
  requestPricingButtons.forEach(button => {
    const vendorId = button.getAttribute('data-vendor-id');
    const packageName = button.getAttribute('data-package');
    
    button.addEventListener('click', () => {
      requestPricing(vendorId, packageName);
    });
  });
  
  // Initialize payment system
  initPaymentSystem();
});
