/**
 * Location Service - Handles city selection and location-based filtering
 * Features: Auto-detect GPS, Manual selection, Persistent storage
 */

class LocationService {
    constructor() {
        this.selectedCity = localStorage.getItem('wedease_city') || null;
        this.selectedState = localStorage.getItem('wedease_state') || null;
        this.currentView = 'states'; // 'states' or 'cities'
        this.selectedStateForCities = null;

        // State-oriented data structure
        this.stateData = {
            'Maharashtra': {
                name: 'Maharashtra',
                cities: {
                    mumbai: { name: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=200' },
                    pune: { name: 'Pune', image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=200' }
                }
            },
            'Delhi NCR': {
                name: 'Delhi NCR',
                cities: {
                    delhi: { name: 'Delhi', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200' }
                }
            },
            'Karnataka': {
                name: 'Karnataka',
                cities: {
                    bangalore: { name: 'Bangalore', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=200' }
                }
            },
            'Tamil Nadu': {
                name: 'Tamil Nadu',
                cities: {
                    chennai: { name: 'Chennai', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=200' }
                }
            },
            'Telangana': {
                name: 'Telangana',
                cities: {
                    hyderabad: { name: 'Hyderabad', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=200' }
                }
            },
            'West Bengal': {
                name: 'West Bengal',
                cities: {
                    kolkata: { name: 'Kolkata', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=200' }
                }
            },
            'Rajasthan': {
                name: 'Rajasthan',
                cities: {
                    jaipur: { name: 'Jaipur', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=200' }
                }
            },
            'Gujarat': {
                name: 'Gujarat',
                cities: {
                    ahmedabad: { name: 'Ahmedabad', image: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=200' }
                }
            },
            'Uttar Pradesh': {
                name: 'Uttar Pradesh',
                cities: {
                    lucknow: { name: 'Lucknow', image: 'https://images.unsplash.com/photo-1590766940554-634cd4e892ae?w=200' }
                }
            },
            'Punjab': {
                name: 'Punjab',
                cities: {
                    chandigarh: { name: 'Chandigarh', image: 'https://images.unsplash.com/photo-1584806749948-697891c67821?w=200' }
                }
            },
            'Goa': {
                name: 'Goa',
                cities: {
                    goa: { name: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=200' }
                }
            }
        };

        // Flatten cities for backward compatibility
        this.cityData = {};
        Object.values(this.stateData).forEach(state => {
            Object.entries(state.cities).forEach(([key, city]) => {
                this.cityData[key] = { ...city, state: state.name };
            });
        });

        this.init();
    }

    init() {
        console.log('LocationService init called');
        this.createLocationModal();
        console.log('Modal created, checking if it exists:', document.getElementById('locationModal'));
        this.createCityBadge();
        console.log('City badge created, checking location badge:', document.getElementById('location-badge'));

        // Show modal if no city selected
        if (!this.selectedCity) {
            console.log('No city selected, will show modal in 500ms');
            setTimeout(() => this.showLocationModal(), 500);
        } else {
            console.log('City already selected:', this.selectedCity);
        }
    }

    createLocationModal() {
        console.log('Creating location modal...');
        const modal = document.createElement('div');
        modal.id = 'locationModal';
        modal.className = 'location-modal';
        modal.innerHTML = `
            <div class="location-modal-overlay"></div>
            <div class="location-modal-content">
                <button class="location-modal-close" id="closeLocationModal">
                    <i class="fas fa-times"></i>
                </button>
                <div class="location-modal-header">
                    <div class="location-icon-wrapper">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <h2 id="modalTitle">Select Your State</h2>
                    <p id="modalSubtitle">Choose your state to find the best wedding vendors</p>
                </div>

                <div class="location-navigation" id="locationNavigation" style="display: none;">
                    <button class="nav-back-btn" id="navBackBtn">
                        <i class="fas fa-arrow-left"></i>
                        Back to States
                    </button>
                </div>

                <div class="location-search-container">
                    <div class="location-search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="locationSearchInput" placeholder="Search for your state...">
                    </div>
                    <button class="detect-location-btn" id="detectLocationBtn">
                        <i class="fas fa-crosshairs"></i>
                        <span>Detect My Location</span>
                    </button>
                </div>

                <div class="location-content">
                    <div class="states-section" id="statesSection">
                        <h3>States</h3>
                        <div class="states-grid" id="statesGrid">
                            ${this.renderStateOptions()}
                        </div>
                    </div>

                    <div class="cities-section" id="citiesSection" style="display: none;">
                        <h3 id="citiesTitle">Cities in <span id="selectedStateName"></span></h3>
                        <div class="city-grid" id="cityGrid">
                            <!-- Cities will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('Location modal created and added to DOM');
    }

    renderStateOptions() {
        return Object.entries(this.stateData).map(([stateKey, state]) => {
            const cityCount = Object.keys(state.cities).length;
            return `
                <div class="state-option" data-state="${stateKey}">
                    <div class="state-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="state-info">
                        <span class="state-name">${state.name}</span>
                        <span class="state-cities">${cityCount} ${cityCount === 1 ? 'city' : 'cities'}</span>
                    </div>
                    <div class="state-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCityOptions(stateKey) {
        const state = this.stateData[stateKey];
        if (!state) return '';

        return Object.entries(state.cities).map(([cityKey, city]) => `
            <div class="city-option" data-city="${cityKey}">
                <div class="city-image" style="background-image: url('${city.image}')"></div>
                <div class="city-info">
                    <span class="city-name">${city.name}</span>
                    <span class="city-state">${state.name}</span>
                </div>
            </div>
        `).join('');
    }

    renderAllCities() {
        return Object.entries(this.cityData).map(([key, city]) => `
            <button class="all-city-btn" data-city="${key}">
                <i class="fas fa-map-marker-alt"></i>
                ${city.name}
            </button>
        `).join('');
    }

    createCityBadge() {
        // Badge is already created in HTML, just update the text if needed
        this.updateCityBadge(this.selectedCity);
    }

    setupEventListeners() {
        // Close modal
        const closeBtn = document.getElementById('closeLocationModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (this.selectedCity) {
                    this.hideLocationModal();
                } else {
                    this.showToast('Please select a city to continue', 'warning');
                }
            });
        }

        // Close on overlay click
        const modal = document.getElementById('locationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('location-modal-overlay')) {
                    if (this.selectedCity) {
                        this.hideLocationModal();
                    }
                }
            });
        }

        // State and city selection - use event delegation on document for dynamically created elements
        document.addEventListener('click', (e) => {
            // Handle state selection
            const stateOption = e.target.closest('.state-option');
            if (stateOption) {
                e.preventDefault();
                e.stopPropagation();
                const stateKey = stateOption.dataset.state;
                console.log('State clicked:', stateKey);
                this.selectState(stateKey);
                return;
            }

            // Handle city selection
            const cityOption = e.target.closest('.city-option');
            if (cityOption) {
                e.preventDefault();
                e.stopPropagation();
                const cityKey = cityOption.dataset.city;
                console.log('City clicked:', cityKey);
                this.setCity(cityKey);
                return;
            }
        });

        // Back navigation
        const backBtn = document.getElementById('navBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('Back button clicked');
                this.showStatesView();
            });
        }

        // City badge click
        const cityBadge = document.getElementById('location-badge');
        console.log('Setting up location badge click listener:', cityBadge);
        if (cityBadge) {
            cityBadge.addEventListener('click', (e) => {
                console.log('Location badge clicked');
                e.preventDefault();
                e.stopPropagation();
                this.showLocationModal();
            });
            console.log('Location badge click listener attached');
        } else {
            console.error('Location badge not found!');
        }

        // Detect location
        const detectBtn = document.getElementById('detectLocationBtn');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => {
                this.detectUserLocation();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('locationSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (this.currentView === 'states') {
                    this.filterStates(e.target.value);
                } else {
                    this.filterCities(e.target.value);
                }
            });
        }
    }

    showLocationModal() {
        console.log('showLocationModal called');
        // Reset to states view
        this.showStatesView();

        const modal = document.getElementById('locationModal');
        console.log('Modal element:', modal);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('Modal shown');
        } else {
            console.error('Modal not found!');
        }
    }

    hideLocationModal() {
        const modal = document.getElementById('locationModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    async detectUserLocation() {
        console.log('Starting GPS detection...');

        // Check if we're on HTTPS (required for geolocation)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            console.warn('Geolocation requires HTTPS');
            this.showToast('Location detection requires a secure connection (HTTPS)', 'error');
            return;
        }

        const btn = document.getElementById('detectLocationBtn');
        if (!btn) {
            console.error('Detect location button not found');
            return;
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Detecting...</span>';
        btn.disabled = true;

        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            this.showToast('Geolocation is not supported by your browser', 'error');
            btn.innerHTML = '<i class="fas fa-crosshairs"></i><span>Detect My Location</span>';
            btn.disabled = false;
            return;
        }

        try {
            console.log('Requesting geolocation permissions...');
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    (error) => {
                        console.error('Geolocation permission/error:', error);
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000, // Increased timeout
                        maximumAge: 60000 // Allow cached positions up to 1 minute old
                    }
                );
            });

            const { latitude, longitude, accuracy } = position.coords;
            console.log('Got coordinates:', latitude, longitude, 'Accuracy:', accuracy, 'meters');

            const city = await this.reverseGeocode(latitude, longitude);
            console.log('Reverse geocoded city:', city);

            if (city) {
                const cityKey = this.findCityKey(city);
                console.log('Found city key:', cityKey);

                if (cityKey) {
                    this.setCity(cityKey);
                    this.showToast(`📍 Location detected: ${this.cityData[cityKey].name}`, 'success');
                } else {
                    console.warn('City not found in database:', city);
                    this.showToast(`📍 Detected: ${city} (not in our database yet)`, 'warning');
                }
            } else {
                console.warn('Could not determine city from coordinates');
                this.showToast('Could not determine your city. Please select manually.', 'warning');
            }
        } catch (error) {
            console.error('Geolocation error:', error);
            let errorMessage = 'Could not detect location. Please select manually.';

            if (error.code === 1) {
                errorMessage = 'Location access denied. Please enable GPS in your browser settings and try again.';
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please check your GPS settings and try again.';
            } else if (error.code === 3) {
                errorMessage = 'Location detection timed out. Please try again.';
            }

            this.showToast(errorMessage, 'error');
            btn.disabled = false;
        }
    }

    async reverseGeocode(lat, lng) {
        try {
            console.log('Reverse geocoding coordinates:', lat, lng);
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();
            console.log('Geocoding response:', data);

            // Try different address fields for city name
            const city = data.address?.city ||
                        data.address?.town ||
                        data.address?.state_district ||
                        data.address?.county ||
                        data.address?.state;

            console.log('Extracted city name:', city);
            return city;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    }

    findCityKey(cityName) {
        if (!cityName) return null;

        const normalizedName = cityName.toLowerCase().trim();
        console.log('Finding city key for:', normalizedName);

        // Direct match
        if (this.cityData[normalizedName]) {
            console.log('Direct match found:', normalizedName);
            return normalizedName;
        }

        // Partial match with common variations
        const variations = [
            normalizedName,
            normalizedName.replace(/\s+/g, ''), // remove spaces
            normalizedName.replace(/[^a-z]/g, ''), // remove special chars
        ];

        for (const variation of variations) {
            for (const [key, city] of Object.entries(this.cityData)) {
                const cityName = city.name.toLowerCase();
                if (cityName.includes(variation) ||
                    variation.includes(cityName) ||
                    this.levenshteinDistance(cityName, variation) <= 2) { // Allow small typos
                    console.log('Partial match found:', key, 'for variation:', variation);
                    return key;
                }
            }
        }

        console.log('No city match found for:', normalizedName);
        return null;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    setCity(cityKey) {
        console.log('setCity called with:', cityKey);
        if (!this.cityData[cityKey]) {
            console.error('City not found:', cityKey);
            return;
        }
        
        this.selectedCity = cityKey;
        localStorage.setItem('wedease_city', cityKey);
        console.log('City saved to localStorage:', cityKey);
        
        this.updateCityBadge(cityKey);
        this.hideLocationModal();
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('cityChanged', { 
            detail: { city: cityKey, cityData: this.cityData[cityKey] } 
        }));
        
        console.log('City selection completed');
    }

    updateCityBadge(cityKey) {
        console.log('Updating city badge with:', cityKey);
        const cityName = document.getElementById('current-city');
        console.log('City name element:', cityName);

        if (cityName) {
            if (this.cityData[cityKey]) {
                const cityNameText = this.cityData[cityKey].name;
                cityName.textContent = cityNameText;
                console.log('Badge updated to:', cityNameText);
            } else {
                cityName.textContent = 'Select City';
                console.log('Badge reset to default');
            }
        } else {
            console.error('City name element not found!');
        }
    }

    selectState(stateKey) {
        console.log('selectState called with:', stateKey);
        this.selectedStateForCities = stateKey;
        this.currentView = 'cities';
        this.showCitiesView(stateKey);
    }

    showStatesView() {
        console.log('showStatesView called');
        this.currentView = 'states';
        this.selectedStateForCities = null;

        // Update UI
        const modalTitle = document.getElementById('modalTitle');
        const modalSubtitle = document.getElementById('modalSubtitle');
        const locationNavigation = document.getElementById('locationNavigation');
        const statesSection = document.getElementById('statesSection');
        const citiesSection = document.getElementById('citiesSection');
        const searchInput = document.getElementById('locationSearchInput');

        if (modalTitle) modalTitle.textContent = 'Select Your State';
        if (modalSubtitle) modalSubtitle.textContent = 'Choose your state to find the best wedding vendors';
        if (searchInput) searchInput.placeholder = 'Search for your state...';
        if (locationNavigation) locationNavigation.style.display = 'none';
        if (statesSection) statesSection.style.display = 'block';
        if (citiesSection) citiesSection.style.display = 'none';

        // Clear search
        if (searchInput) searchInput.value = '';
        this.filterStates('');
    }

    showCitiesView(stateKey) {
        console.log('showCitiesView called with state:', stateKey);
        const state = this.stateData[stateKey];
        if (!state) {
            console.error('State not found:', stateKey);
            return;
        }

        this.currentView = 'cities';

        // Update UI
        const modalTitle = document.getElementById('modalTitle');
        const modalSubtitle = document.getElementById('modalSubtitle');
        const locationNavigation = document.getElementById('locationNavigation');
        const statesSection = document.getElementById('statesSection');
        const citiesSection = document.getElementById('citiesSection');
        const selectedStateName = document.getElementById('selectedStateName');
        const searchInput = document.getElementById('locationSearchInput');

        if (modalTitle) modalTitle.textContent = 'Select Your City';
        if (modalSubtitle) modalSubtitle.textContent = `Choose a city in ${state.name}`;
        if (searchInput) searchInput.placeholder = 'Search for your city...';
        if (locationNavigation) locationNavigation.style.display = 'block';
        if (statesSection) statesSection.style.display = 'none';
        if (citiesSection) citiesSection.style.display = 'block';
        if (selectedStateName) selectedStateName.textContent = state.name;

        // Populate cities
        const cityGrid = document.getElementById('cityGrid');
        if (cityGrid) {
            cityGrid.innerHTML = this.renderCityOptions(stateKey);
            console.log('Cities populated for state:', stateKey, 'Cities:', Object.keys(state.cities));
        }

        // Clear search
        if (searchInput) searchInput.value = '';
    }

    filterStates(query) {
        const normalizedQuery = query.toLowerCase().trim();

        document.querySelectorAll('.state-option').forEach(element => {
            const stateKey = element.dataset.state;
            const state = this.stateData[stateKey];
            const matches = state.name.toLowerCase().includes(normalizedQuery);
            element.style.display = matches ? '' : 'none';
        });
    }

    filterCities(query) {
        const normalizedQuery = query.toLowerCase().trim();

        document.querySelectorAll('.city-option').forEach(element => {
            const cityKey = element.dataset.city;
            const city = this.cityData[cityKey];
            const matches = city.name.toLowerCase().includes(normalizedQuery) ||
                           city.state.toLowerCase().includes(normalizedQuery);
            element.style.display = matches ? '' : 'none';
        });
    }

    getSelectedCity() {
        return this.selectedCity;
    }

    getCityData() {
        return this.selectedCity ? this.cityData[this.selectedCity] : null;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `location-toast location-toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing LocationService...');
    try {
        window.locationService = new LocationService();
        console.log('LocationService initialized successfully');
    } catch (error) {
        console.error('Failed to initialize LocationService:', error);
    }
})