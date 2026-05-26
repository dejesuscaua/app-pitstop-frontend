export interface Vehicle {
  brand: string
  model: string
  plate: string
  year: number
  km: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  cpf: string
  vehicles: Vehicle[]
  createdAt: string
}

export type OrderStatus = 'open' | 'ready' | 'delivered'

export interface OrderItem {
  name: string
  qty: number
  unitPrice: number
}

export interface Product {
  id: string
  name: string
  unitPrice: number
  unit: string
  createdAt: string
}

export interface NotaFiscal {
  id: string
  fileName: string
  size: number
  storagePath: string
  downloadURL: string
  uploadedAt: string
}

export interface DayHours {
  open: boolean
  start: string // "HH:MM"
  end: string   // "HH:MM"
}

export type WorkingHours = [DayHours, DayHours, DayHours, DayHours, DayHours, DayHours, DayHours]

export type AppointmentStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface Appointment {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  vehicleInfo: { brand: string; model: string; plate: string; year: number }
  scheduledAt: string
  estimatedDuration: number
  serviceDescription: string
  status: AppointmentStatus
  orderId?: string | null
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  vehicleInfo: Vehicle
  status: OrderStatus
  items: OrderItem[]
  laborPrice: number
  totalParts: number
  total: number
  notes: string
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}
