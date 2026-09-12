import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen grid grid-cols-[220px_1fr] grid-rows-[52px_1fr] bg-light overflow-hidden">
      <Topbar />
      <Sidebar />
      <main className="overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">{children}</main>
    </div>
  );
}
