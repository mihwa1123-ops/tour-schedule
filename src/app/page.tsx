"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">시티투어 스케줄</h1>
          <p className="mt-2 text-sm text-gray-600">로그인 방식을 선택하세요</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push("/admin/login")}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            관리자 로그인
          </button>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50 transition"
          >
            인솔자 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
