// ==UserScript==
// @name         YouTube - Commenter Names
// @version      1.9.0
// @description  Make YouTube display the names of commenters instead of their handles.
// @author       Lumynous
// @license      MIT
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @match        https://www.youtube.com/*
// @match        https://studio.youtube.com/*
// @exclude      https://www.youtube.com/persist_identity
// @exclude      https://studio.youtube.com/persist_identity
// @exclude      https://studio.youtube.com/ytscframe
// @noframes
// ==/UserScript==

"use strict";

const [watchElm, querySelectorAsync] = (function () {
  const elmObserver = new MutationObserver(elmObserverCallback);
  elmObserver.observe(document, { childList: true, subtree: true });
  const callbacks = new Set();

  function elmObserverCallback(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        for (const { selector, callback, once, self } of callbacks) {
          if (node.matches(selector)) {
            callback(node);
            // TODO: Make this elegant.
            if (once) {
              callbacks.delete(self);
              continue;
            }
          }
          for (const elm of node.querySelectorAll(selector)) {
            callback(elm);
            if (once) {
              callbacks.delete(self);
              break;
            }
          }
        }
      }
    }
  }

  function elmCallback(observer, action, elm) {
    action(elm);
    observer.observe(elm, { attributes: true });
  }

  return [
    (selector, action) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) action(mutation.target);
      });
      const callback = elmCallback.bind(null, observer, action);
      for (const elm of document.querySelectorAll(selector)) callback(elm);
      callbacks.add({
        selector,
        callback,
        once: false,
        // `self` is not needed if not once.
      });
    },
    (selector) => {
      return new Promise((resolve) => {
        const elm = document.querySelector(selector);
        if (elm) {
          resolve(elm);
          return;
        }
        callbacks.add({
          selector,
          callback: resolve,
          once: true,
          get self() {
            return this;
          },
        });
      });
    },
  ];
})();

async function fetchInternalApi(endpoint, body) {
  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/${endpoint}?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false`,
    {
      method: "POST",
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB", clientVersion: "2.20240411.01.00" },
        },
        ...body,
      }),
    },
  );
  return await response.json();
}

function cacheFunctionDecorator(fn) {
  const cache = new Map();
  const decoratedFn = (arg) => {
    let res = cache.get(arg);
    if (res === undefined) {
      res = fn(arg);
      cache.set(arg, res);
    }
    return res;
  };
  decoratedFn.cache = cache;
  return decoratedFn;
}

const getChannelId = cacheFunctionDecorator(async (url) => {
  let json = await fetchInternalApi("navigation/resolve_url", { url });
  if (!json.endpoint.browseEndpoint) {
    // Workaround: Some channels such as @rayduenglish behave strange.  Normally GETing
    // channel pages result 303 and redirect to `/rayduenglish` for example; the internal
    // API responses similarly, the workaround is to resolve twice.  However, some are
    // impossible to resolve correctly; for example, requesting `/@Konata` redirected to
    // `/user/Konata`, and `/user/Konata` leads 404.  This is probably a bug of YouTube.
    json = await fetchInternalApi(
      "navigation/resolve_url",
      json.endpoint.urlEndpoint,
    );
  }
  return json.endpoint.browseEndpoint.browseId;
});

const getChannelName = cacheFunctionDecorator(async (id) => {
  const json = await fetchInternalApi("browse", { browseId: id });
  return json.metadata.channelMetadataRenderer.title;
});

function replaceText(elm, text) {
  elm.firstChild.textContent = text;
}

if (location.hostname === "www.youtube.com") {
  // Get video owner names without requesting.  Video owners likely have comments on their videos.
  const videoOwner = await querySelectorAsync("ytd-video-owner-renderer");
  function cacheVideoOwnerName() {
    if (ytPageType !== "watch") return;
    if (videoOwner.data.title) {
      const id =
        videoOwner.data.title.runs[0].navigationEndpoint.browseEndpoint
          .browseId;
      // Checking before setting is slightly faster than directly setting.
      if (getChannelName.cache.has(id)) return;
      getChannelName.cache.set(
        id,
        Promise.resolve(videoOwner.data.title.runs[0].text),
      );
    } else {
      // Collaborated videos.
      videoOwner.data.attributedTitle.commandRuns[0].onTap.innertubeCommand.showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel.customContent.listViewModel.listItems.forEach(
        ({ listItemViewModel: { title } }) => {
          const id =
            title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.browseId;
          if (getChannelName.cache.has(id)) return;
          getChannelName.cache.set(id, Promise.resolve(title.content));
        },
      );
    }
  }
  document.addEventListener("yt-page-data-updated", cacheVideoOwnerName);
  cacheVideoOwnerName(); // The event won't be fired if visiting a video directly.

  // Mentions in titles.
  watchElm("#title.ytd-watch-metadata a.yt-simple-endpoint", (elm) => {
    if (elm.pathname[1] !== "@") return;
    getChannelName(elm.data.browseEndpoint.browseId).then((name) =>
      replaceText(elm, name),
    );
  });

  // Commenters.
  watchElm("#author-text.ytd-comment-view-model", (elm) => {
    getChannelName(elm.data.browseEndpoint.browseId).then((name) =>
      replaceText(elm.firstElementChild, name),
    );
  });
  watchElm("#name.ytd-author-comment-badge-renderer", (elm) => {
    getChannelName(elm.data.browseEndpoint.browseId).then((name) =>
      replaceText(elm.querySelector("#text"), name),
    );
  });

  // Mentions in comments.
  watchElm("#content-text.ytd-comment-view-model a", (elm) => {
    // Skip non-mentions.  URLs with protocol begin with `http` only.
    // Channels begin with `/channel/`.
    if (elm.attributes.href.value[1] !== "c") return;
    getChannelName(elm.href.slice(elm.href.lastIndexOf("/") + 1)).then((name) =>
      replaceText(elm, `\xA0${name}\xA0`),
    );
  });
} else {
  // TODO: After changing the filters of comments, some commenters' names might be IDs
  // if they're the same one, because their attributes wasn't changed.  A solution is
  // to watch their character data, but it causes a lock with Edge's translation
  // feature.
  watchElm("#name.ytcp-comment", (elm) => {
    getChannelId(elm.href)
      .then(getChannelName)
      .then((name) => replaceText(elm.firstElementChild, name));
  });
  watchElm("#badge-name.ytcp-author-comment-badge", (elm) => {
    getChannelId(elm.href)
      .then(getChannelName)
      .then((name) => replaceText(elm.firstElementChild, name));
  });
}
