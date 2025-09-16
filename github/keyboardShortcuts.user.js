// ==UserScript==
// @name         GitHub - Keyboard Shortcuts
// @namespace    http://tampermonkey.net/
// @version      2025-09-02
// @description  Adds custom keyboard shortcuts to GitHub
// @author       Nusab Taha
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Configuration object for all shortcuts
  const keyboardShortcuts = {
    // Shortcut for repository filter
    repoFilter: {
      // Element selector (can be ID or query selector)
      selector: "#your-repos-filter",
      // Placeholder text to set
      placeholder: "Find repos (ctrl+k)",
      // Keyboard shortcuts
      shortcuts: [
        {
          // Keys required for this shortcut (one or more)
          keys: {
            ctrlKey: true,
            key: "k",
          },
          // Action to perform
          action: "toggle",
          // Whether to prevent default browser behavior
          preventDefault: true,
        },
        {
          keys: {
            key: "Escape",
          },
          // Only apply when element is focused
          onlyWhenFocused: true,
          action: "blur",
          preventDefault: true,
        },
      ],
    },
    // Add more shortcut configurations here as needed
    // Example:
    // anotherShortcut: {
    //     selector: '.some-element',
    //     placeholder: 'Some text',
    //     shortcuts: [...]
    // }
  };

  // Function to handle all keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
      // Loop through all configured shortcuts
      Object.values(keyboardShortcuts).forEach((config) => {
        const element = document.querySelector(config.selector);
        if (!element) return;

        // Check each shortcut in the configuration
        config.shortcuts.forEach((shortcut) => {
          // Check if all required keys are pressed
          const keysMatch = Object.entries(shortcut.keys).every(
            ([key, value]) => {
              return event[key] === value;
            },
          );

          // If keys don't match, skip this shortcut
          if (!keysMatch) return;

          // Check if shortcut should only apply when element is focused
          if (shortcut.onlyWhenFocused && document.activeElement !== element)
            return;

          // Prevent default if configured
          if (shortcut.preventDefault) {
            event.preventDefault();
          }

          // Perform the specified action
          switch (shortcut.action) {
            case "focus":
              element.focus();
              break;
            case "blur":
              element.blur();
              break;
            case "toggle":
              if (document.activeElement === element) {
                element.blur();
              } else {
                element.focus();
              }
              break;
            // Add more actions as needed
            // case 'click':
            //     element.click();
            //     break;
          }
        });
      });
    });
  }

  // Function to update element placeholders
  function updatePlaceholders() {
    Object.values(keyboardShortcuts).forEach((config) => {
      if (!config.placeholder) return;

      const element = document.querySelector(config.selector);
      if (element && !element.hasAttribute("placeholder-updated")) {
        element.setAttribute("placeholder", config.placeholder);
        element.setAttribute("placeholder-updated", "true");
      }
    });
  }

  // Initial setup
  function initialize() {
    updatePlaceholders();
    setupKeyboardShortcuts();
  }

  // Set up a MutationObserver to detect changes in the DOM
  function setupObserver() {
    const observer = new MutationObserver((mutations) => {
      // Check if any mutations added nodes
      const hasAddedNodes = mutations.some(
        (mutation) => mutation.addedNodes && mutation.addedNodes.length > 0,
      );

      // Only update placeholders if nodes were added
      if (hasAddedNodes) {
        updatePlaceholders();
      }
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Run initialization
  initialize();
  setupObserver();
})();
