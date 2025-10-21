"use client";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { logout } from '../lib/auth'
import Image from "next/image";
import { Menu, X, House, Film, Calendar, UserRound, Utensils, MessageSquareText, LogOut } from "lucide-react";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(false);
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

        if (!data || data.access_level !== 2) {
        router.replace('/')
        return
        }

        setEmail(user.email ?? null)
    }

    checkAccess()
    }, [router])

    if (!email) return null

    return (
    <div>
        {/* Navbar (visible on mobile) */}
        <nav className="md:hidden bg-signature-red text-white flex items-center justify-between p-4">
            <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-lg font-semibold">Manager Panel</h1>
            <div></div>
        </nav>

        <div className="flex">
            {/* Sidebar */}
            <div
                className={`fixed md:static top-0 left-0 min-h-screen w-64 bg-signature-red text-white py-4 transform transition-transform duration-300 ease-in-out
                ${isOpen ? "translate-x-0" : "-translate-x-full"} 
                md:translate-x-0 md:block z-50`}
            >
                <Image
                    src="/logo.jpg"
                    alt="Logo"
                    width={300}
                    height={300}
                    className="hidden md:inline-block mb-8 px-4"
                />
                <ul className="space-y-1 font-medium mt-12 md:mt-0">
                    <li>
                        <a
                            href="/manager"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <House />
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a
                            href="/manager/movies"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <Film />
                            Movies Management
                        </a>
                    </li>
                    <li>
                        <a
                            href="/manager/schedule"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <Calendar />
                            Schedule
                        </a>
                    </li>
                    <li>
                        <a
                            href="/manager/staff"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <UserRound />
                            Staff Management
                        </a>
                    </li>
                    <li>
                        <a
                            href="/manager/fnb"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <Utensils />
                            F&B Management
                        </a>
                    </li>
                    <li>
                        <a
                            href="/manager/feedback"
                            className="flex items-center gap-2 py-3 px-4 text-base font-normal text-white hover:bg-signature-red-hover"
                        >
                            <MessageSquareText />
                            Feedback & Complaint Management
                        </a>
                    </li>
                </ul>
                <div className="absolute bottom-0 w-full mb-4">
                    <button
                        onClick={async () => {
                            await logout()
                            router.push('/')
                        }}
                        className="w-full align-middle px-4 py-3 bg-signature-red text-white text-start hover:bg-signature-red-hover"
                    >
                        <LogOut className="inline mr-2" />
                        <p className='inline align-middle'>Logout</p>
                    </button> 
                </div>
            </div>

            {/* Main Content */}
            <main
                className="flex-1 transition-all duration-300"
                onClick={() => isOpen && setIsOpen(false)}
            >
                {children}
            </main>
        </div>

        {/* Overlay for mobile (click to close sidebar) */}
        {isOpen && (
            <div
            className="fixed inset-0 bg-black opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
            ></div>
        )}

    </div>
    );
}
