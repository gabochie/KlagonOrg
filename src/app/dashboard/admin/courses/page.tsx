"use client";

import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { CourseCoverManager } from "@/components/admin/CourseCoverManager";

export default function AdminCoursesPage() {
  return (
    <RequireAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Course covers</div>
          <div className="text-xs text-gray mt-0.5">
            Set the feature image for each course. Uploads publish with the next site rebuild.
          </div>
        </div>
      </div>
      <CourseCoverManager />
    </RequireAdmin>
  );
}
