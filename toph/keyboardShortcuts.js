// ==UserScript==
// @name         Toph - Keyboard Shortcuts
// @namespace    http://tampermonkey.net/
// @version      2025-08-30
// @description  Some manual keyboard shortcuts for the ease of use!
// @author       @Nusab19
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
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
}

document.addEventListener('keydown', e => {
    const combo = getKeyCombo(e);
    const callback = shortcuts.get(combo);
    if (callback) {
        e.preventDefault();
        callback(e);
    }
}, true);

(function() {
    'use strict';
    window.shortcut = shortcut;

    const isEditorOpen = () => document.getElementsByClassName("codepanel")[0]?.className.includes("-open")
    const closeEditor = () => document.querySelector(".btn-close")?.click();
    const toggleEditor = () => {
        const openBtn = document.querySelector('[data-goatcounter-title="Opened IDE"]');
        if (isEditorOpen()) {
            closeEditor()
        } else if (openBtn) {
            openBtn.click()
        }
    };

    const testRunCode = () => {
        if (isEditorOpen()) {
            document.getElementsByClassName("btn-test-samples")[0]?.click()
        } else {
            console.log("Open the Editor first to test run the code")
        }
    };

    const submitCode = () => {
        if (isEditorOpen()) {
            document.getElementsByClassName("btn-submit")[0]?.click()
        } else {
            console.log("Open the Editor first to submit the code")
        }
    };

    const toggleLanguageSelector = () => {
        document.getElementsByClassName("form__field dropdown__toggle")[1]?.click()
        // TODO: Add functionality to go through the languages using the up/down arrow keys
    }

    shortcut("ctrl+e", toggleEditor);
    shortcut("escape", closeEditor);
    shortcut("ctrl+enter", testRunCode);
    shortcut("ctrl+shift+enter", submitCode);
    shortcut("ctrl+l", toggleLanguageSelector);

})();
