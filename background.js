// Store detected IMDB data per tab: { tabId: { imdbId, type, title } }
const tabData = {};

// Cache resolved titles: { imdbId: title }
const titleCache = {};

/**
 * Fetch the title for an IMDB ID by scraping the IMDB page's <title> tag.
 * Results are cached so each ID is only fetched once.
 */
async function resolveTitle(imdbId) {
  if (titleCache[imdbId]) return titleCache[imdbId];
  try {
    const res = await fetch(`https://www.imdb.com/title/${imdbId}/`, {
      headers: { "Accept-Language": "en-US,en;q=0.9" },
    });
    const html = await res.text();
    const match = html.match(/<title>(.+?)<\/title>/i);
    if (match) {
      // IMDB titles look like "Breaking Bad (TV Series 2008–2013) - IMDb"
      const decoded = new DOMParser()
        .parseFromString(match[1], "text/html")
        .documentElement.textContent;
      const clean = decoded
        .replace(/\s*[-–—]\s*IMDb.*$/i, "")
        .trim();
      if (clean) {
        titleCache[imdbId] = clean;
        return clean;
      }
    }
  } catch {}
  return null;
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "imdbFound" && sender.tab) {
    const tabId = sender.tab.id;
    tabData[tabId] = {
      imdbId: message.imdbId,
      type: message.type || "movie",
    };
    // Show the button immediately with the ID as a placeholder
    browser.pageAction.setTitle({
      tabId,
      title: `Open ${message.imdbId} in Stremio`,
    });
    browser.pageAction.show(tabId);

    // Resolve the real title in the background, then update
    resolveTitle(message.imdbId).then((title) => {
      if (title && tabData[tabId]?.imdbId === message.imdbId) {
        tabData[tabId].title = title;
        browser.pageAction.setTitle({
          tabId,
          title: `Open ${title} in Stremio`,
        });
      }
    });
  }
});

// Track tabs where we just triggered a stremio:// open so
// the onUpdated listener doesn't hide the page-action button.
const pendingStremio = new Set();

// Open stremio:// link directly on click
browser.pageAction.onClicked.addListener((tab) => {
  const data = tabData[tab.id];
  if (data) {
    pendingStremio.add(tab.id);
    browser.tabs.update(tab.id, {
      url: `stremio://detail/${data.type}/${data.imdbId}`,
    });
  }
});

// Clean up when tabs close
browser.tabs.onRemoved.addListener((tabId) => {
  delete tabData[tabId];
});

// Hide when a tab navigates away (but not for stremio:// opens)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    if (pendingStremio.has(tabId)) {
      pendingStremio.delete(tabId);
      return;
    }
    delete tabData[tabId];
    browser.pageAction.hide(tabId);
  }
});
