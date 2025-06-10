// ==UserScript==
// @name         Reading Color
// @namespace    http://tampermonkey.net/
// @version      2025-06-10
// @description  try to take over the world!
// @author       You
// @match        https://en.m.wikipedia.org/wiki/Berry_paradox
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const styles = {
        "--background-color-base": "#f4e9b1",
        "--background-color-interactive-subtle": "#f0e08f",
        "--background-color-base-fixed": "#fff1a9",
        "--background-color-interactive": "#ffec8d"
    };

    for (const [prop, value] of Object.entries(styles)) {
        document.documentElement.style.setProperty(prop, value);
    }
})();
