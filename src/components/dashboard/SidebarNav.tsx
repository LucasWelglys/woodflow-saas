'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Package, Users, TrendingUp, Activity, Settings, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export function SidebarNav() {
  const [role, setRole] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          console.log('User Role in Sidebar:', profile.role)
          setRole(profile.role)
        } else if (error) {
          console.error('Error loading profile in Sidebar:', error)
          // Tentar fallback se profile falhar (talvez lag no RLS?)
          // mas o RLS 'authenticated' deve resolver
        }
      }
    }
    loadProfile()
  }, [])

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pedidos', icon: Package, label: 'Pedidos' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/financeiro', icon: TrendingUp, label: 'Financeiro' },
    { href: '/despesas', icon: Activity, label: 'Despesas' },
    { href: '/configuracoes', icon: Settings, label: 'Configurações' },
  ]

  return (
    <nav className="flex-1 px-4 py-4 space-y-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group"
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.label}</span>
        </Link>
      ))}

      {role === 'super-admin' && (
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-stone-300 hover:text-white group border border-dashed border-white/10"
        >
          <Shield className="h-5 w-5 text-indigo-400" />
          <span className="font-medium">Gestão SaaS</span>
        </Link>
      )}
    </nav>
  )
}
