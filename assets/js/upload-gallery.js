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

    const previewInfo = document.createElement('div');
    previewInfo.className = 'preview-info';

    const fileNameElem = document.createElement('span');
    fileNameElem.className = 'preview-filename';
    fileNameElem.textContent = file.name;

    const fileSizeElem = document.createElement('span');
    fileSizeElem.className = 'preview-filesize';
    fileSizeElem.textContent = `${fileSizeMB.toFixed(2)}MB`;

    previewInfo.appendChild(fileNameElem);
    previewInfo.appendChild(fileSizeElem);
    previewItem.appendChild(previewInfo);

    if (isImage) {
      const previewThumb = document.createElement('div');
      previewThumb.className = 'preview-thumbnail';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => URL.revokeObjectURL(img.src);
      previewThumb.appendChild(img);
      previewItem.appendChild(previewThumb);
    } else if (isVideo) {
      const videoIcon = document.createElement('div');
      videoIcon.className = 'preview-video-icon';
      videoIcon.innerHTML = '🎥';
      previewItem.appendChild(videoIcon);
    }
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

  // Retrieve guestName from global variable or DOM element
  const guestName = window.guestName || (document.getElementById('guest-name') ? document.getElementById('guest-name').textContent.trim() : "");

  uploadButton.disabled = true;
  clearFilesButton.disabled = true;
  uploadProgressContainer.classList.remove('hidden');
  uploadProgressBar.style.width = '0%';
  uploadProgressText.textContent = '0% Complete';

  let uploadedCount = 0;

  // Create an array of Promises for each file upload.
  const uploadPromises = selectedFiles.map((file, index) => {
    return new Promise((resolve, reject) => {
      const callbackName = 'uploadCallback_' + Date.now() + '_' + index;
      window[callbackName] = function(response) {
        // Clean up script tag.
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

      // Read file as base64.
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Data = e.target.result.split(',')[1];

        // Build URL with necessary parameters.
        const url = new URL(CONFIG.UPLOAD_GALLERY_API_URL);
        url.searchParams.append('fileUpload', 'true');
        url.searchParams.append('inviteCode', inviteCode);
        url.searchParams.append('guestName', guestName);
        url.searchParams.append('index', index);
        url.searchParams.append('callback', callbackName);

        // Create a form for submission.
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url.toString();
        // Each form targets its own hidden iframe.
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

        // Submit the form.
        form.submit();

        // Remove the form after a delay.
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
  fetchGalleryItems();
  setInterval(fetchGalleryItems, 5 * 60 * 1000); // Refresh every 5 minutes
}

function fetchGalleryItems() {
  const script = document.createElement('script');
  // Use the new API URL for gallery fetching
  script.src = `${CONFIG.UPLOAD_GALLERY_API_URL}?action=fetchGallery&callback=handleGalleryResponse`;
  document.body.appendChild(script);
}

function handleGalleryResponse(data) {
  const scriptTag = document.querySelector('script[src*="callback=handleGalleryResponse"]');
  if (scriptTag) {
    document.body.removeChild(scriptTag);
  }
  if (data && data.success && data.files) {
    currentGalleryItems = data.files;
    displayGalleryItems();
  } else {
    galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery.</div>';
  }
}

function displayGalleryItems() {
  galleryGrid.innerHTML = '';
  const shuffled = currentGalleryItems.sort(() => 0.5 - Math.random());
  shuffled.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const ext = getFileExtension(file.name).toLowerCase();
    const isImage = CONFIG.UPLOAD.ALLOWED_IMAGE_TYPES.includes(`.${ext}`);
    if (isImage) {
      const img = document.createElement('img');
      img.src = file.url;
      img.alt = file.name;
      if (CONFIG.GALLERY.LAZY_LOAD) {
        img.loading = 'lazy';
      }
      item.appendChild(img);
    } else {
      const videoIcon = document.createElement('div');
      videoIcon.className = 'gallery-video-icon';
      videoIcon.innerHTML = '🎥';
      item.appendChild(videoIcon);
    }
    if (CONFIG.GALLERY.SHOW_UPLOADER_NAMES && file.uploader) {
      const uploader = document.createElement('div');
      uploader.className = 'gallery-uploader';
      uploader.textContent = file.uploader;
      item.appendChild(uploader);
    }
    item.addEventListener('click', () => openFullscreen(index));
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
}

function displayFullscreenItem() {
  if (currentGalleryItems.length === 0) return;
  const file = currentGalleryItems[currentGalleryIndex];
  fullscreenContent.innerHTML = '';
  const ext = getFileExtension(file.name).toLowerCase();
  const isImage = CONFIG.UPLOAD.ALLOWED_IMAGE_TYPES.includes(`.${ext}`);
  if (isImage) {
    const img = document.createElement('img');
    img.src = file.url;
    img.alt = file.name;
    fullscreenContent.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = file.url;
    video.controls = true;
    fullscreenContent.appendChild(video);
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

function closeFullscreen() {
  galleryFullscreen.classList.add('hidden');
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    fullscreenPlay.textContent = '▶';
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
