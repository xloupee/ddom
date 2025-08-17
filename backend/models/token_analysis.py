from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TokenHolder(BaseModel):
    wallet_address: str
    balance: float
    percentage: float
    rank: int
    is_whale: bool
    account_type: Optional[str] = None  # "exchange", "liquidity_pool", "individual", etc.

class TokenMetadata(BaseModel):
    mint_address: str
    name: Optional[str] = None
    symbol: Optional[str] = None
    decimals: int
    total_supply: float
    
class DistributionStats(BaseModel):
    total_holders: int
    top_10_percentage: float
    top_100_percentage: float
    whale_count: int  # holders with >1% of supply
    gini_coefficient: Optional[float] = None  # measure of inequality
    
class TokenAnalysisResponse(BaseModel):
    token_metadata: TokenMetadata
    distribution_stats: DistributionStats
    top_holders: List[TokenHolder]
    analysis_timestamp: datetime
    
class QuickStatsResponse(BaseModel):
    total_holders: int
    top_10_percentage: float
    whale_count: int
    last_updated: datetime
