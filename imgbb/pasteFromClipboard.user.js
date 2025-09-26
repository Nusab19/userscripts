// ==UserScript==
// @name         ImgBB - Paste from Clipboard
// @namespace    http://tampermonkey.net/
// @version      2025-09-26
// @description  Paste image directly from your clipboard
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

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers or insecure contexts
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

  function getImageUrl(result) {
    return (
      result.image?.url || result.image?.display_url || result.image?.url_viewer
    );
  }

  function redirectToUploadedImage(result) {
    const imageUrl = getImageUrl(result);
    if (imageUrl) {
      if (result.image?.display_url) {
        window.location.href = result.image.display_url;
      } else if (result.image?.url_viewer) {
        window.location.href = result.image.url_viewer;
      } else {
        window.location.href = imageUrl;
      }
    }
  }

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

          // Copy the image URL to clipboard
          const imageUrl = getImageUrl(result);
          if (imageUrl) {
            const copySuccess = await copyToClipboard(imageUrl);
            if (copySuccess) {
              showNotification(
                "Image uploaded & URL copied to clipboard!",
                "success",
              );
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
          }, 1000);
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

  document.addEventListener("paste", handlePaste, true);

  const style = document.createElement("style");
  style.textContent = `
        body::after {
            content: "📋 Ctrl+V to paste images & copy URL. By @Nusab19";
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

  console.log("ImgBB Clipboard Paste userscript v2.0 loaded");
})();
