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
                
                # Subscribe to new token creation events
                subscribe_message = {
                    "method": "subscribeNewToken"
                }
                await websocket.send(json.dumps(subscribe_message))
                logger.info("Subscribed to new token events")
                
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
    
    async def subscribe_to_token_trades(self, mint_address: str) -> AsyncGenerator[Dict, None]:
        """
        Subscribe to real-time trades for a specific token
        """
        try:
            async with websockets.connect(self.websocket_url) as websocket:
                logger.info(f"Connected to PumpPortal WebSocket for token {mint_address}")
                
                # Subscribe to trades for specific token
                subscribe_message = {
                    "method": "subscribeTokenTrade",
                    "keys": [mint_address]
                }
                await websocket.send(json.dumps(subscribe_message))
                logger.info(f"Subscribed to trades for token {mint_address}")
                
                async for message in websocket:
                    try:
                        data = json.loads(message)
                        yield data
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse WebSocket message: {message}")
                        continue
                        
        except Exception as e:
            logger.error(f"WebSocket connection error for token {mint_address}: {e}")
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
    
    async def get_early_buyers(self, mint_address: str, limit: int = 10) -> List[Dict]:
        """
        Get the first few buyers of a token based on trade history
        """
        try:
            # Get historical trades sorted by timestamp
            trades = await self.get_token_trades(mint_address, limit=5000)
            
            if not trades:
                return []
            
            # Filter only buy trades and sort by timestamp
            buy_trades = [trade for trade in trades if trade.is_buy]
            buy_trades.sort(key=lambda x: x.timestamp)
            
            # Get unique early buyers (first time they bought)
            early_buyers = []
            seen_wallets = set()
            
            for trade in buy_trades:
                if trade.trader not in seen_wallets and len(early_buyers) < limit:
                    early_buyers.append({
                        "wallet_address": trade.trader,
                        "purchase_amount": trade.amount,
                        "purchase_time": trade.timestamp,
                        "sol_spent": trade.price,
                        "rank": len(early_buyers) + 1
                    })
                    seen_wallets.add(trade.trader)
            
            return early_buyers
            
        except Exception as e:
            logger.error(f"Error fetching early buyers: {e}")
            return []

    async def get_token_holders_analysis(self, mint_address: str) -> Dict:
        """
        Analyze token holders using PumpPortal real-time trade data
        """
        try:
            # Get historical trades first
            trades = await self.get_token_trades(mint_address, limit=2000)  # Increased limit for better accuracy
            
            if not trades:
                logger.warning(f"No trades found for token {mint_address}")
                return {
                    "total_holders": 0,
                    "top_10_percentage": 0.0,
                    "whale_count": 0,
                    "total_volume_sol": 0.0,
                    "largest_holder_percentage": 0.0,
                    "analysis_timestamp": datetime.utcnow()
                }
            
            # Analyze holder distribution from trades
            holder_balances = {}
            total_volume_sol = 0
            total_volume_tokens = 0
            unique_traders = set()
            
            # Process all trades to build holder balances
            for trade in trades:
                trader = trade.trader
                token_amount = trade.amount
                sol_amount = trade.price
                
                unique_traders.add(trader)
                
                if trader not in holder_balances:
                    holder_balances[trader] = {
                        'tokens': 0,
                        'trades': 0,
                        'last_trade': trade.timestamp
                    }
                
                # Update balances based on buy/sell
                if trade.is_buy:
                    holder_balances[trader]['tokens'] += token_amount
                else:
                    holder_balances[trader]['tokens'] -= token_amount
                
                holder_balances[trader]['trades'] += 1
                holder_balances[trader]['last_trade'] = max(
                    holder_balances[trader]['last_trade'], 
                    trade.timestamp
                )
                
                total_volume_sol += sol_amount
                total_volume_tokens += token_amount
            
            # Filter active holders (positive balances)
            active_holders = {
                wallet: data for wallet, data in holder_balances.items() 
                if data['tokens'] > 0.001  # Filter dust
            }
            
            if not active_holders:
                return {
                    "total_holders": len(unique_traders),
                    "top_10_percentage": 0.0,
                    "whale_count": 0,
                    "total_volume_sol": round(total_volume_sol, 2),
                    "largest_holder_percentage": 0.0,
                    "analysis_timestamp": datetime.utcnow()
                }
            
            # Sort holders by token balance
            sorted_holders = sorted(
                active_holders.items(), 
                key=lambda x: x[1]['tokens'], 
                reverse=True
            )
            
            # Calculate distribution stats
            total_holders = len(active_holders)
            total_circulating = sum(data['tokens'] for data in active_holders.values())
            
            # Top 10 holders percentage
            top_10_holders = sorted_holders[:10]
            top_10_tokens = sum(data['tokens'] for _, data in top_10_holders)
            top_10_percentage = (top_10_tokens / total_circulating * 100) if total_circulating > 0 else 0
            
            # Whale count (holders with >1% of circulating supply)
            whale_threshold = total_circulating * 0.01
            whale_count = len([
                data for _, data in sorted_holders 
                if data['tokens'] >= whale_threshold
            ])
            
            # Largest holder percentage
            largest_holder_percentage = (
                sorted_holders[0][1]['tokens'] / total_circulating * 100
            ) if sorted_holders and total_circulating > 0 else 0
            
            return {
                "total_holders": total_holders,
                "top_10_percentage": round(top_10_percentage, 2),
                "whale_count": whale_count,
                "total_volume_sol": round(total_volume_sol, 2),
                "largest_holder_percentage": round(largest_holder_percentage, 2),
                "unique_traders": len(unique_traders),
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
