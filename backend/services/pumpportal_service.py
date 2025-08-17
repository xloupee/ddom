import asyncio
import json
import websockets
import httpx
import os
from typing import Dict, List, Optional, AsyncGenerator
from datetime import datetime
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class TokenCreationEvent(BaseModel):
    mint: str
    symbol: str
    name: str
    description: Optional[str] = None
    creator: str
    market_cap: float
    timestamp: datetime
    image_uri: Optional[str] = None

class TradeEvent(BaseModel):
    mint: str
    signature: str
    trader: str
    is_buy: bool
    amount: float
    price: float
    market_cap: float
    timestamp: datetime

class PumpPortalService:
    def __init__(self):
        self.api_key = os.getenv("PUMPPORTAL_API_KEY")
        self.websocket_url = "wss://pumpportal.fun/api/data"
        self.base_url = "https://pumpportal.fun/api"
        self.http_client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
        self.active_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        
    async def connect_websocket(self) -> AsyncGenerator[Dict, None]:
        """
        Connect to PumpPortal WebSocket and yield real-time events
        """
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info("Connected to PumpPortal WebSocket")
                
                # Subscribe to all events
                subscribe_message = {
                    "method": "subscribeNewToken"
                }
                await websocket.send(json.dumps(subscribe_message))
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        yield data
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse WebSocket message: {message}")
                        continue
                        
        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            raise
    
    async def get_token_trades(self, mint_address: str, limit: int = 100) -> List[TradeEvent]:
        """
        Get recent trades for a specific token
        """
        try:
            # Use the correct PumpPortal API endpoint
            url = f"{self.base_url}/trades"
            response = await self.http_client.get(url, params={
                "mint": mint_address,
                "limit": limit
            })
            
            if response.status_code == 200:
                trades_data = response.json()
                trades = []
                
                for trade in trades_data:
                    trades.append(TradeEvent(
                        mint=trade.get("mint", ""),
                        signature=trade.get("signature", ""),
                        trader=trade.get("user", ""),
                        is_buy=trade.get("is_buy", False),
                        amount=float(trade.get("token_amount", 0)),
                        price=float(trade.get("sol_amount", 0)),
                        market_cap=float(trade.get("market_cap", 0)),
                        timestamp=datetime.fromtimestamp(trade.get("timestamp", 0))
                    ))
                
                return trades
            else:
                logger.error(f"Failed to fetch trades: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching trades: {e}")
            return []
    
    async def get_token_holders_analysis(self, mint_address: str) -> Dict:
        """
        Analyze token holders using PumpPortal trade data
        """
        try:
            trades = await self.get_token_trades(mint_address, limit=1000)
            
            # Analyze holder distribution from trades
            holder_balances = {}
            total_volume = 0
            
            for trade in trades:
                trader = trade.trader
                amount = trade.amount
                
                if trader not in holder_balances:
                    holder_balances[trader] = 0
                
                if trade.is_buy:
                    holder_balances[trader] += amount
                else:
                    holder_balances[trader] -= amount
                
                total_volume += trade.price
            
            # Filter out holders with zero or negative balances
            active_holders = {k: v for k, v in holder_balances.items() if v > 0}
            
            # Sort holders by balance
            sorted_holders = sorted(active_holders.items(), key=lambda x: x[1], reverse=True)
            
            # Calculate distribution stats
            total_holders = len(active_holders)
            total_supply_traded = sum(active_holders.values())
            
            # Top 10 holders percentage
            top_10_holders = sorted_holders[:10]
            top_10_supply = sum([balance for _, balance in top_10_holders])
            top_10_percentage = (top_10_supply / total_supply_traded * 100) if total_supply_traded > 0 else 0
            
            # Whale count (holders with >1% of traded supply)
            whale_threshold = total_supply_traded * 0.01
            whale_count = len([balance for _, balance in sorted_holders if balance >= whale_threshold])
            
            return {
                "total_holders": total_holders,
                "top_10_percentage": round(top_10_percentage, 2),
                "whale_count": whale_count,
                "total_volume_sol": round(total_volume, 2),
                "largest_holder_percentage": round((sorted_holders[0][1] / total_supply_traded * 100), 2) if sorted_holders else 0,
                "analysis_timestamp": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error analyzing token holders: {e}")
            return {
                "total_holders": 0,
                "top_10_percentage": 0.0,
                "whale_count": 0,
                "total_volume_sol": 0.0,
                "largest_holder_percentage": 0.0,
                "analysis_timestamp": datetime.utcnow()
            }
    
    async def get_trending_tokens(self, limit: int = 20) -> List[Dict]:
        """
        Get trending tokens from PumpPortal
        """
        try:
            # Use the correct PumpPortal API endpoint  
            url = f"{self.base_url}/tokens"
            response = await self.http_client.get(url, params={"limit": limit})
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to fetch trending tokens: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error fetching trending tokens: {e}")
            return []
    
    async def close(self):
        """Clean up resources"""
        await self.http_client.aclose()
