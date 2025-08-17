'use client'

import { useState } from 'react'
import { Search, BarChart3, Users, TrendingUp } from 'lucide-react'

export default function Popup() {
    const [tokenAddress, setTokenAddress] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    const handleAnalyze = async () => {
        if (!tokenAddress.trim()) return

        setIsAnalyzing(true)
        // TODO: Implement token analysis
        setTimeout(() => setIsAnalyzing(false), 2000)
    }

    return (
        <div className="w-96 h-[500px] bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-600" />
                    <h1 className="font-semibold text-gray-900">ddom</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">Solana Token Analytics</p>
            </div>

            {/* Input Section */}
            <div className="p-4 bg-white">
                <label htmlFor="token-address" className="block text-sm font-medium text-gray-700 mb-2">
                    Token Mint Address
                </label>
                <div className="flex gap-2">
                    <input
                        id="token-address"
                        type="text"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        placeholder="3L8MNSHc3V7ssEdQiHRbGrJfMPaSJMKykhBHKgikpump"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm">Analyzing token distribution...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <BarChart3 className="w-12 h-12 mb-3 text-gray-300" />
                        <p className="text-sm text-center">
                            Enter a Solana token address to analyze its holder distribution
                        </p>
                    </div>
                )}
            </div>

            {/* Quick Stats Preview */}
            <div className="bg-white border-t border-gray-200 p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                        <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600">Holders</p>
                        <p className="text-sm font-medium text-gray-900">-</p>
                    </div>
                    <div>
                        <TrendingUp className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600">Top 10%</p>
                        <p className="text-sm font-medium text-gray-900">-</p>
                    </div>
                    <div>
                        <BarChart3 className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600">Whales</p>
                        <p className="text-sm font-medium text-gray-900">-</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
