from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os
from dotenv import load_dotenv

from services.solana_service import SolanaService
from services.pumpportal_service import PumpPortalService
from models.token_analysis import TokenAnalysisResponse
from models.pumpportal_models import RealTimeStats, TrendingToken

load_dotenv()

app = FastAPI(
    title="ddom API",
    description="Solana memecoin analytics API",
    version="1.0.0"
)

# Configure CORS for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
solana_service = SolanaService()
pumpportal_service = PumpPortalService()

class TokenAnalysisRequest(BaseModel):
    mint_address: str

@app.get("/")
async def root():
    return {"message": "ddom API - Solana Token Analytics"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ddom-api"}

@app.post("/api/analyze-token", response_model=TokenAnalysisResponse)
async def analyze_token(request: TokenAnalysisRequest):
    """
    Analyze a Solana token's holder distribution
    """
    try:
        # Validate mint address format
        if not request.mint_address or len(request.mint_address) < 32:
            raise HTTPException(status_code=400, detail="Invalid mint address format")
        
        # Perform token analysis
        analysis = await solana_service.analyze_token_distribution(request.mint_address)
        
        return analysis
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/token/{mint_address}/quick-stats")
async def get_quick_stats(mint_address: str):
    """
    Get quick statistics for a token (for popup preview)
    """
    try:
        # Try PumpPortal first for real-time data
        pumpportal_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
        
        if pumpportal_stats["total_holders"] > 0:
            # Use PumpPortal data if available
            return {
                "total_holders": pumpportal_stats["total_holders"],
                "top_10_percentage": pumpportal_stats["top_10_percentage"],
                "whale_count": pumpportal_stats["whale_count"],
                "last_updated": pumpportal_stats["analysis_timestamp"]
            }
        else:
            # Fallback to Solana RPC data
            stats = await solana_service.get_quick_token_stats(mint_address)
            return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trending-tokens")
async def get_trending_tokens(limit: int = 10):
    """
    Get trending tokens from PumpPortal
    """
    try:
        trending = await pumpportal_service.get_trending_tokens(limit)
        return {"trending_tokens": trending}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/token/{mint_address}/realtime-stats")
async def get_realtime_stats(mint_address: str):
    """
    Get comprehensive real-time statistics for a token
    """
    try:
        # Get PumpPortal analysis
        holder_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
        
        # Get recent trades for price info
        trades = await pumpportal_service.get_token_trades(mint_address, limit=10)
        
        current_price = trades[0].price / trades[0].amount if trades else 0
        
        return RealTimeStats(
            token_address=mint_address,
            current_price=current_price,
            market_cap=trades[0].market_cap if trades else 0,
            volume_24h=holder_stats["total_volume_sol"],
            holder_stats=holder_stats,
            last_updated=holder_stats["analysis_timestamp"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )
