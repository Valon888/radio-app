
# Mini IPTV + Radio

A simple web application for watching IPTV TV channels and listening to online radio, suitable for desktop and mobile use.

## Features

- Play TV channels (HLS/M3U8) and radio (MP3/AAC)
- Search and filter channels by name, group, or type
- Automatic import of M3U playlists from URL
- Twitch channel support (video embed)
- Display of channel logos and groups
- Automatic saving of the last played channel
- Responsive UI and dark mode
- Works on GitHub Pages with HTTPS streams

## How to Use

1. Open the app in your browser (from GitHub Pages or locally).
2. Select a channel from the list to watch TV or listen to radio.
3. To add new channels, use the "Import from URL" button and enter an M3U URL.
4. Channels with HTTPS streams work in any browser. Channels with HTTP streams may not work on HTTPS pages.

## Tips

- For best compatibility, use only HTTPS streams.
- For Albanian radio/TV that are only HTTP, use the app from a local HTTP server.
- To add new channels, edit the `items` array in `index.html`.

## Example URLs for Import

- Albanian TV: `https://iptv-org.github.io/iptv/countries/al.m3u`
- Albanian Radio (HTTPS): see the integrated list in the app

## Contribution

Contributions are welcome! Open a pull request or issue for suggestions and improvements.

## License

MIT
