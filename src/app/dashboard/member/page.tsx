import Link from "next/link";
import { WelcomeBanner } from "@/components/member/WelcomeBanner";
import { ContributorProgress } from "@/components/member/ContributorProgress";
import { WelcomeOnboarding } from "@/components/member/WelcomeOnboarding";
import { MetricsRow } from "@/components/member/MetricsRow";
import { JourneyTracker } from "@/components/member/JourneyTracker";
import { LearningProgress } from "@/components/member/LearningProgress";
import { Achievements } from "@/components/member/Achievements";
import { UpcomingEvents } from "@/components/member/UpcomingEvents";
import { CommunityProjects } from "@/components/member/CommunityProjects";
import { Announcements } from "@/components/member/Announcements";
import { PublicProfileLink } from "@/components/member/PublicProfileLink";

export default function MemberDashboard() {
  return (
    <>
      <WelcomeBanner />
      <WelcomeOnboarding />
      <ContributorProgress />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Link
          href="/submit"
          className="block bg-navy rounded-xl p-4 text-white hover:opacity-95 transition-opacity"
        >
          <div className="text-sm font-extrabold">Share with the community →</div>
          <div className="text-[11px] text-white/70 mt-0.5">
            Post news, events, classifieds, jobs — free, reviewed before going live
          </div>
        </Link>
        <Link
          href="/my/posts"
          className="block bg-white rounded-xl border border-border p-4 hover:border-amber transition-colors"
        >
          <div className="text-sm font-extrabold text-navy">My Posts →</div>
          <div className="text-[11px] text-gray mt-0.5">
            Track reviews, edit while pending, see admin notes
          </div>
        </Link>
<Link
          href="/field"
          className="block bg-white rounded-xl border border-border p-4 hover:border-amber transition-colors"
        >
          <div className="text-sm font-extrabold text-navy">Field Kit &rarr;</div>
          <div className="text-[11px] text-gray mt-0.5">
            Visiting shops? Capture listings on the spot
          </div>
</Link>
        <PublicProfileLink />
      </div>
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
