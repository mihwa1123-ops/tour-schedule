"use client";

import { Course } from "@/types/database";

interface CourseModalProps {
  course: Course;
  onClose: () => void;
}

export default function CourseModal({ course, onClose }: CourseModalProps) {
  const hasAnyContent =
    course.description ||
    course.tour_location ||
    course.location_description ||
    course.boarding_location ||
    course.docent_handover;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
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
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-bold text-gray-500 mb-1">{label}</div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}
