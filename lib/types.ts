export type FeatureKey =
  | "AGENCY_ENABLED"
  | "BOOKING_ENABLED"
  | "PAYMENTS_ENABLED"
  | "CLIENT_PORTAL_ENABLED"
  | "MEDIA_HUB_ENABLED"
  | "LATEST_ENABLED"
  | "WATCH_ENABLED"
  | "LIVE_ENABLED"
  | "COMMUNITY_ENABLED"
  | "OPPORTUNITIES_ENABLED"
  | "EVENTS_ENABLED"
  | "CHAT_ENABLED"
  | "NEWSLETTER_ENABLED";

export type Service = {
  slug: string;
  name: string;
  group: "Creative production" | "Digital & technology" | "Brand & content";
  index: string;
  summary: string;
  description: string;
  bookingMode: "INSTANT_BOOKING" | "REQUEST_TO_BOOK" | "QUOTE_REQUIRED" | "DISCOVERY_CALL" | "DISABLED";
  pricingMode: "FIXED" | "FROM" | "QUOTE" | "HIDDEN";
  useCases: string[];
  process: string[];
};

export type PortfolioProject = {
  slug: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  tone: string;
  orientation: "portrait" | "landscape";
};

export type HubItem = {
  type: "Latest" | "Watch" | "Live" | "Opportunity" | "Community";
  title: string;
  eyebrow: string;
  href: string;
  state?: string;
};

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EDITOR"
  | "CREATOR"
  | "MODERATOR"
  | "STAFF"
  | "CLIENT"
  | "MEMBER";
