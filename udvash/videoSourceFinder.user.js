// ==UserScript==
// @name         Udvash - Video Source Finder, and other tweaks
// @namespace    http://tampermonkey.net/
// @version      2025-09-04
// @description  Enhanced video source finder with URL parameters and cookie-based navigation + YouTube opener
// @author       Nusab Taha
// @match        https://online.udvash-unmesh.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// ==/UserScript==

(function () {
  "use strict";

  const COLORS = {
    primary: "#024a71",
    primaryHover: "#34495e",
    secondary: "#59168b",
    secondaryHover: "#3c0366",
    success: "#27ae60",
    error: "#c0392b",
    white: "#ffffff",
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const createButton = (text, backgroundColor, hoverColor) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText = `
            background: ${backgroundColor};
            border: none;
            border-radius: 6px;
            color: ${COLORS.white};
            font-size: 14px;
            font-weight: 500;
            padding: 8px 16px;
            cursor: pointer;
            transition: background 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
    button.addEventListener(
      "mouseenter",
      () => (button.style.background = hoverColor),
    );
    button.addEventListener(
      "mouseleave",
      () => (button.style.background = backgroundColor),
    );
    return button;
  };

  const showButtonState = (
    button,
    text,
    color,
    originalText,
    originalColor,
    duration = 1000,
  ) => {
    button.style.background = color;
    button.textContent = text;
    setTimeout(() => {
      button.style.background = originalColor;
      button.textContent = originalText;
    }, duration);
  };

  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  function getCookie(name) {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));
      if (!cookie) return null;
      return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
    } catch {
      return null;
    }
  }

  function setCookie(name, value, days = 119) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; domain=.udvash-unmesh.com; path=/; expires=${expires.toUTCString()}`;
  }

  const saveVideoData = (videoUrl) => {
    const pathPart = videoUrl.split(".udvash-unmesh.com/")[1];
    if (!pathPart) return;
    const cleanPath = pathPart.split("?")[0];
    const pathParts = cleanPath.split("/");
    const filename = pathParts[pathParts.length - 1];
    if (filename.includes("__")) {
      const baseFilename = filename.split("__")[0];
      const extension = filename.split(".").pop();
      pathParts[pathParts.length - 1] = `${baseFilename}.${extension}`;
    }
    const baseUrl = pathParts.join("/");
    const hash = simpleHash(baseUrl);
    const cookieName = `udvash_video_${hash}`;
    const existingData = getCookie(cookieName) || {};
    const videoData = {
      ...existingData,
      url: baseUrl,
      prev: window.location.href,
      timestamp: Date.now(),
    };
    setCookie(cookieName, videoData);
  };

  const initializeButtons = () => {
    const dashboard = document.querySelector(".uu-main");
    if (!dashboard) return;

    const container = document.createElement("div");
    container.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            padding: 0;
            margin: 55px 0 5px 0;
        `;

    const sourceButton = createButton(
      "Find Source",
      COLORS.primary,
      COLORS.primaryHover,
    );
    sourceButton.addEventListener("click", async () => {
      const videoElement = document.getElementById("video_html5_api");
      if (videoElement?.src) {
        showButtonState(
          sourceButton,
          "Copied!",
          COLORS.success,
          "Find Source",
          COLORS.primary,
        );
        saveVideoData(videoElement.src);
        await copyToClipboard(videoElement.src);
        window.open(videoElement.src, "_blank");
      } else {
        showButtonState(
          sourceButton,
          "No Source Found",
          COLORS.error,
          "Find Source",
          COLORS.primary,
          2000,
        );
      }
    });

    const cookieButton = createButton(
      "Copy Cookie",
      COLORS.secondary,
      COLORS.secondaryHover,
    );
    cookieButton.addEventListener("click", async () => {
      try {
        const cookieValue = document.cookie
          .split("; ")
          .find((row) => row.startsWith(".SP_AUTH="))
          ?.split("=")[1];
        if (cookieValue) {
          showButtonState(
            cookieButton,
            "Copied!",
            COLORS.success,
            "Copy Cookie",
            COLORS.secondary,
          );
          await copyToClipboard(cookieValue);
        } else {
          showButtonState(
            cookieButton,
            "Cookie Not Found",
            COLORS.error,
            "Copy Cookie",
            COLORS.secondary,
            2000,
          );
        }
      } catch {
        showButtonState(
          cookieButton,
          "Error",
          COLORS.error,
          "Copy Cookie",
          COLORS.secondary,
          2000,
        );
      }
    });

    const ytButton = createButton("Open YouTube", "#cc0000", "#990000");
    ytButton.addEventListener("click", () => {
      const iframe = document.querySelector("#yt-player");
      if (iframe?.src) {
        const u = new URL(iframe.src);
        const videoId = u.pathname.split("/").pop().split("?")[0];
        const yt = `https://www.youtube.com/watch?v=${videoId}`;
        window.open(yt, "_blank");
      } else {
        showButtonState(
          ytButton,
          "No YouTube Found",
          COLORS.error,
          "Open YouTube",
          "#cc0000",
          2000,
        );
      }
    });

    container.append(sourceButton, cookieButton, ytButton);
    dashboard.parentNode.insertBefore(container, dashboard);
  };

  const cleanupElements = () => {
    document
      .querySelector(
        ".d-between-middle.btn-menu.btn-app-info.position-relative",
      )
      ?.remove();
    document
      .querySelector('a[href="/DiscussionGroup/Index"]')
      ?.parentElement?.remove();
  };

  cleanupElements();
  const whitelists = ["Community", "Performance", "Exam"];
  if (!whitelists.some((term) => window.location.href.includes(term)))
    setTimeout(initializeButtons, 0);
})();
