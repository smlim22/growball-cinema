'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { loginWithEmail, getUserAccessLevel } from './lib/auth'
import Image from 'next/image'
import { EyeOpenIcon, EyeClosedIcon } from "@radix-ui/react-icons";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await loginWithEmail(email, password)
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const accessLevel = await getUserAccessLevel()

      if (accessLevel === 2) {
        router.push('/manager')
      } else if (accessLevel === 1) {
        router.push('/staff')
      } else {
        setError('No access level found for this account')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 pt-10">
      <div className="flex flex-col items-center gap-5 px-8 md:px-0 animate-[fadeIn_0.5s_ease-out]">

        {/* Logo */}
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={260}
          height={260}
          className="drop-shadow-md"
        />

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center leading-tight">
          Cinema Ticketing Management System
          <span className="block text-lg text-gray-700 font-medium">
            (Growball Cinemax)
          </span>
        </h1>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200 w-full max-w-sm">
          <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

          <form onSubmit={handleSubmit} className="flex flex-col">

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
            />

            {/* Password */}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-600 hover:text-gray-900 absolute right-12 top-45 -translate-y-1/2"
            >
              {showPassword ? <EyeClosedIcon className='w-5 h-5' /> : <EyeOpenIcon className='w-5 h-5' />}
            </button>
            
            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all disabled:bg-gray-400 shadow-md hover:shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-gray-500 text-sm mt-2">
          © 2025 Growball Cinemax. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}