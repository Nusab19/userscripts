// ==UserScript==
// @name         TorrentBD - Username Mention Notifier
// @version      2025-09-02
// @description  Automatically detects your username, highlights messages, and plays a sound in the TorrentBD shoutbox when you are mentioned.
// @author       consciouSoul
// @namespace    consciouSoul
// @match        https://*.torrentbd.com/*
// @match        https://*.torrentbd.net/*
// @match        https://*.torrentbd.org/*
// @match        https://*.torrentbd.me/*
// @license      MIT
// @run-at       document-end
// ==/UserScript==



// Note: Sound's Code is by Claude, works pretty good. :3
function playSimpleNotification(volume = 0.08) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (frequency, startTime, duration) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;

        // Quick fade in/out
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playTone(800, now, 0.2);        // First tone
    playTone(1200, now + 0.15, 0.25); // Second tone (higher)
}

(function() {
    'use strict';
    // Get username
    const usernameElement = document.querySelector('span[title="View More"]').firstChild;
    const USERNAME = `@${usernameElement.textContent}`.trim().toLowerCase();


    var GLOBAL_SHOUT_SET = new Set();

    // Function to process messages and highlight them
    function processMessages() {
        try {

            // Get messages container
            const shoutsContainer = document.getElementById("shouts-container");
            if (!shoutsContainer) {
                console.log('Shouts container not found');
                return;
            }

            const messages = [...shoutsContainer.children];

            messages.forEach((m, index) => {
                const shoutID = m.id;
                const text = m.querySelector(".shout-text").textContent.toLowerCase();

                if(text.includes(USERNAME) && !GLOBAL_SHOUT_SET.has(shoutID)){
                    playSimpleNotification()
                    m.style.backgroundColor = '#18489a'; // Darkish blue highlight
                    m.style.transition = 'background-color 0.3s ease'; // Smooth transition
                    GLOBAL_SHOUT_SET.add(shoutID)

                }
            });

            console.log(`Processed ${messages.length} messages`);

        } catch (error) {
            console.error('Error processing messages:', error);
        }
    }

    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        mutations.forEach((mutation) => {
            // Check if nodes were added or removed
            if (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                shouldProcess = true;
            }
            // Check if attributes changed (like class names, styles, etc.)
            else if (mutation.type === 'attributes') {
                shouldProcess = true;
            }
        });

        if (shouldProcess) {
            console.log('DOM change detected, processing messages...');
            processMessages();
        }
    });

    // Configuration for the observer
    const observerConfig = {
        childList: true,        // Watch for addition/removal of child nodes
        subtree: true,          // Watch the entire subtree
        attributes: true,       // Watch for attribute changes
        attributeOldValue: true // Keep track of old attribute values
    };

    // Start observing
    function startMonitoring() {
        // Process messages initially
        processMessages();

        // Find the specific element to observe
        const targetElement = document.getElementById('shouts-container');

        if (targetElement) {
            // Start observing changes to only the specific element
            observer.observe(targetElement, observerConfig);
            console.log('Started monitoring DOM changes on element with id="shouts-container"');
        } else {
            console.log('Element with id="shouts-container" not found. Monitoring will start when element is available.');

            // Optional: Wait for the element to appear in the DOM
            const checkForElement = setInterval(() => {
                const element = document.getElementById('shouts-container');
                if (element) {
                    observer.observe(element, observerConfig);
                    console.log('Element found! Started monitoring DOM changes on id="shouts-container"');
                    clearInterval(checkForElement);
                }
            }, 1000); // Check every second
        }
    }

    // Stop monitoring function (useful for cleanup)
    function stopMonitoring() {
        observer.disconnect();
        console.log('Stopped monitoring DOM changes');
    }

    // Auto-start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }

    // Expose functions globally for manual control
    window.processMessages = processMessages;
    window.startMonitoring = startMonitoring;
    window.stopMonitoring = stopMonitoring;
    window.playSimpleNotification = playSimpleNotification;
})();
