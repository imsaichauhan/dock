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
const uploadProgressContainer = document.getElementById('upload-progress-container');
const uploadProgressBar = document.getElementById('upload-progress-bar');
const uploadProgressText = document.getElementById('upload-progress-text');
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
let currentGalleryItems = [];
let currentGalleryIndex = 0;
let slideshowInterval = null;
const maxFilesToShow = 20; // Number of files to display

// ------------------------
// Upload Functions
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
  uploadButton.addEventListener('click', uploadFilesParallel);
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

function handleFileSelection(files) {
  if (!files || files.length === 0) return;
  selectedFiles = [];
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
    const previewItem = document.createElement('div');
    previewItem.className = 'upload-preview-item';
    const previewThumb = document.createElement('div');
    previewThumb.className = 'preview-thumbnail';
    if (isImage) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
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
    uploadButton.disabled = false;
    clearFilesButton.classList.remove('hidden');
    showUploadMessage('', '');
  } else {
    uploadPreviewContainer.classList.add('hidden');
    uploadButton.disabled = true;
    clearFilesButton.classList.add('hidden');
  }
}

function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

function clearFileSelection() {
  selectedFiles = [];
  uploadPreviewList.innerHTML = '';
  uploadPreviewContainer.classList.add('hidden');
  uploadButton.disabled = true;
  clearFilesButton.classList.add('hidden');
  fileInput.value = '';
  showUploadMessage('', '');
}

function showUploadMessage(message, type) {
  uploadMessage.textContent = message;
  uploadMessage.className = 'upload-message ' + type;
}

// ------------------------
// Upload Multiple Files in Parallel using Promises
// ------------------------
function uploadFilesParallel() {
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
  uploadButton.disabled = true;
  clearFilesButton.disabled = true;
  uploadProgressContainer.classList.remove('hidden');
  uploadProgressBar.style.width = '0%';
  uploadProgressText.textContent = '0% Complete';
  let uploadedCount = 0;
  const uploadPromises = selectedFiles.map((file, index) => {
    return new Promise((resolve, reject) => {
      const callbackName = 'uploadCallback_' + Date.now() + '_' + index;
      window[callbackName] = function(response) {
        const scriptElement = document.getElementById('upload-script-' + index);
        if (scriptElement) {
          document.body.removeChild(scriptElement);
        }
        delete window[callbackName];
        if (response.success) {
          resolve(response);
        } else {
          reject(response.error || 'Upload failed.');
        }
      };
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Data = e.target.result.split(',')[1];
        const url = new URL(CONFIG.UPLOAD_GALLERY_API_URL);
        url.searchParams.append('fileUpload', 'true');
        url.searchParams.append('inviteCode', inviteCode);
        url.searchParams.append('guestName', guestName);
        url.searchParams.append('index', index);
        url.searchParams.append('callback', callbackName);
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url.toString();
        const iframeId = 'upload-iframe-' + index;
        let iframe = document.getElementById(iframeId);
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = iframeId;
          iframe.name = iframeId;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }
        form.target = iframeId;
        form.enctype = 'application/json';
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'json';
        input.value = JSON.stringify({
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type
        });
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
          document.body.removeChild(form);
        }, 1000);
      };
      reader.readAsDataURL(file);
    }).then(response => {
      uploadedCount++;
      const progress = Math.round((uploadedCount / selectedFiles.length) * 100);
      uploadProgressBar.style.width = progress + '%';
      uploadProgressText.textContent = progress + '% Complete';
      return response;
    });
  });
  Promise.all(uploadPromises)
    .then(results => {
      setTimeout(() => {
        uploadButton.disabled = false;
        clearFilesButton.disabled = false;
        uploadProgressContainer.classList.add('hidden');
        showUploadMessage('Files uploaded successfully! They will appear after approval.', 'success');
        clearFileSelection();
      }, 1000);
    })
    .catch(error => {
      showUploadMessage(error, 'error');
      uploadButton.disabled = false;
      clearFilesButton.disabled = false;
      uploadProgressContainer.classList.add('hidden');
    });
}

// ------------------------
// Gallery Functions
// ------------------------
function setupGalleryFunctionality() {
  if (!gallerySection || !galleryGrid) {
    console.error('Missing gallery DOM elements');
    return;
  }

  // Load initial random subset
  fetchGalleryItems();
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

  if (data && data.success && data.files) {
    // Select a random subset of files
    const randomFiles = getRandomSubset(data.files, maxFilesToShow);
    currentGalleryItems = randomFiles;
    displayGalleryItems();
  } else {
    console.error("Gallery API error:", data);
    galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery.</div>';
  }
}

function getRandomSubset(files, count) {
  // Shuffle the array and select the first `count` items
  const shuffled = files.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function displayGalleryItems() {
  galleryGrid.innerHTML = '';

  // Show skeleton loading if no files are loaded yet
  if (currentGalleryItems.length === 0) {
    galleryGrid.innerHTML = `
      <div class="gallery-loading">
        ${Array.from({ length: 12 }).map(() => `<div class="skeleton-item"></div>`).join('')}
      </div>
    `;
  }

  // Display loaded files
  currentGalleryItems.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';
    
    if (file.mimeType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = file.url;
      img.alt = file.name;
      img.loading = 'lazy';
      img.onerror = function() {
        this.src = CONFIG.FALLBACK_IMAGE || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
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
    
    mediaContainer.addEventListener('click', () => openFullscreen(index));
    item.appendChild(mediaContainer);
    galleryGrid.appendChild(item);
  });
}

// ------------------------
// Fullscreen Gallery Functions
// ------------------------
function openFullscreen(index) {
  currentGalleryIndex = index;
  displayFullscreenItem();
  galleryFullscreen.classList.remove('hidden');
  
  // Add event listeners for fullscreen interactions
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
  
  // Remove event listeners when closing fullscreen
  fullscreenContent.removeEventListener('click', handleFullscreenClick);
  galleryFullscreen.removeEventListener('click', handleFullscreenBackgroundClick);
}

function handleFullscreenClick(event) {
  // Prevent event bubbling to the galleryFullscreen click handler
  event.stopPropagation();
  
  // Pause the slideshow if it's running
  if (slideshowInterval) {
    toggleSlideshow();
  }
}

function handleFullscreenBackgroundClick(event) {
  // Close fullscreen only if clicking outside the image and not on any control buttons
  const isControlButton = event.target.closest('#fullscreen-close, #fullscreen-prev, #fullscreen-next, #fullscreen-play');
  if (!fullscreenContent.contains(event.target) && !isControlButton) {
    closeFullscreen();
  }
}

function displayFullscreenItem() {
  const file = currentGalleryItems[currentGalleryIndex];
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
  if (currentGalleryItems.length === 0) return;
  currentGalleryIndex = (currentGalleryIndex + direction + currentGalleryItems.length) % currentGalleryItems.length;
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
