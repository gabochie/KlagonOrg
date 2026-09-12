export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  occupation: string;
  careerGoal: string;
  interests: string[];
  joinedAt: string;
  status: "active" | "pending" | "inactive";
  xp: number;
  level: number;
}

export interface Event {
  id: string;
  title: string;
  type: "workshop" | "hackathon" | "leadership" | "service";
  date: string;
  time: string;
  location: string;
  spots: number;
  spotsLeft: number;
  rsvpCount: number;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  icon: string;
  lessons: number;
  lessonsDone: number;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "active" | "recruiting";
  volunteers: number;
  spotsOpen: number;
  progress: number;
  color: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  time: string;
  dotColor: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
}

export interface Activity {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  time: string;
}

export interface JourneyStage {
  id: number;
  name: string;
  icon: string;
  subtitle: string;
  state: "done" | "current" | "locked";
}

export interface Metric {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  delta?: { value: string; up: boolean };
  target?: string;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  commitment: string;
  spots: number;
  spotsLeft: number;
  color: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
}

export interface SponsorPlan {
  id: string;
  name: string;
  amount: string;
  description: string;
  benefits: string[];
  highlighted?: boolean;
}

export interface DonationTier {
  id: string;
  amount: string;
  label: string;
  description: string;
}

export interface MentorTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  mentors: number;
}

export interface RegistrationFormData {
  fullName: string;
  phone: string;
  email: string;
  age: number;
  occupation: string;
  gender: string;
  careerGoal: string;
  interests: string[];
}
