// Main JavaScript for Wedease

document.addEventListener('DOMContentLoaded', function() {

    // Sticky navigation on scroll
    const header = document.querySelector('header');
    const heroSection = document.querySelector('.hero');
    
    if (header && heroSection) {
        const heroHeight = heroSection.offsetHeight;
        
        window.addEventListener('scroll', function() {
            if (window.scrollY > heroHeight - 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Testimonial slider (if present)
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    if (testimonialCards.length > 0) {
        let currentIndex = 0;
        
        // Only initialize if we have a mobile view
        if (window.innerWidth < 768) {
            showTestimonial(currentIndex);
            
            // Auto-rotate testimonials
            setInterval(() => {
                currentIndex = (currentIndex + 1) % testimonialCards.length;
                showTestimonial(currentIndex);
            }, 5000);
        }
    }
    
    function showTestimonial(index) {
        testimonialCards.forEach((card, i) => {
            if (i === index) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Form validation
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Check required fields
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    showError(field, 'This field is required');
                } else {
                    clearError(field);
                }
            });
            
            // Email validation
            const emailFields = form.querySelectorAll('input[type="email"]');
            emailFields.forEach(field => {
                if (field.value.trim() && !isValidEmail(field.value)) {
                    isValid = false;
                    showError(field, 'Please enter a valid email address');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    });
    
    function showError(field, message) {
        // Clear any existing error
        clearError(field);
        
        // Add error class to the field
        field.classList.add('error-field');
        
        // Create and append error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        
        field.parentNode.appendChild(errorMessage);
    }
    
    function clearError(field) {
        field.classList.remove('error-field');
        
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Category filter functionality (for vendor pages)
    const filterSelects = document.querySelectorAll('.filter-select');
    const vendorCards = document.querySelectorAll('.vendor-card');
    const searchInput = document.querySelector('.filter-group input[type="text"]');
    const searchButton = document.querySelector('.filter-group button');
    
    // Add event listeners for filters
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });
    
    // Add event listener for search
    if (searchButton) {
        searchButton.addEventListener('click', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // Initialize counters and display
    const resultsCounter = document.createElement('div');
    resultsCounter.className = 'results-counter';
    const filterContainer = document.querySelector('.filter-container');
    if (filterContainer) {
        filterContainer.after(resultsCounter);
    }
    
    // Apply filters on page load to set initial count
    document.addEventListener('DOMContentLoaded', function() {
        applyFilters();
    });
    
    function applyFilters() {
        // Get filter values
        const priceFilter = document.querySelector('.price-filter')?.value || 'all';
        const locationFilter = document.querySelector('.location-filter')?.value || 'all';
        const ratingFilter = document.querySelector('.rating-filter')?.value || 'all';
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Additional filters based on page type
        const cuisineFilter = document.querySelector('.cuisine-filter')?.value || 'all';
        const styleFilter = document.querySelector('.style-filter')?.value || 'all';
        const themeFilter = document.querySelector('.theme-filter')?.value || 'all';
        const venueTypeFilter = document.querySelector('.venue-type-filter')?.value || 'all';
        
        let visibleCount = 0;
        
        vendorCards.forEach(card => {
            // Get card data attributes
            const price = parseInt(card.dataset.price);
            const location = card.dataset.location;
            const rating = parseFloat(card.dataset.rating);
            const cuisine = card.dataset.cuisine;
            const style = card.dataset.style;
            const theme = card.dataset.theme;
            const venueType = card.dataset.venueType;
            const vendorName = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const vendorDesc = card.querySelector('.vendor-description p')?.textContent.toLowerCase() || '';
            
            // Price range matching based on category page
            let priceMatch = priceFilter === 'all';
            
            // Check if we're on the catering page (price per plate)
            if (document.querySelector('title')?.textContent.includes('Catering')) {
                priceMatch = priceFilter === 'all' || 
                           (priceFilter === 'low' && price < 1500) ||
                           (priceFilter === 'medium' && price >= 1500 && price < 2500) ||
                           (priceFilter === 'high' && price >= 2500);
            } 
            // Photography, Makeup pricing
            else if (document.querySelector('title')?.textContent.includes('Photography') || 
                     document.querySelector('title')?.textContent.includes('Makeup')) {
                priceMatch = priceFilter === 'all' || 
                           (priceFilter === 'low' && price < 30000) ||
                           (priceFilter === 'medium' && price >= 30000 && price < 60000) ||
                           (priceFilter === 'high' && price >= 60000);
            }
            // Venues and Decor pricing
            else {
                priceMatch = priceFilter === 'all' || 
                           (priceFilter === 'low' && price < 150000) ||
                           (priceFilter === 'medium' && price >= 150000 && price < 300000) ||
                           (priceFilter === 'high' && price >= 300000);
            }
            
            // Other filter matches
            const locationMatch = locationFilter === 'all' || location === locationFilter || location.includes('coimbatore');
            const ratingMatch = ratingFilter === 'all' || 
                                (ratingFilter === '4plus' && rating >= 4) ||
                                (ratingFilter === '3plus' && rating >= 3);
            const cuisineMatch = cuisineFilter === 'all' || cuisine === cuisineFilter;
            const styleMatch = styleFilter === 'all' || style === styleFilter;
            const themeMatch = themeFilter === 'all' || theme === themeFilter;
            const venueTypeMatch = venueTypeFilter === 'all' || venueType === venueTypeFilter;
            
            // Search query matching
            const searchMatch = !searchQuery || 
                               vendorName.includes(searchQuery) || 
                               vendorDesc.includes(searchQuery) ||
                               location.includes(searchQuery);
            
            // Combine all filters
            if (priceMatch && locationMatch && ratingMatch && cuisineMatch && styleMatch && themeMatch && venueTypeMatch && searchMatch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update results counter
        if (resultsCounter) {
            if (visibleCount === 0) {
                resultsCounter.textContent = 'No vendors found matching your criteria.';
                resultsCounter.style.display = 'block';
            } else if (visibleCount === vendorCards.length) {
                resultsCounter.style.display = 'none';
            } else {
                resultsCounter.textContent = `Showing ${visibleCount} of ${vendorCards.length} vendors`;
                resultsCounter.style.display = 'block';
            }
        }
    }

    // E-Invites preview functionality
    const inviteForm = document.getElementById('invite-form');
    const previewContainer = document.querySelector('.preview-placeholder');
    
    if (inviteForm && previewContainer) {
        const previewButton = document.querySelector('.preview-btn');
        
        previewButton?.addEventListener('click', function() {
            // In a real implementation, this would call the AI API
            // For now, just show a placeholder message
            previewContainer.innerHTML = `
                <div class="preview-message">
                    <h3>Your E-Invite Preview</h3>
                    <p>In the actual implementation, this would display your AI-generated invitation based on your inputs.</p>
                    <p>The DALL·E API would be called to generate a custom image.</p>
                </div>
            `;
        });
    }

    // Animation on scroll
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    function checkScroll() {
        animatedElements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                element.classList.add('animated');
            }
        });
    }
    
    // Initial check
    checkScroll();
    
    // Check on scroll
    window.addEventListener('scroll', checkScroll);
});
