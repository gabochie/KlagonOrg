import { VolunteerSection } from "@/components/sections/VolunteerSection";
import { MyVolunteerService } from "@/components/volunteer/MyVolunteerService";

export default function DashboardVolunteerPage() {
  return (
    <>
      <VolunteerSection />
      <div className="bg-light px-4 sm:px-6 pb-14">
        <div className="max-w-5xl mx-auto">
          <MyVolunteerService />
        </div>
      </div>
    </>
  );
}