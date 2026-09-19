import Link from "next/link";
import { MyEventSubmissions } from "@/components/events/MyEventSubmissions";
import { EventSubmitForm } from "@/components/events/EventSubmitForm";

export default function DashboardEventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="text-lg font-extrabold text-navy tracking-tight">My events</div>
        <div className="text-xs text-gray mt-0.5">
          Proposed events go to a review queue — approved ones appear on the{" "}
          <Link href="/events" className="font-bold text-blue hover:underline">
            public events page
          </Link>
          .
        </div>
      </div>

      <div>
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-2.5">
          My submissions
        </div>
        <MyEventSubmissions />
      </div>

      <div>
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-2.5">
          Propose a new event
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <EventSubmitForm />
        </div>
      </div>

      <div className="rounded-2xl bg-pale border border-border p-4 text-xs text-gray">
        <strong className="text-navy">How approval works:</strong> submit your event → it lands in the
        pending queue → an admin reviews and publishes it → you get a notification and it goes live on{" "}
        <Link href="/events" className="font-bold text-blue hover:underline">
          /events
        </Link>
        .
      </div>
    </div>
  );
}