// ==UserScript==
// @name         Udvash - Video Controller
// @namespace    http://tampermonkey.net/
// @version      2025-09-04
// @description  Enhanced video controller with hashed URL-specific storage using cookies
// @author       Nusab Taha
// @include      /^https:\/\/storage-[^.]+\.udvash-unmesh\.com\/.*/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const CONFIG = {
    SEEK_SMALL: 10,
    SEEK_LARGE: 30,
    SPEED_SMALL: 0.1,
    SPEED_LARGE: 0.5,
    VOLUME_STEP: 0.05,
    SAVE_INTERVAL: 5000,
    MIN_SAVE_TIME: 5,
    END_BUFFER_TIME: 10,
  };

  // Simple hash function for URL
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  function getBaseUrl(url) {
    try {
      // Consistent URL processing - same as source finder
      return url.split("?")[0].split(".__")[0].split(".udvash-unmesh.com/")[1];
    } catch (e) {
      return url.split("?")[0];
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) {
      return "0:00";
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  }

  function showIndicator(text) {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      return; // Don't show in fullscreen
    }

    const el = document.createElement("div");
    el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;background:rgba(0,0,0,0.8);color:rgba(255,255,255,0.9);padding:10px 20px;border-radius:50px;font:bold 16px 'Segoe UI',system-ui,sans-serif;opacity:0;transition:opacity 0.2s;pointer-events:none`;
    el.textContent = text;
    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0.9";
    }, 10);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 200);
    }, 1000);
  }

  // Cookie functions for cross-subdomain storage
  function getCookie(name) {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`));

      if (!cookie) {
        return null;
      }

      const cookieValue = cookie.split("=")[1];
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (e) {
      console.error(`Failed to parse cookie ${name}:`, e);
      return null;
    }
  }

  function setCookie(name, value, days = 119) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(
        JSON.stringify(value),
      )}; domain=.udvash-unmesh.com; path=/; expires=${expires.toUTCString()}`;
    } catch (e) {
      console.error(`Failed to set cookie ${name}:`, e);
    }
  }

  function controller() {
    const video = document.querySelector("video");
    if (!video) {
      return console.log("No video found");
    }

    const baseUrl = getBaseUrl(video.src || video.currentSrc || location.href);
    console.log("Base URL:", baseUrl);

    // Calculate hash for current video URL
    const currentVideoHash = simpleHash(baseUrl);
    console.log("Current video hash:", currentVideoHash);

    let timeInterval = null;
    let isPiP = false;

    // Storage functions using cookies
    const store = {
      video: (k, v) => {
        try {
          const cookieName = `udvash_video_${currentVideoHash}`;
          const existingData = getCookie(cookieName) || {};
          existingData[k] = v;
          setCookie(cookieName, existingData);
        } catch (e) {
          console.error("Failed to save video data:", k, e);
        }
      },
      loadVideo: (k, def = null) => {
        try {
          const cookieName = `udvash_video_${currentVideoHash}`;
          const data = getCookie(cookieName) || {};
          return data[k] !== undefined ? data[k] : def;
        } catch (e) {
          console.error("Failed to load video data:", k, e);
          return def;
        }
      },
      global: (k, v) => {
        try {
          const existingData = getCookie("udvash_video_global") || {};
          existingData[k] = v;
          setCookie("udvash_video_global", existingData);
        } catch (e) {
          console.error("Failed to save global setting:", k, e);
        }
      },
      loadGlobal: (k, def = null) => {
        try {
          const data = getCookie("udvash_video_global") || {};
          return data[k] !== undefined ? data[k] : def;
        } catch (e) {
          console.error("Failed to load global setting:", k, e);
          return def;
        }
      },
    };

    // Status display
    const status = document.createElement("div");
    status.style.cssText = `position:fixed;top:2px;left:2px;z-index:10000;pointer-events:none;background:rgba(0,0,0,0.6);color:rgba(255,255,255,0.8);padding:5px 8px;border-radius:3px;font:12px 'Segoe UI',system-ui,sans-serif;transition:opacity 0.3s;line-height:1.2;white-space:pre-line`;
    document.body.appendChild(status);

    // Navigation buttons
    const navContainer = document.createElement("div");
    navContainer.style.cssText = `position:fixed;top:2px;right:2px;z-index:10000;display:flex;gap:5px`;

    const cookieData = getCookie(`udvash_video_${currentVideoHash}`);
    const prevUrl = cookieData?.prev;

    console.log("Cookie data - prev:", prevUrl);

    const createButton = (text, url, paramName) => {
      const btn = document.createElement("button");
      btn.textContent = text;

      const baseColor = url ? "rgba(255,255,255,0.7)" : "rgba(255,100,100,0.7)";
      const hoverColor = url
        ? "rgba(255,255,255,0.8)"
        : "rgba(255,150,150,0.8)";

      btn.style.cssText = `background:rgba(0,0,0,0.6);color:${baseColor};border:none;padding:4px 8px;border-radius:3px;font:11px 'Segoe UI',system-ui,sans-serif;cursor:pointer;opacity:0.5;transition:all 0.2s`;

      if (!url) {
        btn.title = `No ${paramName} URL found in cookie data`;
      }

      btn.onmouseenter = () => {
        btn.style.opacity = "0.8";
        btn.style.color = hoverColor;
      };
      btn.onmouseleave = () => {
        btn.style.opacity = "0.5";
        btn.style.color = baseColor;
      };
      btn.onclick = () => {
        if (url) {
          window.open(url, "_blank");
        } else {
          console.warn(
            `No ${paramName} URL found in cookie udvash_video_${currentVideoHash}`,
          );
          showIndicator(`No ${paramName} URL`);
        }
      };
      return btn;
    };

    navContainer.appendChild(createButton("Prev", prevUrl, "prev"));
    document.body.appendChild(navContainer);

    // Core functions
    const save = {
      settings: () => {
        store.global("speed", video.playbackRate);
        store.global("volume", video.volume);
      },
      time: () => {
        if (
          video.currentTime > CONFIG.MIN_SAVE_TIME &&
          video.duration &&
          video.currentTime < video.duration - CONFIG.END_BUFFER_TIME
        ) {
          store.video("currentTime", video.currentTime);
          store.video("title", document.title);
          store.video("url", baseUrl);
          store.video("duration", video.duration);
          store.video("lastAccessed", Date.now());
        }
      },
    };

    const update = () => {
      const speed = video.playbackRate.toFixed(1);
      const vol = Math.round(video.volume * 100);
      const mute = video.muted ? " (Muted)" : "";
      const pip = isPiP ? " [PiP]" : "";
      status.textContent = `Speed: ${speed}x\nVolume: ${vol}%${mute}${pip}`;
    };

    const seek = (s) => {
      video.currentTime = Math.max(
        0,
        Math.min(
          video.duration || video.currentTime + s,
          video.currentTime + s,
        ),
      );
    };

    const adjust = {
      speed: (d) => {
        video.playbackRate = Math.max(
          0.1,
          Math.min(7.0, Math.round((video.playbackRate + d) * 10) / 10),
        );
        update();
        save.settings();
      },
      volume: (d) => {
        video.volume = Math.max(0, Math.min(1, video.volume + d));
        update();
        save.settings();
      },
    };

    const toggle = {
      play: () => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      },
      mute: () => {
        video.muted = !video.muted;
        update();
      },
      fullscreen: () => {
        const fs =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement;
        if (fs) {
          (
            document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen
          ).call(document);
        } else {
          (
            video.requestFullscreen ||
            video.webkitRequestFullscreen ||
            video.mozRequestFullScreen ||
            video.msRequestFullscreen
          ).call(video);
        }
      },
      pip: () => {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture();
        } else if (video.requestPictureInPicture) {
          video.requestPictureInPicture();
        }
      },
    };

    // Key mappings
    const keys = {
      "[": () => adjust.speed(-CONFIG.SPEED_SMALL),
      "]": () => adjust.speed(CONFIG.SPEED_SMALL),
      "+": () => adjust.speed(CONFIG.SPEED_LARGE),
      "=": () => adjust.speed(CONFIG.SPEED_LARGE),
      "-": () => adjust.speed(-CONFIG.SPEED_LARGE),
      ArrowUp: () => adjust.volume(CONFIG.VOLUME_STEP),
      ArrowDown: () => adjust.volume(-CONFIG.VOLUME_STEP),
      ArrowLeft: (e) => {
        const s = e.ctrlKey ? CONFIG.SEEK_LARGE : CONFIG.SEEK_SMALL;
        seek(-s);
        showIndicator(`← ${s}s`);
      },
      ArrowRight: (e) => {
        const s = e.ctrlKey ? CONFIG.SEEK_LARGE : CONFIG.SEEK_SMALL;
        seek(s);
        showIndicator(`→ ${s}s`);
      },
      " ": toggle.play,
      f: toggle.fullscreen,
      F: toggle.fullscreen,
      m: toggle.mute,
      M: toggle.mute,
      p: toggle.pip,
      P: toggle.pip,
      Escape: () => {
        if (document.fullscreenElement) {
          toggle.fullscreen();
        }
      },
      0: () => {
        video.currentTime = 0;
      },
      1: () => {
        video.currentTime = video.duration * 0.1;
      },
      2: () => {
        video.currentTime = video.duration * 0.2;
      },
      3: () => {
        video.currentTime = video.duration * 0.3;
      },
      4: () => {
        video.currentTime = video.duration * 0.4;
      },
      5: () => {
        video.currentTime = video.duration * 0.5;
      },
      6: () => {
        video.currentTime = video.duration * 0.6;
      },
      7: () => {
        video.currentTime = video.duration * 0.7;
      },
      8: () => {
        video.currentTime = video.duration * 0.8;
      },
      9: () => {
        video.currentTime = video.duration * 0.9;
      },
    };

    // Event handlers
    const handleKey = (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }
      if (keys[e.key]) {
        e.preventDefault();
        e.stopPropagation();
        keys[e.key](e);
      }
    };

    const startSaving = () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
      timeInterval = setInterval(save.time, CONFIG.SAVE_INTERVAL);
    };

    const stopSaving = () => {
      if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
      }
      save.time();
    };

    const handleFs = () => {
      status.style.opacity = document.fullscreenElement ? "0" : "1";
    };

    const handlePiP = () => {
      isPiP = document.pictureInPictureElement === video;
      update();
    };

    // Load settings
    const savedSpeed = store.loadGlobal("speed");
    const savedVol = store.loadGlobal("volume");
    const savedTime = store.loadVideo("currentTime");

    if (savedSpeed) {
      video.playbackRate = parseFloat(savedSpeed);
    }
    if (savedVol) {
      video.volume = parseFloat(savedVol);
    }

    // Restore time
    const restoreTime = () => {
      if (savedTime && video.duration) {
        const t = parseFloat(savedTime);
        if (
          t > CONFIG.MIN_SAVE_TIME &&
          t < video.duration - CONFIG.END_BUFFER_TIME
        ) {
          video.currentTime = t;
        }
      }
    };

    // Event listeners
    document.addEventListener("keydown", handleKey, true);
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ].forEach((e) => document.addEventListener(e, handleFs));

    video.addEventListener("play", startSaving);
    video.addEventListener("pause", stopSaving);
    ["seeked", "timeupdate", "volumechange", "ratechange"].forEach((e) =>
      video.addEventListener(e, update),
    );
    video.addEventListener("loadedmetadata", () => {
      save.time();
      update();
    });
    ["enterpictureinpicture", "leavepictureinpicture"].forEach((e) =>
      video.addEventListener(e, handlePiP),
    );

    window.addEventListener("beforeunload", save.time);

    // Initialize
    if (video.readyState >= 1) {
      restoreTime();
    } else {
      video.addEventListener("loadedmetadata", restoreTime, { once: true });
    }
    update();

    // Global functions for debugging/management
    window.listStoredVideos = () => {
      console.log("=== Stored Videos (Cookies) ===");
      const cookies = document.cookie.split("; ");
      const videoCookies = cookies.filter((cookie) =>
        cookie.startsWith("udvash_video_"),
      );

      videoCookies.forEach((cookie) => {
        const [name, value] = cookie.split("=");
        if (name === "udvash_video_global") {
          console.log(
            "Global Settings:",
            JSON.parse(decodeURIComponent(value)),
          );
        } else {
          const hash = name.replace("udvash_video_", "");
          try {
            const data = JSON.parse(decodeURIComponent(value));
            console.log(`\n${hash}:`);
            if (data.title) {
              console.log(`  ${data.title} | ${formatTime(data.duration)}`);
            }
            if (data.currentTime) {
              console.log(
                `  Time: ${formatTime(parseFloat(data.currentTime))}`,
              );
            }
            if (data.lastAccessed) {
              console.log(
                `  Last: ${new Date(data.lastAccessed).toLocaleString()}`,
              );
            }
          } catch (e) {
            console.error("Failed to parse cookie data for hash", hash, ":", e);
          }
        }
      });
    };

    window.cleanupOldVideoData = (days = 30) => {
      const cutoff = Date.now() - days * 86400000;
      let cleaned = 0;
      const cookies = document.cookie.split("; ");
      const videoCookies = cookies.filter(
        (cookie) =>
          cookie.startsWith("udvash_video_") &&
          !cookie.startsWith("udvash_video_global"),
      );

      videoCookies.forEach((cookie) => {
        const [name, value] = cookie.split("=");
        const hash = name.replace("udvash_video_", "");
        try {
          const data = JSON.parse(decodeURIComponent(value));
          if (data.lastAccessed && data.lastAccessed < cutoff) {
            // Delete cookie by setting it to expire in the past
            document.cookie = `${name}=; domain=.udvash-unmesh.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            cleaned++;
          }
        } catch (e) {
          console.error("Failed to parse cookie data for cleanup:", hash, e);
        }
      });
      console.log(`Cleaned ${cleaned} video cookies`);
    };

    window.removeVideoControls = () => {
      document.removeEventListener("keydown", handleKey, true);
      window.removeEventListener("beforeunload", save.time);
      stopSaving();
      status.remove();
      navContainer.remove();
    };

    console.log("Video Controls Active | Hash:", currentVideoHash);
    console.log(
      "Keys: Space(play) ←→(seek) ↑↓(vol) []+--(speed) F(full) M(mute) P(pip) 0-9(jump)",
    );
  }

  controller();
})();
