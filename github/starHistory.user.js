// ==UserScript==
// @name         GitHub - Star History
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add star history chart to GitHub repository pages
// @author       Nusab Taha
// @match        https://github.com/*/*
// @grant        GM_xmlhttpRequest
// @icon         https://pwukkkacs0.ufs.sh/f/N8hw91y0X4dSv6YAv4JsH6a8UCuVkN2TLODvJrclZGdpMoz9
// @connect      api.star-history.com
// ==/UserScript==

(function () {
  "use strict";

  function isDarkMode() {
    return (
      document.documentElement.dataset.colorMode == "dark" ||
      document.documentElement.dataset.darkreaderScheme == "dark" ||
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    );
  }

  function getUserAndRepoOfCurrentPage() {
    const reGitHubURL = /github\.com\/(?<user>[\w-]+)\/(?<repo>[\w.-]+)\/?/,
      currentURL = location.href,
      groups = reGitHubURL.exec(currentURL)?.groups;
    if (!groups?.user || !groups?.repo)
      throw new Error(`Invalid Github repository URL: ${currentURL}`);
    return groups;
  }

  async function insertStarHistory() {
    const { user, repo } = getUserAndRepoOfCurrentPage();

    try {
      const imgURL =
        "https://api.star-history.com/svg?repos=" +
        `${user}/${repo}&type=Date` +
        (isDarkMode() ? "&theme=dark" : "");

      const response = await new Promise((resolve, reject) =>
        GM_xmlhttpRequest({
          method: "GET",
          url: imgURL,
          responseType: "blob",
          onload: resolve,
          onerror: reject,
        }),
      );
      if (response.status != 200) throw new Error("Failed to fetch image");

      if (!document.querySelector("#star-history")) {
        const imgDataURL = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(response.response);
        });

        const starHistoryImg = document.createElement("img");
        starHistoryImg.style.width = "100%";
        // starHistoryImg.style.height = '300px'
        starHistoryImg.style.padding = "20px 0";
        starHistoryImg.src = imgDataURL;

        const link = document.createElement("a");
        link.href = imgURL;
        link.target = "_blank";
        link.appendChild(starHistoryImg);

        const starHistoryDiv = document.createElement("div");
        starHistoryDiv.id = "star-history";
        starHistoryDiv.className = "BorderGrid-row";
        starHistoryDiv.innerHTML =
          '<div class="BorderGrid-cell"><h2 class="h4 mb-3">Star History</h2></div>';
        starHistoryDiv.querySelector(".BorderGrid-cell").append(link);

        const targetDiv = document.querySelector(".BorderGrid-row");
        if (targetDiv) {
          targetDiv.parentNode.insertBefore(
            starHistoryDiv,
            targetDiv.nextSibling,
          );
        }
      }
    } catch (err) {
      console.error("Error loading star history chart:", err);
    }
  }

  let starHistoryAdded = false;
  let prevURL = location.href;

  new MutationObserver((mutations) =>
    mutations.forEach((mutation) => {
      if (mutation.type == "childList" && mutation.addedNodes.length) {
        const onRepoPage = !!document.querySelector(
          'meta[name="route-pattern"][content*="/:repository"]',
        );
        if (location.href != prevURL) {
          prevURL = location.href;
          starHistoryAdded = false;
        }
        if (onRepoPage && !starHistoryAdded) {
          insertStarHistory();
          starHistoryAdded = true;
        }
      }
    }),
  ).observe(document.documentElement, { childList: true, subtree: true });
})();
