# Changelog

## 1.0.1

### Fixed

- HTML entities (`&quot;`, `&#x27;`) in tooltip titles are now decoded correctly
- Button now hides when navigating away from a show/movie page on SPA sites (Trakt, Simkl)
- Episode pages on IMDB and Trakt now link to the series instead of the episode (which caused 404s in Stremio)
- Fallback link scanner no longer overrides site-specific extractors that intentionally return null

### Changed

- Removed TMDB support (external IDs not available in page HTML)
- Added `trakt.tv` host permission for episode-to-series resolution via IMDB

## 1.0.0

### Added

- Detect movies and shows on IMDB, Trakt, Letterboxd, TMDB, and Simkl
- One-click open in Stremio via page action button
- Auto-resolve titles from IMDB
- SPA navigation support (Turbolinks, History API, polling)
- Fallback IMDB link scanner for unsupported page layouts
