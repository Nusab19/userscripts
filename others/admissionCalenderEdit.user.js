// ==UserScript==
// @name         Admission Calender - Only Keep the Needed
// @namespace    http://tampermonkey.net/
// @version      2025-11-20
// @description  try to take over the world!
// @author       You
// @match        https://study.mnr.world/calendar
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mnr.world
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  function stripSeconds(root) {
    const items = root.querySelectorAll(
      ".font-bengali.whitespace-nowrap.text-xs.sm\\:text-sm",
    );
    items.forEach((el) => {
      const spans = [...el.querySelectorAll("span")];
      const secLabelIndex = spans.findIndex(
        (s) =>
          s.textContent.includes("সেকেন্ড") || s.textContent.includes("সে"),
      );
      if (secLabelIndex > 0) {
        const secNumberIndex = secLabelIndex - 1;
        for (let i = secNumberIndex; i < spans.length; i++) {
          spans[i].remove();
        }
      }
    });
  }

  const removeBoldTargets = (text) => {
    const targets = [
      "মেডিকেল",
      "AFMC",
      "MIST",
      "মেরিটাইম",
      "BUP",
      "বুয়েট",
      "AAUB",
      "বুটেক্স",
      "কৃষি",
    ];
    return targets.includes(text.trim());
  };

  function stripFontBold(root) {
    const items = root.querySelectorAll(`[class="font-bold"]`);
    items.forEach((el) => {
      if (removeBoldTargets(el.textContent))
        el.parentElement?.parentElement?.parentElement?.remove();
    });
  }

  function run(root) {
    stripSeconds(root);
    stripFontBold(root);
  }

  const observer = new MutationObserver(() => run(document));

  observer.observe(document.body, { childList: true, subtree: true });

  run(document);

  const bannerObserver = new MutationObserver(() => {
    document.querySelector(`[class="px-4"]`)?.remove();
    document.querySelector("[class=ntfC]")?.remove();
  });

  bannerObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
