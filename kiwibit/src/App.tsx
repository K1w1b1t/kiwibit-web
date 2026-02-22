import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldCheck, Mail, Key, AlertTriangle } from 'lucide-react'

type AuthStatus = 'IDLE' | 'VALIDATING' | 'GRANTED' | 'DENIED'

const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('')
  useEffect(() => {
    let i = 0
    setDisplayedText('')
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i))
      i++
      if (i > text.length) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [text])

  return (
    <span className="terminal-text text-[10px] tracking-widest text-white/40 uppercase">
      {displayedText}
      <span className="animate-pulse">_</span>
    </span>
  )
}

const App: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<AuthStatus>('IDLE')
  const [error, setError] = useState(false)

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase())

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(email) || password.length < 4) {
      setStatus('DENIED')
      setError(true)
      setTimeout(() => {
        setStatus('IDLE')
        setError(false)
      }, 2000)
      return
    }

    setStatus('VALIDATING')
    await new Promise((r) => setTimeout(r, 2000))
    const isGranted = password === 'admin123' || Math.random() > 0.5

    if (isGranted) setStatus('GRANTED')
    else {
      setStatus('DENIED')
      setError(true)
      setTimeout(() => {
        setStatus('IDLE')
        setError(false)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white font-mono">
      <motion.div
        className={`relative p-12 max-w-md w-full bg-black/80 border rounded-xl ${
          status === 'GRANTED'
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
            : status === 'DENIED'
            ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
            : 'border-white/20'
        }`}
      >
        <div className="flex flex-col items-center mb-6">
          {status === 'GRANTED' ? (
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          ) : status === 'DENIED' ? (
            <AlertTriangle className="w-10 h-10 text-red-500" />
          ) : (
            <Shield className="w-10 h-10 text-white animate-pulse" />
          )}
          <h1 className="text-xs font-black tracking-[0.5em] uppercase text-white/90 mt-4">
            Kiwibit
          </h1>
        </div>

        <h2 className="text-2xl font-bold tracking-[0.4em] uppercase text-white text-center mb-6">
          {status === 'GRANTED'
            ? 'ACCESS_GRANTED'
            : status === 'DENIED'
            ? 'ACCESS_DENIED'
            : 'Restricted Access'}
        </h2>

        <div className="h-4 flex justify-center mb-6">
          <Typewriter text="AUTHENTICATION_REQUIRED // SECURE_SHELL_ACTIVE" />
        </div>

        <form className="space-y-4" onSubmit={handleAuthorize}>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'VALIDATING' || status === 'GRANTED'}
              placeholder="EMAIL_ADDRESS"
              required
              className={`w-full h-12 px-4 bg-transparent border border-white/20 text-white placeholder:text-white/30 rounded focus:ring-1 focus:ring-white/20 outline-none ${
                error ? 'border-red-500 ring-1 ring-red-500/30' : ''
              }`}
            />
            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={status === 'VALIDATING' || status === 'GRANTED'}
              placeholder="••••••••"
              required
              className={`w-full h-12 px-4 bg-transparent border border-white/20 text-white placeholder:text-white/30 rounded focus:ring-1 focus:ring-white/20 outline-none ${
                error ? 'border-red-500 ring-1 ring-red-500/30' : ''
              }`}
            />
            <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          </div>

          <button
            type="submit"
            disabled={status === 'VALIDATING' || status === 'GRANTED'}
            className="w-full h-12 bg-white text-black font-black uppercase tracking-[0.5em] rounded hover:opacity-90 transition-all"
          >
            {status === 'IDLE'
              ? 'Authorize Access'
              : status === 'VALIDATING'
              ? 'VALIDATING_CREDENTIALS...'
              : status === 'GRANTED'
              ? 'AUTHORIZED_SUCCESS'
              : 'ACCESS_DENIED'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default App