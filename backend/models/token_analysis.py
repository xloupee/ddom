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
    
class EarlyBuyer(BaseModel):
    wallet_address: str
    purchase_amount: float
    purchase_time: Optional[datetime] = None
    current_balance: Optional[float] = None
    profit_loss: Optional[float] = None
    rank: int

class QuickStatsResponse(BaseModel):
    total_holders: int
    top_10_percentage: float
    whale_count: int
    last_updated: datetime
    token_name: Optional[str] = None
    token_symbol: Optional[str] = None
    early_buyers: List[EarlyBuyer] = []
