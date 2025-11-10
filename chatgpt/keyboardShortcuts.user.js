// ==UserScript==
// @name         ChatGPT - Toggle Temporary Chat + History Shortcuts
// @namespace    http://tampermonkey.net/
// @version      2025-08-31
// @description  Toggle temporary chat with Alt+T and open chats with Alt+1–9
// @author       Nusab Taha
// @match        https://chatgpt.com/*
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
    if (turnOn) turnOn.click();
    else if (turnOff) turnOff.click();
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const deleteCurrentChat = async () => {
    const conversationId = window.location.pathname.split("/").pop();
    if (
      !conversationId ||
      conversationId === "" ||
      window.location.pathname === "/"
    )
      return;

    const deviceId = getCookie("oai-did");

    try {
      const sessionResponse = await fetch(
        "https://chatgpt.com/api/auth/session",
      );
      const sessionData = await sessionResponse.json();
      const accessToken = sessionData.accessToken;

      await fetch(
        `https://chatgpt.com/backend-api/conversation/${conversationId}`,
        {
          method: "PATCH",
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.6",
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
            "oai-device-id": deviceId,
            "oai-language": "en-US",
            origin: "https://chatgpt.com",
            referer: "https://chatgpt.com/",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
          },
          body: JSON.stringify({ is_visible: false }),
          credentials: "include",
        },
      );

      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

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
      document.querySelector('a[href="/"]').click();
    }
  });

  const observer = new MutationObserver(() => {
    document.querySelectorAll("button").forEach((btn) => {
      if (btn.textContent.trim() === "Upgrade to Go") {
        const parent = btn.parentElement;
        if (parent) parent.style.display = "none";
        else btn.style.display = "none";
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("keydown", (e) => {
    if (!e.altKey) return;
    const num = parseInt(e.key, 10);
    if (num < 1 || num > 9) return;

    const links = document.querySelectorAll('#history a[href^="/c/"]');
    if (num <= links.length) {
      e.preventDefault();
      links[num - 1].click();
    }
  });

  const historyObserver = new MutationObserver(() => {
    if (!document.querySelector("#history")) return;
    const links = document.querySelectorAll('#history a[href^="/c/"]');
    if (links.length > 0) {
      historyObserver.disconnect();
    }
  });
  historyObserver.observe(document.body, { childList: true, subtree: true });
})();
