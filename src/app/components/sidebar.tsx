'use client';
import Image from "next/image";
import { X, User, LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Theme, Avatar, Text } from "@radix-ui/themes";

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
      className={`fixed md:static top-0 left-0 h-full md:min-h-screen w-64 bg-signature-red text-white p-4 transform transition-transform duration-300 ease-in-out
      ${isOpen ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 md:block z-50 flex flex-col`}
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
      <ul className="space-y-1 font-medium mt-2 md:mt-0 overflow-y-auto">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className="flex items-center rounded gap-2 py-3 px-2 text-base font-normal text-white hover:bg-signature-red-hover transition"
              onClick={() => setIsOpen(false)}
            >
              {link.icon}
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* User Profile Card at Bottom */}
      <div className="mt-auto md:absolute md:bottom-3 md:w-56 w-full">
        <Theme className="inline">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-3 w-full rounded-xl bg-[#511312] p-3 transition">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white font-medium">
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <Text
                    weight="bold"
                    size="2"
                    className="block leading-tight truncate text-white"
                  >
                    {name || "User"}
                  </Text>
                  <Text
                    size="1"
                    className="block truncate max-w-[150px] text-gray-200"
                    title={email || ""}
                  >
                    {email || "email@example.com"}
                  </Text>
                </div>
              </button>
            </DropdownMenu.Trigger>

            {/* Keep dropdown text dark */}
            <DropdownMenu.Content
              side="top"
              align="start"
              sideOffset={6}
              className="min-w-[220px] rounded-md bg-white shadow-md p-2"
            >
              <DropdownMenu.Label className="text-sm font-medium text-gray-600 px-2">
                Account
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
              <DropdownMenu.Item
                className="flex items-center gap-2 px-2 py-2 text-sm text-gray-800 rounded hover:bg-gray-100 cursor-pointer"
              >
                <User className="w-4 h-4" />
                Account Settings
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onClick={onLogout}
                className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 rounded hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Theme>
      </div>
    </div>
  );
}