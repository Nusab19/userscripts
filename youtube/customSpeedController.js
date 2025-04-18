// ==UserScript==
// @name         YouTube Video Speed Controller
// @namespace    https://your.namespace.here
// @version      3.3.1
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
};

function MAIN() {
  "use strict";

  console.log(
    "%cYouTube Video Speed Controller Script Running...",
    "color: #fffffff; font-size: 27px;font-weight: 600;background-color: hsl(240, 75%, 60%);"
  );

  // Retrieve playback speed from storage, default to 1.0 if not set
  const initialSpeed = getPlaybackSpeedFromStorage();

  showNotification(`Retrieved Playback speed: ${initialSpeed}x`, 1000);
  document.onload = applySpeedToAllVideos(initialSpeed);

  document.addEventListener("yt-navigate-finish", () => {
    // when the user navigates to another page,
    // find the video and apply the speed
    applySpeedToAllVideos(getPlaybackSpeedFromStorage());
  });

  document.addEventListener("keydown", function (event) {
    // if the key is not `[` or `]` return
    const pressedKey = event.key;
    if (!"[]+-".includes(pressedKey)) return;

    // Ignore key events if the target element is an `input` field
    if (event.target.tagName.toLowerCase() === "input") return;

    const videos = document.getElementsByTagName("video");
    if (!videos.length) return;

    let newSpeed = changeSpeed(pressedKey);

    // Round to 1 decimal place because `0.1 + 0.2 = 0.30000000000000004` >_<
    newSpeed = Math.round(newSpeed * 10) / 10;
    console.log("New speed:", newSpeed);

    applySpeedToAllVideos(newSpeed);
    showNotification(`Playback speed: ${newSpeed}x`, 500);
    localStorage.setItem(scriptNAME, newSpeed.toString());
  });
}

function getPlaybackSpeedFromStorage() {
  let speed = parseFloat(localStorage.getItem(scriptNAME)) || DEFAULT_SPEED;
  return Math.round(speed * 10) / 10;
}

function changeSpeed(pressedKey) {
  const SPEED_STEP = KEYBINDS[pressedKey];
  const newSpeed = getPlaybackSpeedFromStorage() + SPEED_STEP;

  if (SPEED_STEP > 0) {
    // Increase speed
    if (newSpeed > MAX_SPEED) showNotification("You're not the Flash bro! 😒");

    return Math.min(newSpeed, MAX_SPEED);
  } else {
    // Decrease speed
    if (newSpeed < MIN_SPEED)
      showNotification("You're watching a video, not a slideshow! 🙄");

    return Math.max(newSpeed, MIN_SPEED);
  }
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
