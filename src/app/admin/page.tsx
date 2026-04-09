"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AdminLayout from "@/components/AdminLayout";
import MonthNav from "@/components/MonthNav";

import { formatDate, isMonday, getDaysInMonth, toDateString } from "@/lib/date-utils";
import { getCourseColor } from "@/lib/course-utils";
import { Course, Guide, ScheduleWithDetails, GuideMonthlyCount } from "@/types/database";

type PendingChange = {
  course_id?: string | null;
  reservations?: number;
  bank_transfer?: number;
  onsite_purchase?: number;
  confirmed_guide_id?: string | null;
  vehicle_info?: string;
  notes?: string;
};

export default function AdminSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // 키보드(입력 포커스) 감지 — 키보드 올라오면 저장 버튼 숨김
  useEffect(() => {
    function handleFocusIn(e: FocusEvent) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setKeyboardOpen(true);
      }
    }
    function handleFocusOut() {
      // focus 가 다른 input 으로 옮겨지는 경우를 고려해 살짝 지연
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          !active ||
          (active.tagName !== "INPUT" &&
            active.tagName !== "TEXTAREA" &&
            active.tagName !== "SELECT")
        ) {
          setKeyboardOpen(false);
        }
      }, 100);
    }
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  const hasChanges = Object.keys(pendingChanges).length > 0;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [schedulesRes, coursesRes, guidesRes] = await Promise.all([
      fetch(`/api/schedules?year=${year}&month=${month}`),
      fetch("/api/courses"),
      fetch("/api/guides"),
    ]);
    const [schedulesData, coursesData, guidesData] = await Promise.all([
      schedulesRes.json(),
      coursesRes.json(),
      guidesRes.json(),
    ]);
    setSchedules(schedulesData);
    setCourses(coursesData);
    setGuides(guidesData);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 브라우저 닫기/새로고침 경고
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = hasChanges;
    }
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (typeof window !== "undefined") {
        (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = false;
      }
    };
  }, [hasChanges]);

  async function initMonth() {
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    });
    fetchData();
  }

  function stageChange(id: string, field: keyof PendingChange, value: string | number | null) {
    setPendingChanges((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const entries = Object.entries(pendingChanges);
      for (const [id, change] of entries) {
        await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...change }),
        });
      }
      setPendingChanges({});
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  // merged 스케줄 (pending 변경사항 반영)
  const mergedSchedules = useMemo(() => {
    return schedules.map((s) => {
      const change = pendingChanges[s.id];
      if (!change) return s;
      return { ...s, ...change };
    });
  }, [schedules, pendingChanges]);

  const monthlyCounts: GuideMonthlyCount[] = guides.map((g) => ({
    guide_id: g.id,
    guide_name: g.name,
    count: mergedSchedules.filter((s) => s.confirmed_guide_id === g.id).length,
  }));

  const days = getDaysInMonth(year, month);

  function getScheduleForDate(date: Date): ScheduleWithDetails | undefined {
    return mergedSchedules.find((s) => s.date === toDateString(date));
  }

  function tryChangeMonth(action: () => void) {
    if (hasChanges) {
      if (!confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")) return;
      setPendingChanges({});
    }
    action();
  }

  function prevMonth() {
    tryChangeMonth(() => {
      if (month === 0) { setYear(year - 1); setMonth(11); }
      else setMonth(month - 1);
    });
  }
  function nextMonth() {
    tryChangeMonth(() => {
      if (month === 11) { setYear(year + 1); setMonth(0); }
      else setMonth(month + 1);
    });
  }

  return (
    <AdminLayout>
      <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

      {/* 월간 인솔 횟수 바 */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex flex-wrap gap-3 items-center shadow-sm mb-4">
        <span className="text-xs font-medium text-gray-500">인솔 횟수:</span>
        {monthlyCounts.map((mc) => (
          <span key={mc.guide_id} className="text-sm">
            <span className="font-medium text-gray-900">{mc.guide_name}</span>
            <span className="ml-1 text-indigo-600 font-bold">{mc.count}회</span>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">이 달의 스케줄이 없습니다.</p>
          <button
            onClick={initMonth}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {year}년 {month + 1}월 스케줄 생성
          </button>
        </div>
      ) : (
        <>
          {/* 데스크탑 테이블 */}
          <div className="hidden lg:block overflow-x-auto mt-4 pb-20">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-gray-200 px-2 py-2 whitespace-nowrap">날짜</th>
                  <th className="border border-gray-200 px-2 py-2">코스</th>
                  <th className="border border-gray-200 px-2 py-2">예약자</th>
                  <th className="border border-gray-200 px-2 py-2">계좌이체</th>
                  <th className="border border-gray-200 px-2 py-2">현장구매</th>
                  {guides.map((g) => (
                    <th key={g.id} className="border border-gray-200 px-2 py-2 text-center">{g.name}</th>
                  ))}
                  <th className="border border-gray-200 px-2 py-2">인솔확정</th>
                  <th className="border border-gray-200 px-2 py-2">배차정보</th>
                  <th className="border border-gray-200 px-2 py-2">특이사항</th>
                </tr>
              </thead>
              <tbody>
                {days.map((date) => {
                  const monday = isMonday(date);
                  const schedule = getScheduleForDate(date);
                  const availableGuides = schedule?.availability?.filter((a) => a.available) || [];

                  return (
                    <tr key={toDateString(date)} className={monday ? "bg-gray-200 text-gray-400" : "hover:bg-gray-50"}>
                      <td className="border border-gray-200 px-2 py-1.5 whitespace-nowrap font-medium">
                        {formatDate(date)}
                      </td>
                      {(() => {
                        const color = schedule?.course ? getCourseColor(schedule.course.name) : { bg: "", text: "" };
                        const currentCourseId = schedule?.course_id || "";
                        return (
                          <td className={`border border-gray-200 px-2 py-1.5 ${monday ? "" : color.bg}`}>
                            {monday ? (
                              <span className="text-gray-400">휴일</span>
                            ) : schedule ? (
                              <select
                                value={currentCourseId}
                                onChange={(e) => stageChange(schedule.id, "course_id", e.target.value || null)}
                                className={`w-full bg-transparent text-sm border-0 p-0 focus:ring-0 font-medium ${color.text}`}
                              >
                                <option value="">-</option>
                                {courses.filter(c => c.name !== "휴일").map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            ) : null}
                          </td>
                        );
                      })()}
                      <td className="border border-gray-200 px-2 py-1.5">
                        {!monday && schedule && (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.reservations}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "reservations", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="w-14 bg-transparent text-sm border-0 p-0 focus:ring-0"
                          />
                        )}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5">
                        {!monday && schedule && (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.bank_transfer}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "bank_transfer", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="w-14 bg-transparent text-sm border-0 p-0 focus:ring-0"
                          />
                        )}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5">
                        {!monday && schedule && (
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.onsite_purchase}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "onsite_purchase", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="w-14 bg-transparent text-sm border-0 p-0 focus:ring-0"
                          />
                        )}
                      </td>
                      {guides.map((guide) => {
                        const avail = schedule?.availability?.find((a) => a.guide_id === guide.id);
                        return (
                          <td key={guide.id} className={`border border-gray-200 px-2 py-1.5 text-center ${
                            avail?.available ? "bg-green-50 text-green-700" : ""
                          }`}>
                            {!monday && (avail?.available ? "O" : "-")}
                          </td>
                        );
                      })}
                      <td className="border border-gray-200 px-2 py-1.5">
                        {!monday && schedule && (
                          <select
                            value={schedule.confirmed_guide_id || ""}
                            onChange={(e) => stageChange(schedule.id, "confirmed_guide_id", e.target.value || null)}
                            className={`w-full bg-transparent text-sm border-0 p-0 focus:ring-0 ${
                              schedule.confirmed_guide_id ? "font-bold text-indigo-700" : ""
                            }`}
                          >
                            <option value="">-</option>
                            {availableGuides.map((a) => (
                              <option key={a.guide_id} value={a.guide_id}>{a.guide.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 align-top w-[180px] max-w-[180px]">
                        {!monday && schedule && (
                          <textarea
                            value={schedule.vehicle_info}
                            onChange={(e) => stageChange(schedule.id, "vehicle_info", e.target.value)}
                            className="w-full bg-transparent text-sm border-0 p-0 focus:ring-0 resize-none break-words whitespace-pre-wrap"
                            placeholder="번호/기사/연락처"
                            rows={Math.max(1, Math.ceil((schedule.vehicle_info?.length || 0) / 14))}
                          />
                        )}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 align-top w-[200px] max-w-[200px]">
                        {!monday && schedule && (
                          <textarea
                            value={schedule.notes}
                            onChange={(e) => stageChange(schedule.id, "notes", e.target.value)}
                            className="w-full bg-transparent text-sm border-0 p-0 focus:ring-0 resize-none break-words whitespace-pre-wrap"
                            placeholder="특이사항"
                            rows={Math.max(1, Math.ceil((schedule.notes?.length || 0) / 15))}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일 아코디언 카드 뷰 */}
          <div className="lg:hidden mt-4 space-y-2 pb-20">
            {days.map((date) => {
              const monday = isMonday(date);
              const schedule = getScheduleForDate(date);
              const availableGuides = schedule?.availability?.filter((a) => a.available) || [];

              return (
                <details
                  key={toDateString(date)}
                  className={`rounded-lg border ${monday ? "bg-gray-100 border-gray-200" : "bg-white border-gray-200"}`}
                >
                  <summary className={`px-4 py-3 flex items-center justify-between ${monday ? "pointer-events-none" : "cursor-pointer"}`}>
                    <span className={`font-medium ${monday ? "text-gray-400" : "text-gray-900"}`}>
                      {formatDate(date)}
                      {monday && " (휴일)"}
                    </span>
                    {!monday && schedule?.confirmed_guide_id && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                        {guides.find(g => g.id === schedule.confirmed_guide_id)?.name}
                      </span>
                    )}
                  </summary>
                  {!monday && schedule && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs text-gray-500">
                          코스
                          <select
                            value={schedule.course_id || ""}
                            onChange={(e) => stageChange(schedule.id, "course_id", e.target.value || null)}
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                          >
                            <option value="">-</option>
                            {courses.filter(c => c.name !== "휴일").map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-gray-500">
                          인솔확정
                          <select
                            value={schedule.confirmed_guide_id || ""}
                            onChange={(e) => stageChange(schedule.id, "confirmed_guide_id", e.target.value || null)}
                            className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                          >
                            <option value="">-</option>
                            {availableGuides.map((a) => (
                              <option key={a.guide_id} value={a.guide_id}>{a.guide.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="text-xs text-gray-500">
                          예약자
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.reservations}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "reservations", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="mt-1 w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                        </label>
                        <label className="text-xs text-gray-500">
                          계좌이체
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.bank_transfer}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "bank_transfer", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="mt-1 w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                        </label>
                        <label className="text-xs text-gray-500">
                          현장구매
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={schedule.onsite_purchase}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => stageChange(schedule.id, "onsite_purchase", parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                            className="mt-1 w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                        </label>
                      </div>
                      <div className="text-xs text-gray-500">
                        가능 인솔자: {availableGuides.length > 0
                          ? availableGuides.map(a => a.guide.name).join(", ")
                          : "없음"}
                      </div>
                      <label className="text-xs text-gray-500">
                        배차정보
                        <textarea
                          value={schedule.vehicle_info}
                          onChange={(e) => stageChange(schedule.id, "vehicle_info", e.target.value)}
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm resize-none break-words whitespace-pre-wrap"
                          placeholder="차량번호/기사/연락처"
                          rows={Math.max(1, Math.ceil((schedule.vehicle_info?.length || 0) / 25))}
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        특이사항
                        <textarea
                          value={schedule.notes}
                          onChange={(e) => stageChange(schedule.id, "notes", e.target.value)}
                          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm resize-none break-words whitespace-pre-wrap"
                          placeholder="특이사항"
                          rows={Math.max(1, Math.ceil((schedule.notes?.length || 0) / 25))}
                        />
                      </label>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </>
      )}

      {/* 저장 버튼 - 후터 고정 (키보드 올라오면 숨김) */}
      <div className={`${keyboardOpen ? "hidden" : "fixed"} bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {hasChanges ? `${Object.keys(pendingChanges).length}개 변경사항` : "변경사항 없음"}
          </span>
          <button
            onClick={saveAll}
            disabled={!hasChanges || saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
