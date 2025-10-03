'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BarChart3, Users, TrendingUp, AlertCircle, Sun, Moon, ArrowLeft, Clock, Wallet } from 'lucide-react'
import { apiClient, TokenAnalysisResponse, EarlyBuyer } from '@/lib/api'

export default function DetailedAnalysisPage() {
    const params = useParams()
    const router = useRouter()
    const mintAddress = params.mintAddress as string

    const [analysis, setAnalysis] = useState<TokenAnalysisResponse | null>(null)
    const [earlyBuyers, setEarlyBuyers] = useState<EarlyBuyer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)

    // Dark mode toggle logic
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)

        setIsDarkMode(shouldUseDark)
        document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light')
    }, [])

    const toggleDarkMode = () => {
        const newTheme = !isDarkMode
        setIsDarkMode(newTheme)
        const theme = newTheme ? 'dark' : 'light'
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
    }

    // Load detailed analysis
    useEffect(() => {
        const loadAnalysis = async () => {
            if (!mintAddress) return

            console.log('Loading analysis for:', mintAddress)
            setIsLoading(true)
            setError(null)

            try {
                // Get quick stats (this endpoint has the real data)
                console.log('Fetching quick stats...')
                const quickStats = await apiClient.getQuickStats(mintAddress)
                console.log('Quick stats:', quickStats)

                // Convert quick stats to analysis format for display
                const analysisData: TokenAnalysisResponse = {
                    token_metadata: {
                        mint_address: mintAddress,
                        name: quickStats.token_name || 'Unknown Token',
                        symbol: quickStats.token_symbol || 'UNK',
                        decimals: 6,
                        total_supply: 0 // We don't have this in quick stats
                    },
                    distribution_stats: {
                        total_holders: quickStats.total_holders,
                        top_10_percentage: quickStats.top_10_percentage,
                        top_100_percentage: 0, // Not available in quick stats
                        whale_count: quickStats.whale_count,
                        gini_coefficient: null // Not available in quick stats
                    },
                    top_holders: [], // Not available in quick stats
                    analysis_timestamp: quickStats.last_updated
                }

                console.log('Analysis data:', analysisData)
                setAnalysis(analysisData)

                // Get early buyers (first 10 transactions)
                if (quickStats.early_buyers && quickStats.early_buyers.length > 0) {
                    setEarlyBuyers(quickStats.early_buyers.slice(0, 10))
                } else {
                    // If no early buyers data, show empty array
                    console.log('No early buyers data available')
                    setEarlyBuyers([])
                }
            } catch (err) {
                console.error('Analysis failed:', err)
                setError(err instanceof Error ? err.message : 'Analysis failed')
            } finally {
                setIsLoading(false)
            }
        }

        loadAnalysis()
    }, [mintAddress])

    const getRiskLevel = (percentage: number) => {
        if (percentage > 80) return { level: 'High Risk', color: 'text-red-500', bgColor: 'bg-red-100' }
        if (percentage > 50) return { level: 'Moderate Risk', color: 'text-yellow-500', bgColor: 'bg-yellow-100' }
        return { level: 'Low Risk', color: 'text-green-500', bgColor: 'bg-green-100' }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-medium">Analyzing token distribution...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface-background flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-text-dark mb-2">Analysis Failed</h2>
                    <p className="text-text-medium mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-primary"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    if (!analysis) {
        return (
            <div className="min-h-screen bg-surface-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-medium">Loading analysis...</p>
                </div>
            </div>
        )
    }

    const riskInfo = getRiskLevel(analysis.distribution_stats.top_10_percentage)

    return (
        <div className="min-h-screen bg-surface-background">
            {/* Header */}
            <div className="bg-surface-primary border-b border-border-primary p-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-medium hover:text-text-dark"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-brand-500" />
                            <div>
                                <h1 className="text-xl font-semibold text-text-dark">Detailed Analysis</h1>
                                <p className="text-sm text-text-medium">
                                    {analysis.token_metadata.name || 'Unknown Token'} ({analysis.token_metadata.symbol || 'UNK'})
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-medium hover:text-text-dark"
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                {/* Token Overview */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-text-dark">Token Overview</h2>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                            {riskInfo.level}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-dark">
                                {analysis.distribution_stats.total_holders.toLocaleString()}
                            </div>
                            <div className="text-sm text-text-medium">Total Holders</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-dark">
                                {analysis.distribution_stats.top_10_percentage.toFixed(1)}%
                            </div>
                            <div className="text-sm text-text-medium">Top 10% Control</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-dark">
                                {analysis.distribution_stats.whale_count}
                            </div>
                            <div className="text-sm text-text-medium">Whale Accounts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-text-dark">
                                {analysis.distribution_stats.gini_coefficient?.toFixed(3) || 'N/A'}
                            </div>
                            <div className="text-sm text-text-medium">Gini Coefficient</div>
                        </div>
                    </div>
                </div>

                {/* Early Buyers Section */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-brand-500" />
                        <h2 className="text-lg font-semibold text-text-dark">First 10 Transaction Buyers</h2>
                    </div>

                    {earlyBuyers.length > 0 ? (
                        <div className="space-y-3">
                            {earlyBuyers.map((buyer, index) => (
                                <div key={buyer.wallet_address} className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">
                                                {buyer.rank}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-text-subtle" />
                                            <div>
                                                <p className="font-medium text-text-dark">
                                                    {buyer.wallet_address.slice(0, 8)}...{buyer.wallet_address.slice(-8)}
                                                </p>
                                                {buyer.purchase_time && (
                                                    <div className="flex items-center gap-1 text-xs text-text-subtle">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(buyer.purchase_time).toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-text-dark">
                                            {buyer.purchase_amount.toLocaleString()} tokens
                                        </p>
                                        {buyer.sol_spent && (
                                            <p className="text-sm text-text-subtle">
                                                {buyer.sol_spent.toFixed(4)} SOL
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-text-subtle">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No early buyer data available</p>
                        </div>
                    )}
                </div>

                {/* Top Holders */}
                {analysis.top_holders && analysis.top_holders.length > 0 && (
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-text-dark mb-4">Top Holders</h2>
                        <div className="space-y-3">
                            {analysis.top_holders.slice(0, 10).map((holder, index) => (
                                <div key={holder.wallet_address} className="flex items-center justify-between p-3 bg-surface-secondary rounded">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-text-dark">
                                                {holder.wallet_address.slice(0, 8)}...{holder.wallet_address.slice(-8)}
                                            </p>
                                            {holder.account_type && (
                                                <p className="text-xs text-text-subtle">
                                                    {holder.account_type}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-text-dark">
                                            {holder.balance.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-text-subtle">
                                            {((holder.balance / analysis.distribution_stats.total_supply) * 100).toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Analysis Timestamp */}
                <div className="text-center mt-6 text-sm text-text-subtle">
                    Last updated: {new Date(analysis.analysis_timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    )
}
