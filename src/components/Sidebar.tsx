import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Clientes' },
  { to: '/appointments', label: 'Agendamentos' },
  { to: '/orders', label: 'Ordens de Serviço' },
  { to: '/products', label: 'Produtos' },
  { to: '/notas', label: 'Notas Fiscais' },
]

export function Sidebar() {
  const { shopName } = useAuth()
  const navigate = useNavigate()
  const { open, close } = useSidebar()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex h-full w-64 flex-col border-r border-gray-200 bg-white',
        'transition-transform duration-200 ease-in-out',
        'lg:static lg:z-auto lg:h-screen lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-gray-100">
        <div className="flex flex-col leading-tight">
          <span className="font-black tracking-widest text-xs uppercase text-gray-900">PitStop</span>
          <span className="text-xs tracking-widest text-gray-400 font-normal uppercase">OS{shopName && <span className="ml-2 normal-case tracking-normal">{shopName}</span>}</span>
        </div>
        <button
          onClick={close}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:hidden"
          aria-label="Fechar menu"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600 border-l-2 border-brand-400 pl-[10px]'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-semibold tracking-wide uppercase text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
