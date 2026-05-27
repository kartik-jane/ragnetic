import { useState } from 'react'
import { apiFetch } from './api'

export default function Login({ onLoginSuccess, onRegisterClick, onAdminClick, onManagementClick }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        onLoginSuccess(data.user)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{background: '#060a10', backgroundImage: 'linear-gradient(#1e2f45 1px, transparent 1px), linear-gradient(90deg, #1e2f45 1px, transparent 1px)', backgroundSize: '60px 60px'}}>
      <div style={{position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(0,229,255,0.10) 0%, rgba(57,255,138,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0}}></div>
      <div className="w-full max-w-md" style={{position: 'relative', zIndex: 1}}>
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="RAGnetic AI" className="h-40 w-auto mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{color: '#e8f0f8', fontFamily: 'monospace', letterSpacing: '-0.5px'}}>Welcome Back</h2>
          <p className="text-sm" style={{color: '#7a9ab8'}}>Login to continue to RAGnetic AI</p>
        </div>

        {/* Login Form */}
        <div style={{background: '#111927', border: '1px solid #1e2f45', borderRadius: '16px', padding: '32px'}}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition" style={{background: '#0b1220', border: '1px solid #1e2f45', outline: 'none'}}
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed" style={{background: 'linear-gradient(135deg, #00e5ff, #39ff8a)', color: '#060a10', fontFamily: 'monospace', letterSpacing: '0.5px'}}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-center text-sm" style={{color: '#7a9ab8'}}>
              Don't have an account?{' '}
              <button
                onClick={onRegisterClick}
                style={{color: '#00e5ff', fontWeight: '600'}}
              >
                Register here
              </button>
            </div>
            
            <div className="pt-3 space-y-2" style={{borderTop: '1px solid #1e2f45'}}>
              <button
                onClick={onAdminClick}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2" style={{background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.3)', color: '#ffb347'}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Admin Access
              </button>
              
              <button
                onClick={onManagementClick}
                className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2" style={{background: 'rgba(57,255,138,0.08)', border: '1px solid rgba(57,255,138,0.3)', color: '#39ff8a'}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Management Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
