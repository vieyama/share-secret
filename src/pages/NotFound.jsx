import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#ff006e]/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-[#ff006e]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
        <p className="text-[#6b7280] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-[#00ff88] text-[#0a0a0f] rounded-lg font-semibold flex items-center gap-2 hover:bg-[#00ff88]/90 transition-colors"
        >
          <Home className="w-5 h-5" />
          Go Home
        </Link>
      </div>
    </div>
  )
}
