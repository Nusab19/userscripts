// ==UserScript==
// @name         Udvash Video Source Finder, and other tweaks
// @namespace    http://tampermonkey.net/
// @version      2025-08-19
// @description  try to take over the world!
// @author       You
// @match        https://online.udvash-unmesh.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// ==/UserScript==

(function() {
    'use strict';
    // ---------------------------------

    function findSrc(){
        const dashboard = document.getElementsByClassName('app-dashboard')[0];
        if (!dashboard)return;

        // Create container div for centering
        const newDiv = document.createElement('div');
        newDiv.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 0;
    margin: 0;
    margin-bottom: 5px;
    margin-top: -15px;
  `;

        // Create the Find Source button
        const button = document.createElement('button');
        button.textContent = 'Find Source';
        button.style.cssText = `
    background: hsl(217, 89%, 50%);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
  `;

        // Create the Copy Cookie button
        const cookieButton = document.createElement('button');
        cookieButton.textContent = 'Copy Cookie';
        cookieButton.style.cssText = `
    background: hsl(25, 89%, 50%);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.2s ease;
  `;

        // Add hover effects for Find Source button
        button.addEventListener('mouseenter', () => {
            button.style.background = '#3367d6';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = '#4285f4';
        });

        // Add hover effects for Copy Cookie button
        cookieButton.addEventListener('mouseenter', () => {
            cookieButton.style.background = '#e8710a';
        });

        cookieButton.addEventListener('mouseleave', () => {
            cookieButton.style.background = '#f57c00';
        });

        // Add click functionality for Find Source
        button.addEventListener('click', async () => {
            const videoElement = document.getElementById("video_html5_api");
            if (videoElement && videoElement.src) {
                button.style.background = '#34a853';
                button.textContent = 'Copied!';

                // Copy to clipboard
                try {
                    await navigator.clipboard.writeText(videoElement.src);
                } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = videoElement.src;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }

                // Open the source in a new tab
                window.open(videoElement.src, '_blank');

                // Reset button after a short delay
                setTimeout(() => {
                    button.style.background = '#4285f4';
                    button.textContent = 'Find Source';
                }, 1000);
            } else {
                // Show error state
                button.style.background = '#ea4335';
                button.textContent = 'No Source Found';

                // Reset button after showing error
                setTimeout(() => {
                    button.style.background = '#4285f4';
                    button.textContent = 'Find Source';
                }, 2000);
            }
        });

        // Add click functionality for Copy Cookie
        cookieButton.addEventListener('click', async () => {
            try {
                const cookieValue = document.cookie.split('; ')
                .find(row => row.startsWith('.SP_AUTH='))
                ?.split('=')[1];

                if (cookieValue) {
                    cookieButton.style.background = '#34a853';
                    cookieButton.textContent = 'Copied!';

                    // Copy to clipboard
                    try {
                        await navigator.clipboard.writeText(cookieValue);
                    } catch (err) {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = cookieValue;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                    }

                    // Reset button after a short delay
                    setTimeout(() => {
                        cookieButton.style.background = '#f57c00';
                        cookieButton.textContent = 'Copy Cookie';
                    }, 1000);
                } else {
                    // Show error state
                    cookieButton.style.background = '#ea4335';
                    cookieButton.textContent = 'Cookie Not Found';

                    // Reset button after showing error
                    setTimeout(() => {
                        cookieButton.style.background = '#f57c00';
                        cookieButton.textContent = 'Copy Cookie';
                    }, 2000);
                }
            } catch (err) {
                // Show error state
                cookieButton.style.background = '#ea4335';
                cookieButton.textContent = 'Error';

                // Reset button after showing error
                setTimeout(() => {
                    cookieButton.style.background = '#f57c00';
                    cookieButton.textContent = 'Copy Cookie';
                }, 2000);
            }
        });

        newDiv.appendChild(button);
        newDiv.appendChild(cookieButton);
        dashboard.parentNode.insertBefore(newDiv, dashboard);
    }

    document.getElementsByClassName("d-between-middle btn-menu btn-app-info position-relative")[0]?.remove()
    document.querySelector('a[href="/DiscussionGroup/Index"]')?.parentElement?.remove()


    setTimeout(findSrc, 0);
})();
