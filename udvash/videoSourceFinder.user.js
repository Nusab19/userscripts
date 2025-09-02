// ==UserScript==
// @name         Udvash - Video Source Finder, and other tweaks
// @namespace    http://tampermonkey.net/
// @version      2025-09-02
// @description  Enhanced video source finder with URL parameters
// @author       Nusab Taha
// @match        https://online.udvash-unmesh.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// ==/UserScript==

(function() {
    'use strict';

    // Color constants for consistent theming
    const COLORS = {
        primary: '#024a71',
        primaryHover: '#34495e',
        secondary: '#59168b',
        secondaryHover: '#3c0366',
        success: '#27ae60',
        error: '#c0392b',
        white: '#ffffff'
    };

    // Utility functions
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    const createButton = (text, backgroundColor, hoverColor) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            background: ${backgroundColor};
            border: none;
            border-radius: 6px;
            color: ${COLORS.white};
            font-size: 14px;
            font-weight: 500;
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = hoverColor;
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = backgroundColor;
        });

        return button;
    };

    const showButtonState = (button, text, color, originalText, originalColor, duration = 1000) => {
        button.style.background = color;
        button.textContent = text;

        setTimeout(() => {
            button.style.background = originalColor;
            button.textContent = originalText;
        }, duration);
    };

    // Simple hash function for URL
    const simpleHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    };

    const saveVideoData = (videoUrl) => {
        // Extract the base URL (remove query parameters)
        const baseUrl = videoUrl.split('?')[0];
        const hash = simpleHash(baseUrl);

        const videoData = {
            url: baseUrl,
            prev: window.location.href,
            timestamp: Date.now()
        };

        // Save to cookie accessible across all subdomains
        document.cookie = `udvash_video_${hash}=${encodeURIComponent(JSON.stringify(videoData))}; domain=.udvash-unmesh.com; path=/; max-age=111111`; // >1 day
    };

    const initializeButtons = () => {
        const dashboard = document.querySelector('.container.bg-shadow');
        if (!dashboard) return;

        // Create container
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 0;
            margin: -15px 0 5px 0;
        `;

        // Create Find Source button
        const sourceButton = createButton('Find Source', COLORS.primary, COLORS.primaryHover);
        sourceButton.addEventListener('click', async () => {
            const videoElement = document.getElementById("video_html5_api");

            if (videoElement?.src) {
                showButtonState(sourceButton, 'Copied!', COLORS.success, 'Find Source', COLORS.primary);

                saveVideoData(videoElement.src);
                await copyToClipboard(videoElement.src);
                window.open(videoElement.src, '_blank');
            } else {
                showButtonState(sourceButton, 'No Source Found', COLORS.error, 'Find Source', COLORS.primary, 2000);
            }
        });

        // Create Copy Cookie button
        const cookieButton = createButton('Copy Cookie', COLORS.secondary, COLORS.secondaryHover);
        cookieButton.addEventListener('click', async () => {
            try {
                const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith('.SP_AUTH='))
                ?.split('=')[1];

                if (cookieValue) {
                    showButtonState(cookieButton, 'Copied!', COLORS.success, 'Copy Cookie', COLORS.secondary);
                    await copyToClipboard(cookieValue);
                } else {
                    showButtonState(cookieButton, 'Cookie Not Found', COLORS.error, 'Copy Cookie', COLORS.secondary, 2000);
                }
            } catch (err) {
                showButtonState(cookieButton, 'Error', COLORS.error, 'Copy Cookie', COLORS.secondary, 2000);
            }
        });

        container.append(sourceButton, cookieButton);
        dashboard.parentNode.insertBefore(container, dashboard);
    };

    // Clean up unwanted elements
    const cleanupElements = () => {
        document.querySelector('.d-between-middle.btn-menu.btn-app-info.position-relative')?.remove();
        document.querySelector('a[href="/DiscussionGroup/Index"]')?.parentElement?.remove();
    };

    // Initialize
    cleanupElements();
    setTimeout(initializeButtons, 0);
})();
