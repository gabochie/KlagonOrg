"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { CourseCoverManager } from "@/components/admin/CourseCoverManager";
import { CoursePriceManager } from "@/components/admin/CoursePriceManager";

export default function AdminCoursesPage() {
  return (
    <RequireAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Courses</div>
          <div className="text-xs text-gray mt-0.5">
            Set each course&apos;s feature image and price. Changes publish with the next site
            rebuild.
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <CoursePriceManager />
        <CourseCoverManager />
      </div>
    </RequireAdmin>
  );
}
