// ==UserScript==
// @name        Double-click Image Downloader
// @namespace   leaumar
// @match       *://*/*
// @grant       GM.download
// @grant       GM.xmlHttpRequest
// @connect     *
// @version     3
// @author      leaumar@mailbox.org
// @description Double-click images to download them.
// @license     MPL-2.0
// ==/UserScript==

class HttpError extends Error {
  constructor(verb, response) {
    super(`HTTP request ${verb}.`, {
      cause: response,
    });
  }
}

function httpRequest(method, url) {
  return new Promise((resolve, reject) => {
    function fail(verb) {
      return (error) => reject(new HttpError(verb, error));
    }

    GM.xmlHttpRequest({
      url: url.href,
      onload: resolve,
      onerror: fail("errored"),
      onabort: fail("aborted"),
      ontimeout: fail("timed out"),
      responseType: "blob",
    });
  });
}

function httpDownload(url, name) {
  return new Promise((resolve, reject) => {
    function fail(verb) {
      return (error) => reject(new HttpError(verb, error));
    }

    GM.download({
      url: url.href,
      name,
      onload: () => resolve(),
      onerror: fail("errored"),
      onabort: fail("aborted"),
      ontimeout: fail("timed out"),
      responseType: "blob",
    });
  });
}

// -----------------

// from the greasemonkey docs
const lineSeparator = "\r\n";
const headerSeparator = ": ";

// is it still the 90s?
function parseHeaders(headersString) {
  return headersString.split(lineSeparator).reduce((accumulator, line) => {
    const pivot = line.indexOf(headerSeparator);
    const name = line.slice(0, pivot).trim().toLowerCase();
    const value = line.slice(pivot + headerSeparator.length).trim();
    accumulator[name] = value;
    return accumulator;
  }, {});
}

// ----------------

function filterFilename(name) {
  // foo.jpg
  return /^.+\.(?:jpe?g|png|gif|webp)$/iu.exec(name)?.[0];
}

async function queryFilename(url) {
  const response = await httpRequest("HEAD", url);
  const disposition = parseHeaders(response.responseHeaders)[
    "content-disposition"
  ];
  if (disposition != null) {
    // naive approach, but proper parsing is WAY overkill
    // attachment; filename="foo.jpg" -> foo.jpg
    const serverName = /^(?:attachment|inline)\s*;\s*filename="([^"]+)"/iu.exec(
      disposition,
    )?.[1];
    if (serverName != null) {
      return filterFilename(serverName);
    }
  }
}

function readFilename(url) {
  const branch = url.pathname;
  const leaf = branch.slice(branch.lastIndexOf("/") + 1);
  return filterFilename(leaf);
}

function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

async function downloadImage(url, name, image) {
  const opacity = image.style.opacity ?? 1;

  image.style.opacity = 0.5;
  await Promise.all([httpDownload(url, name), sleep(100)]);
  image.style.opacity = opacity;
}

async function onDoubleClick(dblClick) {
  if (dblClick.target.nodeName === "IMG") {
    const imageElement = dblClick.target;
    const url = new URL(imageElement.src, location.origin);
    const name = readFilename(url) ?? (await queryFilename(url));
    if (name == null) {
      throw new Error("Could not determine a filename.");
    }
    await downloadImage(url, name, imageElement);
  }
}

(function main() {
  document.body.addEventListener("dblclick", (dblClick) =>
    onDoubleClick(dblClick).catch(console.error),
  );
})();
