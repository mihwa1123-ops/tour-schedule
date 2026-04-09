"use client";

import { useEffect, useState } from "react";
import GuideLayout from "@/components/GuideLayout";
import NoticesBoard from "@/components/NoticesBoard";
import { supabase } from "@/lib/supabase";
import { Guide } from "@/types/database";

export default function GuideNoticesPage() {
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const res = await fetch("/api/guides");
      const guides: Guide[] = await res.json();
      const guide = guides.find((g) => g.auth_user_id === user.id);
      if (guide) setCurrentGuide(guide);
    }
    load();
  }, []);

  return (
    <GuideLayout guideName={currentGuide?.name}>
      <NoticesBoard readOnly />
    </GuideLayout>
  );
}
