"use client";

import { useEffect, useState } from "react";
import GuideLayout from "@/components/GuideLayout";
import { supabase } from "@/lib/supabase";
import { getCourseColor } from "@/lib/course-utils";
import { Course, Guide } from "@/types/database";

export default function GuideCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const res = await fetch("/api/guides");
        const guides: Guide[] = await res.json();
        const guide = guides.find((g) => g.auth_user_id === user.id);
        if (guide) setCurrentGuide(guide);
      }

      const coursesRes = await fetch("/api/courses");
      const data = await coursesRes.json();
      setCourses((data || []).filter((c: Course) => c.name !== "휴일"));
      setLoading(false);
    }
    load();
  }, []);

  return (
    <GuideLayout guideName={currentGuide?.name}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">코스 안내</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">등록된 코스가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => {
            const color = getCourseColor(course.name);
            const hasAnyContent =
              course.description ||
              course.tour_location ||
              course.location_description ||
              course.boarding_location ||
              course.docent_handover;

            return (
              <div
                key={course.id}
                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
              >
                <div className={`px-4 py-3 ${color.bg}`}>
                  <h3 className={`text-base font-bold ${color.text}`}>{course.name}</h3>
                </div>
                <div className="p-4 space-y-4">
                  {!hasAnyContent && (
                    <p className="text-sm text-gray-400">설명이 없습니다.</p>
                  )}
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
              </div>
            );
          })}
        </div>
      )}
    </GuideLayout>
  );
}

function ReadField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-sm font-bold mb-1" style={{ color: "#6E59FF" }}>{label}</div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}
