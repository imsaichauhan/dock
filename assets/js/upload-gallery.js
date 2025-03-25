// ------------------------
// DOM Elements
// ------------------------
const uploadSection = document.getElementById('upload-section');
const uploadLink = document.getElementById('drive-link-upload'); // Updated element ID for upload link
const gallerySection = document.getElementById('gallery-section');
const galleryGrid = document.getElementById('gallery-grid');
const galleryFullscreen = document.getElementById('gallery-fullscreen');
const fullscreenContent = document.getElementById('fullscreen-content');
const fullscreenCaption = document.getElementById('fullscreen-caption');
const fullscreenClose = document.getElementById('fullscreen-close');
const fullscreenPrev = document.getElementById('fullscreen-prev');
const fullscreenNext = document.getElementById('fullscreen-next');
const fullscreenPlay = document.getElementById('fullscreen-play');
const galleryNavItem = document.getElementById('gallery-nav-item');
const uploadNavItem = document.getElementById('upload-nav-item');

// ------------------------
// Global Variables for Gallery
// ------------------------
let currentGalleryItems = []; // All fetched items (shuffled)
let displayedItems = 0;       // Number of items currently rendered
const itemsPerLoad = 20;      // Load 20 items at a time
let currentGalleryIndex = 0;
let slideshowInterval = null;
let sortedGalleryFiles = [];  // Visual order for fullscreen
let sentinel = null;          // For infinite scrolling

// ------------------------
// Setup Upload Section
// ------------------------
function setupUploadSection() {
  if (!uploadSection || !uploadLink) {
    console.error('Missing upload DOM elements for upload section');
    return;
  }
  
  // Use the DRIVE_LINK from config.js
  const driveURL = (CONFIG.UPLOAD && CONFIG.UPLOAD.DRIVE_LINK) || 
                   'https://drive.google.com/drive/u/0/folders/1MqkUXBe9UPVSQGaL70ROPhz7X8AIMXyc';
  
  uploadLink.href = driveURL;
  uploadLink.textContent = 'Click here to upload files to Google Drive';
  uploadLink.target = '_blank';
  
  // Hide any elements related to the old file upload functionality.
  const fileInput = document.getElementById('file-input');
  const uploadButton = document.getElementById('upload-button');
  const clearFilesButton = document.getElementById('clear-files-button');
  if (fileInput) fileInput.style.display = 'none';
  if (uploadButton) uploadButton.style.display = 'none';
  if (clearFilesButton) clearFilesButton.style.display = 'none';
}

// ------------------------
// Gallery Functions (unchanged)
// ------------------------
function setupGalleryFunctionality() {
  if (!gallerySection || !galleryGrid) {
    console.error('Missing gallery DOM elements');
    return;
  }
  
  const existingSentinel = document.getElementById('gallery-sentinel');
  if (existingSentinel) {
    existingSentinel.remove();
  }
  
  galleryGrid.innerHTML = '';
  
  sentinel = document.createElement('div');
  sentinel.id = 'gallery-sentinel';
  sentinel.className = 'gallery-sentinel';
  sentinel.innerHTML = '<div class="loading-indicator">Loading gallery...</div>';
  sentinel.style.gridColumn = '1 / -1';
  sentinel.style.display = 'flex';
  sentinel.style.justifyContent = 'center';
  sentinel.style.padding = '20px';
  
  galleryGrid.appendChild(sentinel);
  
  displayedItems = 0;
  fetchGalleryItems();
  setupInfiniteScroll();
}

function fetchGalleryItems() {
  const script = document.createElement('script');
  script.src = `${CONFIG.UPLOAD_GALLERY_API_URL}?action=fetchGallery&callback=handleGalleryResponse`;
  document.body.appendChild(script);
}

function handleGalleryResponse(data) {
  const scriptTag = document.querySelector('script[src*="callback=handleGalleryResponse"]');
  if (scriptTag) {
    document.body.removeChild(scriptTag);
  }
  
  console.log("Gallery API response:", data);
  
  if (data && data.success && data.files && data.files.length > 0) {
    if (displayedItems === 0) {
      currentGalleryItems = shuffleArray(data.files);
      displayGalleryItems();
    } else {
      const newItems = shuffleArray(data.files);
      const displayedOnes = currentGalleryItems.slice(0, displayedItems);
      currentGalleryItems = displayedOnes.concat(
        newItems.filter(newItem =>
          !displayedOnes.some(oldItem => oldItem.url === newItem.url)
        )
      );
    }
  } else {
    console.error("Gallery API error or empty files array:", data);
    if (displayedItems === 0) {
      galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery.</div>';
    }
  }
}

function displayGalleryItems() {
  const itemsToShow = currentGalleryItems.slice(displayedItems, displayedItems + itemsPerLoad);
  itemsToShow.forEach((file) => {
    addGalleryItem(file);
  });
  displayedItems += itemsToShow.length;
  
  if (sentinel) {
    galleryGrid.appendChild(sentinel);
  }
}

function addGalleryItem(file) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.fileData = file;
  
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'media-container';
  
  if (file.mimeType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = file.url;
    img.alt = file.name;
    img.loading = 'lazy';
    img.onerror = function() {
      this.src = CONFIG.FALLBACK_IMAGE || 'data:image/png;base64,...';
    };
    mediaContainer.appendChild(img);
  } else if (file.mimeType.startsWith('video/')) {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    const iframe = document.createElement('iframe');
    iframe.src = file.url;
    iframe.frameBorder = '0';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    videoWrapper.appendChild(iframe);
    mediaContainer.appendChild(videoWrapper);
  }
  
  if (CONFIG.GALLERY.SHOW_UPLOADER_NAMES && file.uploader) {
    const uploader = document.createElement('div');
    uploader.className = 'gallery-uploader';
    uploader.textContent = file.uploader;
    mediaContainer.appendChild(uploader);
  }
  
  mediaContainer.addEventListener('click', () => {
    rebuildSortedGalleryFiles();
    const index = sortedGalleryFiles.findIndex(f => f.url === file.url);
    openFullscreen(index);
  });
  
  item.appendChild(mediaContainer);
  galleryGrid.appendChild(item);
}

function rebuildSortedGalleryFiles() {
  const items = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
  sortedGalleryFiles = items.map(item => item.fileData);
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && displayedItems < currentGalleryItems.length) {
        displayGalleryItems();
      }
    });
  }, {
    rootMargin: '100px',
  });
  
  if (sentinel) {
    observer.observe(sentinel);
  }
}

function shuffleArray(array) {
  let shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ------------------------
// Fullscreen Gallery Functions (unchanged)
// ------------------------
function openFullscreen(position) {
  currentGalleryIndex = position;
  displayFullscreenItem();
  galleryFullscreen.classList.remove('hidden');
  fullscreenContent.addEventListener('click', handleFullscreenClick);
  galleryFullscreen.addEventListener('click', handleFullscreenBackgroundClick);
}

function closeFullscreen() {
  galleryFullscreen.classList.add('hidden');
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    fullscreenPlay.textContent = '▶';
  }
  fullscreenContent.removeEventListener('click', handleFullscreenClick);
  galleryFullscreen.removeEventListener('click', handleFullscreenBackgroundClick);
}

function handleFullscreenClick(event) {
  event.stopPropagation();
  if (slideshowInterval) {
    toggleSlideshow();
  }
}

function handleFullscreenBackgroundClick(event) {
  const isControlButton = event.target.closest('#fullscreen-close, #fullscreen-prev, #fullscreen-next, #fullscreen-play');
  if (!fullscreenContent.contains(event.target) && !isControlButton) {
    closeFullscreen();
  }
}

function displayFullscreenItem() {
  if (sortedGalleryFiles.length === 0) return;
  
  if (currentGalleryIndex < 0) {
    currentGalleryIndex = sortedGalleryFiles.length - 1;
  } else if (currentGalleryIndex >= sortedGalleryFiles.length) {
    currentGalleryIndex = 0;
  }
  
  const file = sortedGalleryFiles[currentGalleryIndex];
  if (!file) return;
  
  fullscreenContent.innerHTML = '';
  
  if (file.mimeType.startsWith('image/')) {
    const img = document.createElement('img');
    // Adjusting size parameter for a higher resolution if needed
    img.src = file.url.replace('&sz=w1000', '&sz=w1920');
    img.alt = file.name;
    fullscreenContent.appendChild(img);
  } else if (file.mimeType.startsWith('video/')) {
    const iframe = document.createElement('iframe');
    iframe.src = file.url;
    iframe.allowFullscreen = true;
    iframe.frameBorder = '0';
    fullscreenContent.appendChild(iframe);
  }
  
  fullscreenCaption.textContent = file.name;
}

function navigateGallery(direction) {
  if (sortedGalleryFiles.length === 0) return;
  currentGalleryIndex += direction;
  if (currentGalleryIndex < 0) {
    currentGalleryIndex = sortedGalleryFiles.length - 1;
  } else if (currentGalleryIndex >= sortedGalleryFiles.length) {
    currentGalleryIndex = 0;
  }
  displayFullscreenItem();
}

function toggleSlideshow() {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    fullscreenPlay.textContent = '▶';
  } else {
    slideshowInterval = setInterval(() => {
      navigateGallery(1);
    }, 3000);
    fullscreenPlay.textContent = '⏸';
  }
}

// ------------------------
// Initialization: Show/Hide Sections Based on Config
// ------------------------
function setupUploadGallerySections() {
  // Setup Upload Section if enabled
  if (uploadSection && uploadNavItem) {
    if (CONFIG.UPLOAD && CONFIG.UPLOAD.ENABLED) {
      uploadNavItem.classList.remove('hidden');
      setupUploadSection();
    } else {
      uploadSection.classList.add('hidden');
      uploadNavItem.classList.add('hidden');
    }
  }
  
  // Setup Gallery Section if enabled
  if (gallerySection && galleryNavItem) {
    if (CONFIG.GALLERY && CONFIG.GALLERY.ENABLED) {
      galleryNavItem.classList.remove('hidden');
      setupGalleryFunctionality();
    } else {
      gallerySection.classList.add('hidden');
      galleryNavItem.classList.add('hidden');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupUploadGallerySections();
});
