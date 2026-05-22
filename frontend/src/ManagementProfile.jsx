import { useEffect, useState } from 'react'
import API_URL from './apiConfig'

export default function ManagementProfile({ onBack }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load profile')
      const data = await res.json()
      setProfile(data.user)
    } catch (err) {
      console.error(err)
      alert('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[#0d0d0d] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
            title="Back to Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-200">Management Profile</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{profile?.full_name || 'N/A'}</h2>
            <p className="text-gray-400">Management Account</p>
          </div>

          <div className="space-y-4 bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-sm text-gray-400 font-medium">Full Name:</span>
              <span className="text-sm text-white">{profile?.full_name || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-sm text-gray-400 font-medium">Email:</span>
              <span className="text-sm text-white">{profile?.email || 'N/A'}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-sm text-gray-400 font-medium">Role:</span>
              <span className="text-sm text-white capitalize">{profile?.role || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-400 font-medium">Member Since:</span>
              <span className="text-sm text-white">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
