from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PumpPortalTokenStats(BaseModel):
    total_holders: int
    top_10_percentage: float
    whale_count: int
    total_volume_sol: float
    largest_holder_percentage: float
    analysis_timestamp: datetime

class TrendingToken(BaseModel):
    mint: str
    name: str
    symbol: str
    description: Optional[str] = None
    market_cap: float
    volume_24h: float
    price_change_24h: float
    holders_count: int
    image_uri: Optional[str] = None
    created_timestamp: datetime

class RealTimeStats(BaseModel):
    token_address: str
    current_price: float
    market_cap: float
    volume_24h: float
    holder_stats: PumpPortalTokenStats
    last_updated: datetime

class WebSocketMessage(BaseModel):
    event_type: str  # "newToken", "trade", "priceUpdate"
    data: dict
    timestamp: datetime
