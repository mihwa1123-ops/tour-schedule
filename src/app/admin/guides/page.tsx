"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Guide } from "@/types/database";

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchGuides() {
    const res = await fetch("/api/guides");
    setGuides(await res.json());
  }

  useEffect(() => { fetchGuides(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (res.ok) {
      setName("");
      setEmail("");
      fetchGuides();
    } else {
      const data = await res.json();
      setError(data.error || "추가에 실패했습니다.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string, guideName: string) {
    if (!confirm(`${guideName} 인솔자를 삭제하시겠습니까?`)) return;

    const res = await fetch(`/api/guides?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchGuides();
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">인솔자 관리</h2>

        <form onSubmit={handleAdd} className="mb-8 p-4 bg-white rounded-lg border border-gray-200 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">인솔자 추가</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-gray-400">* 비밀번호는 tour26 으로 자동 설정됩니다</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "추가 중..." : "추가"}
          </button>
        </form>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">인솔자 목록 ({guides.length}명)</h3>
          </div>
          {guides.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500">등록된 인솔자가 없습니다.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {guides.map((guide) => (
                <li key={guide.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{guide.name}</p>
                    <p className="text-xs text-gray-500">{guide.email}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(guide.id, guide.name)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
