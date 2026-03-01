// ==UserScript==
// @name         ImgBB - Paste from Clipboard
// @namespace    http://tampermonkey.net/
// @version      2026-03-01
// @description  Paste image directly from your clipboard with High-Res redirect, Gallery & History
// @author       Nusab19
// @match        https://imgbb.com/*
// @match        https://*.imgbb.com/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imgbb.com
// @downloadURL  https://github.com/Nusab19/userscripts/raw/refs/heads/main/imgbb/pasteFromClipboard.user.js
// @updateURL    https://github.com/Nusab19/userscripts/raw/refs/heads/main/imgbb/pasteFromClipboard.user.js
// @supportURL   https://github.com/Nusab19/userscripts
// @homepage     https://github.com/Nusab19/userscripts
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "imgbb_upload_history";

  // --- History Helper Functions ---
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(url, filename) {
    let history = getHistory();
    const newId = Date.now().toString();
    history.push({
      id: newId,
      url: url,
      name: filename || "image",
      date: new Date().toLocaleString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function removeFromStorage(id) {
    let history = getHistory();
    const updated = history.filter((item) => item.id !== id.toString());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Update count if gallery is open
    const countSpan = document.getElementById("imgbb-history-count");
    if (countSpan) countSpan.innerText = updated.length;
  }

  // --- Notifications ---
  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            transition: opacity 0.3s ease;
        `;

    switch (type) {
      case "success":
        notification.style.backgroundColor = "#28a745";
        break;
      case "error":
        notification.style.backgroundColor = "#dc3545";
        break;
      case "loading":
        notification.style.backgroundColor = "#007bff";
        break;
      default:
        notification.style.backgroundColor = "#6c757d";
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    if (type !== "loading") {
      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }

    return notification;
  }

  // --- Auth Token ---
  function getAuthToken() {
    const tokenElement =
      document.querySelector('input[name="auth_token"]') ||
      document.querySelector('meta[name="auth_token"]') ||
      document.querySelector("[data-auth-token]");

    if (tokenElement) {
      return (
        tokenElement.value ||
        tokenElement.content ||
        tokenElement.getAttribute("data-auth-token")
      );
    }

    const scriptTags = document.querySelectorAll("script");
    for (let script of scriptTags) {
      const content = script.textContent || script.innerText;
      const match = content.match(/auth_token['"]?\s*[:=]\s*['"]([^'"]+)['"]/);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // --- Clipboard Copy ---
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      return false;
    }
  }

  // --- Upload ---
  async function uploadImage(file) {
    const authToken = getAuthToken();
    if (!authToken) {
      throw new Error("Could not find auth token");
    }

    const formData = new FormData();
    formData.append(
      "source",
      file,
      file.name || "clipboard-image." + (file.type.split("/")[1] || "png"),
    );
    formData.append("type", "file");
    formData.append("action", "upload");
    formData.append("timestamp", Date.now().toString());
    formData.append("auth_token", authToken);

    const response = await fetch("https://imgbb.com/json", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (result.status_code !== 200) {
      throw new Error(result.error?.message || "Upload failed");
    }

    return result;
  }

  // FIXED: Changed priority to prefer original direct URL (image.url)
  function getImageUrl(result) {
    return (
      result.image?.image?.url || // Original file direct link
      result.image?.url || // Fallback original link
      result.image?.display_url // Last resort
    );
  }

  // FIXED: Redirect to the high-res URL returned by getImageUrl
  function redirectToUploadedImage(result) {
    const bestUrl = getImageUrl(result);
    if (bestUrl) {
      window.location.href = bestUrl;
    }
  }

  // --- Gallery ---
  function toggleGallery() {
    const existingModal = document.getElementById("imgbb-gallery-modal");
    if (existingModal) {
      existingModal.remove();
    } else {
      renderGallery();
    }
  }

  function renderGallery() {
    const history = getHistory();
    const modal = document.createElement("div");
    modal.id = "imgbb-gallery-modal";
    modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10,10,10,0.9); color: white; z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            font-family: Arial, sans-serif;
        `;

    const container = document.createElement("div");
    container.style.cssText = `
            width: 90%; max-width: 800px; height: 85vh; background: #1e1e1e;
            border-radius: 10px; display: flex; flex-direction: column;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); border: 1px solid #333;
        `;

    const header = document.createElement("div");
    header.style.cssText =
      "padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;";
    header.innerHTML = `
            <h2 style="margin:0; font-size: 1.5em;">🖼️ Uploads (<span id="imgbb-history-count">${history.length}</span>)</h2>
            <div>
                <button id="imgbb-exportJson" style="padding: 6px 12px; cursor:pointer; background:#444; color:white; border:none; border-radius:4px; margin-right:10px; font-family:Arial,sans-serif;">Export JSON</button>
                <button id="imgbb-clearAll" style="padding: 6px 12px; cursor:pointer; background:#c0392b; color:white; border:none; border-radius:4px; margin-right:10px; font-family:Arial,sans-serif;">Clear All</button>
                <button id="imgbb-closeGallery" style="padding: 6px 12px; cursor:pointer; background:#e74c3c; color:white; border:none; border-radius:4px; font-family:Arial,sans-serif;">Close (/)</button>
            </div>
        `;

    const listArea = document.createElement("div");
    listArea.id = "imgbb-gallery-list";
    listArea.style.cssText = "flex-grow: 1; overflow-y: auto; padding: 20px;";

    if (history.length === 0) {
      listArea.innerHTML =
        '<p style="text-align:center; color:#777; margin-top: 50px;">No uploads yet. Paste an image (Ctrl+V) to start.</p>';
    } else {
      history
        .slice()
        .reverse()
        .forEach((item) => {
          listArea.appendChild(buildGalleryRow(item));
        });
    }

    container.appendChild(header);
    container.appendChild(listArea);
    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("imgbb-closeGallery").onclick = () =>
      modal.remove();

    document.getElementById("imgbb-exportJson").onclick = () => {
      const blob = new Blob([JSON.stringify(getHistory(), null, 4)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `imgbb_history_${Date.now()}.json`;
      a.click();
    };

    document.getElementById("imgbb-clearAll").onclick = () => {
      if (!confirm("Clear all upload history? This cannot be undone.")) return;
      localStorage.removeItem(STORAGE_KEY);
      const listEl = document.getElementById("imgbb-gallery-list");
      if (listEl) {
        listEl.innerHTML =
          '<p style="text-align:center; color:#777; margin-top: 50px;">No uploads yet. Paste an image (Ctrl+V) to start.</p>';
      }
      const countSpan = document.getElementById("imgbb-history-count");
      if (countSpan) countSpan.innerText = "0";
    };
  }

  function buildGalleryRow(item) {
    const row = document.createElement("div");
    row.className = "imgbb-gallery-item";
    row.dataset.id = item.id;
    row.style.cssText = `
            background: #252525; padding: 10px; margin-bottom: 10px; border-radius: 6px;
            display: flex; align-items: center; gap: 15px; border: 1px solid #333;
            transition: all 0.2s ease;
        `;

    row.innerHTML = `
            <img src="${item.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; background: #000; flex-shrink: 0;">
            <div style="flex-grow: 1; min-width: 0;">
                <input readonly value="${item.url}" style="width: 95%; background: transparent; border: none; color: #3498db; font-weight: bold; cursor: text; outline: none; font-family: Arial, sans-serif;">
                <div style="font-size: 0.75em; color: #777; margin-top: 4px;">${item.name} &mdash; ${item.date}</div>
            </div>
            <div style="display: flex; gap: 10px; flex-shrink: 0;">
                <button class="imgbb-copy-btn" style="background: #3498db; border: none; color: white; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-family: Arial, sans-serif;">Copy</button>
                <button class="imgbb-del-btn" style="background: #e74c3c; border: none; color: white; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-family: Arial, sans-serif;">✕</button>
            </div>
        `;

    // Copy Button Logic
    const copyBtn = row.querySelector(".imgbb-copy-btn");
    copyBtn.onclick = () => {
      copyToClipboard(item.url);
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "Copied!";
      copyBtn.style.background = "#28a745";
      setTimeout(() => {
        copyBtn.innerText = originalText;
        copyBtn.style.background = "#3498db";
      }, 1500);
    };

    // Delete Button Logic
    const delBtn = row.querySelector(".imgbb-del-btn");
    delBtn.onclick = () => {
      row.style.opacity = "0";
      row.style.transform = "translateX(20px)";
      setTimeout(() => {
        row.remove();
        removeFromStorage(item.id);
      }, 300);
    };

    return row;
  }

  // --- Paste Handler ---
  async function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        hasImage = true;
        e.preventDefault();
        e.stopPropagation();

        const file = item.getAsFile();
        if (!file) {
          showNotification("Failed to get image from clipboard", "error");
          return;
        }

        const loadingNotification = showNotification(
          "Uploading image...",
          "loading",
        );

        try {
          const result = await uploadImage(file);

          if (loadingNotification.parentNode) {
            loadingNotification.parentNode.removeChild(loadingNotification);
          }

          const imageUrl = getImageUrl(result);
          if (imageUrl) {
            // Save to history
            const filename =
              result.image?.original_filename || file.name || "clipboard-image";
            saveToHistory(imageUrl, filename);

            const copySuccess = await copyToClipboard(imageUrl);
            if (copySuccess) {
              showNotification("Image uploaded & URL copied!", "success");
            } else {
              showNotification(
                "Image uploaded! (Failed to copy URL)",
                "success",
              );
            }
          } else {
            showNotification("Image uploaded successfully!", "success");
          }

          setTimeout(() => {
            redirectToUploadedImage(result);
          }, 800);
        } catch (error) {
          console.error("Upload error:", error);

          if (loadingNotification.parentNode) {
            loadingNotification.parentNode.removeChild(loadingNotification);
          }

          showNotification(`Upload failed: ${error.message}`, "error");
        }

        break;
      }
    }

    if (!hasImage) {
      const clipboardText = e.clipboardData.getData("text");
      if (clipboardText.length === 0) {
        showNotification("No image found in clipboard", "error");
      }
    }
  }

  // --- Keyboard Shortcuts ---
  document.addEventListener("keydown", function (e) {
    const tag = e.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable)
      return;

    if (e.key === "/") {
      e.preventDefault();
      toggleGallery();
    }
    if (e.key === "Escape") {
      const modal = document.getElementById("imgbb-gallery-modal");
      if (modal) modal.remove();
    }
  });

  document.addEventListener("paste", handlePaste, true);

  // --- Floating Gallery Button ---
  const galleryBtn = document.createElement("button");
  galleryBtn.innerText = "🖼️ Gallery (/)";
  galleryBtn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        padding: 10px 15px; background: #222; color: #fff; border: 1px solid #444;
        border-radius: 5px; cursor: pointer; font-weight: bold;
        font-family: Arial, sans-serif;
    `;
  galleryBtn.onclick = toggleGallery;
  document.body.appendChild(galleryBtn);

  // --- Indicator Bar ---
  const style = document.createElement("style");
  style.textContent = `
        body::after {
            content: "📋 High-Res Paste Active. By @Nusab19";
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            z-index: 9999;
            pointer-events: none;
            opacity: 0.8;
        }
    `;
  document.head.appendChild(style);

  console.log(
    "ImgBB Clipboard Paste userscript v3.0 loaded - High Res + Gallery",
  );
})();
