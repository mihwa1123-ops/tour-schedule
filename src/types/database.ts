export interface Guide {
  id: string;
  name: string;
  email: string;
  auth_user_id: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  name: string;
  /** 전체 코스 설명 */
  description: string;
  /** 투어 장소 */
  tour_location: string;
  /** 장소 설명 */
  location_description: string;
  /** 승하차 장소 */
  boarding_location: string;
  /** 도슨트 인계 */
  docent_handover: string;
  link_url: string;
  created_at: string;
}

export interface Schedule {
  id: string;
  date: string;
  course_id: string | null;
  reservations: number;
  bank_transfer: number;
  onsite_purchase: number;
  vehicle_info: string;
  notes: string;
  confirmed_guide_id: string | null;
  created_at: string;
}

export interface GuideAvailability {
  id: string;
  schedule_id: string;
  guide_id: string;
  available: boolean;
}

export interface ScheduleWithDetails extends Schedule {
  course: Course | null;
  confirmed_guide: Guide | null;
  availability: (GuideAvailability & { guide: Guide })[];
}

export interface GuideMonthlyCount {
  guide_id: string;
  guide_name: string;
  count: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}
