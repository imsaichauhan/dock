// config.js
const CONFIG = {
    // API endpoint to your Login & RSVP Google Apps Script
    API_URL: 'https://script.google.com/macros/s/AKfycbxwlh-fT7rGM-kohqyo7Z9d27RcRPE1rFP7qLlO381ratGnS0NeCH1AGsUYkv-qk3AO/exec',
    // New API endpoint for Upload & Gallery functionality
    UPLOAD_GALLERY_API_URL: 'https://script.google.com/macros/s/AKfycbyjpPHvRmw5fqvYHnT9eDzdSpKEFHxqANj-_Zo6O0W9byx16S9Zz_MJUb6uG6KByOuy/exec',
    
    // WhatsApp group link (only visible for attendees)
    WHATSAPP_LINK: 'https://chat.whatsapp.com/EGyQOOsqYllJZRNtNDTvQ9',
    // Event details
    EVENT: {
      DATE_TIME: 'March 25, 2025 at 11:30 AM',
      VENUE: "Nice try, Sherlock, but you'll have to wait!",
      VENUE_VIDEO: 'https://www.youtube.com/',
      GOOGLE_MAPS: 'https://www.youtube.com/',
      ITEMS: "A+ for effort, but no spoilers! Just bring your party energy when it's time!",
    },
    // Countdown target date (YYYY, MM-1, DD, HH, MM, SS)
    TARGET_DATE: new Date(2025, 2, 25, 11, 30, 0), // March 25, 2025, 11:30 AM
    // New flag to control venue details reveal manually from backend
    REVEAL_VENUE: true,
    // New properties for post-event messages
    PARTY_STARTED_MESSAGE: "The Party Has Started!",
    THANK_YOU_MESSAGE: "Thank you for attending and making memories!",
    // Party duration in milliseconds (24 hours)
    PARTY_DURATION: 24 * 60 * 60 * 1000,
    // HERO section messages for each phase
    HERO: {
      BEFORE: {
        HEADING: "Hey (guest-name), the countdown is on… but Shibani has no clue!",
        SUBTITLE: "Laughter, surprises, and a birthday girl blissfully unaware of what's ahead!"
      },
      PARTY_STARTED: {
        HEADING: "The wait is over, (guest-name)! The celebration has begun! 🎉",
        SUBTITLE: "Time to make memories, share laughs, and give Shibani the best surprise ever!"
      },
      THANK_YOU: {
        HEADING: "Thank you for being part of this special day, (guest-name)! ✨",
        SUBTITLE: "The memories we made will last a lifetime!"
      }
    },
    // New configurations for upload and gallery features
    UPLOAD: {
      ENABLED: true, // Ensure this is set to true
      MAX_IMAGE_SIZE: 10, // In MB  UPDATE IN APPS SCRIPT
      MAX_VIDEO_SIZE: 300, // In MB
      ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
      ALLOWED_VIDEO_TYPES: ['.mp4', '.mov', '.avi']
    },
    GALLERY: {
      ENABLED: true, // Changed to true to enable gallery functionality
      SHOW_UPLOADER_NAMES: true,
      PUBLIC_DRIVE_LINK: 'https://drive.google.com/drive/u/0/folders/1MqkUXBe9UPVSQGaL70ROPhz7X8AIMXyc',
      LAZY_LOAD: true
    }
  };
