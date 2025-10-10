// ==UserScript==
// @name         Udvash - Auto Load More
// @namespace    http://tampermonkey.net/
// @version      2025-10-10
// @description  Automatically clicks the "Load More" button repeatedly until it disappears, then removes elements
// @author       You
// @include      /^https:\/\/online\.udvash-unmesh\.com\/Routine\/(PracticeExam|PastClasses)$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let count = 0;

  const finish = () => {
    document.querySelectorAll(".uuu-wrap-title").forEach((e) => {
      if (e.textContent.includes("Kha")) {
        e.parentElement.parentElement.parentElement.remove();
      }
    });
  };

  const interval = setInterval(() => {
    const button = document.getElementById("loadMore");
    if (button && button.offsetParent !== null) {
      button.click();
      count++;
      if (count >= 100) {
        clearInterval(interval);
        finish();
      }
    } else {
      clearInterval(interval);
      finish();
    }
  }, 100);
})();
