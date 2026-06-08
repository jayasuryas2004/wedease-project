/**
 * Image Carousel for Authentication Pages
 * Vertical slide animation with auto-rotation
 */

class AuthCarousel {
    constructor() {
        this.carousel = document.getElementById('carousel');
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.currentIndex = 0;
        this.autoRotateInterval = null;
        this.slideInterval = 2000; // 2 seconds

        if (this.slides.length > 0) {
            this.init();
        }
    }

    init() {
        // Setup event listeners
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });

        // Start auto-rotation
        this.startAutoRotate();

        // Pause on hover
        if (this.carousel) {
            this.carousel.addEventListener('mouseenter', () => this.stopAutoRotate());
            this.carousel.addEventListener('mouseleave', () => this.startAutoRotate());
        }
    }

    goToSlide(index) {
        // Remove active class from all slides and indicators
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.indicators.forEach(indicator => indicator.classList.remove('active'));

        // Add active class to current slide and indicator
        this.currentIndex = index;
        this.slides[this.currentIndex].classList.add('active');
        this.indicators[this.currentIndex].classList.add('active');

        // Reset auto-rotate timer
        this.stopAutoRotate();
        this.startAutoRotate();
    }

    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }

    startAutoRotate() {
        this.autoRotateInterval = setInterval(() => {
            this.nextSlide();
        }, this.slideInterval);
    }

    stopAutoRotate() {
        if (this.autoRotateInterval) {
            clearInterval(this.autoRotateInterval);
        }
    }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AuthCarousel();
});
