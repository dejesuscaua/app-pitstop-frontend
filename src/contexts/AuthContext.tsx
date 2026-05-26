import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '@/services/firebase'

interface AuthContextValue {
  user: User | null
  tenantId: string | null
  shopName: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tenantId: null,
  shopName: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [shopName, setShopName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const result = await firebaseUser.getIdTokenResult()
        setTenantId((result.claims.tenantId as string) ?? null)
        setShopName((result.claims.shopName as string) ?? null)
        setUser(firebaseUser)
      } else {
        setUser(null)
        setTenantId(null)
        setShopName(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, tenantId, shopName, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
