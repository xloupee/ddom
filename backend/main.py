from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

from services.solana_service import SolanaService
from services.pumpportal_service import PumpPortalService
from services.helius_service import HeliusService
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
helius_service = HeliusService()

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
    Get quick statistics for a token (for popup preview) - now with accurate data and early buyers!
    """
    try:
        print(f"Getting quick stats for: {mint_address}")
        
        # Get early buyers from Helius (more comprehensive transaction data)
        early_buyers = await helius_service.get_early_buyers(mint_address, limit=10)
        
        # Try Helius first for most accurate data
        helius_stats = await helius_service.analyze_token_distribution(mint_address)
        
        if helius_stats["total_holders"] > 0:
            # Use Helius data - most accurate
            return {
                "total_holders": helius_stats["total_holders"],
                "top_10_percentage": helius_stats["top_10_percentage"],
                "whale_count": helius_stats["whale_count"],
                "token_name": helius_stats.get("token_name", "Unknown Token"),
                "token_symbol": helius_stats.get("token_symbol", "UNK"),
                "last_updated": helius_stats["analysis_timestamp"],
                "early_buyers": early_buyers
            }
        
        # Fallback to PumpPortal for pump.fun tokens
        if 'pump' in mint_address.lower():
            print("Helius failed, trying PumpPortal for pump.fun token")
            pumpportal_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
            
            if pumpportal_stats["total_holders"] > 0:
                return {
                    "total_holders": pumpportal_stats["total_holders"],
                    "top_10_percentage": pumpportal_stats["top_10_percentage"],
                    "whale_count": pumpportal_stats["whale_count"],
                    "token_name": "PumpFun Token",
                    "token_symbol": "PUMP",
                    "last_updated": pumpportal_stats["analysis_timestamp"],
                    "early_buyers": early_buyers
                }
        
        # Final fallback to Solana RPC
        print("All services failed, using basic Solana RPC")
        stats = await solana_service.get_quick_token_stats(mint_address)
        stats["early_buyers"] = early_buyers
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/token/{mint_address}")
async def debug_token_analysis(mint_address: str):
    """
    Debug endpoint to test all three services and see their raw responses
    """
    debug_results = {
        "mint_address": mint_address,
        "helius_test": {"status": "pending"},
        "pumpportal_test": {"status": "pending"}, 
        "solana_test": {"status": "pending"}
    }
    
    # Test Helius
    try:
        helius_result = await helius_service.analyze_token_distribution(mint_address)
        debug_results["helius_test"] = {
            "status": "success",
            "data": helius_result,
            "api_key": f"{helius_service.api_key[:10]}..."
        }
    except Exception as e:
        debug_results["helius_test"] = {
            "status": "error",
            "error": str(e),
            "api_key": f"{helius_service.api_key[:10]}..."
        }
    
    # Test PumpPortal 
    try:
        pumpportal_result = await pumpportal_service.get_token_holders_analysis(mint_address)
        debug_results["pumpportal_test"] = {
            "status": "success", 
            "data": pumpportal_result,
            "api_key": f"{pumpportal_service.api_key[:10]}..."
        }
    except Exception as e:
        debug_results["pumpportal_test"] = {
            "status": "error",
            "error": str(e),
            "api_key": f"{pumpportal_service.api_key[:10]}..."
        }
    
    # Test Solana RPC
    try:
        solana_result = await solana_service.get_quick_token_stats(mint_address)
        debug_results["solana_test"] = {
            "status": "success",
            "data": solana_result
        }
    except Exception as e:
        debug_results["solana_test"] = {
            "status": "error", 
            "error": str(e)
        }
    
    return debug_results

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

@app.websocket("/ws/token/{mint_address}")
async def websocket_token_updates(websocket, mint_address: str):
    """
    WebSocket endpoint for real-time token updates
    """
    await websocket.accept()
    
    try:
        # Send initial data
        initial_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
        await websocket.send_json({
            "type": "initial_stats",
            "data": initial_stats
        })
        
        # Start real-time trade streaming
        async for trade_data in pumpportal_service.subscribe_to_token_trades(mint_address):
            # Process the trade and send updated stats
            updated_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
            
            await websocket.send_json({
                "type": "trade_update",
                "trade": trade_data,
                "updated_stats": updated_stats
            })
            
    except Exception as e:
        logger.error(f"WebSocket error for {mint_address}: {e}")
        await websocket.close()

@app.get("/api/debug/token/{mint_address}")
async def debug_token_analysis(mint_address: str):
    """
    Debug endpoint to see detailed token analysis breakdown
    """
    try:
        # Test all services and see which ones work
        result = {
            "mint_address": mint_address,
            "helius_test": None,
            "pumpportal_test": None,
            "solana_test": None
        }
        
        # Test Helius
        try:
            helius_stats = await helius_service.analyze_token_distribution(mint_address)
            result["helius_test"] = {
                "status": "success",
                "data": helius_stats,
                "api_key": helius_service.api_key[:10] + "..." if helius_service.api_key else "No API key"
            }
        except Exception as e:
            result["helius_test"] = {"status": "failed", "error": str(e)}
        
        # Test PumpPortal
        try:
            pumpportal_stats = await pumpportal_service.get_token_holders_analysis(mint_address)
            result["pumpportal_test"] = {
                "status": "success", 
                "data": pumpportal_stats,
                "api_key": pumpportal_service.api_key[:10] + "..." if pumpportal_service.api_key else "No API key"
            }
        except Exception as e:
            result["pumpportal_test"] = {"status": "failed", "error": str(e)}
        
        # Test Solana RPC
        try:
            solana_stats = await solana_service.get_quick_token_stats(mint_address)
            result["solana_test"] = {"status": "success", "data": solana_stats}
        except Exception as e:
            result["solana_test"] = {"status": "failed", "error": str(e)}
        
        return result
        
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
