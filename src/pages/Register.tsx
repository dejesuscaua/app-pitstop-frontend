import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useForm } from 'react-hook-form'
import { auth } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'

interface FormValues {
  shopName: string
  email: string
  password: string
  confirmPassword: string
}

export function Register() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm<FormValues>()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const onSubmit = async ({ shopName, email, password }: FormValues) => {
    setAuthError(null)
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password)
      await api.post('/auth/register', { shopName })
      // Force token refresh to get the tenantId custom claim
      await firebaseUser.getIdToken(true)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta.'
      if (msg.includes('email-already-in-use')) {
        setAuthError('Este e-mail já está em uso.')
      } else {
        setAuthError('Erro ao criar conta. Tente novamente.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-brand-400 text-4xl">⬡</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">PitStop OS</h1>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta grátis</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4"
        >
          {authError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{authError}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da oficina</label>
            <input
              {...register('shopName', { required: 'Informe o nome da oficina' })}
              placeholder="Ex: Mecânica do Patrick"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            {errors.shopName && <p className="text-xs text-danger mt-1">{errors.shopName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...register('email', { required: 'Informe o e-mail' })}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              {...register('password', { required: 'Informe a senha', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
            <input
              {...register('confirmPassword', {
                required: 'Confirme a senha',
                validate: (v) => v === watch('password') || 'As senhas não coincidem',
              })}
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? 'Criando conta…' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-brand-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
