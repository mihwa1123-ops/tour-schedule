"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Course } from "@/types/database";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");

  async function fetchCourses() {
    const res = await fetch("/api/courses");
    setCourses(await res.json());
  }

  useEffect(() => { fetchCourses(); }, []);

  async function handleSave(id: string) {
    await fetch("/api/courses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, description: editDescription, image_url: editImageUrl, link_url: editLinkUrl }),
    });
    setEditingId(null);
    fetchCourses();
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">코스 관리</h2>

        <div className="bg-white rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-100">
            {courses.filter(c => c.name !== "휴일").map((course) => (
              <li key={course.id} className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900">{course.name}</h3>
                  {editingId !== course.id && (
                    <button
                      onClick={() => { setEditingId(course.id); setEditDescription(course.description); setEditImageUrl(course.image_url || ""); setEditLinkUrl(course.link_url || ""); }}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      편집
                    </button>
                  )}
                </div>
                {editingId === course.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">코스 설명</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">이미지 URL</label>
                      <input
                        type="url"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">관련 URL</label>
                      <input
                        type="url"
                        value={editLinkUrl}
                        onChange={(e) => setEditLinkUrl(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://example.com/course-info"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(course.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {course.description || "설명 없음"}
                    </p>
                    {course.image_url && (
                      <img src={course.image_url} alt={course.name} className="rounded-lg max-h-48 object-cover" />
                    )}
                    {course.link_url && (
                      <a href={course.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline block">
                        관련 링크 보기 &rarr;
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
