'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { logout } from '../lib/auth'

export default function StaffPage() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      const { data } = await supabase
        .from('staff')
        .select('access_level')
        .eq('uuid', user.id)
        .single()

      if (!data || data.access_level !== 1) {
        router.replace('/')
        return
      }

      setEmail(user.email ?? null)
    }

    checkAccess()
  }, [router])

  if (!email) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Staff Dashboard</h1>
        <p className="text-gray-600 mb-4">Welcome, {email}</p>
        <button
          onClick={async () => {
            await logout()
            router.push('/login')
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  )
}