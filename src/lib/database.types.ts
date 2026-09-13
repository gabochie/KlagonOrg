export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "member" | "admin" | "super_admin";
export type MemberStatus = "pending" | "approved" | "rejected";
export type EventType = "workshop" | "hackathon" | "leadership" | "service";
export type DonationStatus = "pending" | "paid" | "failed" | "refunded";
export type ProjectStatus = "active" | "recruiting" | "completed";
export type NewsCategory =
  | "Programs"
  | "Events"
  | "Community"
  | "Environment"
  | "Partnerships";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          age: number | null;
          occupation: string | null;
          gender: "male" | "female" | "other" | null;
          interests: string[];
          career_goal: string | null;
          role: UserRole;
          status: MemberStatus;
          xp: number;
          avatar_url: string | null;
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          age?: number | null;
          occupation?: string | null;
          gender?: "male" | "female" | "other" | null;
          interests?: string[];
          career_goal?: string | null;
          role?: UserRole;
          status?: MemberStatus;
          xp?: number;
          avatar_url?: string | null;
          onboarded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]> & {
          id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          member_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          member_id: string;
          type?: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          title: string;
          type: EventType;
          description: string | null;
          date: string;
          time: string;
          location: string | null;
          spots: number;
          published: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: EventType;
          description?: string | null;
          date: string;
          time: string;
          location?: string | null;
          spots?: number;
          published?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          member_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          member_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvps"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_rsvps_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          category: string;
          icon: string;
          description: string | null;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          icon?: string;
          description?: string | null;
          published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          duration_min: number;
          content_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          duration_min?: number;
          content_url?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          id: string;
          member_id: string;
          lesson_id: string;
          completed_at: string;
        };
        Insert: {
          member_id: string;
          lesson_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lesson_progress_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: { id: string; name: string; icon: string };
        Insert: { id?: string; name: string; icon?: string };
        Update: Partial<Database["public"]["Tables"]["badges"]["Insert"]>;
        Relationships: [];
      };
      reader_completions: {
        Row: { id: string; member_id: string; slug: string; completed_at: string };
        Insert: { member_id: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["reader_completions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reader_completions_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      member_badges: {
        Row: { id: string; member_id: string; badge_id: string; unlocked_at: string };
        Insert: { member_id: string; badge_id: string };
        Update: Partial<Database["public"]["Tables"]["member_badges"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon: string;
          status: ProjectStatus;
          volunteers_target: number;
          progress: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          icon?: string;
          status?: ProjectStatus;
          volunteers_target?: number;
          progress?: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      project_volunteers: {
        Row: { id: string; project_id: string; member_id: string; joined_at: string };
        Insert: { project_id: string; member_id: string };
        Update: Partial<Database["public"]["Tables"]["project_volunteers"]["Insert"]>;
        Relationships: [];
      };
      news_articles: {
        Row: {
          id: string;
          title: string;
          excerpt: string | null;
          body: string | null;
          category: NewsCategory;
          author: string | null;
          author_name: string | null;
          image_url: string | null;
          read_time_min: number;
          published: boolean;
          published_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          excerpt?: string | null;
          body?: string | null;
          category?: NewsCategory;
          author?: string | null;
          author_name?: string | null;
          image_url?: string | null;
          read_time_min?: number;
          published?: boolean;
          published_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["news_articles"]["Insert"]>;
        Relationships: [];
      };
      announcements: {
        Row: { id: string; title: string; body: string; pin_until: string | null; created_at: string };
        Insert: { id?: string; title: string; body: string; pin_until?: string | null };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string;
          subject: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          full_name?: string | null;
          phone?: string | null;
          email: string;
          subject?: string | null;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
      };
      mentor_applications: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string;
          profession: string | null;
          topics: string[];
          motivation: string | null;
          status: MemberStatus;
          created_at: string;
        };
        Insert: {
          full_name: string;
          phone: string;
          email: string;
          profession?: string | null;
          topics?: string[];
          motivation?: string | null;
          status?: MemberStatus;
        };
        Update: Partial<Database["public"]["Tables"]["mentor_applications"]["Insert"]>;
        Relationships: [];
      };
      volunteer_signups: {
        Row: {
          id: string;
          project_id: string | null;
          member_id: string | null;
          role: string | null;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          project_id?: string | null;
          member_id?: string | null;
          role?: string | null;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["volunteer_signups"]["Insert"]>;
        Relationships: [];
      };
      sponsor_applications: {
        Row: {
          id: string;
          org_name: string | null;
          full_name: string;
          phone: string;
          email: string;
          plan_id: string | null;
          message: string | null;
          status: MemberStatus;
          created_at: string;
        };
        Insert: {
          org_name?: string | null;
          full_name: string;
          phone: string;
          email: string;
          plan_id?: string | null;
          message?: string | null;
          status?: MemberStatus;
        };
        Update: Partial<Database["public"]["Tables"]["sponsor_applications"]["Insert"]>;
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          amount_ghs: number;
          tier_id: string | null;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          status: DonationStatus;
          provider: string;
          provider_ref: string | null;
          metadata: Json;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          amount_ghs: number;
          tier_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          status?: DonationStatus;
          provider?: string;
          provider_ref?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["donations"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string | null;
          entity_id: string | null;
          detail: Json;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          action: string;
          entity?: string | null;
          entity_id?: string | null;
          detail?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      events_public: {
        Row: {
          id: string;
          title: string;
          type: EventType;
          description: string | null;
          date: string;
          time: string;
          location: string | null;
          spots: number;
          created_by: string | null;
          created_at: string;
          rsvp_count: number;
          spots_left: number;
        };
        Relationships: [];
      };
      projects_public: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon: string;
          status: ProjectStatus;
          volunteers_target: number;
          progress: number;
          created_by: string | null;
          created_at: string;
          volunteer_count: number;
          spots_open: number;
        };
        Relationships: [];
      };
      courses_public: {
        Row: {
          id: string;
          title: string;
          category: string;
          icon: string;
          description: string | null;
          created_at: string;
          lesson_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_approved_member: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      log_audit: {
        Args: {
          p_action: string;
          p_entity: string;
          p_entity_id?: string;
          p_detail?: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      event_type: EventType;
      donation_status: DonationStatus;
      project_status: ProjectStatus;
      news_category: NewsCategory;
    };
  };
}