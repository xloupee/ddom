'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, BarChart3, Users, TrendingUp, AlertCircle, Sun, Moon, Clipboard } from 'lucide-react'
import { apiClient, QuickStatsResponse } from '@/lib/api'

export default function Popup() {
    const router = useRouter()
    const [tokenAddress, setTokenAddress] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [quickStats, setQuickStats] = useState<QuickStatsResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Dark mode toggle logic
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark)

        setIsDarkMode(shouldUseDark)
        document.documentElement.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light')
    }, [])

    // Auto-detect clipboard on page load
    useEffect(() => {
        const checkClipboard = async () => {
            try {
                const clipboardText = await navigator.clipboard.readText()

                if (clipboardText && isValidSolanaAddress(clipboardText.trim())) {
                    const address = clipboardText.trim()
                    showNotification('success', `Found token in clipboard: ${address.slice(0, 6)}...${address.slice(-4)}`)
                    setTokenAddress(address)
                    // Auto-analyze after a short delay
                    setTimeout(() => {
                        if (address.trim()) {
                            setIsAnalyzing(true)
                            setError(null)
                            apiClient.getQuickStats(address.trim())
                                .then(stats => setQuickStats(stats))
                                .catch(err => setError(err instanceof Error ? err.message : 'Analysis failed'))
                                .finally(() => setIsAnalyzing(false))
                        }
                    }, 1000)
                }
            } catch (error) {
                // Clipboard access might be denied or not available
                console.log('Could not access clipboard:', error)
            }
        }

        checkClipboard()
    }, [])

    const toggleDarkMode = () => {
        const newTheme = !isDarkMode
        setIsDarkMode(newTheme)
        const theme = newTheme ? 'dark' : 'light'
        localStorage.setItem('theme', theme)
        document.documentElement.setAttribute('data-theme', theme)
    }

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

    const handleClipboardSearch = async () => {
        if (isAnalyzing) return

        try {
            const clipboardText = await navigator.clipboard.readText()

            if (!clipboardText) {
                showNotification('error', 'Clipboard is empty')
                return
            }

            const address = clipboardText.trim()

            if (!isValidSolanaAddress(address)) {
                showNotification('error', 'Clipboard does not contain a valid Solana address')
                return
            }

            showNotification('success', `Found token in clipboard: ${address.slice(0, 6)}...${address.slice(-4)}`)
            setTokenAddress(address)
            handleAnalyze()

        } catch (err) {
            showNotification('error', 'Could not access clipboard. Please check permissions.')
        }
    }

    const isValidSolanaAddress = (address: string): boolean => {
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
        return base58Regex.test(address)
    }

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message })
        setTimeout(() => setNotification(null), type === 'error' ? 4000 : 3000)
    }

    return (
        <div className="w-96 h-[500px] bg-surface-background flex flex-col relative">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-2 left-2 right-2 z-50 p-3 rounded-lg shadow-lg ${notification.type === 'success'
                    ? 'bg-brand-500 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    <div className="flex items-center gap-2">
                        {notification.type === 'success' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        )}
                        <span className="text-sm">{notification.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-surface-primary border-b border-border-primary p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-brand-500" />
                        <h1 className="font-semibold text-text-dark">ddom</h1>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-medium hover:text-text-dark"
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {isDarkMode ? (
                            <Sun className="w-4 h-4" />
                        ) : (
                            <Moon className="w-4 h-4" />
                        )}
                    </button>
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
                        onClick={handleClipboardSearch}
                        disabled={isAnalyzing}
                        className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Search token from clipboard"
                    >
                        <Clipboard className="w-4 h-4" />
                    </button>
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
                            <div className="card p-4 bg-gradient-to-r from-anthropic-beige-whisper to-anthropic-beige-ultra-light border-brand-200">
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

                        {/* Early Buyers Section */}
                        {quickStats.early_buyers && quickStats.early_buyers.length > 0 && (
                            <div className="card p-4">
                                <h3 className="font-medium text-text-dark mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-brand-500" />
                                    Early Buyers
                                </h3>
                                <div className="space-y-2">
                                    {quickStats.early_buyers.slice(0, 5).map((buyer, index) => (
                                        <div key={buyer.wallet_address} className="flex items-center justify-between p-2 bg-surface-secondary rounded">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        {buyer.rank}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-text-dark">
                                                        {buyer.wallet_address.slice(0, 6)}...{buyer.wallet_address.slice(-4)}
                                                    </p>
                                                    {buyer.purchase_time && (
                                                        <p className="text-xs text-text-subtle">
                                                            {new Date(buyer.purchase_time).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-text-dark">
                                                    {buyer.purchase_amount.toLocaleString()}
                                                </p>
                                                {buyer.sol_spent && (
                                                    <p className="text-xs text-text-subtle">
                                                        {buyer.sol_spent.toFixed(2)} SOL
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => router.push(`/analysis/${tokenAddress}`)}
                            className="w-full btn-primary text-sm"
                        >
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
