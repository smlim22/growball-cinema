'use client'

import { supabase } from './supabaseClient'

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('staff')
}

export async function getUserAccessLevel(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('staff')
    .select('access_level')
    .eq('uuid', user.id)
    .single()

  if (error || !data) return null
  return data.access_level
}