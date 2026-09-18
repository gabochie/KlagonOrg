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
export type SponsorTier = "community" | "growth" | "talent" | "digital" | "strategic";
export type SponsorStatus = "pending" | "active" | "paused";
export type WallGroup =
  | "founding"
  | "strategic"
  | "innovation"
  | "skills"
  | "community"
  | "business";
export type BadgeType =
  | "verified"
  | "sponsor"
  | "community_partner"
  | "skills_partner"
  | "innovation_partner"
  | "youth_employer"
  | "impact_partner";
export type PostType = "news" | "event" | "business" | "classified" | "job" | "announcement";
export type PostStatus = "pending" | "approved" | "rejected" | "hidden";
export type PostArea = "klagon" | "tema_west" | "other";
export type BoostTier = "none" | "featured" | "premium";
export type BroadcastKind = "email" | "whatsapp" | "social";
export type AuthorBadge = "member" | "verified" | "editorial";
export type MapEntityType =
  | "project"
  | "event"
  | "business"
  | "school"
  | "health"
  | "faith"
  | "community"
  | "facility"
  | "governance"
  | "need"
  | "sponsor"
  | "stay";
export type MapSeverity = "low" | "medium" | "high" | "critical";

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
          verified_contributor: boolean;
          approved_posts: number;
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
          verified_contributor?: boolean;
          approved_posts?: number;
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
          content: string | null;
          content_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          duration_min?: number;
          content?: string | null;
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
      business_cards: {
        Row: {
          id: string;
          sponsor_id: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          sponsor_id: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_cards"]["Insert"]>;
        Relationships: [];
      };
      sponsor_badges: {
        Row: {
          id: string;
          sponsor_id: string;
          tier_type: BadgeType;
          awarded_at: string;
        };
        Insert: {
          sponsor_id: string;
          tier_type: BadgeType;
          awarded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sponsor_badges"]["Insert"]>;
        Relationships: [];
      };
      sponsors: {
        Row: {
          id: string;
          slug: string;
          tier: SponsorTier;
          status: SponsorStatus;
          wall_group: WallGroup | null;
          featured: boolean;
          name: string;
          tagline: string | null;
          logo_url: string | null;
          cover_url: string | null;
          about: string | null;
          why_supports: string | null;
          categories: string[];
          products_services: string[];
          contact: Json;
          location: Json;
          opening_hours: string | null;
          service_areas: string[];
          certifications: string[];
          photos: string[];
          price_range: string | null;
          amenities: string[];
          check_in: string | null;
          check_out: string | null;
          stay_type: string | null;
          latitude: number | null;
          longitude: number | null;
          booking_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          tier: SponsorTier;
          status?: SponsorStatus;
          wall_group?: WallGroup | null;
          featured?: boolean;
          name: string;
          tagline?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          about?: string | null;
          why_supports?: string | null;
          categories?: string[];
          products_services?: string[];
          contact?: Json;
          location?: Json;
          opening_hours?: string | null;
          service_areas?: string[];
          certifications?: string[];
          photos?: string[];
          price_range?: string | null;
          amenities?: string[];
          check_in?: string | null;
          check_out?: string | null;
          stay_type?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          booking_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sponsors"]["Insert"]>;
        Relationships: [];
      };
      template_downloads: {
        Row: {
          id: string;
          template_id: string;
          sponsor_id: string | null;
          downloaded_at: string;
        };
        Insert: {
          template_id: string;
          sponsor_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["template_downloads"]["Insert"]>;
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          title: string;
          category: string;
          industry_tag: string | null;
          description: string | null;
          file_url: string;
          min_tier: SponsorTier;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          title: string;
          category: string;
          industry_tag?: string | null;
          description?: string | null;
          file_url: string;
          min_tier?: SponsorTier;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["templates"]["Insert"]>;
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
      lead_captures: {
        Row: {
          id: number;
          name: string | null;
          phone: string | null;
          email: string | null;
          source: string;
          intent: string | null;
          profile_id: string | null;
          status: string;
          area: string | null;
          source_record_id: string | null;
          created_at: string;
        };
        Insert: {
          name?: string | null;
          phone?: string | null;
          email?: string | null;
          source?: string;
          intent?: string | null;
          profile_id?: string | null;
          status?: string;
          area?: string | null;
          source_record_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_captures"]["Insert"]>;
        Relationships: [];
      };
      ops_kocc_audit: {
        Row: { id: number; owner: string; event: Json; created_at: string };
        Insert: { owner: string; event: Json };
        Update: Partial<Database["public"]["Tables"]["ops_kocc_audit"]["Insert"]>;
        Relationships: [];
      };
      outreach_sends: {
        Row: {
          id: number;
          source_record_id: string;
          company: string | null;
          wa_phone: string;
          staff_slot: number;
          template: string;
          area: string;
          outcome: string;
          created_at: string;
        };
        Insert: {
          source_record_id: string;
          company?: string | null;
          wa_phone: string;
          staff_slot?: number;
          template?: string;
          area?: string;
          outcome?: string;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_sends"]["Insert"]>;
        Relationships: [];
      };
      outreach_suppressions: {
        Row: { wa_phone: string; reason: string; created_at: string };
        Insert: { wa_phone: string; reason?: string };
        Update: Partial<Database["public"]["Tables"]["outreach_suppressions"]["Insert"]>;
        Relationships: [];
      };
      ops_kocc_snapshots: {
        Row: { owner: string; days: number | null; payload: Json; updated_at: string };
        Insert: {
          owner: string;
          days?: number | null;
          payload: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ops_kocc_snapshots"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          type: PostType;
          title: string;
          excerpt: string | null;
          body: string | null;
          category: string;
          subcategory: string | null;
          details: Json;
          area: PostArea;
          status: PostStatus;
          rejected_reason: string | null;
          submitted_by: string | null;
          author_name: string | null;
          author_badge: AuthorBadge;
          cover_url: string | null;
          gallery: Json;
          price_ghs: number | null;
          contact_phone: string | null;
          contact_email: string | null;
          event_date: string | null;
          event_time: string | null;
          event_location: string | null;
          boost_tier: BoostTier;
          boost_fee_ghs: number | null;
          boost_until: string | null;
          reports: number;
          views: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type?: PostType;
          title: string;
          excerpt?: string | null;
          body?: string | null;
          category?: string;
          subcategory?: string | null;
          details?: Json;
          area?: PostArea;
          status?: PostStatus;
          rejected_reason?: string | null;
          submitted_by?: string | null;
          author_name?: string | null;
          author_badge?: AuthorBadge;
          cover_url?: string | null;
          gallery?: Json;
          price_ghs?: number | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          event_date?: string | null;
          event_time?: string | null;
          event_location?: string | null;
          boost_tier?: BoostTier;
          boost_fee_ghs?: number | null;
          boost_until?: string | null;
          reports?: number;
          views?: number;
          published_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]> & {
          id?: string;
          status?: PostStatus;
          rejected_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_submitted_by_fkey";
            columns: ["submitted_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_reports: {
        Row: {
          id: string;
          post_id: string;
          reported_by: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reported_by: string;
          reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["post_reports"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      post_views: {
        Row: { id: string; post_id: string; viewed_at: string };
        Insert: { id?: string; post_id: string; viewed_at?: string };
        Update: Partial<Database["public"]["Tables"]["post_views"]["Insert"]> & {
          id?: string;
        };
        Relationships: [];
      };
      post_contact_messages: {
        Row: {
          id: string;
          post_id: string;
          sender_name: string | null;
          sender_phone: string | null;
          sender_email: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          sender_name?: string | null;
          sender_phone?: string | null;
          sender_email?: string | null;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_contact_messages"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_contact_messages_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          source: string;
          subscribed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          source?: string;
          subscribed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Insert"]> & {
          id?: string;
        };
        Relationships: [];
      };
      broadcasts: {
        Row: {
          id: string;
          kind: BroadcastKind;
          post_id: string | null;
          sent_by: string | null;
          delivered_to: number | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: BroadcastKind;
          post_id?: string | null;
          sent_by?: string | null;
          delivered_to?: number | null;
          payload?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["broadcasts"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "broadcasts_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          sponsor_id: string | null;
          post_id: string | null;
          reviewer_name: string;
          reviewer_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          photos: string[];
          staff_pick: boolean;
          reply: string | null;
          replied_at: string | null;
          helpful: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sponsor_id?: string | null;
          post_id?: string | null;
          reviewer_name: string;
          reviewer_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          photos?: string[];
          staff_pick?: boolean;
          reply?: string | null;
          replied_at?: string | null;
          helpful?: number;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_sponsor_id_fkey";
            columns: ["sponsor_id"];
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      map_points: {
        Row: {
          id: string;
          entity_type: MapEntityType;
          entity_id: string | null;
          external_id: string | null;
          name: string;
          description: string | null;
          category: string | null;
          latitude: number;
          longitude: number;
          community_area: string;
          severity: MapSeverity | null;
          icon: string | null;
          status: MemberStatus;
          source: string;
          reported_by: string | null;
          moderated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: MapEntityType;
          entity_id?: string | null;
          external_id?: string | null;
          name: string;
          description?: string | null;
          category?: string | null;
          latitude: number;
          longitude: number;
          community_area?: string;
          severity?: MapSeverity | null;
          icon?: string | null;
          status?: MemberStatus;
          source?: string;
          reported_by?: string | null;
          moderated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["map_points"]["Insert"]> & {
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "map_points_reported_by_fkey";
            columns: ["reported_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "map_points_moderated_by_fkey";
            columns: ["moderated_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
      map_points_public: {
        Row: {
          id: string;
          entity_type: MapEntityType;
          entity_id: string | null;
          name: string;
          description: string | null;
          category: string | null;
          latitude: number;
          longitude: number;
          community_area: string;
          severity: MapSeverity | null;
          icon: string | null;
          created_at: string;
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
      promote_sponsor_application: {
        Args: {
          p_application_id: string;
          p_slug: string;
          p_tier: SponsorTier;
          p_name: string;
          p_tagline?: string;
          p_logo_url?: string;
          p_cover_url?: string;
          p_about?: string;
          p_why_supports?: string;
          p_categories?: string[];
          p_products_services?: string[];
          p_contact?: Json;
          p_location?: Json;
          p_opening_hours?: string;
          p_service_areas?: string[];
          p_certifications?: string[];
          p_wall_group?: WallGroup;
          p_featured?: boolean;
        };
        Returns: string;
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
      purchase_boost: {
        Args: {
          p_post_id: string;
          p_tier: BoostTier;
        };
        Returns: boolean;
      };
      moderate_map_point: {
        Args: {
          p_map_id: string;
          p_status: MemberStatus;
        };
        Returns: undefined;
      };
      bump_review_helpful: {
        Args: {
          p_review_id: string;
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
      sponsor_tier: SponsorTier;
      sponsor_status: SponsorStatus;
      wall_group: WallGroup;
      badge_type: BadgeType;
      post_type: PostType;
      post_status: PostStatus;
      post_area: PostArea;
      boost_tier: BoostTier;
      broadcast_kind: BroadcastKind;
      map_entity_type: MapEntityType;
      map_severity: MapSeverity;
    };
  };
}