'use client'

import { useState } from 'react'
import { Search, BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { apiClient, QuickStatsResponse } from '@/lib/api'

export default function Popup() {
    const [tokenAddress, setTokenAddress] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [quickStats, setQuickStats] = useState<QuickStatsResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleAnalyze = async () => {
        if (!tokenAddress.trim()) return

        setIsAnalyzing(true)
        setError(null)

        try {
            const stats = await apiClient.getQuickStats(tokenAddress.trim())
            setQuickStats(stats)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed')
            setQuickStats(null)
        } finally {
            setIsAnalyzing(false)
        }
    }

    return (
        <div className="w-96 h-[500px] bg-surface-background flex flex-col">
            {/* Header */}
            <div className="bg-surface-primary border-b border-border-primary p-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-500" />
                    <h1 className="font-semibold text-text-dark">ddom</h1>
                </div>
                <p className="text-sm text-text-medium mt-1">Solana Token Analytics</p>
            </div>

            {/* Input Section */}
            <div className="p-4 bg-surface-primary">
                <label htmlFor="token-address" className="block text-sm font-medium text-text-dark mb-2">
                    Token Mint Address
                </label>
                <div className="flex gap-2">
                    <input
                        id="token-address"
                        type="text"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="3L8MNSHc3V7ssEdQiHRbGrJfMPaSJMKykhBHKgikpump"
                        className="input-primary flex-1 text-sm"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={!tokenAddress.trim() || isAnalyzing}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 p-4 overflow-y-auto">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full text-text-medium">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm">Analyzing token distribution...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-600">
                        <AlertCircle className="w-8 h-8 mb-3" />
                        <p className="text-sm text-center">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="mt-2 text-xs text-text-subtle hover:text-text-medium transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                ) : quickStats ? (
                    <div className="space-y-4">
                        {/* Token Info Header */}
                        {(quickStats.token_name || quickStats.token_symbol) && (
                            <div className="card p-4 bg-gradient-to-r from-brand-50 to-brand-100 border-brand-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">
                                            {quickStats.token_symbol?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-text-dark">
                                            {quickStats.token_name || 'Unknown Token'}
                                        </h3>
                                        <p className="text-sm text-text-medium">
                                            {quickStats.token_symbol || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Distribution Analytics */}
                        <div className="card p-4">
                            <h3 className="font-medium text-text-dark mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-brand-500" />
                                Holder Distribution
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-medium">Total Holders</span>
                                    <span className="text-sm font-semibold text-text-dark bg-surface-secondary px-2 py-1 rounded">
                                        {quickStats.total_holders.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-medium">Top 10 Control</span>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${quickStats.top_10_percentage > 80
                                            ? 'text-red-700 bg-red-100'
                                            : quickStats.top_10_percentage > 50
                                                ? 'text-yellow-700 bg-yellow-100'
                                                : 'text-green-700 bg-green-100'
                                        }`}>
                                        {quickStats.top_10_percentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-medium">Whale Accounts</span>
                                    <span className="text-sm font-semibold text-text-dark bg-surface-secondary px-2 py-1 rounded">
                                        {quickStats.whale_count}
                                    </span>
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div className="mt-4 pt-3 border-t border-border-primary">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${quickStats.top_10_percentage > 80
                                            ? 'bg-red-500'
                                            : quickStats.top_10_percentage > 50
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                        }`} />
                                    <span className="text-xs text-text-subtle">
                                        {quickStats.top_10_percentage > 80
                                            ? 'High concentration risk'
                                            : quickStats.top_10_percentage > 50
                                                ? 'Moderate concentration'
                                                : 'Well distributed'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full btn-primary text-sm">
                            View Detailed Analysis
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-text-subtle">
                        <BarChart3 className="w-12 h-12 mb-3 text-text-subtle/50" />
                        <p className="text-sm text-center">
                            Enter a Solana token address to analyze its holder distribution
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Stats Preview */}
            <div className="bg-surface-primary border-t border-border-primary p-3">
                {quickStats ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    {quickStats.token_symbol?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-text-dark">
                                    {quickStats.token_symbol || 'Unknown'}
                                </p>
                                <p className="text-xs text-text-subtle">
                                    {quickStats.total_holders.toLocaleString()} holders
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-text-medium">Risk Level</p>
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${quickStats.top_10_percentage > 80
                                        ? 'bg-red-500'
                                        : quickStats.top_10_percentage > 50
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`} />
                                <span className="text-xs font-medium text-text-dark">
                                    {quickStats.top_10_percentage > 80
                                        ? 'High'
                                        : quickStats.top_10_percentage > 50
                                            ? 'Medium'
                                            : 'Low'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-xs text-text-subtle">Enter a token address to analyze</p>
                    </div>
                )}
            </div>
        </div>
    )
}
