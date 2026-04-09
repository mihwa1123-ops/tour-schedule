"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Course } from "@/types/database";

type EditForm = {
  description: string;
  tour_location: string;
  location_description: string;
  boarding_location: string;
  docent_handover: string;
  link_url: string;
};

const EMPTY_FORM: EditForm = {
  description: "",
  tour_location: "",
  location_description: "",
  boarding_location: "",
  docent_handover: "",
  link_url: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function fetchCourses() {
    const res = await fetch("/api/courses");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "코스를 불러오지 못했습니다.");
      return;
    }
    setCourses(await res.json());
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  function startEdit(course: Course) {
    setEditingId(course.id);
    setForm({
      description: course.description ?? "",
      tour_location: course.tour_location ?? "",
      location_description: course.location_description ?? "",
      boarding_location: course.boarding_location ?? "",
      docent_handover: course.docent_handover ?? "",
      link_url: course.link_url ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave(id: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(
          (data.error || "저장에 실패했습니다.") +
          "\n\n[원인 가능성]\n" +
          "Supabase DB 에 새 컬럼이 아직 없을 수 있습니다.\n" +
          "supabase/migrations/003_course_fields.sql 을 실행해주세요."
        );
        return;
      }
      const updated: Course = await res.json();
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">코스 관리</h2>

        <div className="bg-white rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-100">
            {courses
              .filter((c) => c.name !== "휴일")
              .map((course) => {
                const isEditing = editingId === course.id;
                return (
                  <li key={course.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">{course.name}</h3>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(course)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-700 hover:bg-indigo-100"
                        >
                          편집
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Field label="① 전체 코스">
                          <textarea
                            value={form.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            rows={3}
                            placeholder="코스 전체에 대한 설명"
                            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </Field>

                        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 space-y-3">
                          <div className="text-xs font-bold text-gray-700">② 각 코스 상세</div>
                          <Field label="투어 장소">
                            <textarea
                              value={form.tour_location}
                              onChange={(e) => updateField("tour_location", e.target.value)}
                              rows={3}
                              placeholder="방문하는 장소 목록"
                              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </Field>
                          <Field label="장소 설명">
                            <textarea
                              value={form.location_description}
                              onChange={(e) => updateField("location_description", e.target.value)}
                              rows={4}
                              placeholder="각 장소에 대한 설명"
                              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </Field>
                          <Field label="승하차 장소">
                            <textarea
                              value={form.boarding_location}
                              onChange={(e) => updateField("boarding_location", e.target.value)}
                              rows={3}
                              placeholder="승차/하차 위치"
                              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </Field>
                          <Field label="도슨트 인계">
                            <textarea
                              value={form.docent_handover}
                              onChange={(e) => updateField("docent_handover", e.target.value)}
                              rows={3}
                              placeholder="도슨트 인계 사항"
                              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </Field>
                        </div>

                        <Field label="관련 URL (선택)">
                          <input
                            type="url"
                            value={form.link_url}
                            onChange={(e) => updateField("link_url", e.target.value)}
                            placeholder="https://example.com/course-info"
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </Field>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleSave(course.id)}
                            disabled={saving}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300"
                          >
                            {saving ? "저장 중..." : "저장"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <ReadField label="전체 코스" value={course.description} />
                        <ReadField label="투어 장소" value={course.tour_location} />
                        <ReadField label="장소 설명" value={course.location_description} />
                        <ReadField label="승하차 장소" value={course.boarding_location} />
                        <ReadField label="도슨트 인계" value={course.docent_handover} />
                        {course.link_url && (
                          <a
                            href={course.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline block break-all"
                          >
                            관련 링크 보기 →
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}
