# Streams Ahead 🏴‍☠️

Look, I invented this. A Firefox addon that finds movies and shows on websites and opens them in [Stremio](https://www.stremio.com/) with one click. You're welcome. I came up with the name too. It's a play on "streets ahead," which is a phrase I coined. If you don't know what it means, you're streets behind.

## How it works

When you visit a movie or show page on one of the supported sites, Streams Ahead - again, my idea - finds the IMDB ID and puts a button right there in your address bar. One click and boom, it opens in Stremio. It's so simple a broad could use it.

## Supported sites

| Site | What's detected |
|---|---|
| [IMDB](https://www.imdb.com) | Title pages, including episodes (resolves to series) |
| [Trakt](https://trakt.tv) | Movie, show, and episode pages (resolves to series) |
| [Letterboxd](https://letterboxd.com) | Film pages |
| [Simkl](https://simkl.com) | Movie and TV pages |

Any page on these sites that has an IMDB link will also get picked up by the fallback scanner. That's five sites. I've been with more sites than that in a single weekend. I'm talking about websites. What did you think I meant?

## Install

### From AMO (recommended)

Download the signed `.xpi` from [Releases](../../releases) and open it in Firefox. If you can't figure that out, I don't know what to tell you. My third wife figured out how to install Firefox extensions and she thought a PDF was a type of STD.

### From source

1. Clone this repo
2. Open `about:debugging#/runtime/this-firefox` in Firefox
3. Click **Load Temporary Add-on** and select `manifest.json`

## SPA support

Some of these sites, like Trakt, use something called "Turbolinks" where the page changes without actually reloading. I don't fully understand it, but neither does anyone else, and at least I'm honest about it. Streams Ahead handles this by listening for Turbolinks events, hooking the History API, and polling for URL changes as a fallback. I suggested all of those approaches during a meeting that nobody else remembers but definitely happened.

## Permissions

- **activeTab / tabs** - to see what page you're on and show the button. That's it. I'm not spying on you. I've done a lot of things I'm not proud of, but browser surveillance isn't one of them.
- **imdb.com** - to fetch the title name for the tooltip, and to resolve episode pages to their parent series
- **trakt.tv** - to resolve episode pages to their parent series via IMDB

No data is collected or sent anywhere. Unlike my moist towelette empire, this is a non-profit operation. The only network request is a fetch to IMDB to get the title name, and the results are cached in memory. I don't even know what you're watching. I don't care. Unless it's one of the films I executive produced, in which case, you're welcome.
