import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, Copy, Check, AlertTriangle, Shield, Clock } from 'lucide-react'
import { decodePayload, decryptSecret } from '../utils/crypto'
import { incrementViewCountAndGet, getViewCount } from '../utils'

export default function ViewSecret() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [decryptedSecret, setDecryptedSecret] = useState('')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(null)
  const [viewCount, setViewCount] = useState(0)
  const [maxViews, setMaxViews] = useState(999)
  const [destroyed, setDestroyed] = useState(false)
  const [data, setData] = useState(null)
  const hasAutoDecrypted = useRef(false)

  const handleDecrypt = useCallback(async (pwd, payload) => {
    setLoading(true)
    setError('')

    try {
      const secret = await decryptSecret(payload, pwd)
      const newCount = incrementViewCountAndGet(id)
      setDecryptedSecret(secret)
      setNeedsPassword(false)
      setViewCount(newCount)
    } catch (err) {
      console.error(err)
      setError('Failed to decrypt. Check your password.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) {
      setError('Invalid link')
      setLoading(false)
      return
    }

    try {
      const payload = decodePayload(id)
      
      if (!payload) {
        setError('Invalid or corrupted link')
        setLoading(false)
        return
      }

      const now = Date.now()
      const createdAt = payload.t
      const expiry = payload.x
      const viewLimit = payload.v

      if (now - createdAt > expiry) {
        setError('This secret has expired')
        setLoading(false)
        return
      }

      const currentViews = getViewCount(id)
      setMaxViews(viewLimit)
      setViewCount(currentViews)
      setData(payload)

      if (viewLimit !== 999 && currentViews >= viewLimit) {
        setDestroyed(true)
        setLoading(false)
        return
      }

      const remainingTime = Math.max(0, expiry - (now - createdAt))
      setTimeLeft(remainingTime)

      if (payload.p === 1) {
        setNeedsPassword(true)
        setLoading(false)
      } else {
        if (!hasAutoDecrypted.current) {
          hasAutoDecrypted.current = true
          handleDecrypt(null, payload)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load secret')
      setLoading(false)
    }
  }, [handleDecrypt, id])

  useEffect(() => {
    if (!timeLeft || timeLeft <= 0 || destroyed) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          setError('This secret has expired')
          setDestroyed(true)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, destroyed])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!loading && data) {
      handleDecrypt(password, data)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(decryptedSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTimeLeft = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s remaining`
    }
    return `${seconds}s remaining`
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-8 flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin mb-4" />
          <p className="text-[#6b7280]">Decrypting your secret...</p>
        </div>
      </div>
    )
  }

  if (destroyed || error === 'This secret has expired') {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="bg-[#12121a] border border-[#ff006e]/30 rounded-lg p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#ff006e]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#ff006e]" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Secret Not Available</h1>
          <p className="text-[#6b7280] mb-6">
            {destroyed 
              ? 'This secret has been viewed the maximum number of times and has been destroyed.'
              : 'This secret has expired and is no longer accessible.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#00ff88] text-[#0a0a0f] rounded-lg font-medium hover:bg-[#00ff88]/90 transition-colors"
          >
            Create a New Secret
          </button>
        </div>
      </div>
    )
  }

  if (needsPassword && !decryptedSecret) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#ff006e]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#ff006e]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Password Required</h1>
              <p className="text-sm text-[#6b7280]">This secret is password protected</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-md px-4 py-3 pr-12 text-white placeholder-[#374151] focus:outline-none focus:border-[#00ff88]/50"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-[#ff006e] text-sm mb-4">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#00ff88] text-[#0a0a0f] rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#00ff88]/90 transition-colors"
            >
              <Shield className="w-5 h-5" />
              Decrypt Secret
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (decryptedSecret) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00ff88]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Secret Revealed</h1>
                <p className="text-sm text-[#6b7280]">Your secret has been decrypted</p>
              </div>
            </div>
            {timeLeft && (
              <div className="flex items-center gap-1.5 text-sm text-[#6b7280]">
                <Clock className="w-4 h-4" />
                {formatTimeLeft(timeLeft)}
              </div>
            )}
          </div>

          <div className="relative mb-4">
            <div className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-4 pr-12">
              <pre className="text-white text-sm font-mono whitespace-pre-wrap break-all">
                {decryptedSecret}
              </pre>
            </div>
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 bg-[#1e1e2e] rounded-md text-[#6b7280] hover:text-white hover:bg-[#374151] transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-sm text-[#6b7280] mb-6">
            <span>
              {maxViews === 999 
                ? 'Unlimited views remaining' 
                : `View ${viewCount} of ${maxViews} (${maxViews - viewCount} remaining)`}
            </span>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 border border-[#1e1e2e] rounded-lg text-[#6b7280] hover:text-white hover:border-[#374151] transition-colors"
          >
            Share Your Own Secret
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-8 flex flex-col items-center">
        <AlertTriangle className="w-8 h-8 text-[#ff006e] mb-4" />
        <p className="text-[#6b7280]">{error || 'Something went wrong'}</p>
      </div>
    </div>
  )
}