// ==UserScript==
// @name         Wikipedia - Change Reading Color
// @namespace    http://tampermonkey.net/
// @version      2025-09-26
// @description  Rookie attempt to change Wikipedia color scheme for better reading experience. (Unstable)
// @author       Nusab Taha
// @match        https://*.wikipedia.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org
// @grant        none
// ==/UserScript==

// NOTE: Code is unfinished. More changes are needed to make it perfect.

(function () {
  "use strict";

  const styles = {
    "--background-color-base": "#f4e9b1",
    "--background-color-interactive-subtle": "#f0e08f",
    "--background-color-base-fixed": "#fff1a9",
    "--background-color-interactive": "#ffec8d",
    "--color-base": "#282828",
    "--color-base--hover": "#232f3c",
    "--color-emphasized": "#113c66",
    "--color-subtle": "#a2a9b1",
    "--color-progressive": "#003db6",
  };

  for (const [prop, value] of Object.entries(styles)) {
    document.documentElement.style.setProperty(prop, value);
  }

  // Logo color always black
  document.querySelector(".mw-logo-container").className = "mw-logo-container";
})();
