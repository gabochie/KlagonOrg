import type { PostType } from "@/types";
import {
  POST_TYPE_LABELS,
  CATEGORY_SEEDS,
  PROPERTY_SUBCATEGORIES,
  AUTO_SUBCATEGORIES,
  type Vertical,
} from "@/lib/posts";

export const POST_TYPES: PostType[] = [
  "news",
  "event",
  "business",
  "classified",
  "job",
  "announcement",
];

export const TYPE_BLURBS: Record<PostType, string> = {
  news: "Share something happening in Klagon or Tema West",
  event: "Invite the community to a gathering or programme",
  business: "Promote your local business or offer",
  classified: "List an item, property, vehicle or service to sell",
  job: "Post an opening or look for one",
  announcement: "Community alerts, safety notices and updates",
};

export const CLASSIFIED_VERTICALS: Vertical[] = ["Properties", "Auto", "Goods", "Services", "Jobs"];

export const TYPE_PRICE_LABELS: Partial<Record<PostType, string>> = {
  business: "Price (GH₵, optional)",
  job: "Salary range (GH₵, optional)",
};

export const VERTICAL_PRICE_LABELS: Partial<Record<Vertical, string>> = {
  Properties: "Price / rent per month (GH₵)",
  Auto: "Price (GH₵)",
  Goods: "Price (GH₵)",
  Services: "Rate (GH₵, optional)",
};

export function categoryFor(type: PostType, vertical: Vertical): string {
  if (type === "classified") return vertical;
  const seeds = CATEGORY_SEEDS[type];
  return seeds?.[0] ?? "General";
}

/** Options for the category input (chips). For classifieds the "categories" are the verticals. */
export function categoriesFor(type: PostType): string[] {
  return type === "classified" ? CLASSIFIED_VERTICALS : CATEGORY_SEEDS[type] ?? ["General"];
}

export function subcategoriesFor(type: PostType, vertical: Vertical): string[] {
  if (type !== "classified") return [];
  if (vertical === "Properties") return [...PROPERTY_SUBCATEGORIES];
  if (vertical === "Auto") return [...AUTO_SUBCATEGORIES];
  return [];
}

export interface FieldSpec {
  key: string;
  label: string;
  kind?: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

/**
 * Type-specific structured fields collected into `posts.details.jsonb`.
 * These drive the segmented form: the fields adapt to the vertical.
 */
export function detailsFieldsFor(type: PostType, vertical: Vertical): FieldSpec[] {
  if (type === "classified") {
    switch (vertical) {
      case "Properties":
        return [
          { key: "listing_type", label: "Listing type", kind: "select", options: ["rent", "sale", "short_stay"], required: true },
          { key: "bedrooms", label: "Bedrooms", kind: "number" },
          { key: "bathrooms", label: "Bathrooms", kind: "number" },
          { key: "size", label: "Size (m² or plots)", kind: "text", placeholder: "e.g. 4 plots / 120 m²" },
          { key: "furnished", label: "Furnished", kind: "select", options: ["Yes", "No"] },
          { key: "parking", label: "Parking", kind: "select", options: ["Yes", "No"] },
          { key: "compound", label: "Compound details", kind: "textarea", placeholder: "Gated? Water? Security? Extra notes" },
        ];
      case "Auto":
        return [
          { key: "make", label: "Make", kind: "text", placeholder: "Toyota", required: true },
          { key: "model", label: "Model", kind: "text", placeholder: "Corolla", required: true },
          { key: "year", label: "Year", kind: "number" },
          { key: "mileage", label: "Mileage", kind: "text", placeholder: "e.g. 85,000 km" },
          { key: "fuel", label: "Fuel", kind: "select", options: ["Petrol", "Diesel", "Electric", "Hybrid"] },
          { key: "transmission", label: "Transmission", kind: "select", options: ["Automatic", "Manual"] },
          { key: "condition", label: "Condition", kind: "select", options: ["New", "Used"] },
          { key: "hire", label: "Listing", kind: "select", options: ["For sale", "For hire"] },
        ];
      case "Goods":
        return [
          { key: "condition", label: "Condition", kind: "select", options: ["New", "Used"] },
          { key: "negotiable", label: "Price negotiable", kind: "select", options: ["Yes", "No"] },
        ];
      case "Services":
        return [
          { key: "availability", label: "Availability", kind: "text", placeholder: "Weekdays / weekends / anytime" },
          { key: "service_location", label: "Service area", kind: "text", placeholder: "Klagon, Tema West, home visits..." },
        ];
      case "Jobs":
        return [
          { key: "company", label: "Company / employer", kind: "text" },
          { key: "salary_range_ghs", label: "Salary range (GH₵)", kind: "text" },
          { key: "deadline", label: "Application deadline", kind: "date" },
          { key: "position_type", label: "Type", kind: "select", options: ["Full-time", "Part-time", "Gig/Freelance", "Internship", "Volunteer"] },
        ];
    }
  }
  if (type === "job") {
    return [
      { key: "company", label: "Company / employer", kind: "text" },
      { key: "salary_range_ghs", label: "Salary range (GH₵)", kind: "text" },
      { key: "deadline", label: "Application deadline", kind: "date" },
      { key: "position_type", label: "Type", kind: "select", options: ["Full-time", "Part-time", "Gig/Freelance", "Internship", "Volunteer"] },
    ];
  }
  return [];
}

export function requiresBody(type: PostType): boolean {
  return type !== "classified";
}

export function showContactFields(type: PostType): boolean {
  return type === "classified" || type === "business" || type === "job";
}

export function showEventFields(type: PostType): boolean {
  return type === "event";
}

export function showPriceField(type: PostType, vertical: Vertical): boolean {
  return (
    type === "classified" ||
    type === "job" ||
    type === "business"
  );
}

export function priceLabelFor(type: PostType, vertical: Vertical): string {
  if (type === "classified") return VERTICAL_PRICE_LABELS[vertical] ?? "Price (GH₵)";
  return TYPE_PRICE_LABELS[type] ?? "Price (GH₵, optional)";
}

export function typeLabel(type: PostType): string {
  return POST_TYPE_LABELS[type];
}