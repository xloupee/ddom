from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os
from dotenv import load_dotenv

from services.solana_service import SolanaService
from models.token_analysis import TokenAnalysisResponse

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

# Initialize Solana service
solana_service = SolanaService()

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
        stats = await solana_service.get_quick_token_stats(mint_address)
        return stats
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
