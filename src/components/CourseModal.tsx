"use client";

import { useState } from "react";
import { Course } from "@/types/database";

interface CourseModalProps {
  course: Course;
  isAdmin?: boolean;
  onClose: () => void;
  onSave?: (description: string) => void;
}

export default function CourseModal({ course, isAdmin, onClose, onSave }: CourseModalProps) {
  const [description, setDescription] = useState(course.description);
  const [editing, setEditing] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[120px]"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => { onSave?.(description); setEditing(false); }}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{course.description || "설명이 없습니다."}</p>
            {course.image_url && (
              <img src={course.image_url} alt={course.name} className="rounded-lg w-full max-h-64 object-cover" />
            )}
            {course.link_url && (
              <a href={course.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline block">
                관련 링크 보기 &rarr;
              </a>
            )}
            {isAdmin && (
              <button
                onClick={() => setEditing(true)}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
              >
                편집
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
