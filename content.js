/**
 * Site-specific extractors. Each returns { imdbId, type } or null.
 * "type" is "movie" or "series" for the stremio:// protocol.
 */

const extractors = [
  {
    // IMDB — ID is right in the URL
    host: "imdb.com",
    extract() {
      const match = location.pathname.match(/\/title\/(tt\d+)/);
      if (!match) return null;
      const imdbId = match[1];
      // Detect type from the page's schema markup or subtext
      const schemaEl = document.querySelector('script[type="application/ld+json"]');
      let type = "movie";
      if (schemaEl) {
        try {
          const schema = JSON.parse(schemaEl.textContent);
          if (schema["@type"] === "TVSeries") type = "series";
        } catch {}
      }
      return { imdbId, type };
    },
  },
  {
    // Trakt — URL tells us movie vs show, IMDB link is in the sidebar/sharing
    host: "trakt.tv",
    extract() {
      const type = location.pathname.startsWith("/shows/") ? "series" : "movie";
      // Trakt puts the IMDB link in the external links sidebar
      const imdbLink = document.querySelector('a[href*="imdb.com/title/tt"]');
      if (imdbLink) {
        const match = imdbLink.href.match(/(tt\d+)/);
        if (match) return { imdbId: match[1], type };
      }
      // Fallback: Trakt sometimes embeds IMDB in data attributes
      const dataImdb = document.querySelector("[data-imdb-id]");
      if (dataImdb) {
        return { imdbId: dataImdb.getAttribute("data-imdb-id"), type };
      }
      return null;
    },
  },
  {
    // Letterboxd — IMDB link in the footer/sidebar of film pages
    host: "letterboxd.com",
    extract() {
      const imdbLink = document.querySelector('a[href*="imdb.com/title/tt"]');
      if (imdbLink) {
        const match = imdbLink.href.match(/(tt\d+)/);
        if (match) return { imdbId: match[1], type: "movie" };
      }
      // Letterboxd also uses data-imdb-id on the body or micro-data
      const bodyImdb = document.body.getAttribute("data-imdb-id");
      if (bodyImdb) return { imdbId: bodyImdb, type: "movie" };
      return null;
    },
  },
  {
    // TMDB — IMDB ID is in the external IDs section or social links
    host: "themoviedb.org",
    extract() {
      const type = location.pathname.startsWith("/tv/") ? "series" : "movie";
      const imdbLink = document.querySelector('a[href*="imdb.com/title/tt"]');
      if (imdbLink) {
        const match = imdbLink.href.match(/(tt\d+)/);
        if (match) return { imdbId: match[1], type };
      }
      return null;
    },
  },
  {
    // Simkl
    host: "simkl.com",
    extract() {
      const type = location.pathname.startsWith("/tv/") ? "series" : "movie";
      const imdbLink = document.querySelector('a[href*="imdb.com/title/tt"]');
      if (imdbLink) {
        const match = imdbLink.href.match(/(tt\d+)/);
        if (match) return { imdbId: match[1], type };
      }
      return null;
    },
  },
];

/**
 * Generic fallback: scan all links on the page for an IMDB title URL.
 */
function fallbackScan() {
  const links = document.querySelectorAll('a[href*="imdb.com/title/tt"]');
  for (const link of links) {
    const match = link.href.match(/(tt\d+)/);
    if (match) return { imdbId: match[1], type: "movie" };
  }
  return null;
}

// Track what we last sent so we don't spam duplicate messages,
// and so we know when the page has actually changed.
let lastSentId = null;
let lastUrl = null;

function run() {
  const hostname = location.hostname;
  let result = null;

  // Try site-specific extractor first
  for (const extractor of extractors) {
    if (hostname.includes(extractor.host)) {
      result = extractor.extract();
      if (result) break;
    }
  }

  // Fallback: scan links
  if (!result) result = fallbackScan();

  if (result && result.imdbId !== lastSentId) {
    lastSentId = result.imdbId;
    browser.runtime.sendMessage({
      action: "imdbFound",
      imdbId: result.imdbId,
      type: result.type,
    });
  }
}

/**
 * Detect SPA / Turbolinks-style navigations where the URL changes
 * but the content script stays alive (no full page reload).
 */
function watchForNavigation() {
  lastUrl = location.href;

  // 1. Turbolinks / Turbo specific events (Trakt uses this)
  for (const event of ["turbolinks:load", "turbo:load", "turbo:render"]) {
    document.addEventListener(event, () => {
      lastSentId = null;
      run();
      setTimeout(run, 800);
    });
  }

  // 2. History API (pushState/replaceState) — covers most other SPAs
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;

  history.pushState = function (...args) {
    originalPush.apply(this, args);
    onUrlChange();
  };
  history.replaceState = function (...args) {
    originalReplace.apply(this, args);
    onUrlChange();
  };
  window.addEventListener("popstate", onUrlChange);

  // 3. Polling fallback — catches anything the above miss
  setInterval(() => {
    if (location.href !== lastUrl) {
      onUrlChange();
    }
  }, 1000);
}

function onUrlChange() {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  lastSentId = null;
  // Small delay to let the new DOM settle
  setTimeout(run, 300);
  setTimeout(run, 1200);
}

// Initial run + retries for slow-loading content
run();
setTimeout(run, 1500);
setTimeout(run, 4000);

// Start watching for SPA navigations
watchForNavigation();
