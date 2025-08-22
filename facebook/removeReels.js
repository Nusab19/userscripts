// ==UserScript==
// @name         Remove Reels
// @namespace    http://tampermonkey.net/
// @version      2025-08-22
// @description  try to take over the world!
// @author       You
// @match        https://www.facebook.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=facebook.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Safe version of your Facebook Reels remover
    function removeReelsSection() {
        try {
            // Find the Reels span element
            const reelsSpan = [...document.querySelectorAll('span[dir="auto"]')]
            .find(el => el.textContent.trim() === "Reels");

            if (!reelsSpan) return false;

            // Safely traverse up the parent chain
            let current = reelsSpan;
            for (let i = 0; i < 7 && current?.parentElement; i++) {
                current = current.parentElement;
            }

            // Only remove if we found a valid container and it's not a critical page element
            if (current &&
                current !== document.body &&
                current !== document.documentElement &&
                !current.id?.includes('mount') && // Avoid root containers
                current.offsetHeight > 0) { // Make sure it's visible

                current.remove();
                console.log('Reels section removed');
                return true;
            }

        } catch (error) {
            console.warn('Error removing Reels section:', error);
        }

        return false;
    }

    // Run with retry mechanism for dynamic content
    function initReelsRemover() {
        // Try immediately
        removeReelsSection();

        // Watch for new content (Facebook loads dynamically)
        const observer = new MutationObserver(() => {
            // Debounce to avoid excessive calls
            clearTimeout(observer.timeoutId);
            observer.timeoutId = setTimeout(removeReelsSection, 500);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also try periodically in case mutation observer misses something
        setInterval(removeReelsSection, 3000);
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReelsRemover);
    } else {
        initReelsRemover();
    }
})();
