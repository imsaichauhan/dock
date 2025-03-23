// main.js

// DOM Elements
const loginSection = document.getElementById('login-section');
const welcomeSection = document.getElementById('welcome-section');
const thankyouSection = document.getElementById('thankyou-section');
const inviteCodeInput = document.getElementById('invite-code');
const submitCodeBtn = document.getElementById('submit-code');
const loginError = document.getElementById('login-error');
const guestNameElement = document.getElementById('guest-name');
const rsvpInputs = document.querySelectorAll('input[name="rsvp"]');
const foodPreferenceGroup = document.getElementById('food-preference-group');
const foodInputs = document.querySelectorAll('input[name="food"]');
const submitRsvpBtn = document.getElementById('submit-rsvp');
const rsvpMessage = document.getElementById('rsvp-message');
const whatsappContainer = document.getElementById('whatsapp-container');
const whatsappLink = document.getElementById('whatsapp-link');
// Spotify DOM Elements
const spotifyContainer = document.getElementById('spotify-container');
const spotifyLink = document.getElementById('spotify-link');
// Event Details Elements
const eventDatetime = document.getElementById('event-datetime');
const eventVenue = document.getElementById('event-venue');
const mapsLink = document.getElementById('maps-link');
const eventItems = document.getElementById('event-items');
const revealVenueBtn = document.getElementById('reveal-venue-btn');
const venueDetails = document.getElementById('venue-details');
const venueRevealControls = document.getElementById('venue-reveal-controls');
const balloonContainer = document.getElementById('balloon-container');

// Global Variables
let submittedRsvp = null;
let guestName = '';

// ------------------------
// Login & RSVP Functions
// ------------------------

// Create animated balloons for the login screen
function createBalloons() {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#62CBFF', '#A782FD'];
    const sizes = [40, 50, 60, 70, 80];
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const balloonCount = isMobile ? 2 : 8;

    for (let i = 0; i < balloonCount; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const animationDuration = 8 + Math.random() * 8;
        const animationDelay = Math.random() * 5;
        balloon.style.width = `${size}px`;
        balloon.style.height = `${Math.round(size * 1.6)}px`;
        balloon.style.background = color;
        balloon.style.left = `${left}%`;
        balloon.style.animationDuration = `${animationDuration}s`;
        balloon.style.animationDelay = `${animationDelay}s`;
        balloon.style.opacity = '0.7';
        balloonContainer.appendChild(balloon);
    }
}

// Add pulse effect to the submit button
function addLoginButtonEffects() {
    submitCodeBtn.classList.add('pulse-effect');
    inviteCodeInput.addEventListener('focus', () => {
        inviteCodeInput.style.transition = 'all 0.3s ease';
        inviteCodeInput.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.5)';
    });
    inviteCodeInput.addEventListener('blur', () => {
        inviteCodeInput.style.boxShadow = '';
    });
}

// Fallback scroll function
function scrollToTopFallback() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

// Initialize the application
function init() {
    createBalloons();
    addLoginButtonEffects();
    // Setup event details
    eventDatetime.textContent = CONFIG.EVENT.DATE_TIME;
    eventVenue.textContent = CONFIG.EVENT.VENUE;
    mapsLink.href = CONFIG.EVENT.GOOGLE_MAPS;
    const venueVideoLink = document.getElementById('venue-video-link');
    if (venueVideoLink) {
        venueVideoLink.href = CONFIG.EVENT.VENUE_VIDEO;
    }
    eventItems.textContent = CONFIG.EVENT.ITEMS;
    if (CONFIG.REVEAL_VENUE && venueDetails) {
        venueDetails.classList.add('revealed');
        const overlay = venueDetails.querySelector('.blur-overlay');
        if (overlay) {
            overlay.remove();
        }
        if (venueRevealControls) {
            venueRevealControls.classList.add('hidden');
        }
    }
    setupBlurTooltip();
    if (CONFIG.WHATSAPP_LINK) {
        whatsappLink.href = CONFIG.WHATSAPP_LINK;
        console.log('WhatsApp link initialized:', CONFIG.WHATSAPP_LINK);
    } else {
        console.error('WhatsApp link configuration missing');
    }
    // Set Public Drive Link for gallery
    if (driveLink && CONFIG.GALLERY.PUBLIC_DRIVE_LINK) {
        driveLink.href = CONFIG.GALLERY.PUBLIC_DRIVE_LINK;
    }
    setupEventListeners();
    setupUploadGallerySections(); // Ensure this function is called

    // Hide RSVP section and show Upload/Gallery sections based on config
    const rsvpSection = document.getElementById('rsvp');
    if (CONFIG.UPLOAD.ENABLED || CONFIG.GALLERY.ENABLED) {
        if (rsvpSection) {
            rsvpSection.classList.add('hidden');
        }
        if (CONFIG.UPLOAD.ENABLED) {
            const uploadSection = document.getElementById('upload-section');
            const uploadNavItem = document.getElementById('upload-nav-item');
            if (uploadSection) {
                uploadSection.classList.remove('hidden');
            }
            if (uploadNavItem) {
                uploadNavItem.classList.remove('hidden');
            }
        }
        if (CONFIG.GALLERY.ENABLED) {
            const gallerySection = document.getElementById('gallery-section');
            const galleryNavItem = document.getElementById('gallery-nav-item');
            if (gallerySection) {
                gallerySection.classList.remove('hidden');
            }
            if (galleryNavItem) {
                galleryNavItem.classList.remove('hidden');
            }
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    submitCodeBtn.addEventListener('click', validateInviteCode);
    inviteCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateInviteCode();
    });
    if (revealVenueBtn && venueDetails && !CONFIG.REVEAL_VENUE) {
        revealVenueBtn.addEventListener('click', () => {
            venueDetails.classList.add('revealed');
            const overlay = venueDetails.querySelector('.blur-overlay');
            if (overlay) {
                overlay.remove();
            }
            venueRevealControls.classList.add('hidden');
        });
    }
    rsvpInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (e.target.value === 'Yes') {
                foodPreferenceGroup.classList.remove('hidden');
                foodPreferenceGroup.classList.add('fade-in');
            } else {
                foodPreferenceGroup.classList.add('hidden');
            }
        });
    });
    submitRsvpBtn.addEventListener('click', submitRSVP);
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', scrollToTopFallback);
    }
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.addEventListener('mouseenter', () => {
            loginCard.style.transform = 'translateY(-5px)';
            loginCard.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
        });
        loginCard.addEventListener('mouseleave', () => {
            loginCard.style.transform = '';
            loginCard.style.boxShadow = '';
        });
    }
}

// Revised Tooltip System
function setupBlurTooltip() {
    const blurredElements = document.querySelectorAll('.blur-content');
    blurredElements.forEach(element => {
        if (element.classList.contains('revealed')) return;
        element.style.position = 'relative';
        if (!element.querySelector('.blur-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'blur-overlay';
            element.appendChild(overlay);
            overlay.addEventListener('mousemove', (e) => {
                showBlurTooltip(element, e);
            });
            overlay.addEventListener('mouseleave', () => {
                hideBlurTooltip(element);
            });
        }
    });
}

function showBlurTooltip(element, event) {
    const tooltipId = `blur-tooltip-${element.id || 'default'}`;
    let tooltip = document.getElementById(tooltipId);
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = tooltipId;
        tooltip.className = 'blur-tooltip';
        const tooltipText = document.createElement('span');
        tooltipText.textContent = "Blurry for now… but those who inspect closely might see more. 😉";
        tooltip.appendChild(tooltipText);
        document.body.appendChild(tooltip);
    }
    void tooltip.offsetHeight;
    const offset = 15;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let posX = event.clientX + offset;
    let posY = event.clientY + offset;
    if (posX + tooltipRect.width > viewportWidth - 20) {
        posX = event.clientX - tooltipRect.width - offset;
    }
    if (posY + tooltipRect.height > viewportHeight - 20) {
        posY = event.clientY - tooltipRect.height - offset;
    }
    tooltip.style.left = `${Math.max(20, posX)}px`;
    tooltip.style.top = `${Math.max(20, posY)}px`;
}

function hideBlurTooltip(element) {
    const tooltipId = `blur-tooltip-${element.id || 'default'}`;
    const tooltip = document.getElementById(tooltipId);
    if (tooltip) tooltip.remove();
}

// Validate invite code using JSONP
function validateInviteCode() {
    const inviteCode = inviteCodeInput.value.trim();
    if (!inviteCode) {
        showLoginError('Please enter your invite code');
        shakeInput(inviteCodeInput);
        return;
    }
    submitCodeBtn.disabled = true;
    submitCodeBtn.textContent = 'Checking...';
    submitCodeBtn.classList.remove('pulse-effect');
    const script = document.createElement('script');
    script.src = `${CONFIG.API_URL}?inviteCode=${inviteCode}&callback=handleInviteCodeResponse`;
    const timeout = setTimeout(() => {
        showLoginError('Request timed out. Please try again.');
        resetSubmitButton();
        document.body.removeChild(script);
    }, 10000);
    script.onload = () => clearTimeout(timeout);
    document.body.appendChild(script);
}

// Add shake animation to element
function shakeInput(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// Handle JSONP response for invite code validation
function handleInviteCodeResponse(data) {
    const scriptTag = document.querySelector('script[src*="callback=handleInviteCodeResponse"]');
    if (scriptTag) {
        document.body.removeChild(scriptTag);
    }
    if (data.error) {
        showLoginError(data.error);
        shakeInput(inviteCodeInput);
        resetSubmitButton();
        return;
    }
    submitCodeBtn.textContent = 'Welcome!';
    submitCodeBtn.style.backgroundColor = 'var(--success-color)';
    setTimeout(() => {
        if (data.name && guestNameElement) {
            guestNameElement.textContent = data.name;
            window.guestName = data.name;
            guestName = data.name;
        }
        if (data.name === 'The Pure Joy in Human Form') {
            CONFIG.WHATSAPP_LINK = 'https://chat.whatsapp.com/HJ95aGEzGiv2gRs6JZlc0S';
            const whatsappLink = document.getElementById('whatsapp-link');
            if (whatsappLink) {
                whatsappLink.href = CONFIG.WHATSAPP_LINK;
            }
        }
        if (data.name !== 'The Pure Joy in Human Form') {
            if (spotifyContainer) {
                spotifyContainer.classList.remove('hidden');
            }
            if (spotifyLink) {
                spotifyLink.href = 'https://open.spotify.com/playlist/2AX0HBpOfjCeEFc95JTD01?si=fXb2b2vkTgmoD41A7UF1mQ&pt=8530fa3cf27624537eb062b298dad69b&pi=OKdBXREbQja3m';
            }
        } else {
            if (spotifyContainer) {
                spotifyContainer.classList.add('hidden');
            }
        }
        loginSection.classList.remove('active');
        welcomeSection.classList.add('active');
        welcomeSection.classList.add('fade-in');
        if (typeof updateHeroText === 'function') {
            updateHeroText("before");
        }
        if (typeof initCountdown === 'function') {
            initCountdown();
        }
        if (balloonContainer) {
            balloonContainer.innerHTML = '';
        }
    }, 800);
}

// Submit RSVP using JSONP
function submitRSVP() {
    const rsvpValue = document.querySelector('input[name="rsvp"]:checked')?.value;
    submittedRsvp = rsvpValue;
    let foodValue = 'N/A';
    if (!rsvpValue) {
        showRsvpMessage('Please select whether you\'ll be attending', 'error');
        return;
    }
    if (rsvpValue === 'Yes') {
        foodValue = document.querySelector('input[name="food"]:checked')?.value;
        if (!foodValue) {
            showRsvpMessage('Please select your food preference', 'error');
            return;
        }
    }
    submitRsvpBtn.disabled = true;
    submitRsvpBtn.textContent = 'Submitting...';
    const inviteCode = inviteCodeInput.value.trim();
    const script = document.createElement('script');
    script.src = `${CONFIG.API_URL}?inviteCode=${inviteCode}&rsvp=${rsvpValue}&foodPreference=${foodValue}&callback=handleRsvpResponse`;
    const timeout = setTimeout(() => {
        showRsvpMessage('Request timed out. Please try again.', 'error');
        resetRsvpButton();
        document.body.removeChild(script);
    }, 10000);
    script.onload = () => clearTimeout(timeout);
    document.body.appendChild(script);
}

// Handle JSONP response for RSVP submission
function handleRsvpResponse(data) {
    const scriptTag = document.querySelector('script[src*="callback=handleInviteResponse"]') ||
                      document.querySelector('script[src*="callback=handleRsvpResponse"]');
    if (scriptTag) {
        document.body.removeChild(scriptTag);
    }
    console.log("RSVP Response received:", data);
    if (data.error) {
        showRsvpMessage(data.error, 'error');
        resetRsvpButton();
        return;
    }
    rsvpMessage.textContent = '';
    const isAttending = submittedRsvp && normalizeRsvpResponse(submittedRsvp);
    console.log(`RSVP normalized from submitted: "${submittedRsvp}" → ${isAttending ? "Yes" : "No"}`);
    cleanupSections();
    setTimeout(() => {
        welcomeSection.classList.remove('active');
        if (isAttending) {
            handleAttendingResponse();
        } else {
            handleDecliningResponse();
        }
    }, 1000);
}

function normalizeRsvpResponse(rsvp) {
    if (!rsvp) return false;
    const normalized = String(rsvp).trim().toLowerCase();
    return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

function handleAttendingResponse() {
    console.log("Handling 'Yes' response");
    showRsvpMessage('Thank you for your response! Can\'t wait to celebrate together! 🎉', 'success');
    welcomeSection.classList.remove('active');
    thankyouSection.classList.add('active');
    thankyouSection.classList.add('fade-in');
    if (whatsappContainer) {
        whatsappContainer.classList.remove('hidden');
        whatsappContainer.classList.add('fade-in');
        scrollToTopFallback();
        setTimeout(() => {
            if (typeof createConfetti === 'function') {
                createConfetti();
            } else {
                console.warn('createConfetti function not found');
            }
        }, 500);
    }
}

function handleDecliningResponse() {
    console.log("Handling 'No' response");
    showRsvpMessage('We\'ll miss you! If plans change, you can always update your response.', 'info');
    const declineSection = document.createElement('section');
    declineSection.id = 'decline-section';
    declineSection.className = 'section active fade-in';
    declineSection.innerHTML = `
        <div class="container">
            <div class="thankyou-card">
                <h1>We'll miss you!</h1>
                <p>If your plans change, feel free to update your RSVP.</p>
                <button id="back-to-rsvp" class="btn">Change Response</button>
            </div>
        </div>
    `;
    document.body.insertBefore(declineSection, thankyouSection.nextSibling);
    thankyouSection.classList.remove('active');
    const backToRsvpBtn = document.getElementById('back-to-rsvp');
    if (backToRsvpBtn) {
        backToRsvpBtn.addEventListener('click', () => {
            declineSection.remove();
            welcomeSection.classList.add('active');
            resetRsvpButton();
        });
    }
}

function cleanupSections() {
    const existingDeclineSection = document.getElementById('decline-section');
    if (existingDeclineSection) {
        existingDeclineSection.remove();
    }
    thankyouSection.classList.remove('active');
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.add('shake');
    setTimeout(() => {
        loginError.classList.remove('shake');
    }, 500);
}

function showRsvpMessage(message, type) {
    rsvpMessage.textContent = message;
    rsvpMessage.className = 'message ' + type;
}

function resetSubmitButton() {
    submitCodeBtn.disabled = false;
    submitCodeBtn.textContent = 'Unlock Invitation';
    submitCodeBtn.classList.add('pulse-effect');
}

function resetRsvpButton() {
    submitRsvpBtn.disabled = false;
    submitRsvpBtn.textContent = 'Submit RSVP';
}

// ------------------------
// Initialization
// ------------------------
document.addEventListener('DOMContentLoaded', init);