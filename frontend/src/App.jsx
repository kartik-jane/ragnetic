// App.jsx
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown'
import Login from './Login'
import Register from './Register'
import AdminLogin from './AdminLogin'
import ManagementLogin from './ManagementLogin'
import AdminDashboard from './AdminDashboard'
import UserProfile from './UserProfile'
import ManagementProfile from './ManagementProfile'
import Website from './Website'
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showManagementLogin, setShowManagementLogin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManagement, setIsManagement] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingConvId, setEditingConvId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, convId: null, convTitle: '' })
  const [attachedFiles, setAttachedFiles] = useState([])
  const [currentFileContext, setCurrentFileContext] = useState(null)  // Stores file content for conversation
  const [currentView, setCurrentView] = useState('chat')  // 'chat' or 'profile'
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const chatEndRef = useRef(null)
  const [showWebsite, setShowWebsite] = useState(true)


  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Load conversations when authenticated
  useEffect(() => {
    if (isAuthenticated || isManagement) {
      loadConversations()
    }
  }, [isAuthenticated, isManagement])

  useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])


  const checkAuth = async () => {
    try {
      // Check if user is authenticated
      const userRes = await fetch('http://localhost:3000/check-auth', {
        credentials: 'include'
      })
      if (userRes.ok) {
        const data = await userRes.json()
        setIsAuthenticated(true)
        setUser(data.user)
        setIsAdmin(false)
        setAuthLoading(false)
        return
      }
      
      // Check if admin is authenticated
      const adminRes = await fetch('http://localhost:3000/admin/check-auth', {
        credentials: 'include'
      })
      if (adminRes.ok) {
        const data = await adminRes.json()
        setIsAdmin(true)
        setAdmin(data.admin)
        setAuthLoading(false)
        return
      }
      
      // Check if management is authenticated
      const managementRes = await fetch('http://localhost:3000/check-auth', {
        credentials: 'include'
      })
      if (managementRes.ok) {
        const data = await managementRes.json()
        if (data.role === 'management') {
          setIsManagement(true)
          setUser(data.user)
          setAuthLoading(false)
          return
        }
      }
      
      setIsAuthenticated(false)
      setIsAdmin(false)
      setIsManagement(false)
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setIsAdmin(false)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleRegisterClick = () => {
    setShowRegister(true)
  }

  const handleBackToLogin = () => {
    setShowRegister(false)
  }

  const handleAdminLoginSuccess = (adminData) => {
    setAdmin(adminData)
    setIsAdmin(true)
  }

  const handleManagementLoginSuccess = (userData) => {
    setUser(userData)
    setIsManagement(true)
  }

  const handleAdminLogout = async () => {
    try {
      await fetch('http://localhost:3000/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsAdmin(false)
      setAdmin(null)
      setShowAdminLogin(false)
    } catch (error) {
      console.error('Admin logout failed:', error)
    }
  }

  const handleManagementLogout = async () => {
    try {
      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsManagement(false)
      setUser(null)
      setMessages([])
      setConversations([])
      setCurrentConversationId(null)
    } catch (error) {
      console.error('Management logout failed:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setIsAuthenticated(false)
      setIsManagement(false)
      setUser(null)
      setMessages([])
      setConversations([])
      setCurrentConversationId(null)
      // 🔥 ADD THIS LINE
      setShowWebsite(true)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const loadConversations = async () => {
    try {
      const res = await fetch('http://localhost:3000/conversations', {
        credentials: 'include'
      })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const loadConversation = async (convId) => {
    try {
      const res = await fetch(`http://localhost:3000/conversations/${convId}`, {
        credentials: 'include'
      })
      const data = await res.json()
      const formattedMessages = data.messages.map(m => ({
        role: m.role,
        content: m.content,
        attachedFiles: m.attached_files || null  // Include attached files from DB
      }))
      setMessages(formattedMessages)
      setCurrentConversationId(convId)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentConversationId(null)
    setAttachedFiles([])
    setCurrentFileContext(null)
  }

  const showDeleteConfirmation = (convId, convTitle, e) => {
    e.stopPropagation()
    setDeleteConfirmation({ show: true, convId, convTitle })
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, convId: null, convTitle: '' })
  }

  const confirmDelete = async () => {
    const { convId } = deleteConfirmation
    try {
      await fetch(`http://localhost:3000/conversations/${convId}`, { 
        method: 'DELETE',
        credentials: 'include'
      })
      loadConversations()
      if (currentConversationId === convId) {
        startNewChat()
      }
      setDeleteConfirmation({ show: false, convId: null, convTitle: '' })
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const startRenaming = (convId, currentTitle, e) => {
    e.stopPropagation()
    setEditingConvId(convId)
    setEditingTitle(currentTitle)
  }

  const cancelRenaming = () => {
    setEditingConvId(null)
    setEditingTitle('')
  }

  const saveRename = async (convId, e) => {
    e.stopPropagation()
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
        setEditingConvId(null)
        setEditingTitle('')
      }
    } catch (error) {
      console.error('Error renaming conversation:', error)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Reset the input so the same file can be re-selected later
    e.target.value = ''

    // Upload each file and store
    const uploadedFiles = []
    let combinedContent = ''
    const failedFiles = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const res = await fetch('http://localhost:3000/upload-chat-file', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          if (data.success && data.content) {
            uploadedFiles.push({ name: file.name })
            combinedContent += `\n\n=== File: ${file.name} ===\n${data.content}`
          } else {
            console.error('File uploaded but no content returned for:', file.name)
            failedFiles.push(file.name)
          }
        } else {
          // Parse error response from server
          let errorMsg = `Failed to upload "${file.name}"`
          try {
            const errData = await res.json()
            if (errData.error) errorMsg = `"${file.name}": ${errData.error}`
          } catch (_) {}
          console.error('Upload error:', errorMsg)
          failedFiles.push(file.name)
        }
      } catch (error) {
        console.error('Error uploading file:', file.name, error)
        failedFiles.push(file.name)
      }
    }

    // Show error alert if any files failed
    if (failedFiles.length > 0) {
      alert(`Failed to upload the following file(s):\n${failedFiles.join('\n')}\n\nSupported formats: PDF, DOCX, TXT`)
    }

    // Only update state if at least one file succeeded
    if (uploadedFiles.length > 0) {
      setAttachedFiles(uploadedFiles)
      setCurrentFileContext(combinedContent)
    }
  }

  const removeFile = (index) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index)
    setAttachedFiles(newFiles)
    
    // If no files left, clear context
    if (newFiles.length === 0) {
      setCurrentFileContext(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return

    // Add file attachments info to user message if files are attached
    const userMessage = {
      role: 'user',
      content: input,
      attachedFiles: attachedFiles.length > 0 ? [...attachedFiles] : null
    }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    
    // Add loading message
    const loadingMessages = [...newMessages, { role: 'assistant', content: 'Thinking...', isLoading: true }]
    setMessages(loadingMessages)
    const queryText = input
    const fileContext = currentFileContext
    setInput('')
    // Don't clear file context yet - keep it for the conversation
    const currentFile = attachedFiles.length > 0 ? attachedFiles[0] : null

    try {
      // Always use JSON - include file context and conversation history
      const res = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          query: queryText,
          conversation_id: currentConversationId,
          file_context: fileContext,  // Send file content for natural conversation
          conversation_history: messages,  // Send conversation history for context
          attached_files: attachedFiles.length > 0 ? attachedFiles : null  // Send file names to save in DB
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      
      // Update conversation ID if it's a new conversation
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id)
        loadConversations() // Refresh conversation list
      }
      
      // Replace loading message with actual response
      if (data.error) {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}` }])
      } else if (data.answer) {
        setMessages([...newMessages, { role: 'assistant', content: data.answer }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: 'No response received from server.' }])
      }
    } catch (error) {
      console.error('Error in sendMessage:', error)
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${error.message}` }])
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      // Stop listening
      if (recognition) {
        recognition.stop();
      }
      setIsListening(false);
      setRecognition(null);
    } else {
      // Start listening
      const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + ' ' + transcript);
      };
      rec.onend = () => {
        setIsListening(false);
        setRecognition(null);
      };
      rec.onerror = () => {
        setIsListening(false);
        setRecognition(null);
      };

      setRecognition(rec);
      rec.start();
    }
  }

  if (showWebsite) {
  return (
    <Website
      onGetStarted={() => { setShowWebsite(false); setShowRegister(true) }}
      onLogin={() => setShowWebsite(false)}
    />
  )
}

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Show admin dashboard if admin is logged in
  if (isAdmin) {
    return <AdminDashboard admin={admin} onLogout={handleAdminLogout} />
  }

  // Show login or register page if not authenticated
  if (!isAuthenticated && !isManagement) {
    if (showAdminLogin) {
      return <AdminLogin onAdminLoginSuccess={handleAdminLoginSuccess} onBackClick={() => setShowAdminLogin(false)} />
    }
    if (showManagementLogin) {
      return <ManagementLogin onManagementLoginSuccess={handleManagementLoginSuccess} onBackClick={() => setShowManagementLogin(false)} />
    }
    if (showRegister) {
      return <Register onBackToLogin={handleBackToLogin} />
    }
    return <Login onLoginSuccess={handleLoginSuccess} onRegisterClick={handleRegisterClick} onAdminClick={() => setShowAdminLogin(true)} onManagementClick={() => setShowManagementLogin(true)} />
  }

  // Show profile page if current view is profile
  if (currentView === 'profile') {
    if (isManagement) {
      return <ManagementProfile onBack={() => setCurrentView('chat')} />
    } else {
      return <UserProfile onBack={() => setCurrentView('chat')} />
    }
  }

  return (
    <div className="h-screen w-full bg-[#0d0d0d] text-white flex">
      {/* Sidebar - Collapsed */}
      {!showSidebar && (
        <div className="w-16 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-r border-gray-800 flex flex-col items-center py-4">
          <div className="flex flex-col gap-3 flex-1">
            <button
              onClick={() => setShowSidebar(true)}
              className="relative p-2 hover:bg-gray-800 rounded-lg transition group"
              title="Expand Sidebar"
            >
              <img src="/favicon.png" alt="RAGnetic AI" className="w-8 h-8 transition-opacity group-hover:opacity-0" />
              {/* Expand icon on hover */}
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
          
          {/* User Profile Icon at Bottom */}
          <div className="mt-auto pt-3 border-t border-gray-800">
            <button
              onClick={() => setCurrentView('profile')}
              className="p-2 hover:bg-gray-800 rounded-lg transition group relative"
              title="Profile Settings"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Sidebar - Expanded */}
      {showSidebar && (
        <div className="w-72 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border-r border-gray-800 flex flex-col shadow-2xl">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setShowSidebar(false)}
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
                  {/* Active indicator */}
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
                          if (e.key === 'Enter') saveRename(conv.id, e)
                          if (e.key === 'Escape') cancelRenaming()
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
                          onClick={(e) => saveRename(conv.id, e)}
                          className="p-1.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition"
                          title="Save"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelRenaming(); }}
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
                          onClick={(e) => startRenaming(conv.id, conv.title, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition"
                          title="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => showDeleteConfirmation(conv.id, conv.title, e)}
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
          
          {/* User Info Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('profile')}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition"
                  title="Profile Settings"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <div>
                  <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                </div>
              </div>
              <button
                onClick={isManagement ? handleManagementLogout : handleLogout}
                className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 hover:text-red-300 transition"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Delete Conversation</h3>
                <p className="text-sm text-gray-400 mb-1">
                  Are you sure you want to delete this conversation?
                </p>
                <p className="text-sm font-medium text-gray-300">
                  "{deleteConfirmation.convTitle}"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-200">Chat Assistant</h1>
          </div>
        </div>

        {/* Chat Interface */}
        <>
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
                    Ask questions about your documents or search the web for the latest information
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
                    // User message with optional file attachments
                    <div className="max-w-[80%]">
                      {/* File attachments preview if exist - Grid layout */}
                      {m.attachedFiles && m.attachedFiles.length > 0 && (
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          {m.attachedFiles.map((file, idx) => (
                            <div key={idx} className="bg-[#2f2f2f] rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                              <div className="flex items-center gap-2 p-2">
                                {/* File Icon */}
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-md flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                  </svg>
                                </div>
                                {/* File Details */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{file.name}</p>
                                  <p className="text-xs text-gray-400">PDF</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Message content */}
                      <div className="px-4 py-3 rounded-2xl shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  ) : (
                    // AI Assistant message with avatar and label
                    <div className="flex gap-4 max-w-[85%]">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      
                      {/* Message Content */}
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
        <div ref={chatEndRef} />  
          </div>

          <div className="bg-[#0d0d0d] p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative flex flex-col gap-2 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-blue-500 transition shadow-lg p-3">
                
                {/* File attachments indicator inside input box - Grid layout */}
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
                            onClick={() => removeFile(index)}
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

                {/* Input controls row */}
                <div className="flex items-end gap-2">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />

                  {/* Paperclip button */}
                  <label
                    htmlFor="file-upload"
                    className="p-2 hover:bg-gray-800 rounded-lg transition text-gray-400 hover:text-gray-200 flex-shrink-0 cursor-pointer"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </label>

                  {/* Textarea */}
                  <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
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

                  {/* Mic button */}
                  <button
                    onClick={startListening}
                    className={`p-2 hover:bg-gray-800 rounded-lg transition flex-shrink-0 ${isListening ? 'text-red-400' : 'text-gray-400 hover:text-gray-200'}`}
                    title={isListening ? "Stop voice input" : "Voice input"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>

                  {/* Send button */}
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="p-2 hover:bg-gray-800 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 text-gray-400 hover:text-gray-200"
                    title="Send message"
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  )
}