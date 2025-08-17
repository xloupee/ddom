# dont dump on me - Solana Token Analytics

A Chrome extension and web application for analyzing Solana memecoin distribution and holder concentration.

## Development Setup

### Backend (Python FastAPI)

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your Solana RPC endpoint
   ```

4. **Run the API server**:
   ```bash
   python main.py
   # API will be available at http://localhost:8000
   ```

### Frontend (Next.js)

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   # App will be available at http://localhost:3000
   ```

3. **Build for Chrome extension**:
   ```bash
   npm run build:extension
   ```

## Features

- **Token Analysis**: Analyze any SPL token's holder distribution
- **Holder Classification**: Identify whales, exchanges, and liquidity pools
- **Distribution Metrics**: Calculate concentration statistics
- **Chrome Extension**: Seamless analysis while browsing DEXs
- **Real-time Data**: Direct blockchain data fetching

## API Endpoints

- `GET /` - API health check
- `POST /api/analyze-token` - Full token distribution analysis
- `GET /api/token/{mint}/quick-stats` - Quick statistics for popup

## Chrome Extension Installation

1. Build the extension: `npm run build:extension`
2. Open Chrome Extensions page: `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `frontend/dist` folder

## License

MIT License