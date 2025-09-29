# ddom Chrome Extension

A Chrome extension for analyzing Solana token distribution and holder concentration.

## Installation (Developer Mode)

Since this is for personal use, you'll install it as an unpacked extension:

### Prerequisites
1. Make sure your backend is running on `http://localhost:8000`
2. Generate icon files (see Icon Generation section below)

### Steps
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `extension` folder from this project
5. The extension should now appear in your extensions list and toolbar

### Icon Generation
1. Open `create-icons.html` in your browser
2. Click on each canvas to download the PNG files:
   - Save as `icon-16.png`
   - Save as `icon-32.png` 
   - Save as `icon-48.png`
   - Save as `icon-128.png`
3. Place all PNG files in the `icons/` folder

## Usage

1. Click the ddom extension icon in your Chrome toolbar
2. Enter a Solana token mint address (e.g., `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` for USDC)
3. Click the search button or press Enter
4. View the token distribution analysis
5. Use the theme toggle to switch between light and dark mode

## Features

- Real-time token holder analysis
- Risk assessment based on concentration
- Dark/light theme support
- Quick stats display
- Link to detailed web app analysis

## Development

The extension connects to your local FastAPI backend running on port 8000. Make sure both the backend and frontend servers are running for full functionality.

### File Structure
```
extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Extension functionality
├── styles.css         # Styling (extracted from Tailwind)
├── icons/             # Extension icons
└── README.md          # This file
```

## Troubleshooting

- **Extension won't load**: Check that all required files are present
- **API errors**: Ensure your backend is running on localhost:8000
- **Missing icons**: Generate PNG icons using the create-icons.html file
- **CORS errors**: The backend should already be configured for CORS

## Security Note

This extension is configured for personal development use and connects to localhost. Do not distribute without proper security review and production configuration.
