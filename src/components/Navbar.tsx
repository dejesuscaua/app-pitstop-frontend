import { useSidebar } from '@/contexts/SidebarContext'

interface Props {
  readonly title: string
}

export function Navbar({ title }: Props) {
  const { toggle } = useSidebar()

  return (
    <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4">
      <button
        onClick={toggle}
        className="mr-3 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Abrir menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="truncate text-sm font-semibold tracking-wide uppercase text-gray-900">{title}</h1>
    </header>
  )
}
