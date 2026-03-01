// ==UserScript==
// @name         Image Host with Ctrl+V & History
// @namespace    http://tampermonkey.net/
// @version      2026-02-28
// @description  Upload, Auto-Copy Link, History Gallery (Toggle with /), Delete items
// @author       You
// @match        https://freeimage.host/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=freeimage.host
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "upload_history";
  let isUploading = false;

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
    const newId = Date.now().toString(); // String ID for consistency
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
    const countSpan = document.getElementById("history-count");
    if (countSpan) countSpan.innerText = updated.length;
  }

  // --- UI: Toast & Overlay ---
  function showStatus(msg, isError = false) {
    let toast = document.getElementById("upload-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "upload-toast";
      toast.style =
        "position:fixed; bottom:80px; right:20px; z-index:10001; padding:12px 20px; border-radius:5px; color:white; font-family:sans-serif; font-weight:bold; transition:opacity 0.3s; pointer-events:none; box-shadow: 0 4px 6px rgba(0,0,0,0.2);";
      document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.background = isError ? "#e74c3c" : "#2ecc71"; // Green for success
    toast.style.opacity = "1";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 3000);
  }

  function toggleOverlay(show) {
    let overlay = document.getElementById("upload-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "upload-overlay";
      overlay.style =
        "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10005; display:flex; align-items:center; justify-content:center; pointer-events:none; transition:opacity 0.2s; opacity:0;";
      overlay.innerHTML =
        '<div style="background:white; padding:30px; border-radius:12px; font-weight:bold; font-size:1.2em; color:#333; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">🚀 Uploading...</div>';
      document.body.appendChild(overlay);
    }
    overlay.style.opacity = show ? "1" : "0";
    document.body.style.cursor = show ? "wait" : "default";
  }

  // --- Gallery Logic ---
  function toggleGallery() {
    const existingModal = document.getElementById("gallery-modal");
    if (existingModal) {
      existingModal.remove();
    } else {
      renderGallery();
    }
  }

  function renderGallery() {
    const history = getHistory();
    const modal = document.createElement("div");
    modal.id = "gallery-modal";
    modal.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(10,10,10,0.9); color: white; z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            font-family: sans-serif;
        `;

    const container = document.createElement("div");
    container.style = `
            width: 90%; max-width: 800px; height: 85vh; background: #1e1e1e;
            border-radius: 10px; display: flex; flex-direction: column;
            box-shadow: 0 0 30px rgba(0,0,0,0.8); border: 1px solid #333;
        `;

    const header = document.createElement("div");
    header.style =
      "padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;";
    header.innerHTML = `
            <h2 style="margin:0; font-size: 1.5em;">🖼️ Uploads (<span id="history-count">${history.length}</span>)</h2>
            <div>
                <button id="exportJson" style="padding: 6px 12px; cursor:pointer; background:#444; color:white; border:none; border-radius:4px; margin-right:10px;">Export JSON</button>
                <button id="closeGallery" style="padding: 6px 12px; cursor:pointer; background:#e74c3c; color:white; border:none; border-radius:4px;">Close (/)</button>
            </div>
        `;

    const listArea = document.createElement("div");
    listArea.style = "flex-grow: 1; overflow-y: auto; padding: 20px;";

    if (history.length === 0) {
      listArea.innerHTML =
        '<p style="text-align:center; color:#777; margin-top: 50px;">No uploads yet. Paste an image (Ctrl+V) to start.</p>';
    } else {
      history
        .slice()
        .reverse()
        .forEach((item) => {
          const row = document.createElement("div");
          row.className = "gallery-item";
          row.dataset.id = item.id;
          row.style = `
                    background: #252525; padding: 10px; margin-bottom: 10px; border-radius: 6px;
                    display: flex; align-items: center; gap: 15px; border: 1px solid #333;
                    transition: all 0.2s ease;
                `;

          row.innerHTML = `
                    <img src="${item.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; background: #000; flex-shrink: 0;">
                    <div style="flex-grow: 1; min-width: 0;">
                        <input readonly value="${item.url}" style="width: 95%; background: transparent; border: none; color: #3498db; font-weight: bold; cursor: text; outline: none;">
                        <div style="font-size: 0.75em; color: #777; margin-top: 4px;">${item.date}</div>
                    </div>
                    <div style="display: flex; gap: 10px; flex-shrink: 0;">
                        <button class="copy-btn" style="background: #3498db; border: none; color: white; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">Copy</button>
                        <button class="del-btn" style="background: #e74c3c; border: none; color: white; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">✕</button>
                    </div>
                `;

          // Copy Button Logic (Gallery)
          const copyBtn = row.querySelector(".copy-btn");
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(item.url);
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            copyBtn.style.background = "#2ecc71";
            setTimeout(() => {
              copyBtn.innerText = originalText;
              copyBtn.style.background = "#3498db";
            }, 1500);
          };

          // Delete Button Logic
          const delBtn = row.querySelector(".del-btn");
          delBtn.onclick = () => {
            row.style.opacity = "0";
            row.style.transform = "translateX(20px)";
            setTimeout(() => {
              row.remove();
              removeFromStorage(item.id);
            }, 300);
          };

          listArea.appendChild(row);
        });
    }

    container.appendChild(header);
    container.appendChild(listArea);
    modal.appendChild(container);
    document.body.appendChild(modal);

    document.getElementById("closeGallery").onclick = () => modal.remove();
    document.getElementById("exportJson").onclick = () => {
      const blob = new Blob([JSON.stringify(getHistory(), null, 4)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `upload_history_${Date.now()}.json`;
      a.click();
    };
  }

  // --- Event Listeners ---
  document.addEventListener("keydown", function (e) {
    const tag = e.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target.isContentEditable)
      return;

    if (e.key === "/") {
      e.preventDefault();
      toggleGallery();
    }
    if (e.key === "Escape") {
      const modal = document.getElementById("gallery-modal");
      if (modal) modal.remove();
    }
  });

  document.addEventListener(
    "paste",
    function (e) {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          e.preventDefault();
          e.stopImmediatePropagation();

          if (isUploading) {
            showStatus("⚠️ Already uploading...", true);
            return;
          }
          uploadImage(item.getAsFile());
          break;
        }
      }
    },
    true,
  );

  // --- Main Upload Function ---
  function uploadImage(file) {
    const authToken = window.PF?.obj?.config?.auth_token;
    if (!authToken) return alert("Auth token missing. Refresh page.");

    isUploading = true;
    toggleOverlay(true);

    const formData = new FormData();
    formData.append("source", file);
    formData.append("type", "file");
    formData.append("action", "upload");
    formData.append("auth_token", authToken);

    fetch("https://freeimage.host/json", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status_code === 200 && data.image?.image?.url) {
          const directUrl = data.image.image.url;

          // 1. Save to History
          saveToHistory(directUrl, data.image.original_filename);

          // 2. Copy to Clipboard
          navigator.clipboard
            .writeText(directUrl)
            .then(() => {
              showStatus("Link Copied! Redirecting...");
            })
            .catch((err) => {
              console.error("Clipboard copy failed:", err);
              showStatus("Upload Success! Redirecting...");
            })
            .finally(() => {
              // 3. Redirect (Short delay to allow user to see the "Copied" toast)
              setTimeout(() => {
                window.location.href = directUrl;
              }, 800);
            });
        } else {
          throw new Error(data.error?.message || "Upload failed");
        }
      })
      .catch((err) => {
        alert(err.message);
        isUploading = false;
        toggleOverlay(false);
        showStatus("Upload failed", true);
      });
  }

  // Floating Button
  const btn = document.createElement("button");
  btn.innerText = "🖼️ Gallery";
  btn.style = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        padding: 10px 15px; background: #222; color: #fff; border: 1px solid #444;
        border-radius: 5px; cursor: pointer; font-weight: bold;
    `;
  btn.onclick = toggleGallery;
  document.body.appendChild(btn);
})();
