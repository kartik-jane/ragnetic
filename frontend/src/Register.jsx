import { useState } from 'react'
import { apiFetch } from './api'

export default function Register({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    api_key: '',
    role: 'user'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    // Validation
    if (formData.full_name.trim().split(' ').length < 2) {
      setError('Please enter your full name (first and last name)')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    if (formData.api_key.length !== 16) {
      setError('Company Key must be exactly 16 characters')
      return
    }

    setLoading(true)

    try {
      const res = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          api_key: formData.api_key,
          role: formData.role
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMessage('Registration successful! Redirecting to login...')
        setFormData({ 
          full_name: '', 
          username: '', 
          email: '', 
          password: '', 
          confirm_password: '', 
          api_key: '',
          role: 'user'
        })
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onBackToLogin()
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
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
      <div className="w-full max-w-3xl" style={{position: 'relative', zIndex: 1}}>
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="RAGnetic AI" className="h-40 w-auto mx-auto" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{color: '#e8f0f8', fontFamily: 'monospace', letterSpacing: '-0.5px'}}>Create Account</h2>
          <p className="text-sm" style={{color: '#7a9ab8'}}>Sign up to get started with RAGnetic AI</p>
        </div>

        {/* Register Form */}
        <div style={{background: '#111927', border: '1px solid #1e2f45', borderRadius: '16px', padding: '32px'}}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full Name and Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#7a9ab8'}}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition" style={{background: '#0b1220', border: '1px solid #1e2f45'}}
                  placeholder="Enter your full name"
                />
              </div>

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
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="Choose a username"
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                placeholder="Enter your email"
              />
            </div>

            {/* Row 3: Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            {/* Row 4: Company Key and Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Key
                </label>
                <input
                  type="text"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleChange}
                  required
                  maxLength="16"
                  className="w-full rounded-xl px-4 py-3 text-white font-mono focus:outline-none transition" style={{background: '#0b1220', border: '1px solid #1e2f45'}}
                  placeholder="Enter your 16-character key"
                />
                <p className="text-xs mt-1" style={{color: '#3d5470'}}>
                  Contact your administrator to get a company key
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl px-4 py-3 text-white focus:outline-none transition" style={{background: '#0b1220', border: '1px solid #1e2f45'}}
                >
                  <option value="user">User</option>
                  <option value="management">Management</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-3 text-green-400 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {successMessage}
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
                  Registering...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{color: '#7a9ab8'}}>
            Already have an account?{' '}
            <button
              onClick={onBackToLogin}
              style={{color: '#00e5ff', fontWeight: '600'}}
            >
              Login here
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
