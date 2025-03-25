// ------------------------
// DOM Elements
// ------------------------
const uploadSection = document.getElementById('upload-section');
const gallerySection = document.getElementById('gallery-section');
const uploadDropzone = document.getElementById('upload-dropzone');
const fileInput = document.getElementById('file-input');
const uploadButton = document.getElementById('upload-button');
const clearFilesButton = document.getElementById('clear-files-button');
const uploadPreviewContainer = document.getElementById('upload-preview-container');
const uploadPreviewList = document.getElementById('upload-preview-list');
const uploadMessage = document.getElementById('upload-message');
const galleryGrid = document.getElementById('gallery-grid');
const driveLink = document.getElementById('drive-link');
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
// Global Variables
// ------------------------
let selectedFiles = [];
let currentGalleryItems = []; // All fetched items (shuffled)
let displayedItems = 0;       // Number of items currently rendered
const itemsPerLoad = 20;      // Load 20 items at a time
let currentGalleryIndex = 0;
let slideshowInterval = null;
let sortedGalleryFiles = [];  // Visual order for fullscreen
let sentinel = null;          // For infinite scrolling

// ------------------------
// Upload Functions (Updated for Direct Google Drive Upload)
// ------------------------
function setupUploadFunctionality() {
  if (!uploadDropzone || !fileInput || !uploadButton || !clearFilesButton) {
    console.error('Missing upload DOM elements');
    return;
  }
  
  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.classList.add('dropzone-active');
  });
  
  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('dropzone-active');
  });
  
  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove('dropzone-active');
    handleFileSelection(e.dataTransfer.files);
  });
  
  uploadDropzone.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', () => {
    handleFileSelection(fileInput.files);
  });
  
  // Updated to use direct upload function
  uploadButton.addEventListener('click', uploadFilesToGoogleDrive);
  clearFilesButton.addEventListener('click', clearFileSelection);
  
  if (fullscreenClose) {
    fullscreenClose.addEventListener('click', closeFullscreen);
  }
  if (fullscreenPrev) {
    fullscreenPrev.addEventListener('click', () => navigateGallery(-1));
  }
  if (fullscreenNext) {
    fullscreenNext.addEventListener('click', () => navigateGallery(1));
  }
  if (fullscreenPlay) {
    fullscreenPlay.addEventListener('click', toggleSlideshow);
  }
}

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

function handleFileSelection(files) {
  if (!files || files.length === 0) return;
  
  selectedFiles = [];
  // Clear the preview list; no per‑file progress text is added.
  uploadPreviewList.innerHTML = '';
  let validFilesFound = false;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileType = getFileExtension(file.name).toLowerCase();
    const isImage = CONFIG.UPLOAD.ALLOWED_IMAGE_TYPES.includes(`.${fileType}`);
    const isVideo = CONFIG.UPLOAD.ALLOWED_VIDEO_TYPES.includes(`.${fileType}`);
    
    if (!isImage && !isVideo) {
      showUploadMessage(`File "${file.name}" is not an allowed type.`, 'error');
      continue;
    }
    
    const maxSize = isImage ? CONFIG.UPLOAD.MAX_IMAGE_SIZE : CONFIG.UPLOAD.MAX_VIDEO_SIZE;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      showUploadMessage(`File "${file.name}" exceeds the maximum size of ${maxSize}MB.`, 'error');
      continue;
    }
    
    selectedFiles.push(file);
    validFilesFound = true;
    
    // Create a simple thumbnail preview.
    const previewItem = document.createElement('div');
    previewItem.className = 'upload-preview-item';
    previewItem.dataset.index = i;
    
    const previewThumb = document.createElement('div');
    previewThumb.className = 'preview-thumbnail';
    
    if (isImage) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.loading = 'lazy';
      img.onload = () => URL.revokeObjectURL(img.src);
      previewThumb.appendChild(img);
    } else if (isVideo) {
      const videoIcon = document.createElement('div');
      videoIcon.className = 'preview-video-icon';
      videoIcon.innerHTML = '🎥';
      previewThumb.appendChild(videoIcon);
    }
    
    previewItem.appendChild(previewThumb);
    uploadPreviewList.appendChild(previewItem);
  }
  
  if (validFilesFound) {
    uploadPreviewContainer.classList.remove('hidden');
    // Hide any progress container if present.
    const progressContainer = document.getElementById('upload-progress-container');
    if (progressContainer) progressContainer.classList.add('hidden');
    uploadButton.disabled = false;
    clearFilesButton.classList.remove('hidden');
    showUploadMessage('', '');
  } else {
    uploadPreviewContainer.classList.add('hidden');
    uploadButton.disabled = true;
    clearFilesButton.classList.add('hidden');
  }
}

function showUploadMessage(message, type) {
  uploadMessage.textContent = message;
  uploadMessage.className = 'upload-message ' + type;
}

function clearFileSelection() {
  selectedFiles = [];
  uploadPreviewList.innerHTML = '';
  uploadPreviewContainer.classList.add('hidden');
  uploadButton.disabled = true;
  clearFilesButton.classList.add('hidden');
  fileInput.value = '';
  showUploadMessage('', '');
  
  const progressContainer = document.getElementById('upload-progress-container');
  if (progressContainer) progressContainer.classList.add('hidden');
}

function uploadFilesToGoogleDrive() {
  if (selectedFiles.length === 0) {
    showUploadMessage('No files selected.', 'error');
    return;
  }
  
  const inviteCode = document.getElementById('invite-code').value.trim();
  if (!inviteCode) {
    showUploadMessage('Missing invite code. Please refresh and log in again.', 'error');
    return;
  }
  
  const guestName = window.guestName || (document.getElementById('guest-name') ? document.getElementById('guest-name').textContent.trim() : "");
  
  if (!guestName) {
    showUploadMessage('Guest name is required.', 'error');
    return;
  }
  
  // Disable UI during upload
  uploadButton.disabled = true;
  clearFilesButton.disabled = true;
  fileInput.disabled = true;
  uploadDropzone.style.pointerEvents = 'none';
  
  // Create a single form for multiple file uploads
  const formData = new FormData();
  
  // Add invite code and guest name to form data
  formData.append('inviteCode', inviteCode);
  formData.append('guestName', guestName);
  
  // Add files to form data with sequential naming
  selectedFiles.forEach((file, index) => {
    const fileExtension = getFileExtension(file.name);
    const renamedFile = new File(
      [file], 
      `${guestName}${index + 1}.${fileExtension}`, 
      { type: file.type }
    );
    formData.append('files', renamedFile);
  });
  
  // Show uploading message
  showUploadMessage('Uploading files, please wait...', '');
  
  // Perform the upload
  fetch(CONFIG.UPLOAD_GALLERY_API_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Re-enable UI after successful upload
      uploadButton.disabled = false;
      clearFilesButton.disabled = false;
      fileInput.disabled = false;
      uploadDropzone.style.pointerEvents = '';
      
      showUploadMessage('Files uploaded successfully! They will appear after approval.', 'success');
      clearFileSelection();
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  })
  .catch(error => {
    // Re-enable UI on error
    uploadButton.disabled = false;
    clearFilesButton.disabled = false;
    fileInput.disabled = false;
    uploadDropzone.style.pointerEvents = '';
    
    showUploadMessage('Upload failed: ' + error.message, 'error');
  });
}

// ------------------------
// Gallery Functions (unchanged from original)
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
      if (entry.isIntersecting) {
        if (displayedItems < currentGalleryItems.length) {
          displayGalleryItems();
        }
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
// Initialization
// ------------------------
function setupUploadGallerySections() {
  const uploadSection = document.getElementById('upload-section');
  const uploadNavItem = document.getElementById('upload-nav-item');
  const gallerySection = document.getElementById('gallery-section');
  const galleryNavItem = document.getElementById('gallery-nav-item');
  if (uploadSection && uploadNavItem) {
    if (CONFIG.UPLOAD.ENABLED) {
      uploadNavItem.classList.remove('hidden');
      setupUploadFunctionality();
    } else {
      uploadSection.classList.add('hidden');
      uploadNavItem.classList.add('hidden');
    }
  }
  if (gallerySection && galleryNavItem) {
    if (CONFIG.GALLERY.ENABLED) {
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
