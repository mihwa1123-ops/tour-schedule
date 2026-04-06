"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/");
  }

  const navItems = [
    { href: "/admin", label: "스케줄" },
    { href: "/admin/guides", label: "인솔자 관리" },
    { href: "/admin/courses", label: "코스 관리" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <h1 className="text-base font-bold text-gray-900">시티투어 관리자</h1>
              <nav className="flex gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      pathname === item.href
                        ? "bg-indigo-50 text-indigo-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
