"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import MonthNav from "@/components/MonthNav";
import CourseModal from "@/components/CourseModal";
import GuideLayout from "@/components/GuideLayout";
import { supabase } from "@/lib/supabase";
import { formatDate, isMonday, getDaysInMonth, toDateString } from "@/lib/date-utils";
import { getCourseColor } from "@/lib/course-utils";
import { Course, Guide, ScheduleWithDetails } from "@/types/database";
// Course 는 CourseModal prop 타입용으로만 사용

export default function GuideSchedulePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // 로컬 편집: schedule_id → available (저장 버튼 누르기 전까지만 유지)
  const [pendingAvailability, setPendingAvailability] = useState<Record<string, boolean>>({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const router = useRouter();

  const hasChanges = Object.keys(pendingAvailability).length > 0;

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const res = await fetch("/api/guides");
      const guides: Guide[] = await res.json();
      const guide = guides.find(g => g.auth_user_id === user.id);
      if (guide) setCurrentGuide(guide);
    }
    getUser();
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const schedulesRes = await fetch(`/api/schedules?year=${year}&month=${month}`);
    setSchedules(await schedulesRes.json());
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 브라우저 닫기/새로고침 경고
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // 키보드(입력 포커스) 감지
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

  // merged 스케줄: pendingAvailability 를 반영
  const mergedSchedules = useMemo(() => {
    if (!currentGuide) return schedules;
    return schedules.map((s) => {
      if (!(s.id in pendingAvailability)) return s;
      const newAvailable = pendingAvailability[s.id];
      const existing = s.availability || [];
      const hasRecord = existing.some((a) => a.guide_id === currentGuide.id);
      const updated = hasRecord
        ? existing.map((a) =>
            a.guide_id === currentGuide.id ? { ...a, available: newAvailable } : a
          )
        : [
            ...existing,
            {
              id: `pending-${s.id}`,
              schedule_id: s.id,
              guide_id: currentGuide.id,
              available: newAvailable,
              guide: currentGuide,
            },
          ];
      return { ...s, availability: updated };
    });
  }, [schedules, pendingAvailability, currentGuide]);

  function stageAvailability(scheduleId: string, newAvailable: boolean) {
    setPendingAvailability((prev) => {
      // 이미 서버 상태와 같아지면 해당 entry 제거
      const orig = schedules
        .find((s) => s.id === scheduleId)
        ?.availability?.find((a) => a.guide_id === currentGuide?.id)?.available || false;
      const next = { ...prev };
      if (newAvailable === orig) {
        delete next[scheduleId];
      } else {
        next[scheduleId] = newAvailable;
      }
      return next;
    });
  }

  async function saveAll() {
    if (!currentGuide) return;
    setSaving(true);
    try {
      const entries = Object.entries(pendingAvailability);
      for (const [scheduleId, available] of entries) {
        await fetch("/api/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schedule_id: scheduleId,
            guide_id: currentGuide.id,
            available,
          }),
        });
      }
      setPendingAvailability({});
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  // hasChanges 를 window 에 노출 (GuideLayout 의 탭/로그아웃 이 확인)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = hasChanges;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as unknown as { __hasUnsavedChanges?: boolean }).__hasUnsavedChanges = false;
      }
    };
  }, [hasChanges]);

  const days = getDaysInMonth(year, month);

  function getScheduleForDate(date: Date): ScheduleWithDetails | undefined {
    return mergedSchedules.find((s) => s.date === toDateString(date));
  }

  function tryChangeMonth(action: () => void) {
    if (hasChanges) {
      if (!confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")) return;
      setPendingAvailability({});
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
    <GuideLayout guideName={currentGuide?.name}>
      <MonthNav year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />

        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">이 달의 스케줄이 아직 없습니다.</div>
        ) : (
          <>
            {/* 데스크탑 테이블 */}
            <div className="hidden md:block overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border border-gray-200 px-3 py-2">날짜</th>
                    <th className="border border-gray-200 px-3 py-2">코스</th>
                    <th className="border border-gray-200 px-3 py-2">탑승자</th>
                    <th className="border border-gray-200 px-3 py-2">인솔확정</th>
                    <th className="border border-gray-200 px-3 py-2">배차정보</th>
                    <th className="border border-gray-200 px-3 py-2">특이사항</th>
                    <th className="border border-gray-200 px-3 py-2 text-center">참여</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((date) => {
                    const monday = isMonday(date);
                    const schedule = getScheduleForDate(date);
                    const myAvail = schedule?.availability?.find(a => a.guide_id === currentGuide?.id);
                    const isConfirmed = schedule?.confirmed_guide_id === currentGuide?.id;
                    const total = schedule
                      ? schedule.reservations + schedule.bank_transfer + schedule.onsite_purchase
                      : 0;

                    return (
                      <tr
                        key={toDateString(date)}
                        className={
                          monday ? "bg-gray-200 text-gray-400" :
                          isConfirmed ? "bg-indigo-50" : "hover:bg-gray-50"
                        }
                      >
                        <td className="border border-gray-200 px-3 py-2 whitespace-nowrap font-medium">
                          {formatDate(date)}
                        </td>
                        {(() => {
                          const color = schedule?.course ? getCourseColor(schedule.course.name) : { bg: "", text: "" };
                          return (
                            <td className={`border border-gray-200 px-3 py-2 ${monday ? "" : color.bg}`}>
                              {monday ? (
                                <span>휴일</span>
                              ) : schedule?.course ? (
                                <button
                                  onClick={() => setSelectedCourse(schedule.course!)}
                                  className={`font-medium hover:underline ${color.text}`}
                                >
                                  {schedule.course.name}
                                </button>
                              ) : "-"}
                            </td>
                          );
                        })()}
                        <td className="border border-gray-200 px-3 py-2">
                          {!monday && schedule && (
                            <span>
                              <span className="font-bold">{total}명</span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({schedule.reservations}/{schedule.bank_transfer}/{schedule.onsite_purchase})
                              </span>
                            </span>
                          )}
                        </td>
                        <td className={`border border-gray-200 px-3 py-2 ${isConfirmed ? "font-bold text-indigo-700" : ""}`}>
                          {!monday && schedule?.confirmed_guide
                            ? schedule.confirmed_guide.name
                            : !monday ? "-" : ""}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 max-w-[200px] whitespace-pre-wrap break-words" title={schedule?.vehicle_info}>
                          {!monday && (schedule?.vehicle_info || "")}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 max-w-[200px] whitespace-pre-wrap break-words" title={schedule?.notes}>
                          {!monday && (schedule?.notes || "")}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {!monday && schedule && (
                            <button
                              onClick={() => stageAvailability(schedule.id, !(myAvail?.available || false))}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                myAvail?.available
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {myAvail?.available ? "가능" : "불가"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden mt-4 space-y-2">
              {days.map((date) => {
                const monday = isMonday(date);
                const schedule = getScheduleForDate(date);
                const myAvail = schedule?.availability?.find(a => a.guide_id === currentGuide?.id);
                const isConfirmed = schedule?.confirmed_guide_id === currentGuide?.id;
                const total = schedule
                  ? schedule.reservations + schedule.bank_transfer + schedule.onsite_purchase
                  : 0;

                return (
                  <details
                    key={toDateString(date)}
                    className={`rounded-lg border ${
                      monday ? "bg-gray-100 border-gray-200" :
                      isConfirmed ? "bg-indigo-50 border-indigo-200" :
                      "bg-white border-gray-200"
                    }`}
                  >
                    <summary className="px-4 py-3 cursor-pointer flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${monday ? "text-gray-400" : "text-gray-900"}`}>
                          {formatDate(date)}
                          {monday && " (휴일)"}
                        </span>
                        {isConfirmed && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">확정</span>
                        )}
                      </div>
                      {!monday && schedule && (
                        <button
                          onClick={(e) => { e.preventDefault(); stageAvailability(schedule.id, !(myAvail?.available || false)); }}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            myAvail?.available
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {myAvail?.available ? "가능" : "불가"}
                        </button>
                      )}
                    </summary>
                    {!monday && schedule && (
                      <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">코스</span>
                          {schedule.course ? (
                            <button
                              onClick={() => setSelectedCourse(schedule.course!)}
                              className="text-indigo-600 hover:underline"
                            >
                              {schedule.course.name}
                            </button>
                          ) : <span>-</span>}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">탑승자</span>
                          <span>
                            <span className="font-bold">{total}명</span>
                            <span className="text-xs text-gray-400 ml-1">
                              ({schedule.reservations}/{schedule.bank_transfer}/{schedule.onsite_purchase})
                            </span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">인솔확정</span>
                          <span className={isConfirmed ? "font-bold text-indigo-700" : ""}>
                            {schedule.confirmed_guide?.name || "-"}
                          </span>
                        </div>
                        {schedule.vehicle_info && (
                          <div className="flex justify-between gap-3">
                            <span className="text-gray-500 shrink-0">배차정보</span>
                            <span className="text-right max-w-[60%] whitespace-pre-wrap break-words">{schedule.vehicle_info}</span>
                          </div>
                        )}
                        {schedule.notes && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">특이사항</span>
                            <span className="text-right max-w-[60%]">{schedule.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </>
        )}

      {selectedCourse && (
        <CourseModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}

      {/* 저장 버튼 - 후터 고정 (키보드 올라오면 숨김) */}
      <div
        className={`${keyboardOpen ? "hidden" : "fixed"} bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-lg`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {hasChanges ? `${Object.keys(pendingAvailability).length}개 변경사항` : "변경사항 없음"}
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
    </GuideLayout>
  );
}
