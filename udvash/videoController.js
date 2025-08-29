// ==UserScript==
// @name         Udvash Video Controller
// @namespace    http://tampermonkey.net/
// @version      2025-08-20
// @description  try to take over the world!
// @author       You
// @match        https://*.udvash-unmesh.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Video Keyboard Controls Script
    function controller() {
        // Find the video element
        const video = document.querySelector('video');

        if (!video) {
            console.log('No video element found on the page');
            return;
        }

        console.log('Video controls activated!');

        // Load saved settings from localStorage
        const savedSpeed = localStorage.getItem('videoControllerSpeed');
        const savedVolume = localStorage.getItem('videoControllerVolume');

        if (savedSpeed) {
            video.playbackRate = parseFloat(savedSpeed);
        }
        if (savedVolume) {
            video.volume = parseFloat(savedVolume);
        }

        // Function to save settings to localStorage
        function saveSettings() {
            localStorage.setItem('videoControllerSpeed', video.playbackRate.toString());
            localStorage.setItem('videoControllerVolume', video.volume.toString());
        }

        // Create toast container
        const toastContainer = document.createElement('div');
        toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
    `;
    document.body.appendChild(toastContainer);

    // Create permanent status display
    const statusDisplay = document.createElement('div');
    statusDisplay.style.cssText = `
        position: fixed;
        top: 2px;
        left: 2px;
        z-index: 10000;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-family: Arial, sans-serif;
        transition: opacity 0.3s ease;
        line-height: 1.2;
        white-space: pre-line;
    `;
    document.body.appendChild(statusDisplay);

    // Function to update status display
    function updateStatus() {
        const speed = video.playbackRate.toFixed(1);
        const volume = Math.round(video.volume * 100);
        statusDisplay.textContent = `Speed: ${speed}x\nVolume: ${volume}%`;
    }

    // Function to handle fullscreen changes
    function handleFullscreenChange() {
        const isFullscreen = document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement ||
              document.msFullscreenElement;

        statusDisplay.style.opacity = isFullscreen ? '0' : '1';
    }

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial status update
    updateStatus();

    // Function to show toast message
    function showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            margin-bottom: 5px;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);

        // Remove after 2 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    // Function to clamp and round speed to nearest 0.1
    function clampSpeed(speed) {
        return Math.max(0.1, Math.min(7.0, Math.round(speed * 10) / 10));
    }

    // Function to clamp volume between 0 and 1
    function clampVolume(volume) {
        return Math.max(0, Math.min(1, volume));
    }

    // Keyboard event handler
    function handleKeyPress(event) {
        // Only handle if not typing in an input field
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        let currentSpeed = video.playbackRate;
        let currentVolume = video.volume;

        switch(event.key) {
            case '[':
                // Decrease speed by 0.1x
                video.playbackRate = clampSpeed(currentSpeed - 0.1);
                showToast(`Speed: ${video.playbackRate.toFixed(1)}x`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case ']':
                // Increase speed by 0.1x
                video.playbackRate = clampSpeed(currentSpeed + 0.1);
                showToast(`Speed: ${video.playbackRate.toFixed(1)}x`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case '+':
            case '=': // Handle both + and = key (same key without shift)
                // Increase speed by 0.5x
                video.playbackRate = clampSpeed(currentSpeed + 0.5);
                showToast(`Speed: ${video.playbackRate.toFixed(1)}x`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case '-':
                // Decrease speed by 0.5x
                video.playbackRate = clampSpeed(currentSpeed - 0.5);
                showToast(`Speed: ${video.playbackRate.toFixed(1)}x`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case 'ArrowUp':
                // Increase volume by 0.05
                video.volume = clampVolume(currentVolume + 0.05);
                showToast(`Volume: ${Math.round(video.volume * 100)}%`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case 'ArrowDown':
                // Decrease volume by 0.05
                video.volume = clampVolume(currentVolume - 0.05);
                showToast(`Volume: ${Math.round(video.volume * 100)}%`);
                updateStatus();
                saveSettings();
                event.preventDefault();
                break;

            case 'f':
            case 'F':
                // Toggle fullscreen
                if (document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement) {
                    // Exit fullscreen
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                    showToast('Exited fullscreen');
                } else {
                    // Enter fullscreen
                    if (video.requestFullscreen) {
                        video.requestFullscreen();
                    } else if (video.webkitRequestFullscreen) {
                        video.webkitRequestFullscreen();
                    } else if (video.mozRequestFullScreen) {
                        video.mozRequestFullScreen();
                    } else if (video.msRequestFullscreen) {
                        video.msRequestFullscreen();
                    }
                    showToast('Entered fullscreen');
                }
                event.preventDefault();
                break;
        }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyPress);

    // Show initial status
    showToast('Video controls ready!');

    // Store cleanup function globally for easy removal if needed
    window.removeVideoControls = function() {
        document.removeEventListener('keydown', handleKeyPress);
        if (toastContainer.parentNode) {
            toastContainer.parentNode.removeChild(toastContainer);
        }
        console.log('Video controls removed');
    };

    console.log('Controls:');
    console.log('[ ] - Speed ±0.1x');
    console.log('+ - - Speed ±0.5x');
    console.log('↑ ↓ - Volume ±5%');
    console.log('Call removeVideoControls() to disable');
}
    controller();
})();
