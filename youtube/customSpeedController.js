// ==UserScript==
// @name         YouTube Video Speed Controller
// @namespace    https://your.namespace.here
// @version      3.5.1
// @description  Control playback speed on YouTube with keyboard.
// @author       Nusab Taha
// @license      MIT
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// ==/UserScript==

const scriptNAME = "YT_SPEED";
const MIN_SPEED = 0.1;
const DEFAULT_SPEED = 1;
const MAX_SPEED = 7;
const KEYBINDS = {
  "[": -0.1,
  "]": +0.1,
  "-": -0.5,
  "+": +0.5,
  "=": +0.5, // Add "=" as an alternative for "+" since some keyboards require Shift for "+"
};

function MAIN() {
  "use strict";

  console.log(
    "%cYouTube Video Speed Controller Script Running...",
    "color: #fffffff; font-size: 27px;font-weight: 600;background-color: hsl(240, 75%, 60%);"
  );

  const initialSpeed = getPlaybackSpeedFromStorage();
  showNotification(`Retrieved Playback speed: ${initialSpeed}x`, 1000);
  document.onload = applySpeedToAllVideos(initialSpeed);

  document.addEventListener("yt-navigate-finish", () => {
    applySpeedToAllVideos(getPlaybackSpeedFromStorage());
  });

  document.addEventListener("keydown", function (event) {
    const pressedKey = event.key;

    // Ignore if key is not in our keybinds
    if (!Object.keys(KEYBINDS).includes(pressedKey)) return;

    // Check if user is typing in an editable field
    if (isEditable(event.target)) {
      // When in an editable field, allow normal typing behavior
      // DO NOT process the keystroke as a speed command
      return;
    }

    // Only handle speed changes if we're not in an editable field
    const videos = document.getElementsByTagName("video");
    if (!videos.length) return;

    let newSpeed = changeSpeed(pressedKey);
    newSpeed = Math.round(newSpeed * 10) / 10;

    applySpeedToAllVideos(newSpeed);
    showNotification(`Playback speed: ${newSpeed}x`, 500);
    localStorage.setItem(scriptNAME, newSpeed.toString());
  });
}

function isEditable(element) {
  if (!element) return false;

  if (element.tagName && ["input", "textarea"].includes(element.tagName.toLowerCase())) {
    return true;
  }

  if (element.getAttribute && element.getAttribute("contenteditable") === "true") {
    return true;
  }

  let parent = element;
  while (parent && parent !== document) {
    if (parent.getAttribute && parent.getAttribute("contenteditable") === "true") {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
}

function getPlaybackSpeedFromStorage() {
  let speed = parseFloat(localStorage.getItem(scriptNAME)) || DEFAULT_SPEED;
  return Math.round(speed * 10) / 10;
}

function changeSpeed(pressedKey) {
  const SPEED_STEP = KEYBINDS[pressedKey];
  const currentSpeed = getPlaybackSpeedFromStorage();
  const newSpeed = currentSpeed + SPEED_STEP;

  if (SPEED_STEP > 0 && newSpeed > MAX_SPEED) {
    showNotification("You're not the Flash bro! 😒");
    return MAX_SPEED;
  } else if (SPEED_STEP < 0 && newSpeed < MIN_SPEED) {
    showNotification("You're watching a video, not a slideshow! 🙄");
    return MIN_SPEED;
  }

  return newSpeed;
}

function applySpeedToAllVideos(speed) {
  const videos = document.getElementsByTagName("video");
  for (let video of videos) {
    video.playbackRate = speed;
  }
}

function showNotification(message, duration = 2000) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      padding: 11px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-family: Arial, sans-serif;
      font-size: 15px;
      z-index: 9999;
      border-radius: 7px;`;

  document.body.appendChild(notification);
  setTimeout(() => document.body.removeChild(notification), duration);
}

MAIN();
