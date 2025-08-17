const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TokenHolder {
    wallet_address: string
    balance: number
    percentage: number
    rank: number
    is_whale: boolean
    account_type?: string
}

export interface TokenMetadata {
    mint_address: string
    name?: string
    symbol?: string
    decimals: number
    total_supply: number
}

export interface DistributionStats {
    total_holders: number
    top_10_percentage: number
    top_100_percentage: number
    whale_count: number
    gini_coefficient?: number
}

export interface TokenAnalysisResponse {
    token_metadata: TokenMetadata
    distribution_stats: DistributionStats
    top_holders: TokenHolder[]
    analysis_timestamp: string
}

export interface QuickStatsResponse {
    total_holders: number
    top_10_percentage: number
    whale_count: number
    last_updated: string
}

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    async analyzeToken(mintAddress: string): Promise<TokenAnalysisResponse> {
        const response = await fetch(`${this.baseUrl}/api/analyze-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mint_address: mintAddress
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to analyze token')
        }

        return response.json()
    }

    async getQuickStats(mintAddress: string): Promise<QuickStatsResponse> {
        const response = await fetch(`${this.baseUrl}/api/token/${mintAddress}/quick-stats`)

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to get quick stats')
        }

        return response.json()
    }

    async healthCheck(): Promise<{ status: string; service: string }> {
        const response = await fetch(`${this.baseUrl}/health`)
        return response.json()
    }
}

export const apiClient = new ApiClient()
