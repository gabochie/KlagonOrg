"use client";

import Link from "next/link";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { useAuth } from "@/components/auth/AuthProvider";
import { MetricCards } from "@/components/admin/MetricCards";
import { BarChart } from "@/components/admin/BarChart";
import { DonutChart } from "@/components/admin/DonutChart";
import { QuickActions } from "@/components/admin/QuickActions";
import { MembersTable } from "@/components/admin/MembersTable";
import { UpcomingEvents } from "@/components/admin/UpcomingEvents";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { LeadsList } from "@/components/admin/LeadsList";
import { DirectoryImporter } from "@/components/admin/DirectoryImporter";
import { ClaimsQueue } from "@/components/admin/ClaimsQueue";
import { OwnerDigests } from "@/components/admin/OwnerDigests";
import { ListingImporter } from "@/components/admin/ListingImporter";
import { MapImporter } from "@/components/admin/MapImporter";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { OutreachQueue } from "@/components/admin/OutreachQueue";

export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <RequireAdmin>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-lg font-extrabold text-navy tracking-tight">Dashboard Overview</div>
          <div className="text-xs text-gray mt-0.5">
            {today} · Klagon, Greater Accra
          </div>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <Link
              href="/dashboard/super"
              className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Super Admin →
            </Link>
          )}
          <button className="px-3 py-1.5 rounded-lg bg-white text-navy border border-border text-xs font-semibold cursor-pointer font-sans hover:bg-light transition-colors">
            Export Report
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-amber text-navy text-xs font-bold cursor-pointer font-sans hover:bg-amber/90 transition-colors">
            + New Event
          </button>
        </div>
      </div>

      <MetricCards />

      <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-2.5">
        <div className="bg-white rounded-xl border border-border p-4">
          <BarChart />
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <DonutChart />
        </div>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2.5">
        <MembersTable />
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-xl border border-border p-4">
            <UpcomingEvents />
          </div>
          <div className="bg-white rounded-xl border border-border p-4 flex-1">
            <ActivityFeed />
          </div>
        </div>
      </div>

      <LeadsList />
      <div className="mt-2.5">
        <DirectoryImporter />
      </div>
      <div className="mt-2.5">
        <OwnerDigests />
      </div>
      <div className="mt-2.5">
        <ClaimsQueue />
      </div>
      <div className="mt-2.5">
        <MapImporter />
      </div>
      <div className="mt-2.5">
        <ListingImporter />
      </div>
      <div className="mt-2.5">
        <ModerationQueue />
      </div>
      <div className="mt-2.5">
        <OutreachQueue />
      </div>
      </RequireAdmin>
    );
}