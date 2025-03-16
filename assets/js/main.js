// Configuration
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwLeVzlihQ1AV-fld7UrUcOcR-fSkcxgbAdNJFIEGHclQ01w6hsud9_11vUJn9Zjk3E/exec',
    WHATSAPP_LINK: 'https://chat.whatsapp.com/EGyQOOsqYllJZRNtNDTvQ9',
    EVENT: {
        DATE_TIME: 'March 25, 2025 at 12:00 PM',
        VENUE: 'Crystal Garden Resort',
        GOOGLE_MAPS: 'https://www.google.com/maps/place/Munnar,+Kerala+685612/@10.0806496,77.0641779,15z/data=!3m1!4b1!4m6!3m5!1s0x3b0799794d099a6d:0x63250e5553c7e0c!8m2!3d10.0889333!4d77.0595248!16zL20vMDFydmpi?entry=ttu&g_ep=EgoyMDI1MDMxMi4wIKXMDSoASAFQAw%3D%3D',
        ITEMS: 'Your beautiful self, comfortable clothes, and lots of energy!',
    },
    TARGET_DATE: new Date(2025, 2, 25, 12, 0, 0)
};

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
const whatsappContainer = document.querySelector('.whatsapp-group');
const whatsappLink = document.getElementById('whatsapp-link');
const eventDatetime = document.getElementById('event-datetime');
const eventVenue = document.getElementById('event-venue');
const mapsLink = document.getElementById('maps-link');
const eventItems = document.getElementById('event-items');

// Initialize application
function init() {
    eventDatetime.textContent = CONFIG.EVENT.DATE_TIME;
    eventVenue.textContent = CONFIG.EVENT.VENUE;
    mapsLink.href = CONFIG.EVENT.GOOGLE_MAPS;
    eventItems.textContent = CONFIG.EVENT.ITEMS;
    whatsappLink.href = CONFIG.WHATSAPP_LINK;
    whatsappContainer.style.display = 'none'; // Hide WhatsApp link initially
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    submitCodeBtn.addEventListener('click', validateInviteCode);
    inviteCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validateInviteCode();
    });

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
}

// Validate invite code using JSONP
function validateInviteCode() {
    const inviteCode = inviteCodeInput.value.trim();

    if (!inviteCode) {
        showLoginError('Please enter your invite code');
        return;
    }

    submitCodeBtn.disabled = true;
    submitCodeBtn.textContent = 'Checking...';

    const script = document.createElement('script');
    script.src = `${CONFIG.API_URL}?inviteCode=${inviteCode}&callback=handleInviteCodeResponse`;

    const timeout = setTimeout(() => {
        showLoginError('Request timed out. Please try again.');
        submitCodeBtn.disabled = false;
        submitCodeBtn.textContent = 'Unlock Invitation';
        document.body.removeChild(script);
    }, 10000);

    script.onload = () => clearTimeout(timeout);
    document.body.appendChild(script);
}

// Handle JSONP response for invite code validation
function handleInviteCodeResponse(data) {
    document.body.removeChild(document.querySelector('script[src*="callback=handleInviteCodeResponse"]'));

    if (data.error) {
        showLoginError(data.error);
        submitCodeBtn.disabled = false;
        submitCodeBtn.textContent = 'Unlock Invitation';
        return;
    }

    guestNameElement.textContent = data.name;
    loginSection.classList.remove('active');
    welcomeSection.classList.add('active');
    welcomeSection.classList.add('fade-in');
}

// Submit RSVP using JSONP
function submitRSVP() {
    const rsvpValue = document.querySelector('input[name="rsvp"]:checked')?.value;
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
        submitRsvpBtn.disabled = false;
        submitRsvpBtn.textContent = 'Submit RSVP';
        document.body.removeChild(script);
    }, 10000);

    script.onload = () => clearTimeout(timeout);
    document.body.appendChild(script);
}

// Handle JSONP response for RSVP submission
function handleRsvpResponse(data) {
    document.body.removeChild(document.querySelector('script[src*="callback=handleRsvpResponse"]'));

    if (data.error) {
        showRsvpMessage(data.error, 'error');
        submitRsvpBtn.disabled = false;
        submitRsvpBtn.textContent = 'Submit RSVP';
        return;
    }

    showRsvpMessage('Thank you for your response!', 'success');

    setTimeout(() => {
        welcomeSection.classList.remove('active');
        thankyouSection.classList.add('active');
        thankyouSection.classList.add('fade-in');

        // Show WhatsApp group link only if RSVP is "Yes"
        if (data.rsvp === 'Yes') {
            whatsappContainer.style.display = 'block';
        } else {
            whatsappContainer.style.display = 'none';
        }
    }, 2000);
}

// Show error message
function showLoginError(message) {
    loginError.textContent = message;
}

// Show RSVP message
function showRsvpMessage(message, type) {
    rsvpMessage.textContent = message;
    rsvpMessage.className = 'message';
    rsvpMessage.classList.add(type);
}

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', init);
