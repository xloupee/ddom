import Link from 'next/link'
import { BarChart3, Chrome, Github } from 'lucide-react'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-12 px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <BarChart3 className="w-10 h-10 text-brand-600" />
                        <h1 className="text-4xl font-bold text-gray-900">ddom</h1>
                    </div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Solana memecoin analytics tool for analyzing token distribution and holder concentration
                    </p>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="card p-6">
                        <BarChart3 className="w-8 h-8 text-brand-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Token Analysis</h3>
                        <p className="text-gray-600 text-sm">
                            Analyze any SPL token's distribution by pasting its mint address
                        </p>
                    </div>
                    <div className="card p-6">
                        <Chrome className="w-8 h-8 text-brand-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Browser Extension</h3>
                        <p className="text-gray-600 text-sm">
                            Seamlessly analyze tokens while browsing DEXs and social media
                        </p>
                    </div>
                    <div className="card p-6">
                        <Github className="w-8 h-8 text-brand-600 mb-3" />
                        <h3 className="font-semibold text-gray-900 mb-2">Open Source</h3>
                        <p className="text-gray-600 text-sm">
                            Transparent analytics with open source blockchain data processing
                        </p>
                    </div>
                </div>

                {/* Demo Links */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center gap-4">
                        <Link
                            href="/popup"
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Try Extension Popup
                        </Link>
                        <button className="btn-secondary">
                            View Documentation
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        This is the development preview. Install as Chrome extension for full functionality.
                    </p>
                </div>
            </div>
        </div>
    )
}
