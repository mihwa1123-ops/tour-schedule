"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwLoading(true);

    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
    });

    if (res.ok) {
      setPwMsg("비밀번호가 변경되었습니다.");
      setCurrentPw("");
      setNewPw("");
      setTimeout(() => setShowPwModal(false), 1000);
    } else {
      const data = await res.json();
      setPwMsg(data.error || "변경에 실패했습니다.");
    }
    setPwLoading(false);
  }

  const navItems = [
    { href: "/admin", label: "스케줄" },
    { href: "/admin/guides", label: "인솔자 관리" },
    { href: "/admin/courses", label: "코스 관리" },
    { href: "/admin/notices", label: "공지사항" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <h1 className="text-base font-bold text-gray-900">시티투어 관리자</h1>

            {/* PC: 텍스트 버튼 */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => { setShowPwModal(true); setPwMsg(""); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                비밀번호 변경
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                로그아웃
              </button>
            </div>

            {/* 모바일: 햄버거 */}
            <div className="md:hidden relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => { setShowMenu(false); setShowPwModal(true); setPwMsg(""); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    비밀번호 변경
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 탭 메뉴 - 헤더와 함께 고정 */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={confirmNavIfDirty}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                    pathname === item.href
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>

      {/* 햄버거 메뉴 배경 오버레이 */}
      {showMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
      )}

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowPwModal(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">관리자 비밀번호 변경</h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="현재 비밀번호"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="새 비밀번호 (4자 이상)"
                required
                minLength={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {pwMsg && <p className={`text-sm ${pwMsg.includes("변경") ? "text-green-600" : "text-red-600"}`}>{pwMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowPwModal(false)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {pwLoading ? "변경 중..." : "변경"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
