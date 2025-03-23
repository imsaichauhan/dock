// countdown.js
// DOM Elements for individual countdown values
const daysElement = document.getElementById('days');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');

// Helper to update hero text based on phase
function updateHeroText(phase) {
    const heroHeading = document.getElementById('hero-heading');
    const heroSubtitle = document.getElementById('hero-subtitle');
    
    // Use the globally stored guest name if available
    const guestName = window.guestName || "(guest-name)";
    
    if (phase === "before") {
        heroHeading.innerHTML = CONFIG.HERO.BEFORE.HEADING.replace("(guest-name)", guestName);
        heroSubtitle.textContent = CONFIG.HERO.BEFORE.SUBTITLE;
    } else if (phase === "partyStarted") {
        heroHeading.innerHTML = CONFIG.HERO.PARTY_STARTED.HEADING.replace("(guest-name)", guestName);
        heroSubtitle.textContent = CONFIG.HERO.PARTY_STARTED.SUBTITLE;
    } else if (phase === "thankYou") {
        heroHeading.innerHTML = CONFIG.HERO.THANK_YOU.HEADING.replace("(guest-name)", guestName);
        heroSubtitle.textContent = CONFIG.HERO.THANK_YOU.SUBTITLE;
    }
}

// Update countdown timer
function updateCountdown() {
    const now = new Date();
    const diff = CONFIG.TARGET_DATE - now;
    const countdownContainer = document.getElementById('countdown');
    
    // When event time has passed
    if (diff <= 0) {
        const elapsed = now - CONFIG.TARGET_DATE;
        // Hide the countdown timer container
        countdownContainer.style.display = "none";
        
        // Update hero text based on elapsed time
        if (elapsed < CONFIG.PARTY_DURATION) {
            updateHeroText("partyStarted");
        } else {
            updateHeroText("thankYou");
        }
        return;
    }
    
    // Calculate remaining time
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update the DOM with formatted values
    daysElement.textContent = days.toString().padStart(2, '0');
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
}

// Initialize the countdown timer and update every second
function initCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Start countdown when DOM is loaded
document.addEventListener('DOMContentLoaded', initCountdown);
