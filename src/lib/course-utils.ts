// 코스별 색상 매핑
export function getCourseColor(courseName: string): { bg: string; text: string } {
  switch (courseName) {
    case "마실A":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "마실B":
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    case "토요마실":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "일요마실":
      return { bg: "bg-pink-100", text: "text-pink-700" };
    case "휴일":
      return { bg: "bg-gray-200", text: "text-gray-400" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700" };
  }
}

// 요일별 기본 코스 이름 (0=일, 1=월, ..., 6=토)
export function getDefaultCourseName(dayOfWeek: number): string | null {
  switch (dayOfWeek) {
    case 2: return "마실A";  // 화
    case 4: return "마실A";  // 목
    case 3: return "마실B";  // 수
    case 5: return "마실B";  // 금
    case 6: return "토요마실"; // 토
    case 0: return "일요마실"; // 일
    case 1: return "휴일";   // 월
    default: return null;
  }
}
