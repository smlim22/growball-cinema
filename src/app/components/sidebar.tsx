import Image from "next/image";
import { X, LogOut, User } from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  links: SidebarLink[];
  name: string | null;
  email: string | null;
  onLogout: () => Promise<void>;
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  links,
  name,
  email,
  onLogout,
}: SidebarProps) {
  return (
    <div
      className={`fixed md:static top-0 left-0 min-h-screen w-64 bg-signature-red text-white p-4 transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 md:block z-50`}
    >
      {/* Close button (mobile only) */}
      <div className="md:hidden flex justify-start px-2 mb-4">
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Logo */}
      <Image
        src="/logo.jpg"
        alt="Logo"
        width={300}
        height={300}
        className="hidden md:inline-block mb-8"
      />

      {/* Navigation Links */}
      <ul className="space-y-1 font-medium mt-2 md:mt-0">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className="flex items-center rounded gap-2 py-3 px-2 text-base font-normal text-white hover:bg-signature-red-hover"
              onClick={() => setIsOpen(false)}
            >
              {link.icon}
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* User Profile Section */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-white/20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="rounded-full overflow-hidden">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{name}</span>
            <span className="text-xs text-gray-200">{email}</span>
          </div>
          <div className="flex">
            <button
              onClick={onLogout}
              className="text-white hover:text-gray-300"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}