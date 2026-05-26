import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

function Layout() {
  const { open, close } = useSidebar()
  const location = useLocation()

  useEffect(() => { close() }, [location.pathname])

  return (
    <div className="flex h-screen bg-surface">
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export function AppLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  )
}
