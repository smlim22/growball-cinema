'use client';
import Sidebar from "../components/sidebar";
import { Menu, X, House, Banknote, Utensils } from "lucide-react";
import { logout } from "../lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Image from "next/image";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("staff")
        .select("access_level, staff_name")
        .eq("uuid", user.id)
        .single();

      if (!data || data.access_level !== 1) {
        router.replace("/");
        return;
      }

      setEmail(user.email ?? null);
      setName(data.staff_name ?? null);
    };

    checkAccess();
  }, [router]);

  if (!email) return null;

  const links = [
    { href: "/staff", label: "Home", icon: <House /> },
    { href: "/staff/pos", label: "Point of Sales (POS)", icon: <Banknote /> },
    { href: "/staff/fnb", label: "F&B Order Management", icon: <Utensils /> },
  ];

  return (
    <div>
      <nav className="md:hidden bg-signature-red text-white flex items-center justify-between px-4 py-3">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Image src="/logo.jpg" alt="Logo" width={190} height={190} />
        <div></div>
      </nav>

      <div className="flex">
        <Sidebar
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          links={links}
          name={name}
          email={email}
          onLogout={async () => {
            await logout();
            router.push("/");
          }}
        />
        <main className="flex-1 transition-all duration-300" onClick={() => isOpen && setIsOpen(false)}>
          {children}
        </main>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}