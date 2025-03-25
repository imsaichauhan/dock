// Photo Carousel Functionality
(function() {
    // Photo data (captions removed)
    const photos = [
        'assets/img/photos/IMG_20250319_014729.webp',
        'assets/img/photos/IMG_20250325_104528.jpg',
        'assets/img/photos/IMG_20250319_014821.webp',
        'assets/img/photos/IMG_20250319_014851.webp',
        'assets/img/photos/IMG_20250319_014941.webp',
        'assets/img/photos/IMG_20250319_015024.webp',
        'assets/img/photos/IMG_20250319_015108.webp',
        'assets/img/photos/IMG_20250319_015203.webp',
        'assets/img/photos/IMG_20250319_015311.webp',
        'assets/img/photos/IMG_20250319_015414.webp',
        'assets/img/photos/IMG_20250319_015459.webp'
    ];

    // DOM Elements
    let carousel, prevBtn, nextBtn, indicatorsContainer;

    // Current photo index
    let currentPhotoIndex = 0;

    // Auto-play settings
    const autoPlayInterval = 2000; // 5 seconds
    let autoPlayTimer;
    let isAutoPlaying = true;

    // Initialize carousel
    function initCarousel() {
        // Get DOM elements
        carousel = document.getElementById('photo-carousel');
        prevBtn = document.getElementById('prev-photo');
        nextBtn = document.getElementById('next-photo');

        // Create container for indicators
        indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'carousel-indicators';

        // Get parent container
        const carouselContainer = document.querySelector('.carousel-container');

        // Add photos to carousel
        photos.forEach((photo, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.classList.add('carousel-item');

            // Create an image element
            const imgElement = document.createElement('img');
            imgElement.src = photo;
            imgElement.classList.add('carousel-image');

            // Create indicator
            const indicator = document.createElement('div');
            indicator.classList.add('indicator');
            indicator.addEventListener('click', () => showPhoto(index));
            indicatorsContainer.appendChild(indicator);

            // Append image to carousel item
            carouselItem.appendChild(imgElement);
            carousel.appendChild(carouselItem);
        });

        // Add indicators to container
        carouselContainer.appendChild(indicatorsContainer);

        // Set up event listeners
        prevBtn.addEventListener('click', () => {
            prevPhoto();
            resetAutoPlay();
        });

        nextBtn.addEventListener('click', () => {
            nextPhoto();
            resetAutoPlay();
        });

        // Pause auto-play on hover
        carouselContainer.addEventListener('mouseenter', pauseAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);

        // Touch events for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        carouselContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carouselContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            resetAutoPlay();
        }, { passive: true });

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                nextPhoto(); // Swipe left
            } else if (touchEndX > touchStartX + 50) {
                prevPhoto(); // Swipe right
            }
        }

        // Show first photo
        showPhoto(currentPhotoIndex);

        // Start auto-play
        startAutoPlay();
    }

    // Show specific photo
    function showPhoto(index) {
        carousel.style.transform = `translateX(-${index * 100}%)`;
        currentPhotoIndex = index;

        // Update indicators
        const indicators = document.querySelectorAll('.indicator');
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    // Previous photo
    function prevPhoto() {
        const newIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
        showPhoto(newIndex);
    }

    // Next photo
    function nextPhoto() {
        const newIndex = (currentPhotoIndex + 1) % photos.length;
        showPhoto(newIndex);
    }

    // Auto-play functions
    function startAutoPlay() {
        if (!isAutoPlaying) {
            autoPlayTimer = setInterval(nextPhoto, autoPlayInterval);
            isAutoPlaying = true;
        }
    }

    function pauseAutoPlay() {
        if (isAutoPlaying) {
            clearInterval(autoPlayTimer);
            isAutoPlaying = false;
        }
    }

    function resetAutoPlay() {
        pauseAutoPlay();
        startAutoPlay();
    }

    // Initialize carousel when DOM is ready
    document.addEventListener('DOMContentLoaded', initCarousel);
})();
