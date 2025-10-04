// ==UserScript==
// @name         Chatgpt - Toggle Temporary Chat
// @namespace    http://tampermonkey.net/
// @version      2025-09-26
// @description  Turn on and off the temporary chat with alt+t
// @author       Nusab Taha
// @match        https://chatgpt.com/
// @icon         https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://chatgpt.com&size=128
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const toggle = () => {
    const turnOn = document.querySelector(
      '[aria-label="Turn on temporary chat"]',
    );
    const turnOff = document.querySelector(
      '[aria-label="Turn off temporary chat"]',
    );
    if (turnOn) {
      turnOn.click();
    } else if (turnOff) {
      turnOff.click();
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "t") {
      event.preventDefault();
      toggle();
    }
  });
})();
