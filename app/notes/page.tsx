'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: string
  tenantSlug: string
}

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  user: {
    email: string
  }
}

export default function NotesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchNotes()
  }, [router])

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch notes')
      }

      const data = await response.json()
      setNotes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note')
      }

      setNotes([data, ...notes])
      setNewNote({ title: '', content: '' })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete note')
      }

      setNotes(notes.filter(note => note.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note')
    }
  }

  const handleUpgrade = async () => {
    if (!user) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tenants/${user.tenantSlug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade')
      }

      alert('Tenant upgraded to Pro successfully! You can now create unlimited notes.')
      // Refresh the page to update UI
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>Loading...</h1>
        </div>
      </div>
    )
  }

  const isFreePlan = notes.length >= 3 // Simple check - in real app, you'd get this from tenant data
  const canUpgrade = user?.role === 'ADMIN' && isFreePlan

  return (
    <div className="container">
      <div className="header">
        <div className="header-actions">
          <h1>Tenant Notes</h1>
          <div>
            <span className="user-info">
              {user?.email} ({user?.role}) - {user?.tenantSlug}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {canUpgrade && (
        <div className="upgrade-banner">
          <h3>🎉 Upgrade to Pro</h3>
          <p>You've reached the free plan limit of 3 notes. Upgrade to Pro for unlimited notes!</p>
          <button onClick={handleUpgrade} className="btn btn-primary">
            Upgrade to Pro
          </button>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Notes ({notes.length})</h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary"
          >
            {showCreateForm ? 'Cancel' : 'Create Note'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateNote} style={{ marginBottom: '20px' }}>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                required
                placeholder="Note title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="content">Content:</label>
              <textarea
                id="content"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Note content"
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Note'}
            </button>
          </form>
        )}

        {notes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No notes yet. Create your first note!
          </p>
        ) : (
          <div className="notes-grid">
            {notes.map((note) => (
              <div key={note.id} className="card note-card">
                <h3>{note.title}</h3>
                <p style={{ margin: '10px 0', color: '#666' }}>{note.content || 'No content'}</p>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '10px' }}>
                  By {note.user.email} • {new Date(note.createdAt).toLocaleDateString()}
                </div>
                <div className="note-actions">
                  <button 
                    onClick={() => handleDeleteNote(note.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
