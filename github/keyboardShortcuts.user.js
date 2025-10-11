// ==UserScript==
// @name         GitHub - Keyboard Shortcuts
// @namespace    http://tampermonkey.net/
// @version      2025-05-13
// @description  Adds custom keyboard shortcuts to GitHub
// @author       Nusab Taha
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function getRepoBaseUrl() {
    const match = window.location.href.match(
      /https:\/\/github\.com\/[^\/]+\/[^\/]+/,
    );
    return match ? match[0] : null;
  }

  function isTyping() {
    const activeElement = document.activeElement;
    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      activeElement.isContentEditable
    );
  }

  const shortcuts = [
    {
      key: "k",
      ctrl: true,
      action: () => {
        const input = document.querySelector("#your-repos-filter");
        if (input) {
          if (document.activeElement === input) {
            input.blur();
          } else {
            input.focus();
          }
        }
      },
    },
    {
      key: "Escape",
      action: () => {
        const input = document.querySelector("#your-repos-filter");
        if (input && document.activeElement === input) {
          input.blur();
        }
      },
    },
    {
      key: "n",
      skipWhenTyping: true,
      action: () => {
        const baseUrl = getRepoBaseUrl();
        if (baseUrl) {
          window.location.href = `${baseUrl}/new/main`;
        }
      },
    },
    {
      key: "u",
      skipWhenTyping: true,
      action: () => {
        const baseUrl = getRepoBaseUrl();
        if (baseUrl) {
          window.location.href = `${baseUrl}/upload/main`;
        }
      },
    },
  ];

  document.addEventListener("keydown", (e) => {
    shortcuts.forEach((shortcut) => {
      if (shortcut.skipWhenTyping && isTyping()) return;
      if (e.key === shortcut.key && (!shortcut.ctrl || e.ctrlKey)) {
        e.preventDefault();
        shortcut.action();
      }
    });
  });

  function updatePlaceholder() {
    const input = document.querySelector("#your-repos-filter");
    if (input && !input.hasAttribute("data-updated")) {
      input.setAttribute("placeholder", "Find repos (ctrl+k)");
      input.setAttribute("data-updated", "true");
    }
  }

  updatePlaceholder();

  new MutationObserver(() => updatePlaceholder()).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
