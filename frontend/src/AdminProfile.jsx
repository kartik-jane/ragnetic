import { useEffect, useState } from 'react'

export default function AdminProfile({ onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/admin/check-auth', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load admin profile')
      const data = await res.json()
      setProfile(data.admin)
      setForm({ username: data.admin.username || '', password: '' })
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('http://localhost:3000/profile', {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      fetchProfile(); onClose()
    } catch (err) { console.error(err); alert(err.message) } finally { setSaving(false) }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-lg font-bold mb-4">Admin Profile</h3>
        <div className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Username</label>
            <input name="username" value={form.username} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white" /></div>
          <div><label className="block text-sm text-gray-300 mb-1">New password (leave blank to keep)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full px-3 py-2 rounded bg-gray-800 text-white" /></div>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 rounded bg-gray-700">Cancel</button>
        <button onClick={save} className="px-3 py-2 rounded bg-blue-600" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
      </div>
    </div>
  )
}
