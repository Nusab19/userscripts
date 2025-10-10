// ==UserScript==
// @name         Github - Toggle Between Tabs with Alt+` (Edit, Preview, Code, Blame)
// @namespace    http://tampermonkey.net/
// @version      2025-10-10
// @description  Toggles between GitHub tabs (Edit, Preview, Code, Blame) using Alt+`
// @author       Nusab Taha
// @match        https://github.com/*/edit/*
// @match        https://github.com/*/blob/*
// @match        https://github.com/*/blame/*
// @match        https://github.com/*/new/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  document.addEventListener("keydown", function (event) {
    // Check if Alt + ` (backtick) is pressed
    if (event.altKey && event.code === "Backquote") {
      event.preventDefault(); // Prevent default browser behavior
      document.querySelector(`[aria-current="false"]`).click();
    }
  });
})();
