import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Customers } from '@/pages/Customers'
import { CustomerForm } from '@/pages/CustomerForm'
import { Orders } from '@/pages/Orders'
import { OrderForm } from '@/pages/OrderForm'
import { OrderDetail } from '@/pages/OrderDetail'
import { OrderPublic } from '@/pages/OrderPublic'
import { CustomerNotes } from '@/pages/CustomerNotes'
import { NotasFiscais } from '@/pages/NotasFiscais'
import { Products } from '@/pages/Products'
import { OrderEdit } from '@/pages/OrderEdit'
import { Appointments } from '@/pages/Appointments'
import { AppointmentForm } from '@/pages/AppointmentForm'

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/os/:tenantId/:id', element: <OrderPublic /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/customers', element: <Customers /> },
      { path: '/customers/new', element: <CustomerForm /> },
      { path: '/customers/:id/edit', element: <CustomerForm /> },
      { path: '/customers/:id/notas', element: <CustomerNotes /> },
      { path: '/notas', element: <NotasFiscais /> },
      { path: '/products', element: <Products /> },
      { path: '/orders', element: <Orders /> },
      { path: '/orders/new', element: <OrderForm /> },
      { path: '/orders/:id', element: <OrderDetail /> },
      { path: '/orders/:id/edit', element: <OrderEdit /> },
      { path: '/appointments', element: <Appointments /> },
      { path: '/appointments/new', element: <AppointmentForm /> },
      { path: '/appointments/:id/edit', element: <AppointmentForm /> },
      { path: '/', element: <Navigate to="/dashboard" replace /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
