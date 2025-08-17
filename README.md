# ddom - Solana Token Analytics

A Chrome extension and web application for analyzing Solana memecoin distribution and holder concentration.

## Architecture

This project uses a full-stack architecture:

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI + Solana Web3 integration
- **Chrome Extension**: Popup interface with real-time token analysis

## Project Structure

```
ddom/
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/# Reusable React components
│   │   └── lib/       # Frontend utilities
│   └── public/        # Static assets & Chrome extension manifest
├── backend/           # Python FastAPI server
│   ├── main.py        # FastAPI application entry point
│   ├── models/        # Pydantic data models
│   ├── services/      # Business logic (Solana integration)
│   └── requirements.txt
└── README.md
```

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License