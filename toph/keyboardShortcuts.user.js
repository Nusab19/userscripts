// ==UserScript==
// @name         Toph - Keyboard Shortcuts
// @namespace    http://tampermonkey.net/
// @version      2025-09-16
// @description  Some manual keyboard shortcuts for the ease of use!
// @author       Nusab
// @match        https://toph.co/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=toph.co
// @grant        none
// ==/UserScript==

const shortcuts = new Map();

function shortcut(keys, callback) {
  shortcuts.set(keys.toLowerCase(), callback);
}

function getKeyCombo(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}

function handleKeydown(e) {
  const combo = getKeyCombo(e);
  const callback = shortcuts.get(combo);
  if (callback) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    callback(e);
    return false;
  }
}

document.addEventListener("keydown", handleKeydown, true);
document.addEventListener(
  "keyup",
  function (e) {
    const combo = getKeyCombo(e);
    if (shortcuts.has(combo)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  },
  true,
);

(function () {
  "use strict";
  window.shortcut = shortcut;
  let _meh = 0;

  const isEditorOpen = () =>
    document
      .getElementsByClassName("codepanel")[0]
      ?.className.includes("-open");
  const closeEditor = () => document.querySelector(".btn-close")?.click();
  const toggleEditor = () => {
    const openBtn = document.querySelector(
      '[data-goatcounter-title="Opened IDE"]',
    );
    _meh += 1;
    if (_meh % 2 == 0 && isEditorOpen()) {
      closeEditor();
    }
    // else if (openBtn) {
    //   openBtn.click();
    // }
  };

  const testRunCode = () => {
    if (isEditorOpen()) {
      document.getElementsByClassName("btn-test-samples")[0]?.click();
    } else {
      console.log("Open the Editor first to test run the code");
    }
  };

  const submitCode = () => {
    if (isEditorOpen()) {
      document.getElementsByClassName("btn-submit")[0]?.click();
    } else {
      console.log("Open the Editor first to submit the code");
    }
  };

  const toggleLanguageSelector = () => {
    document.getElementsByClassName("form__field dropdown__toggle")[1]?.click();
  };

  shortcut("ctrl+e", toggleEditor);
  // shortcut("escape", closeEditor);
  // shortcut("ctrl+enter", testRunCode);
  // shortcut("ctrl+shift+enter", submitCode);
  shortcut("ctrl+l", toggleLanguageSelector);
})();
