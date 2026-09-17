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
  headline: string;
  description: string;
  benefits: string[];
  highlighted?: boolean;
  featured?: boolean;
  tier: string;
}

export interface SponsorWallGroup {
  id: string;
  label: string;
  description: string;
  defaultTiers: string[];
}

export interface SponsorshipTier {
  id: string;
  label: string;
  short: string;
  amount: string;
  badge: string;
  priceMonthly: number | null;
}

export interface BusinessTemplate {
  id: string;
  title: string;
  category: string;
  industryTag: string | null;
  description: string | null;
  fileUrl: string;
  starter: boolean;
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

// ------------------------------------------------------------------
// Hyperlocal community portal
// ------------------------------------------------------------------

export type PostType = "news" | "event" | "business" | "classified" | "job" | "announcement";
export type PostStatus = "pending" | "approved" | "rejected" | "hidden";
export type PostArea = "klagon" | "tema_west" | "other";
export type BoostTier = "none" | "featured" | "premium";
export type AuthorBadge = "member" | "verified" | "editorial";

export interface Post {
  id: string;
  type: PostType;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  subcategory: string | null;
  details: Record<string, unknown>;
  area: PostArea;
  status: PostStatus;
  rejectedReason: string | null;
  submittedBy: string | null;
  authorName: string;
  authorBadge: AuthorBadge;
  coverUrl: string | null;
  gallery: string[];
  priceGhs: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  boostTier: BoostTier;
  boostFeeGhs: number | null;
  boostUntil: string | null;
  reports: number;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostFilters {
  type?: PostType | "all";
  area?: PostArea | "all";
  category?: string;
  subcategory?: string;
  search?: string;
  boostedFirst?: boolean;
  limit?: number;
}

export interface PostInput {
  type: PostType;
  title: string;
  excerpt?: string;
  body?: string;
  category?: string;
  subcategory?: string | null;
  details?: Record<string, unknown>;
  area?: PostArea;
  cover_url?: string | null;
  gallery?: string[];
  price_ghs?: number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_location?: string | null;
}
