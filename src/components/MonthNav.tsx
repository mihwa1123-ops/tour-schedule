"use client";

interface MonthNavProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={onPrev}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 transition"
      >
        &larr; 이전
      </button>
      <h2 className="text-lg font-bold text-gray-900">
        {year}년 {month + 1}월
      </h2>
      <button
        onClick={onNext}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 transition"
      >
        다음 &rarr;
      </button>
    </div>
  );
}
