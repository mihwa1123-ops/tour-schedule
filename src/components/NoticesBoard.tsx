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

  async function fetchInitial() {
    setLoading(true);
    const res = await fetch(`/api/notices?limit=${INITIAL_LIMIT}&offset=0`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => {
    fetchInitial();
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    const res = await fetch(`/api/notices?limit=${MORE_LIMIT}&offset=${items.length}`);
    const data = await res.json();
    setItems((prev) => [...prev, ...(data.items || [])]);
    setTotal(data.total || 0);
    setLoadingMore(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "등록에 실패했습니다.");
      return;
    }
    setNewTitle("");
    setNewContent("");
    setShowWrite(false);
    await fetchInitial();
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
    const res = await fetch("/api/notices", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title: editTitle, content: editContent }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "수정에 실패했습니다.");
      return;
    }
    cancelEdit();
    await fetchInitial();
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
        {!readOnly && !showWrite && (
          <button
            onClick={() => setShowWrite(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
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
            const displayDate = n.updated_at || n.created_at;
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
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-base font-bold text-gray-900 break-words flex-1">
                        {n.title}
                      </h3>
                      {!readOnly && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(n)}
                            className="text-xs text-gray-500 hover:text-indigo-600"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {formatDateTime(displayDate)}
                      {isEdited && <span className="ml-1 text-gray-400">(수정됨)</span>}
                    </div>
                    {n.content && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {n.content}
                      </p>
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
