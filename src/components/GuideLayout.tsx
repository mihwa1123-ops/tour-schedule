"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

function confirmNavIfDirty(e: React.MouseEvent) {
  if (typeof window === "undefined") return;
  const dirty = (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges;
  if (dirty) {
    if (!confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")) {
      e.preventDefault();
    } else {
      (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = false;
    }
  }
}

export default function GuideLayout({
  children,
  guideName,
}: {
  children: React.ReactNode;
  guideName?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthChecked(true);
    }
    check();
  }, [router]);

  async function handleLogout() {
    const dirty = (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges;
    if (dirty && !confirm("저장하지 않은 변경사항이 있습니다. 로그아웃 하시겠습니까?")) {
      return;
    }
    (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = false;
    await supabase.auth.signOut();
    router.push("/");
  }

  // 24시간 이내 새 공지 여부
  const [hasNewNotice, setHasNewNotice] = useState(false);
  useEffect(() => {
    async function checkNotices() {
      try {
        const res = await fetch("/api/notices?limit=5");
        if (!res.ok) return;
        const { items } = await res.json();
        const now = Date.now();
        const has = items.some((n: { created_at: string }) => now - new Date(n.created_at).getTime() < 24 * 60 * 60 * 1000);
        setHasNewNotice(has);
      } catch { /* ignore */ }
    }
    checkNotices();
  }, []);

  const navItems = [
    { href: "/schedule", label: "스케줄" },
    { href: "/courses", label: "코스" },
    { href: "/notices", label: "공지사항", badge: hasNewNotice },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <h1 className="text-base font-bold text-gray-900">
              시티투어 인솔자
              {guideName && <span className="ml-1 text-indigo-600">({guideName})</span>}
            </h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <nav className="flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={confirmNavIfDirty}
                  className={`relative px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                    pathname === item.href
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {"badge" in item && item.badge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-24">{children}</main>
    </div>
  );
}
