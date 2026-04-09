"use client";

import { useEffect, useState } from "react";
import { Notice } from "@/types/database";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

const INITIAL_LIMIT = 30;
const MORE_LIMIT = 10;

export default function NoticesBoard({ readOnly = false }: { readOnly?: boolean }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 새 글 작성
  const [showWrite, setShowWrite] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 편집 중인 id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      try {
        const res = await fetch(`/api/notices?limit=${INITIAL_LIMIT}&offset=0`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "공지사항을 불러오지 못했습니다.");
          setItems([]);
          setTotal(0);
        } else {
          const data = await res.json();
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchInitial();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/notices?limit=${MORE_LIMIT}&offset=${items.length}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "더 불러오지 못했습니다.");
        return;
      }
      const data = await res.json();
      setItems((prev) => [...prev, ...(data.items || [])]);
      setTotal(data.total || 0);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "등록에 실패했습니다.");
        return;
      }
      const created: Notice = await res.json();
      // 낙관적 업데이트: 새 글을 맨 위에 추가
      setItems((prev) => [created, ...prev]);
      setTotal((t) => t + 1);
      setNewTitle("");
      setNewContent("");
      setShowWrite(false);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(n: Notice) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  async function handleUpdate(id: string) {
    if (!editTitle.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/notices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: editTitle, content: editContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "수정에 실패했습니다.");
        return;
      }
      const updated: Notice = await res.json();
      // 수정된 항목을 맨 위로 이동 (updated_at 기준 정렬이므로 동일 동작)
      setItems((prev) => [updated, ...prev.filter((n) => n.id !== id)]);
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("삭제에 실패했습니다.");
      return;
    }
    setItems((prev) => prev.filter((n) => n.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  const hasMore = items.length < total;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
        {!readOnly && (
          <button
            onClick={() => setShowWrite(true)}
            disabled={showWrite}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            글쓰기
          </button>
        )}
      </div>

      {!readOnly && showWrite && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="내용"
            rows={5}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowWrite(false);
                setNewTitle("");
                setNewContent("");
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300"
            >
              {saving ? "등록 중..." : "등록"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">등록된 공지사항이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const isEdited = n.updated_at && n.created_at && n.updated_at !== n.created_at;
            const isEditing = editingId === n.id;

            return (
              <div
                key={n.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                {!readOnly && isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="제목"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="내용"
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleUpdate(n.id)}
                        disabled={saving}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300"
                      >
                        {saving ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 등록 시간 (상단) */}
                    <div className="text-xs text-gray-500 mb-1">
                      등록 {formatDateTime(n.created_at)}
                      {isEdited && (
                        <span className="ml-2 text-gray-400">
                          · 수정 {formatDateTime(n.updated_at)}
                        </span>
                      )}
                    </div>
                    {/* 제목 */}
                    <h3 className="text-base font-bold text-gray-900 break-words mb-2">
                      {n.title}
                    </h3>
                    {/* 내용 */}
                    {n.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {n.content}
                      </p>
                    )}
                    {/* 수정/삭제 버튼 (카드 내부 하단) */}
                    {!readOnly && (
                      <div className="flex gap-2 justify-end mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => startEdit(n)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingMore ? "불러오는 중..." : `더보기 (${total - items.length}개 남음)`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
