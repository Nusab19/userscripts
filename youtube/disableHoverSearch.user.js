// ==UserScript==
// @name         Youtube - Disable Hover Search Suggestions
// @namespace    http://tampermonkey.net/
// @version      1.19
// @description  Makes Enter key always search for text in search box, ignoring hovered suggestions
// @author       Nusab Taha
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  function blockAllSuggestionEvents() {
    const suggestionsContainer = document.querySelector(
      ".ytSearchboxComponentSuggestionsContainer",
    );
    if (!suggestionsContainer) return;

    const blockEvents = [
      "mouseover",
      "mouseenter",
      "mousemove",
      "mousedown",
      "click",
    ];

    blockEvents.forEach((eventType) => {
      suggestionsContainer.addEventListener(
        eventType,
        function (e) {
          e.stopImmediatePropagation();
          e.stopPropagation();
        },
        true,
      );
    });

    const suggestions = suggestionsContainer.querySelectorAll(
      ".ytSuggestionComponentSuggestion",
    );
    suggestions.forEach((suggestion) => {
      blockEvents.forEach((eventType) => {
        suggestion.addEventListener(
          eventType,
          function (e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
          },
          true,
        );
      });
    });
  }

  function fixSearchInput() {
    const searchInput = document.querySelector(
      'input.ytSearchboxComponentInput[name="search_query"]',
    );
    if (!searchInput) return;

    searchInput.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Enter") {
          e.stopImmediatePropagation();
          e.preventDefault();

          const searchValue = this.value.trim();
          if (searchValue) {
            const form = this.closest("form");
            if (form) {
              window.location.href =
                form.action +
                "?search_query=" +
                encodeURIComponent(searchValue);
            }
          }
        }
      },
      true,
    );

    const observer = new MutationObserver(() => {
      if (searchInput.hasAttribute("aria-activedescendant")) {
        searchInput.removeAttribute("aria-activedescendant");
      }
    });

    observer.observe(searchInput, {
      attributes: true,
      attributeFilter: ["aria-activedescendant"],
    });
  }

  function init() {
    fixSearchInput();
    blockAllSuggestionEvents();
  }

  const mainObserver = new MutationObserver(() => {
    init();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      init();
      mainObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  } else {
    init();
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
})();
