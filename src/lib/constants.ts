import type {
  Event,
  Course,
  Project,
  Announcement,
  Badge,
  Activity,
  JourneyStage,
  Metric,
  VolunteerOpportunity,
  NewsArticle,
  SponsorPlan,
  DonationTier,
  MentorTopic,
} from "@/types";

export const NAV_LINKS = [
  "About",
  "Events",
  "Learn",
  "Projects",
  "Community",
] as const;

export const INTERESTS = [
  "Technology",
  "Entrepreneurship",
  "AI",
  "Leadership",
  "Jobs & Career",
  "Community",
  "Finance",
  "Communication",
] as const;

export const JOURNEY_STAGES: JourneyStage[] = [
  { id: 1, name: "Discover", icon: "🔍", subtitle: "Find your interest", state: "done" },
  { id: 2, name: "Learn", icon: "📚", subtitle: "Skills & workshops", state: "current" },
  { id: 3, name: "Build", icon: "🔨", subtitle: "Real projects", state: "locked" },
  { id: 4, name: "Earn", icon: "💰", subtitle: "Jobs & income", state: "locked" },
  { id: 5, name: "Lead", icon: "🏆", subtitle: "Run teams", state: "locked" },
  { id: 6, name: "Mentor", icon: "🌱", subtitle: "Give back", state: "locked" },
];

export const VALUE_PROPS = [
  { icon: "🤖", title: "AI & Tech Skills", desc: "Learn AI tools, coding basics, and digital skills that employers and clients actually pay for in today's Ghana.", bg: "#EEF2FF" },
  { icon: "💼", title: "Entrepreneurship", desc: "Turn your ideas into income. Get the mindset, tools, and network to start something meaningful.", bg: "#FFF7E6" },
  { icon: "🤝", title: "Mentorship Access", desc: "Connect with experienced professionals from the community who've walked the path and want to shorten yours.", bg: "#ECFDF5" },
  { icon: "🏗️", title: "Community Projects", desc: "Work on real projects that build your portfolio and Klagon.", bg: "#FFF3F0" },
  { icon: "📋", title: "Career Planning", desc: "Structured sessions on CVs, interviews, financial literacy, and career roadmaps.", bg: "#F0F9FF" },
  { icon: "🎖️", title: "Recognition & Records", desc: "Every session, project, and contribution is tracked. Build a verifiable record of growth.", bg: "#F0FDF4" },
];

export const EVENTS: Event[] = [
  { id: "1", title: "Introduction to AI Tools", type: "workshop", date: "2025-07-12", time: "10:00 AM", location: "Community Hall, Klagon", spots: 30, spotsLeft: 12, rsvpCount: 18 },
  { id: "2", title: "Klagon Problem-Solving Hack", type: "hackathon", date: "2025-07-19", time: "9:00 AM", location: "KlagonStars Hub", spots: 25, spotsLeft: 13, rsvpCount: 12 },
  { id: "3", title: "Public Speaking & Influence", type: "leadership", date: "2025-07-23", time: "5:00 PM", location: "Community Hall", spots: 0, spotsLeft: 0, rsvpCount: 0 },
  { id: "4", title: "Klagon Clean-Up Drive", type: "service", date: "2025-07-26", time: "7:00 AM", location: "Klagon Central", spots: 0, spotsLeft: 0, rsvpCount: 0 },
];

export const COURSES: Course[] = [
  { id: "1", title: "Introduction to AI", category: "Future Skills", icon: "🤖", lessons: 5, lessonsDone: 0, color: "#EEF2FF" },
  { id: "2", title: "Financial Literacy Basics", category: "Finance", icon: "💰", lessons: 4, lessonsDone: 3, color: "#FFF7E6" },
  { id: "3", title: "Leadership Foundations", category: "Leadership", icon: "🏆", lessons: 6, lessonsDone: 0, color: "#ECFDF5" },
  { id: "4", title: "Start Your First Business", category: "Entrepreneurship", icon: "🚀", lessons: 7, lessonsDone: 2, color: "#FFF3F0" },
  { id: "5", title: "Communication That Wins", category: "Communication", icon: "💬", lessons: 4, lessonsDone: 0, color: "#F0F9FF" },
  { id: "6", title: "Build Your Career Roadmap", category: "Career", icon: "🗺️", lessons: 5, lessonsDone: 0, color: "#F0FDF4" },
];

export const PROJECTS: Project[] = [
  { id: "1", title: "Klagon Tree-Planting Drive", description: "Planting 200 trees across Klagon's key areas to improve air quality and community pride.", icon: "🌳", status: "active", volunteers: 14, spotsOpen: 6, progress: 60, color: "#ECFDF5" },
  { id: "2", title: "Digital Literacy for Seniors", description: "Weekly sessions teaching phones, mobile money, and internet basics to Klagon's older residents.", icon: "💻", status: "recruiting", volunteers: 4, spotsOpen: 10, progress: 25, color: "#EEF2FF" },
  { id: "3", title: "Youth Coding Club", description: "Introducing secondary school students to basic programming and computational thinking.", icon: "🎓", status: "active", volunteers: 8, spotsOpen: 4, progress: 0, color: "#FFF7E6" },
];

export const TESTIMONIALS = [
  { quote: "\"Before KlagonStars, I didn't know where to start. After three sessions, I landed my first freelance design job. It's the best thing to happen to Klagon youth.\"", name: "Ebenezer Ofori", role: "Graphic Designer, Age 22", initials: "EO", color: "#0F1B5C" },
  { quote: "\"The coding club changed my son's direction completely. He's now talking about building apps for Ghana instead of just playing games. I'm proud.\"", name: "Mary Acheampong", role: "Parent, Klagon resident", initials: "MA", color: "#B45309" },
  { quote: "\"I volunteered as a mentor thinking I'd give back. But honestly, these young people are teaching me as much as I'm teaching them.\"", name: "Kweku Asante", role: "Mentor, Software Engineer", initials: "KA", color: "#065F46" },
];

export const MEMBER_METRICS: Metric[] = [
  { label: "Events Attended", value: 3, sub: "1 RSVP upcoming", accent: "#F59E0B" },
  { label: "Lessons Done", value: 7, sub: "Across 2 courses", accent: "#1A2E8C" },
  { label: "Projects Joined", value: 1, sub: "Tree-Planting Drive", accent: "#10B981" },
  { label: "Total XP Earned", value: 340, sub: "Level 4 · Rising Star", accent: "#FF6B47" },
];

export const MEMBER_COURSES: Course[] = [
  { id: "1", title: "Financial Literacy Basics", category: "Finance", icon: "💰", lessons: 4, lessonsDone: 3, color: "#FFF7E6" },
  { id: "2", title: "Start Your First Business", category: "Entrepreneurship", icon: "🚀", lessons: 7, lessonsDone: 2, color: "#FFF3F0" },
];

export const MEMBER_BADGES: Badge[] = [
  { id: "1", name: "First Login", icon: "🌟", unlocked: true },
  { id: "2", name: "Event Goer", icon: "📅", unlocked: true },
  { id: "3", name: "AI Certified", icon: "🤖", unlocked: true },
  { id: "4", name: "Volunteer", icon: "🌳", unlocked: true },
  { id: "5", name: "Builder", icon: "🔨", unlocked: false },
  { id: "6", name: "Leader", icon: "🏆", unlocked: false },
  { id: "7", name: "Mentor", icon: "🌱", unlocked: false },
];

export const MEMBER_EVENTS: Event[] = [
  { id: "1", title: "Intro to AI Workshop", type: "workshop", date: "2025-07-12", time: "10:00 AM", location: "Community Hall", spots: 30, spotsLeft: 12, rsvpCount: 18 },
  { id: "2", title: "Klagon Hackathon", type: "hackathon", date: "2025-07-19", time: "9:00 AM", location: "KlagonStars Hub", spots: 25, spotsLeft: 13, rsvpCount: 12 },
  { id: "3", title: "Public Speaking & Influence", type: "leadership", date: "2025-07-23", time: "5:00 PM", location: "Community Hall", spots: 0, spotsLeft: 0, rsvpCount: 0 },
];

export const MEMBER_PROJECTS: Project[] = [
  { id: "1", title: "Klagon Tree-Planting Drive", description: "", icon: "🌳", status: "active", volunteers: 14, spotsOpen: 6, progress: 60, color: "#ECFDF5" },
  { id: "2", title: "Digital Literacy for Seniors", description: "", icon: "💻", status: "recruiting", volunteers: 4, spotsOpen: 10, progress: 25, color: "#EEF2FF" },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: "1", title: "New Learning Track: Career Planning", body: "A brand new 5-lesson career roadmap course has just launched. Be among the first to complete it.", time: "2 hours ago", dotColor: "#F59E0B" },
  { id: "2", title: "Hackathon Teams Now Open", body: "Form your team of 2–4 before July 17 to participate in the Klagon Problem-Solving Hack.", time: "Yesterday", dotColor: "#10B981" },
  { id: "3", title: "Mentor Kweku Asante is available", body: "Software engineer and KlagonStars mentor Kweku just opened 3 slots for 1-on-1 sessions this month.", time: "2 days ago", dotColor: "#1A2E8C" },
];

export const ADMIN_METRICS: Metric[] = [
  { label: "Total Members", value: 73, sub: "Target: 100 members", accent: "#0F1B5C", delta: { value: "12 this week", up: true } },
  { label: "Weekly Active", value: 28, sub: "Target: 30 active", accent: "#F59E0B", delta: { value: "4 vs last week", up: true } },
  { label: "Sessions Done", value: 7, sub: "Target: 10 sessions", accent: "#10B981", delta: { value: "2 this week", up: true } },
  { label: "Active Projects", value: 3, sub: "Target: 3 projects", accent: "#FF6B47", delta: { value: "On track", up: true } },
];

export const ADMIN_MEMBERS = [
  { initials: "AK", name: "Ama Kofi", email: "ama.kofi@gmail.com", age: 22, interests: ["Tech", "AI"], joined: "8 Jul", status: "active" as const, color: "#EEF2FF", textColor: "#3730A3" },
  { initials: "EO", name: "Ebenezer Ofori", email: "e.ofori@yahoo.com", age: 24, interests: ["Bizness", "Jobs"], joined: "7 Jul", status: "active" as const, color: "#FFF7E6", textColor: "#B45309" },
  { initials: "SB", name: "Serwaa Boateng", email: "serwaa.b@outlook.com", age: 19, interests: ["Leadership"], joined: "9 Jul", status: "pending" as const, color: "#ECFDF5", textColor: "#065F46" },
  { initials: "KA", name: "Kofi Asante", email: "k.asante@gmail.com", age: 27, interests: ["Tech", "Finance"], joined: "10 Jul", status: "pending" as const, color: "#FFF3F0", textColor: "#9A3412" },
  { initials: "MA", name: "Mary Acheampong", email: "m.acheampong@gmail.com", age: 21, interests: ["AI", "Career"], joined: "11 Jul", status: "active" as const, color: "#F0F9FF", textColor: "#185FA5" },
];

export const ADMIN_EVENTS: Event[] = [
  { id: "1", title: "Intro to AI Workshop", type: "workshop", date: "2025-07-12", time: "10 AM", location: "", spots: 0, spotsLeft: 0, rsvpCount: 18 },
  { id: "2", title: "Klagon Hackathon", type: "hackathon", date: "2025-07-19", time: "9 AM", location: "", spots: 0, spotsLeft: 0, rsvpCount: 12 },
  { id: "3", title: "Public Speaking", type: "leadership", date: "2025-07-23", time: "5 PM", location: "", spots: 0, spotsLeft: 0, rsvpCount: 0 },
];

export const ACTIVITIES: Activity[] = [
  { id: "1", icon: "👤", iconBg: "#EEF2FF", title: "Serwaa Boateng registered — awaiting approval", time: "2 minutes ago" },
  { id: "2", icon: "📅", iconBg: "#FFF7E6", title: "Ama Kofi RSVP'd to Intro to AI Workshop", time: "14 minutes ago" },
  { id: "3", icon: "✅", iconBg: "#ECFDF5", title: "Financial Literacy session marked complete by 11 members", time: "1 hour ago" },
  { id: "4", icon: "🌳", iconBg: "#FFF3F0", title: "Kofi Asante joined Tree-Planting Project as volunteer", time: "3 hours ago" },
  { id: "5", icon: "💬", iconBg: "#F0F9FF", title: "New message from NGO partner: Action Aid Ghana", time: "Yesterday" },
];

export const VOLUNTEER_OPPS: VolunteerOpportunity[] = [
  { id: "1", title: "Youth Mentor", description: "Guide and support young members in their learning journey. Share your expertise in tech, business, or leadership.", icon: "🧑‍🏫", category: "Mentorship", commitment: "2-4 hrs/week", spots: 10, spotsLeft: 7, color: "#EEF2FF" },
  { id: "2", title: "Event Coordinator", description: "Help plan, organize, and run KlagonStars workshops, hackathons, and community events throughout the month.", icon: "📅", category: "Events", commitment: "3-5 hrs/week", spots: 5, spotsLeft: 3, color: "#FFF7E6" },
  { id: "3", title: "Digital Literacy Tutor", description: "Teach seniors and beginners how to use phones, mobile money, and the internet in weekly sessions.", icon: "💻", category: "Education", commitment: "2 hrs/week", spots: 15, spotsLeft: 11, color: "#ECFDF5" },
  { id: "4", title: "Social Media Lead", description: "Manage KlagonStars' social media presence — create content, share updates, and grow our online community.", icon: "📱", category: "Communications", commitment: "3 hrs/week", spots: 3, spotsLeft: 2, color: "#FFF3F0" },
  { id: "5", title: "Tree-Planting Volunteer", description: "Join the environmental team in planting and maintaining trees across Klagon's key areas.", icon: "🌳", category: "Environment", commitment: "Weekends", spots: 20, spotsLeft: 6, color: "#F0F9FF" },
  { id: "6", title: "Fundraising Assistant", description: "Help with grant research, donor outreach, and fundraising campaigns to support KlagonStars programs.", icon: "💰", category: "Operations", commitment: "3 hrs/week", spots: 4, spotsLeft: 4, color: "#F0FDF4" },
];

export const NEWS_ARTICLES: NewsArticle[] = [
  { id: "1", title: "KlagonStars Launches New Career Planning Course for Klagon Youth", excerpt: "A brand new 5-lesson career roadmap course has just launched, designed to help young people in Klagon plan their professional futures with confidence.", category: "Programs", author: "Emmanuel Kumi", date: "10 Jul 2025", image: "📋", readTime: "3 min" },
  { id: "2", title: "Klagon Problem-Solving Hackathon: Teams Now Forming", excerpt: "Registration is open for the July 19 hackathon. Form your team of 2–4 and tackle real community challenges using tech and innovation.", category: "Events", author: "Ama Kofi", date: "8 Jul 2025", image: "💡", readTime: "2 min" },
  { id: "3", title: "Mentor Spotlight: Kweku Asante Opens 1-on-1 Sessions", excerpt: "Software engineer and KlagonStars mentor Kweku Asante has opened 3 new slots for personalized mentoring sessions this month.", category: "Community", author: "KlagonStars Team", date: "6 Jul 2025", image: "🌟", readTime: "4 min" },
  { id: "4", title: "Tree-Planting Drive Reaches 60% of 200-Tree Goal", excerpt: "Thanks to 14 dedicated volunteers, the Klagon Tree-Planting Drive is more than halfway to its target. Join the next session this weekend.", category: "Environment", author: "Serwaa Boateng", date: "4 Jul 2025", image: "🌳", readTime: "2 min" },
  { id: "5", title: "Digital Literacy Program Expands to Senior Citizens", excerpt: "Following high demand, KlagonStars is expanding its Digital Literacy program with dedicated sessions for senior residents of Klagon.", category: "Programs", author: "Mary Acheampong", date: "1 Jul 2025", image: "💻", readTime: "3 min" },
  { id: "6", title: "KlagonStars Partners with Action Aid Ghana for Youth Workshop Series", excerpt: "A new partnership brings resources, mentorship, and funding for a series of workshops focused on entrepreneurship and life skills.", category: "Partnerships", author: "Emmanuel Kumi", date: "28 Jun 2025", image: "🤝", readTime: "5 min" },
];

export const SPONSOR_PLANS: SponsorPlan[] = [
  { id: "1", name: "Community Friend", amount: "GH₵ 500/mo", description: "Support a single workshop or learning session each month.", benefits: ["Name listed on KlagonStars website", "Quarterly impact report", "Social media shoutout"], highlighted: false },
  { id: "2", name: "Youth Champion", amount: "GH₵ 2,000/mo", description: "Fund a full learning track for 10 youth members each quarter.", benefits: ["Logo on KlagonStars materials", "Monthly impact report", "Recognition at events", "2 seats at annual gala"], highlighted: true },
  { id: "3", name: "Future Builder", amount: "GH₵ 5,000/mo", description: "Underwrite equipment, venue, and mentor stipends for an entire cohort.", benefits: ["Featured sponsor at all events", "Dedicated KlagonStars partnership page", "Quarterly video updates", "Volunteer engagement days", "Naming rights on funded program"], highlighted: false },
];

export const DONATION_TIERS: DonationTier[] = [
  { id: "1", amount: "GH₵ 50", label: "Supplies for 1 workshop", description: "Covers learning materials and refreshments for a single session." },
  { id: "2", amount: "GH₵ 100", label: "Transport for 5 volunteers", description: "Gets 5 youth volunteers to and from community project sites." },
  { id: "3", amount: "GH₵ 250", label: "1 digital device for a member", description: "Provides a phone or tablet for a member without access." },
  { id: "4", amount: "GH₵ 500", label: "Full workshop for 20 youth", description: "Funds a complete workshop including facilitator, materials, and venue." },
  { id: "5", amount: "GH₵ 1,000", label: "Mentor stipend (1 month)", description: "Supports a community mentor for one month of dedicated sessions." },
];

export const MENTOR_TOPICS: MentorTopic[] = [
  { id: "1", title: "Software Engineering", icon: "💻", description: "Web development, mobile apps, APIs, and best practices in modern software engineering.", mentors: 4 },
  { id: "2", title: "Entrepreneurship", icon: "🚀", description: "Starting a business, validating ideas, funding, and scaling in the Ghanaian market.", mentors: 3 },
  { id: "3", title: "AI & Data Skills", icon: "🤖", description: "AI tools, machine learning basics, data analysis, and prompt engineering.", mentors: 2 },
  { id: "4", title: "Career Development", icon: "📋", description: "CV writing, interview prep, freelancing, and career planning for young Ghanaians.", mentors: 5 },
  { id: "5", title: "Leadership & Public Speaking", icon: "🎤", description: "Team leadership, communication skills, confidence building, and community organizing.", mentors: 3 },
  { id: "6", title: "Financial Literacy", icon: "💰", description: "Budgeting, saving, mobile money, and financial planning for youth.", mentors: 2 },
];

export const QUICK_ACTIONS = [
  { icon: "👤", label: "Approve Member", sub: "7 pending" },
  { icon: "📅", label: "Create Event", sub: "Publish now" },
  { icon: "✅", label: "Mark Attendance", sub: "Today's session" },
  { icon: "📰", label: "Post Article", sub: "Community news" },
];
