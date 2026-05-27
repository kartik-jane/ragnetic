import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [activeMembers, setActiveMembers] = useState([])
  const [activeMemberTab, setActiveMemberTab] = useState('user')
  const [loading, setLoading] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // API Key Management State
  const [apiKeys, setApiKeys] = useState([])
  const [loadingKeys, setLoadingKeys] = useState(false)
  const [keyEmail, setKeyEmail] = useState('')
  const [keyRole, setKeyRole] = useState('user')
  const [generatingKey, setGeneratingKey] = useState(false)
  const [keyMessage, setKeyMessage] = useState('')

  // AI Chat State
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [showChatSidebar, setShowChatSidebar] = useState(true)
  const [editingConvId, setEditingConvId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, convId: null, convTitle: '' })
  const [attachedFiles, setAttachedFiles] = useState([])
  const [currentFileContext, setCurrentFileContext] = useState(null)

  // Settings State
  const [allUsers, setAllUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingsUserTab, setSettingsUserTab] = useState('user')

  // Shared section classes to ensure consistent cut-to-cut layout
  const sectionClass = "bg-gray-900/50 border border-gray-800 rounded-2xl p-6"
  const headerWrapperClass = "flex items-center justify-between mb-4"

  // Track loaded data to avoid unnecessary reloads
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (activeTab === 'dashboard' && !dataLoaded) {
      loadDashboardData()
    }
  }, [activeTab, dataLoaded])

  useEffect(() => {
    if (activeTab === 'settings' && allUsers.length === 0) {
      loadAllUsers()
    }
  }, [activeTab])

  const loadDashboardData = async () => {
    setLoading(true)
    setLoadingKeys(true)
    
    try {
      // Load both users and API keys in parallel for better performance
      const [usersResponse, keysResponse] = await Promise.all([
        fetch('http://localhost:3000/admin/all-users', { credentials: 'include' }),
        fetch('http://localhost:3000/admin/api-keys', { credentials: 'include' })
      ])
      
      if (!usersResponse.ok || !keysResponse.ok) {
        throw new Error('Failed to load dashboard data')
      }
      
      const [usersData, keysData] = await Promise.all([
        usersResponse.json(),
        keysResponse.json()
      ])
      
      // Process users data
      const usersWithRole = (usersData.users || []).map(user => ({ ...user, role: 'User' }))
      const managementWithRole = (usersData.management_users || []).map(user => ({ ...user, role: 'Management' }))
      setActiveMembers([...usersWithRole, ...managementWithRole])
      
      // Process API keys data
      setApiKeys(keysData.api_keys || [])
      
      setDataLoaded(true)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
      setLoadingKeys(false)
    }
  }

  const loadApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await fetch('http://localhost:3000/admin/api-keys', {
        credentials: 'include'
      })
      const data = await res.json()
      setApiKeys(data.api_keys || [])
    } catch (error) {
      console.error('Error loading API keys:', error)
    } finally {
      setLoadingKeys(false)
    }
  }

  const generateApiKey = async () => {
    if (!keyEmail.trim()) {
      setKeyMessage('Please enter an email address')
      setTimeout(() => setKeyMessage(''), 3000)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(keyEmail)) {
      setKeyMessage('Please enter a valid email address')
      setTimeout(() => setKeyMessage(''), 3000)
      return
    }

    setGeneratingKey(true)
    try {
      const res = await fetch('http://localhost:3000/admin/api-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: keyEmail, role: keyRole })
      })
      const data = await res.json()
      
      if (res.ok) {
        setKeyMessage(`API Key Generated: ${data.api_key}`)
        setKeyEmail('')
        loadApiKeys()
        setTimeout(() => setKeyMessage(''), 5000)
      } else {
        setKeyMessage(data.error || 'Failed to generate API key')
        setTimeout(() => setKeyMessage(''), 3000)
      }
    } catch (error) {
      setKeyMessage('Error generating API key')
      setTimeout(() => setKeyMessage(''), 3000)
    } finally {
      setGeneratingKey(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setKeyMessage('API Key copied to clipboard!')
    setTimeout(() => setKeyMessage(''), 2000)
  }

  const deleteApiKey = async (keyId, email) => {
    if (!confirm(`Are you sure you want to delete the API key for "${email}"?`)) {
      return
    }

    try {
      const res = await fetch(`http://localhost:3000/admin/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      
      if (res.ok) {
        setKeyMessage(`API key for "${email}" deleted successfully`)
        loadApiKeys()
        setTimeout(() => setKeyMessage(''), 3000)
      } else {
        setKeyMessage(data.error || 'Failed to delete API key')
        setTimeout(() => setKeyMessage(''), 3000)
      }
    } catch (error) {
      setKeyMessage('Error deleting API key')
      setTimeout(() => setKeyMessage(''), 3000)
    }
  }

  const deleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will remove all their conversations and messages.`)) {
      return
    }

    try {
      const res = await fetch(`http://localhost:3000/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json()
      
      if (res.ok) {
        setKeyMessage(`User "${username}" deleted successfully`)
        loadActiveMembers()
        setTimeout(() => setKeyMessage(''), 3000)
      } else {
        setKeyMessage(data.error || 'Failed to delete user')
        setTimeout(() => setKeyMessage(''), 3000)
      }
    } catch (error) {
      setKeyMessage('Error deleting user')
      setTimeout(() => setKeyMessage(''), 3000)
    }
  }

  // Settings Functions
  const loadAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('http://localhost:3000/admin/all-users', {
        credentials: 'include'
      })
      const data = await res.json()
      
      // Process users data - combine users and management_users like dashboard
      const usersWithRole = (data.users || []).map(user => ({ ...user, role: 'User' }))
      const managementWithRole = (data.management_users || []).map(user => ({ ...user, role: 'Management' }))
      setAllUsers([...usersWithRole, ...managementWithRole])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3000/admin/toggle-user/${userId}`, {
        method: 'POST',
        credentials: 'include'
      })
      if (res.ok) {
        setSettingsMessage('User status updated successfully')
        loadAllUsers()
        setTimeout(() => setSettingsMessage(''), 3000)
      } else {
        setSettingsMessage('Failed to update user status')
        setTimeout(() => setSettingsMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      setSettingsMessage('Error updating user status')
      setTimeout(() => setSettingsMessage(''), 3000)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch('http://localhost:3000/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      })
      if (res.ok) {
        setSettingsMessage('Password changed successfully')
        setTimeout(() => setSettingsMessage(''), 3000)
      } else {
        const data = await res.json()
        setSettingsMessage(data.error || 'Failed to change password')
        setTimeout(() => setSettingsMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setSettingsMessage('Error changing password')
      setTimeout(() => setSettingsMessage(''), 3000)
    }
  }

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files))
  }

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const uploadFiles = async (indexType) => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadStatus('Uploading...')
    let successCount = 0
    let failCount = 0

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('index_type', indexType)

      try {
        const res = await fetch('http://localhost:3000/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        const data = await res.json()
        console.log(`Upload response for ${file.name}:`, res.status, data)

        if (res.ok) {
          successCount++
          console.log(`✓ ${file.name} uploaded successfully`)
        } else {
          failCount++
          console.error(`✗ ${file.name} failed:`, data.error)
        }
      } catch (error) {
        failCount++
        console.error(`Upload error for ${file.name}:`, error)
      }
    }

    setUploadStatus(`Upload complete: ${successCount} succeeded, ${failCount} failed`)
    setSelectedFiles([])
    setUploading(false)
    setTimeout(() => setUploadStatus(''), 3000)
  }

  // AI Chat Functions
  const loadConversations = async () => {
    try {
      const res = await fetch('http://localhost:3000/conversations', { credentials: 'include' })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const startNewChat = () => {
    setCurrentConversationId(null)
    setMessages([])
    setAttachedFiles([])
    setCurrentFileContext(null)
  }

  const loadConversation = async (convId) => {
    try {
      setCurrentConversationId(convId)
      const res = await fetch(`http://localhost:3000/conversations/${convId}`, { credentials: 'include' })
      const data = await res.json()
      setMessages(data.messages || [])
      setAttachedFiles([])
      setCurrentFileContext(null)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleChatFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    const newAttachedFiles = []
    
    for (const file of files) {
      const text = await file.text()
      newAttachedFiles.push({
        name: file.name,
        content: text
      })
    }
    
    setAttachedFiles([...attachedFiles, ...newAttachedFiles])
    if (newAttachedFiles.length > 0) {
      const combinedContext = newAttachedFiles.map(f => f.content).join('\n\n')
      setCurrentFileContext(combinedContext)
    }
  }

  const removeChatFile = (index) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index)
    setAttachedFiles(newFiles)
    if (newFiles.length === 0) {
      setCurrentFileContext(null)
    } else {
      setCurrentFileContext(newFiles.map(f => f.content).join('\n\n'))
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return

    const userMessage = { role: 'user', content: input, attached_files: attachedFiles.map(f => f.name) }
    setMessages([...messages, userMessage])
    setInput('')

    try {
      const res = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: input,
          conversation_id: currentConversationId,
          file_context: currentFileContext,
          conversation_history: messages,
          attached_files: attachedFiles.map(f => f.name)
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
        
        if (!currentConversationId) {
          setCurrentConversationId(data.conversation_id)
          loadConversations()
        }
        
        setAttachedFiles([])
        setCurrentFileContext(null)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to send message' }])
    }
  }

  const handleDeleteConversation = async () => {
    try {
      const res = await fetch(`http://localhost:3000/conversations/${deleteConfirmation.convId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        if (currentConversationId === deleteConfirmation.convId) {
          startNewChat()
        }
        loadConversations()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
    setDeleteConfirmation({ show: false, convId: null, convTitle: '' })
  }

  const handleRenameConversation = async (convId) => {
    if (!editingTitle.trim()) return

    try {
      const res = await fetch(`http://localhost:3000/conversations/${convId}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: editingTitle })
      })

      if (res.ok) {
        loadConversations()
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
    }
    setEditingConvId(null)
    setEditingTitle('')
  }

  return (
    <div className="h-screen w-full bg-[#0d0d0d] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo and Title */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RAGnetic AI" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold">Admin Panel</h1>
              <p className="text-xs text-gray-400">{admin?.username}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === 'dashboard'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Document Upload
            </button>

            <button
              onClick={() => setActiveTab('api-key')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === 'api-key'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API Key Generation
            </button>

            <button
              onClick={() => {
                setActiveTab('ai-chat')
                if (conversations.length === 0) loadConversations()
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === 'ai-chat'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Chat
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-b border-yellow-800/30 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'upload' && 'Document Management'}
              {activeTab === 'api-key' && 'API Key Generation'}
              {activeTab === 'ai-chat' && 'AI Chat Assistant'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dashboard Content */}
          {activeTab === 'dashboard' && (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Overview */}
        <div className={sectionClass}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            System Overview
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-300">Total Users</span>
                </div>
                <div className="text-2xl font-bold text-white">{activeMembers.length}</div>
                <div className="text-xs text-blue-200 mt-1">
                  {activeMembers.filter(m => m.role === 'User').length} regular + {activeMembers.filter(m => m.role === 'Management').length} management
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-300">API Keys</span>
                </div>
                <div className="text-2xl font-bold text-white">{apiKeys.length}</div>
                <div className="text-xs text-green-200 mt-1">
                  {apiKeys.filter(k => k.is_used).length} used + {apiKeys.filter(k => !k.is_used).length} available
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-700/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-purple-300">Total Conversations</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {activeMembers.reduce((sum, member) => sum + (member.conversation_count || 0), 0)}
                </div>
                <div className="text-xs text-purple-200 mt-1">
                  Across all users
                </div>
              </div>
            </div>
          )}
        </div>

        {/* API Key Management Section */}
        <div className={sectionClass}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            API Key Management
          </h2>

          {keyMessage && (
            <div className={`mb-4 p-4 rounded-lg text-sm ${
              keyMessage.includes('Generated') || keyMessage.includes('copied') 
                ? 'bg-green-900/50 border border-green-600 text-green-100' 
                : keyMessage.includes('deleted')
                ? 'bg-blue-900/50 border border-blue-600 text-blue-100'
                : 'bg-red-900/50 border border-red-600 text-red-100'
            }`}>
              {keyMessage}
            </div>
          )}

          {/* API Keys List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">
                Generated API Keys ({apiKeys.length})
              </h3>
              <button
                onClick={() => {
                  setDataLoaded(false)
                  setLoadingKeys(true)
                  loadDashboardData()
                }}
                disabled={loadingKeys}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-xs transition flex items-center gap-1"
              >
                {loadingKeys && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                Refresh
              </button>
            </div>

            {loadingKeys ? (
              <div className="text-center py-8 text-gray-400">Loading API keys...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/50 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <p className="text-sm text-gray-500">No API keys generated yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">API Key</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3 text-sm text-gray-300">{key.email}</td>
                        <td className="px-4 py-3 text-sm font-mono text-yellow-400">{key.api_key}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            key.is_used 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {key.is_used ? 'Used' : 'Available'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(key.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(key.api_key)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </button>
                            <button
                              onClick={() => deleteApiKey(key.id, key.email)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Active Members Section */}
        <div className={sectionClass}>
          {(() => {
            const filteredMembers = activeMembers.filter(member => member.role.toLowerCase() === activeMemberTab)
            return (
              <>
                <div className={headerWrapperClass}>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active Members ({filteredMembers.length})
                  </h2>
                  <button
                    onClick={() => {
                      setDataLoaded(false)
                      setLoading(true)
                      loadDashboardData()
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition flex items-center gap-1"
                  >
                    {loading && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                    Refresh
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveMemberTab('user')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeMemberTab === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    User ({activeMembers.filter(m => m.role.toLowerCase() === 'user').length})
                  </button>
                  <button
                    onClick={() => setActiveMemberTab('management')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeMemberTab === 'management'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Management ({activeMembers.filter(m => m.role.toLowerCase() === 'management').length})
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading active members...</div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">No {activeMemberTab} members yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Username</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Conversations</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredMembers.sort((a, b) => a.username.localeCompare(b.username)).map((member, index) => (
                          <tr key={member.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium">{member.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{member.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                member.role === 'Management' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {member.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                member.role === 'Management' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {member.conversation_count} chats
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {new Date(member.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => deleteUser(member.id, member.username)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </div>
          )}

          {/* Settings Content */}
          {activeTab === 'settings' && (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* User Management Section */}
        <div className={sectionClass}>
          {(() => {
            const filteredUsers = allUsers.filter(user => user.role.toLowerCase() === settingsUserTab)
            return (
              <>
                <div className={headerWrapperClass}>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    User Management ({filteredUsers.length})
                  </h2>
                  <button
                    onClick={() => {
                      setLoadingUsers(true)
                      loadAllUsers()
                    }}
                    disabled={loadingUsers}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm transition flex items-center gap-1"
                  >
                    {loadingUsers && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>}
                    Refresh
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSettingsUserTab('user')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      settingsUserTab === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    User ({allUsers.filter(u => u.role.toLowerCase() === 'user').length})
                  </button>
                  <button
                    onClick={() => setSettingsUserTab('management')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      settingsUserTab === 'management'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Management ({allUsers.filter(u => u.role.toLowerCase() === 'management').length})
                  </button>
                </div>

                {settingsMessage && (
                  <div className={`mb-4 p-4 rounded-lg text-sm ${
                    settingsMessage.includes('successfully') 
                      ? 'bg-green-900/50 border border-green-600 text-green-100' 
                      : 'bg-red-900/50 border border-red-600 text-red-100'
                  }`}>
                    {settingsMessage}
                  </div>
                )}

                {loadingUsers ? (
                  <div className="text-center py-8 text-gray-400">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">No {settingsUserTab} users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Username</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredUsers.map((user, index) => (
                          <tr key={user.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium">{user.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'Management' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.is_active 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => toggleUserStatus(user.id)}
                                className={`px-3 py-1 rounded text-xs transition flex items-center gap-1 ${
                                  user.is_active 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Admin Profile Section */}
        <div className={sectionClass}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Admin Profile
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Info */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Profile Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Username:</span>
                  <span className="text-white">{admin?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{admin?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white">Administrator</span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Change Password</h3>
              <form className="space-y-3" onSubmit={async (e) => {
                e.preventDefault()
                if (newPassword !== confirmPassword) {
                  setSettingsMessage('New passwords do not match')
                  setTimeout(() => setSettingsMessage(''), 3000)
                  return
                }
                await changePassword(currentPassword, newPassword)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
          )}

          {/* Upload Content */}
          {activeTab === 'upload' && (
      <div className="max-w-7xl mx-auto">
        <div className={sectionClass}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Document Management
          </h2>

          <div className="bg-gray-800 p-6 rounded-xl border-2 border-dashed border-gray-600">
            <input
              type="file"
              id="adminFileInput"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.docx,.txt"
            />
            <label
              htmlFor="adminFileInput"
              className="cursor-pointer flex flex-col items-center justify-center py-8"
            >
              <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-400 text-sm">Click to select files or drag and drop</p>
              <p className="text-gray-500 text-xs mt-1">PDF, DOCX, TXT (Multiple files supported)</p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="ml-2 text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => uploadFiles('user')}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload to User Index`}
                </button>
                <button
                  onClick={() => uploadFiles('management')}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload to Management Index`}
                </button>
                <button
                  onClick={() => uploadFiles('both')}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload to Both Indexes`}
                </button>
              </div>
            </div>
          )}

          {uploadStatus && (
            <div className="mt-4 bg-blue-900/50 border border-blue-600 p-4 rounded-lg text-sm">
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
          )}

          {/* API Key Content */}
          {activeTab === 'api-key' && (
      <div className="max-w-4xl mx-auto">
        <div className={sectionClass}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Generate New API Key
          </h2>

          {/* Generate Key */}
          <div className="bg-gray-800 p-6 rounded-xl mb-6">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter user email"
                value={keyEmail}
                onChange={(e) => setKeyEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && generateApiKey()}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
              <select
                value={keyRole}
                onChange={(e) => setKeyRole(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 transition"
              >
                <option value="user">User</option>
                <option value="management">Management</option>
              </select>
              <button
                onClick={generateApiKey}
                disabled={generatingKey}
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {generatingKey ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </div>

          {keyMessage && (
            <div className={`p-4 rounded-lg text-sm ${
              keyMessage.includes('Generated') || keyMessage.includes('copied') 
                ? 'bg-green-900/50 border border-green-600 text-green-100' 
                : keyMessage.includes('deleted')
                ? 'bg-blue-900/50 border border-blue-600 text-blue-100'
                : 'bg-red-900/50 border border-red-600 text-red-100'
            }`}>
              {keyMessage}
            </div>
          )}
        </div>
      </div>
          )}

          {/* AI Chat Content - Same interface as User/Management */}
          {activeTab === 'ai-chat' && (
            <div className="h-full w-full flex overflow-hidden -m-6">
              {/* Sidebar - Collapsed */}
              {!showChatSidebar && (
                <div className="w-16 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-r border-gray-800 flex flex-col items-center py-4">
                  <div className="flex flex-col gap-3 flex-1">
                    <button
                      onClick={() => setShowChatSidebar(true)}
                      className="relative p-2 hover:bg-gray-800 rounded-lg transition group"
                      title="Expand Sidebar"
                    >
                      <img src="/favicon.png" alt="RAGnetic AI" className="w-8 h-8 transition-opacity group-hover:opacity-0" />
                      <div className="absolute inset-0 bg-gray-800 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                    <button
                      onClick={startNewChat}
                      className="p-2 hover:bg-gray-800 rounded-lg transition"
                      title="New Conversation"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Sidebar - Expanded */}
              {showChatSidebar && (
                <div className="w-72 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-r border-gray-800 flex flex-col shadow-2xl">
                  {/* Sidebar Header */}
                  <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => setShowChatSidebar(false)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition"
                        title="Collapse Sidebar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      <img src="/logo.png" alt="RAGnetic AI" className="h-16 w-auto" />
                    </div>
                    <button
                      onClick={startNewChat}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Conversation
                    </button>
                  </div>
                  
                  {/* Conversations List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-gray-500">No conversations yet</p>
                        <p className="text-xs text-gray-600 mt-1">Start a new chat to begin</p>
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => editingConvId !== conv.id && loadConversation(conv.id)}
                          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between group relative ${
                            currentConversationId === conv.id 
                              ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-lg' 
                              : 'hover:bg-gray-800/50 border border-transparent'
                          }`}
                        >
                          {currentConversationId === conv.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full"></div>
                          )}
                          
                          <div className="flex-1 min-w-0 pl-1">
                            {editingConvId === conv.id ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameConversation(conv.id)
                                  if (e.key === 'Escape') setEditingConvId(null)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-gray-700 text-sm px-3 py-1.5 rounded-lg outline-none border-2 border-blue-500 focus:border-blue-400"
                                autoFocus
                              />
                            ) : (
                              <>
                                <p className="text-sm font-medium truncate text-gray-200">{conv.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p className="text-xs text-gray-500">
                                    {new Date(conv.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            {editingConvId === conv.id ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRenameConversation(conv.id); }}
                                  className="p-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition"
                                  title="Save"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingConvId(null); }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-700 transition"
                                  title="Cancel"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingConvId(conv.id); setEditingTitle(conv.title); }}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition"
                                  title="Rename"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmation({ show: true, convId: conv.id, convTitle: conv.title }); }}
                                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Admin Info Footer */}
                  <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{admin?.username}</p>
                          <p className="text-xs text-yellow-400">Admin</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-800">
                  <div className="p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-200">Admin Chat Assistant</h1>
                    <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1.5 rounded-full font-semibold">Full Access</span>
                  </div>
                </div>

                {/* Chat Interface */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4 max-w-md">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-200">Start a Conversation</h2>
                        <p className="text-gray-400 text-sm">
                          Ask questions about your documents. You have access to both User and Management knowledge bases.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                      >
                        {m.role === 'user' ? (
                          <div className="max-w-[80%]">
                            {m.attachedFiles && m.attachedFiles.length > 0 && (
                              <div className="mb-2 grid grid-cols-2 gap-2">
                                {m.attachedFiles.map((file, idx) => (
                                  <div key={idx} className="bg-[#2f2f2f] rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                                    <div className="flex items-center gap-2 p-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">PDF</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="px-4 py-3 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4 max-w-[85%]">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            
                            <div className="flex flex-col gap-1 flex-1">
                              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide self-start">
                                RAGnetic AI
                              </span>
                              
                              {m.isLoading ? (
                                <div className="flex items-center gap-3 py-2">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                  </div>
                                  <span className="text-sm text-gray-400 italic">Generating response...</span>
                                </div>
                              ) : (
                                <div className="text-gray-100 leading-relaxed prose prose-invert prose-sm max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      p: ({children}) => <p className="mb-3 last:mb-0 text-gray-200 leading-relaxed">{children}</p>,
                                      strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                                      em: ({children}) => <em className="italic text-purple-300">{children}</em>,
                                      ul: ({children}) => <ul className="list-none mb-3 space-y-2 ml-4 [&>li]:before:content-['✓'] [&>li]:before:text-green-400 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:font-bold [&>li]:before:text-lg [&>li>ul>li]:before:content-['➤'] [&>li>ul>li]:before:text-blue-400 [&>li>ul>li]:before:text-base [&>li>ul>li>ul>li]:before:content-['•'] [&>li>ul>li>ul>li]:before:text-purple-400 [&>li>ul>li>ul>li]:before:text-sm">{children}</ul>,
                                      ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-2 ml-4">{children}</ol>,
                                      li: ({children}) => <li className="text-gray-300 leading-relaxed relative pl-6">{children}</li>,
                                      code: ({inline, children}) => 
                                        inline 
                                          ? <code className="bg-gray-800/80 px-2 py-1 rounded-md text-xs font-mono text-purple-300 border border-gray-700">{children}</code>
                                          : <code className="block bg-gray-800/60 p-4 rounded-lg my-3 text-sm font-mono text-gray-200 overflow-x-auto border border-gray-700 shadow-inner whitespace-pre-wrap">{children}</code>,
                                      h1: ({children}) => <h1 className="text-xl font-bold mb-3 mt-4 text-white border-b border-gray-700 pb-2">{children}</h1>,
                                      h2: ({children}) => <h2 className="text-lg font-bold mb-2 mt-4 text-white">{children}</h2>,
                                      h3: ({children}) => <h3 className="text-base font-bold mb-2 mt-3 text-purple-300">{children}</h3>,
                                      blockquote: ({children}) => <blockquote className="border-l-4 border-purple-500 pl-4 my-3 italic text-gray-300 bg-gray-800/30 py-2 rounded-r">{children}</blockquote>,
                                    }}
                                  >
                                    {m.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-[#0d0d0d] p-4">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative flex flex-col gap-2 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-blue-500 transition shadow-lg p-3">
                      
                      {attachedFiles.length > 0 && (
                        <div className="pb-2 border-b border-gray-700">
                          <div className="grid grid-cols-2 gap-2">
                            {attachedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-lg px-2 py-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                                <span className="text-xs text-blue-300 font-medium truncate flex-1">{file.name}</span>
                                <button
                                  onClick={() => removeChatFile(index)}
                                  className="p-0.5 hover:bg-blue-500/20 rounded transition flex-shrink-0"
                                  title="Remove file"
                                >
                                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-end gap-2">
                        <input
                          type="file"
                          id="admin-file-upload"
                          multiple
                          onChange={handleChatFileSelect}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                        />

                        <label
                          htmlFor="admin-file-upload"
                          className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200 flex-shrink-0 cursor-pointer"
                          title="Attach file"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </label>

                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                          placeholder="Ask here about the documents..."
                          rows={1}
                          className="flex-1 bg-transparent outline-none text-sm resize-none overflow-hidden text-white placeholder-gray-500"
                          style={{
                            minHeight: '24px',
                            maxHeight: '150px',
                            height: 'auto'
                          }}
                          onInput={(e) => {
                            e.target.style.height = 'auto'
                            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                          }}
                        />

                        <button
                          onClick={handleSendMessage}
                          disabled={!input.trim()}
                          className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          title="Send message"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Delete Conversation</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{deleteConfirmation.convTitle}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmation({ show: false, convId: null, convTitle: '' })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}  