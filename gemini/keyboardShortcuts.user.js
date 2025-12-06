// ==UserScript==
// @name         Gemini - Toggle Temporary Chat, Shortcuts, Junk Free
// @namespace    http://tampermonkey.net/
// @version      2025-08-31
// @description  Toggle temporary chat with Alt+T and open chats with Alt+1–9
// @author       Nusab Taha
// @match        https://gemini.google.com/app*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const toggle = () => {
    const turnOn = document.querySelector('[class="temp-chat-icon"]');
    const turnOff = document.querySelector('[class="temp-chat-icon"]');
    if (turnOn) turnOn.click();
    else if (turnOff) turnOff.click();
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
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
    const batchData = [[[rpcId, innerPayload, null, "generic"]]];

    const postBody = new URLSearchParams({
      "f.req": JSON.stringify(batchData),
      at: atToken,
    });

    console.log(`🗑️ Deleting chat ${conversationId}...`);

    try {
      const response = await fetch(
        `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=${rpcId}&source-path=${encodeURIComponent(window.location.pathname)}&hl=en`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "X-Same-Domain": "1",
          },
          body: postBody,
        },
      );

      const text = await response.text();

      // 4. Check for success signature
      if (text.includes("wrb.fr") || response.status === 200) {
        console.log(`✅ Request Sent. Server response length: ${text.length}`);
        console.log(
          "If successful, you should be redirected or the chat is gone.",
        );
        // Force reload to verify
        // window.location.href = "https://gemini.google.com/app";
        document.querySelector(`[aria-label="New chat"]`).click();
      } else {
        console.error("❌ Server Error:", text);
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "t") {
      e.preventDefault();
      toggle();
    }
    if (e.altKey && e.key.toLowerCase() === "x") {
      e.preventDefault();
      deleteCurrentChat();
      document.querySelector('a[href="/"]').click();
    }
    if (e.altKey && e.key.toLowerCase() === "n") {
      e.preventDefault();
      document.querySelector(`[aria-label="New chat"]`).click();
    }
  });

  // Remove bullshits
  Array.from(document.getElementsByTagName("announcement-banner")).forEach(
    (el) => {
      el.remove();
    },
  );
  document.querySelector(`.adv-upsell`)?.remove();

  const targetNode = document.body;
  const config = { childList: true, subtree: true };

  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        // Apply the removal logic on every change
        Array.from(
          document.getElementsByTagName("announcement-banner"),
        ).forEach((el) => {
          el.remove();
        });
        document.querySelector(`.adv-upsell`)?.remove();
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const num = parseInt(e.key, 10);
    if (num < 1 || num > 9) return;
    document.querySelectorAll(`[data-test-id="conversation"]`)[num - 1].click();
  });

  // Function to apply styles
  function applyStyles() {
    // Keep all parent containers at full width (no scrolling)
    document
      .querySelectorAll(
        [
          ".chat-history-scroll-container",
          ".chat-history",
          ".conversation-container",
          ".response-container",
          ".response-container-content",
          ".message-content",
          ".markdown",
        ].join(","),
      )
      .forEach((el) => {
        el.style.maxWidth = "none";
        el.style.width = "100%";
      });

    // Check if device is small (less than 768px)
    const isSmallDevice = window.innerWidth < 768;

    // FORCE user query to the right
    document.querySelectorAll("user-query").forEach((el) => {
      el.style.display = "block";
      el.style.width = "100%";
      el.style.marginLeft = "auto";
      el.style.marginRight = "0";
    });

    // FORCE right-align-content to actually align right
    document.querySelectorAll(".right-align-content").forEach((el) => {
      el.style.width = "100%";
      el.style.marginLeft = "auto";
      el.style.marginRight = "0";
      el.style.textAlign = "right";
    });

    // Force user-query-content to fixed width and float right
    document.querySelectorAll("user-query-content").forEach((el) => {
      if (isSmallDevice) {
        el.style.maxWidth = "100%";
        el.style.width = "100%";
        el.style.marginLeft = "0";
      } else {
        el.style.maxWidth = "600px";
        el.style.width = "600px";
        el.style.marginLeft = "auto";
        el.style.marginRight = "0";
        el.style.float = "right";
        el.style.clear = "both";
      }
    });

    // Make user chat bubbles fixed width
    document.querySelectorAll(".user-query-bubble-container").forEach((el) => {
      if (isSmallDevice) {
        el.style.maxWidth = "100%";
        el.style.width = "100%";
      } else {
        el.style.maxWidth = "600px";
        el.style.width = "600px";
      }
    });

    // Ensure the bubble background takes full available width
    document
      .querySelectorAll(".user-query-bubble-with-background")
      .forEach((el) => {
        el.style.maxWidth = "100%";
        el.style.width = "100%";
      });
  }

  // Apply styles initially
  applyStyles();

  // Debounce function to limit execution rate
  let debounceTimer;
  let isApplying = false;

  function debouncedApplyStyles() {
    if (isApplying) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      isApplying = true;
      applyStyles();
      isApplying = false;
    }, 200);
  }

  // Create a MutationObserver to watch for DOM changes
  const widthObserver = new MutationObserver((mutations) => {
    // Only react to childList changes (new messages), not attribute changes
    const hasNewNodes = mutations.some(
      (mutation) =>
        mutation.type === "childList" && mutation.addedNodes.length > 0,
    );

    if (hasNewNodes) {
      debouncedApplyStyles();
    }
  });

  // Start observing the chat history container
  const chatHistory =
    document.querySelector(".chat-history-scroll-container") || document.body;
  widthObserver.observe(chatHistory, {
    childList: true,
    subtree: true,
  });

  // Also reapply on window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(applyStyles, 300);
  });

  console.log("Chat styles applied - user chats RIGHT ALIGNED at 600px width!");
})();
