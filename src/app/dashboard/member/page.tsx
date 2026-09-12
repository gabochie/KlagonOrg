import { WelcomeBanner } from "@/components/member/WelcomeBanner";
import { MetricsRow } from "@/components/member/MetricsRow";
import { JourneyTracker } from "@/components/member/JourneyTracker";
import { LearningProgress } from "@/components/member/LearningProgress";
import { Achievements } from "@/components/member/Achievements";
import { UpcomingEvents } from "@/components/member/UpcomingEvents";
import { CommunityProjects } from "@/components/member/CommunityProjects";
import { Announcements } from "@/components/member/Announcements";

export default function MemberDashboard() {
  return (
    <>
      <WelcomeBanner />
      <MetricsRow />
      <JourneyTracker />
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-2.5">
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-xl border border-border p-4">
            <LearningProgress />
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <Achievements />
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="bg-white rounded-xl border border-border p-4">
            <UpcomingEvents />
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <CommunityProjects />
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <Announcements />
          </div>
        </div>
      </div>
    </>
  );
}
