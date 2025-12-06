// ==UserScript==
// @name         Gemini - Toggle Temporary Chat
// @namespace    http://tampermonkey.net/
// @version      2025-08-31
// @description  Toggle temporary chat with Alt+T and open chats with Alt+1–9
// @author       Nusab Taha
// @match        https://gemini.google.com/app*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const toggle = () => {
        const turnOn = document.querySelector('[class="temp-chat-icon"]');
        const turnOff = document.querySelector('[class="temp-chat-icon"]');
        if (turnOn) turnOn.click();
        else if (turnOff) turnOff.click();
    };

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    async function deleteCurrentChat() {
        // 1. Get Conversation ID
        const conversationId = window.location.pathname.split("/").pop();
        if (!conversationId || !conversationId.match(/^[a-z0-9]+$/i)) {
            return console.error("❌ Error: Invalid Conversation ID.");
        }

        // 2. Get Security Token
        const atToken = window.WIZ_global_data?.SNlM0e;
        if (!atToken) {
            return console.error("❌ Error: Security token (SNlM0e) not found.");
        }

        // 3. Construct Payload (TRIPLE NESTED)
        // Structure: [ [ [ "RPC_ID", "INNER_JSON", null, "generic" ] ] ]
        const rpcId = "GzXR5e";
        const innerPayload = JSON.stringify([`c_${conversationId}`]);

        // FIX: Added the extra wrapping array here to make it triple-nested
        const batchData = [[[
            rpcId,
            innerPayload,
            null,
            "generic"
        ]]];

        const postBody = new URLSearchParams({
            "f.req": JSON.stringify(batchData),
            "at": atToken
        });

        console.log(`🗑️ Deleting chat ${conversationId}...`);

        try {
            const response = await fetch(`https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${rpcId}&source-path=${encodeURIComponent(window.location.pathname)}&hl=en`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    "X-Same-Domain": "1"
                },
                body: postBody
            });

            const text = await response.text();

            // 4. Check for success signature
            if (text.includes("wrb.fr") || response.status === 200) {
                console.log(`✅ Request Sent. Server response length: ${text.length}`);
                console.log("If successful, you should be redirected or the chat is gone.");
                // Force reload to verify
                // window.location.href = "https://gemini.google.com/app";
                document.querySelector(`[aria-label="New chat"]`).click()
            } else {
                console.error("❌ Server Error:", text);
            }
        } catch (err) {
            console.error("❌ Fetch Error:", err);
        }
    }

    document.addEventListener('keydown', e => {
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            toggle();
        }
        if (e.altKey && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            deleteCurrentChat();
            document.querySelector('a[href="/"]').click();
        }
        if (e.altKey && e.key.toLowerCase() === 'n') {
            e.preventDefault();
            document.querySelector(`[aria-label="New chat"]`).click()
        }
    });

    // Remove bullshits
    Array.from(document.getElementsByTagName("announcement-banner")).forEach(el => {
        el.remove();
    });
    document.querySelector(`.adv-upsell`)?.remove()

    const targetNode = document.body;
    const config = { childList: true, subtree: true };

    const callback = function(mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // Apply the removal logic on every change
                Array.from(document.getElementsByTagName("announcement-banner")).forEach(el => {
                    el.remove();
                });
                document.querySelector(`.adv-upsell`)?.remove();
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);


    document.addEventListener('keydown', e => {
        if (!e.altKey) return;
        const num = parseInt(e.key, 10);
        if (num < 1 || num > 9) return;
        document.querySelectorAll(`[data-test-id="conversation"]`)[num-1].click()
    });

})();
