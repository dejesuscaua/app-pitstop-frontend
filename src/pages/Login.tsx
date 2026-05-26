import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useForm } from 'react-hook-form'
import { auth } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'

interface FormValues {
  email: string
  password: string
}

export function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const onSubmit = async ({ email, password }: FormValues) => {
    setAuthError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch {
      setAuthError('E-mail ou senha incorretos.')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-brand-400 text-4xl">⬡</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">PitStop OS</h1>
          <p className="text-sm text-gray-500 mt-1">Entre na sua conta</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
        >
          {authError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{authError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...register('email', { required: true })}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              {...register('password', { required: true })}
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Não tem conta?{' '}
          <Link to="/register" className="text-brand-600 hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
