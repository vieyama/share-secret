import { useState } from 'react'
import { Shield, Clock, Eye, Lock, Key, Loader2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { encryptSecret, createShareableLink } from '../utils/crypto'

const expiryOptions = [
  { value: 0.5, label: '30 seconds' },
  { value: 1, label: '1 minutes' },
  { value: 5, label: '5 minutes' },
  { value: 60, label: '1 hour' },
  { value: 1440, label: '24 hours' },
  { value: 10080, label: '7 days' }
]

const viewLimitOptions = [
  { value: 1, label: '1 view' },
  { value: 2, label: '2 views' },
  { value: 5, label: '5 views' },
  { value: 999, label: 'Unlimited' }
]

export default function CreateSecret() {
  const [secret, setSecret] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [expiry, setExpiry] = useState(60)
  const [viewLimit, setViewLimit] = useState(1)
  const [showOptions, setShowOptions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareableLink, setShareableLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!secret.trim()) {
      setError('Please enter a secret')
      return
    }
    
    setError('')
    setLoading(true)
    
    try {
      const encryptedData = await encryptSecret(secret, usePassword ? password : null)
      const link = createShareableLink(encryptedData, expiry, viewLimit)
      setShareableLink(link)
    } catch (err) {
      setError('Failed to encrypt secret. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (shareableLink) {
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const resetForm = () => {
    setSecret('')
    setPassword('')
    setShareableLink(null)
    setError('')
  }

  if (shareableLink) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#00ff88]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Secret Encrypted</h1>
              <p className="text-sm text-[#6b7280]">Your secret has been secured</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm text-[#6b7280] mb-2">Share this link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareableLink}
                readOnly
                className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-md px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-[#00ff88]/50"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-3 bg-[#00ff88] text-[#0a0a0f] rounded-md font-medium flex items-center gap-2 hover:bg-[#00ff88]/90 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="bg-[#0a0a0f] rounded-md p-4 text-sm">
            <div className="flex items-start gap-3">
              <Key className="w-4 h-4 text-[#ff006e] mt-0.5" />
              <div className="text-[#6b7280]">
                <p className="mb-2">This link contains your encrypted secret. Once all views are used or the link expires, the secret will be permanently inaccessible.</p>
                <p className="text-[#ff006e]">Make sure to copy and save this link now. It will not be stored.</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={resetForm}
            className="w-full mt-6 py-3 border border-[#1e1e2e] rounded-md text-[#6b7280] hover:text-white hover:border-[#374151] transition-colors"
          >
            Create Another Secret
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Share a Secret</h1>
        <p className="text-[#6b7280]">
          Send encrypted messages, passwords, or sensitive data securely
        </p>
      </div>

      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-lg p-6">
        <div className="mb-6">
          <textarea
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Paste your secret here..."
            className={`w-full h-40 bg-[#0a0a0f] border rounded-lg px-4 py-3 text-white placeholder-[#374151] font-mono text-sm resize-none focus:outline-none transition-colors ${error ? 'border-[#ff006e]' : 'border-[#1e1e2e] focus:border-[#00ff88]/50'}`}
          />
          {error && <p className="text-[#ff006e] text-sm mt-2">{error}</p>}
          <div className="text-right text-sm text-[#374151] mt-1">
            {secret.length} characters
          </div>
        </div>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-2 text-[#6b7280] hover:text-white mb-4 transition-colors"
        >
          {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Advanced Options
        </button>

        {showOptions && (
          <div className="space-y-4 mb-6 pb-6 border-b border-[#1e1e2e] animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm text-white">
                  <Lock className="w-4 h-4 text-[#6b7280]" />
                  Password Protection
                </label>
                <button
                  onClick={() => setUsePassword(!usePassword)}
                  className={`w-12 h-6 rounded-full transition-colors ${usePassword ? 'bg-[#00ff88]' : 'bg-[#1e1e2e]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${usePassword ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              
              {usePassword && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-md px-4 py-2.5 text-white placeholder-[#374151] text-sm focus:outline-none focus:border-[#00ff88]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-white mb-2">
                <Clock className="w-4 h-4 text-[#6b7280]" />
                Expiration Time
              </label>
              <div className="grid grid-cols-2 gap-2">
                {expiryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setExpiry(option.value)}
                    className={`py-2 px-3 rounded-md text-sm transition-colors ${expiry === option.value ? 'bg-[#00ff88] text-[#0a0a0f]' : 'bg-[#0a0a0f] text-[#6b7280] hover:text-white border border-[#1e1e2e]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-white mb-2">
                <Eye className="w-4 h-4 text-[#6b7280]" />
                View Limit
              </label>
              <div className="grid grid-cols-2 gap-2">
                {viewLimitOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setViewLimit(option.value)}
                    className={`py-2 px-3 rounded-md text-sm transition-colors ${viewLimit === option.value ? 'bg-[#00ff88] text-[#0a0a0f]' : 'bg-[#0a0a0f] text-[#6b7280] hover:text-white border border-[#1e1e2e]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading || !secret.trim()}
          className="w-full py-3.5 bg-[#00ff88] text-[#0a0a0f] rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#00ff88]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Encrypting...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Encrypt & Create Link
            </>
          )}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[#374151]">
        <span className="flex items-center gap-2">
          <Lock className="w-4 h-4" />
          End-to-end encrypted
        </span>
        <span className="flex items-center gap-2">
          <Key className="w-4 h-4" />
          Zero server storage
        </span>
      </div>
    </div>
  )
}
