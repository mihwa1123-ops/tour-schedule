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
  description: string;
  image_url: string;
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
