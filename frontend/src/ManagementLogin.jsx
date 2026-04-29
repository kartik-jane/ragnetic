import { useState } from 'react'

export default function ManagementLogin({ onManagementLoginSuccess, onBackClick }) {
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
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok && data.user && data.user.role === 'management') {
        onManagementLoginSuccess(data.user)
      } else {
        setError('Invalid management credentials')
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0d0d0d] via-[#1a1a1a] to-[#0d0d0d] p-4">
      {/* Back Button - Top Left */}
      <button
        onClick={onBackClick}
        className="fixed top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to User Login
      </button>
      
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img src="/logo.png" alt="RAGnetic AI" className="h-40 w-auto mx-auto" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="text-2xl font-bold text-white">Management Portal</h2>
          </div>
          <p className="text-gray-400 text-sm">Secure access for management</p>
        </div>

        {/* Management Login Form */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-purple-800/50 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Management Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="Enter management username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Management Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="Enter management password"
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login to Management'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  )
}