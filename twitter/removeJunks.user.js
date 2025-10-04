// ==UserScript==
// @name         Remove ADs -.-
// @namespace    http://tampermonkey.net/
// @version      2025-10-04
// @description  Remove Verified Orgs and Premium badges on X
// @author       Nusab19
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function removePremiumBadges() {
    const selectors = [
      `[aria-label="Verified Orgs"]`,
      `[aria-label="Premium"]`,
    ];

    // run every 500ms for each selector
    selectors.forEach((sel) => {
      const interval = setInterval(() => {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          elements.forEach((el) => el.remove());
          clearInterval(interval);
        }
      }, 500);
    });

    // remove Premium Subscribe Banner
    const interval = setInterval(() => {
      const span = Array.from(document.querySelectorAll("span")).find(
        (span) => span.textContent.trim() === "Subscribe to Premium",
      )?.parentElement.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement;

      if (span) {
        span.remove();
        clearInterval(interval);
      }
    }, 500);
  }

  function observeDOM() {
    const observer = new MutationObserver(() => {
      removePremiumBadges();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function hookNavigationEvents() {
    const pushState = history.pushState;
    const replaceState = history.replaceState;

    function handleNavigation() {
      removePremiumBadges();
    }

    history.pushState = function (...args) {
      pushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    history.replaceState = function (...args) {
      replaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("locationchange"));
    });

    window.addEventListener("locationchange", handleNavigation);
  }

  removePremiumBadges();
  observeDOM();
  hookNavigationEvents();
})();
