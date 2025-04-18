// ==UserScript==
// @name         Github Beautify
// @namespace    http://tampermonkey.net/
// @version      2025-04-18
// @description  Hightlights repository's visibiity. eg. "Public" | "Private"
// @author       You
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

function Header(text) {
    console.log(
        `%c${text}`,
        "color: #ffffff; font-size: 25px; font-weight: 600; background-color: hsl(240, 75%, 60%);"
    );
}

// Function to apply styling to repository visibility labels
function styleVisibilityLabels() {
    const spans = document.querySelectorAll("span");
    const publicSpans = Array.from(spans).filter(span => span.textContent.trim() === "Public" && ![...span.classList].includes("flex-auto"));
    const privateSpans = Array.from(spans).filter(span => span.textContent.trim() === "Private" && ![...span.classList].includes("flex-auto"));

    // Apply general CSS styling to Public spans (red background)
    publicSpans.forEach(span => {
        if (!span.hasAttribute('styled-by-userscript')) {
            span.style.backgroundColor = "hsl(216, 100%, 45%)";
            span.style.color = "hsl(0, 0%, 90%)";
            span.setAttribute('styled-by-userscript', 'true');
        }
    });

    // Apply general CSS styling to Private spans (green background)
    privateSpans.forEach(span => {
        if (!span.hasAttribute('styled-by-userscript')) {
            span.style.backgroundColor = "hsl(150, 100%, 30%)";
            span.style.color = "hsl(0, 0%, 90%)";
            span.setAttribute('styled-by-userscript', 'true');
        }
    });
}

(function() {
    'use strict';

    Header("Custom Github Script is Running...");

    // Initial styling
    styleVisibilityLabels();

    // Set up a MutationObserver to detect changes in the DOM
    const observer = new MutationObserver((mutations) => {
        // Check if any mutations added nodes
        const hasAddedNodes = mutations.some(mutation =>
            mutation.addedNodes && mutation.addedNodes.length > 0
        );

        // Only re-apply styling if nodes were added to avoid unnecessary processing
        if (hasAddedNodes) {
            styleVisibilityLabels();
        }
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
