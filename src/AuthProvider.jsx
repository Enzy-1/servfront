import { useEffect, useMemo, useState } from 'react'
import { api, clearSession, getStoredUser, getToken, setSession } from './api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(!!getToken())

  useEffect(() => {
    const token = getToken()
    if (!token) return

    api('/auth/me')
      .then((data) => {
        setUser(data.user)
        localStorage.setItem('servtec_user', JSON.stringify(data.user))
      })
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(email, password) {
        const data = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setSession(data.token, data.user)
        setUser(data.user)
      },
      logout() {
        clearSession()
        setUser(null)
      },
      isAdmin: user?.role === 'admin',
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}