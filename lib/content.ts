import type { FeatureKey, HubItem, PortfolioProject, Service } from "@/lib/types";

export const site = {
  name: "E-MEDIA",
  description:
    "E-MEDIA is a London creative and digital agency for photography, video, live production, websites, applications and AI automation. Fast content delivery.",
  location: "London / UK",
  email: "contact@weareemedia.co.uk",
  emailIsPlaceholder: false,
};

export const defaultFeatures: Record<FeatureKey, boolean> = {
  AGENCY_ENABLED: true,
  BOOKING_ENABLED: true,
  PAYMENTS_ENABLED: false,
  CLIENT_PORTAL_ENABLED: true,
  MEDIA_HUB_ENABLED: true,
  LATEST_ENABLED: true,
  WATCH_ENABLED: true,
  LIVE_ENABLED: true,
  COMMUNITY_ENABLED: true,
  OPPORTUNITIES_ENABLED: true,
  EVENTS_ENABLED: true,
  CHAT_ENABLED: true,
  NEWSLETTER_ENABLED: true,
};

export const services: Service[] = [
  {
    slug: "photography",
    name: "Photography",
    group: "Creative production",
    index: "01",
    summary: "Portraits, campaigns, events and considered visual stories.",
    description:
      "A thoughtful photography service shaped around the subject, context and final delivery—not a one-size-fits-all shoot.",
    bookingMode: "REQUEST_TO_BOOK",
    pricingMode: "QUOTE",
    useCases: ["Professional shoots", "Portraits", "Events", "Weddings", "Corporate", "Campaigns"],
    process: ["Discover", "Plan", "Create", "Select", "Deliver"],
  },
  {
    slug: "videography",
    name: "Videography",
    group: "Creative production",
    index: "02",
    summary: "Cinematic moving image for campaigns, social and events.",
    description:
      "From a focused crew to a broader production, we design the approach around the story and where it needs to travel.",
    bookingMode: "QUOTE_REQUIRED",
    pricingMode: "QUOTE",
    useCases: ["Events", "Campaigns", "Corporate", "Social video", "Commercial productions"],
    process: ["Brief", "Treatment", "Production", "Post", "Delivery"],
  },
  {
    slug: "film-production",
    name: "Film production",
    group: "Creative production",
    index: "03",
    summary: "Short-form, documentary and long-form production support.",
    description: "End-to-end story development and production, scaled responsibly to the brief.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Short films", "Documentaries", "Branded films", "Long-form productions"],
    process: ["Development", "Pre-production", "Shoot", "Post-production", "Release"],
  },
  {
    slug: "interviews-podcasts",
    name: "Interviews & podcasts",
    group: "Creative production",
    index: "04",
    summary: "Human conversations, recorded with editorial care.",
    description: "Multi-camera and audio-first formats for studio or on-location production.",
    bookingMode: "REQUEST_TO_BOOK",
    pricingMode: "QUOTE",
    useCases: ["Interviews", "Podcasts", "Filmed podcasts", "On-location production"],
    process: ["Format", "Prep", "Record", "Edit", "Publish"],
  },
  {
    slug: "livestream-production",
    name: "Livestream production",
    group: "Creative production",
    index: "05",
    summary: "Reliable live coverage for conversations, events and broadcasts.",
    description: "A modular live-production service activated only when the required crew and equipment are confirmed.",
    bookingMode: "QUOTE_REQUIRED",
    pricingMode: "QUOTE",
    useCases: ["Conferences", "Events", "Broadcasts", "Productions"],
    process: ["Scope", "Technical plan", "Rehearse", "Broadcast", "Archive"],
  },
  {
    slug: "post-production",
    name: "Post production",
    group: "Creative production",
    index: "06",
    summary: "Editing, colour, sound and delivery with a sharp finishing eye.",
    description: "Flexible finishing support for E-MEDIA productions and selected external projects.",
    bookingMode: "REQUEST_TO_BOOK",
    pricingMode: "QUOTE",
    useCases: ["Editing", "Colour work", "Audio", "Versioning", "Delivery"],
    process: ["Ingest", "Edit", "Review", "Finish", "Deliver"],
  },
  {
    slug: "web-development",
    name: "Web development",
    group: "Digital & technology",
    index: "07",
    summary: "Fast, accessible digital products built around real organisational needs.",
    description: "Strategy, product design and full-stack delivery without ornamental complexity.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Websites", "Platforms", "Portals", "Commerce", "Integrations"],
    process: ["Discover", "Define", "Design", "Build", "Improve"],
  },
  {
    slug: "business-systems",
    name: "Business systems",
    group: "Digital & technology",
    index: "08",
    summary: "Internal tools that remove friction from everyday operations.",
    description: "Practical systems for workflows, data and customer operations, designed with the people using them.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Internal tools", "Workflow automation", "Client portals", "Reporting"],
    process: ["Map", "Prioritise", "Prototype", "Integrate", "Support"],
  },
  {
    slug: "mobile-applications",
    name: "Mobile applications",
    group: "Digital & technology",
    index: "09",
    summary: "Focused mobile products with a maintainable technical foundation.",
    description: "Product and engineering support from validation through launch and iteration.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Product strategy", "Application design", "Cross-platform development", "Backend systems"],
    process: ["Validate", "Design", "Build", "Test", "Launch"],
  },
  {
    slug: "ai-integration",
    name: "AI integration consulting",
    group: "Digital & technology",
    index: "10",
    summary: "Measured AI adoption for useful, reviewable workflows.",
    description: "We assess where AI can help, where it should not be used, and how human review, privacy and evaluation fit the system.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Workflow assessment", "Prototyping", "Evaluation", "Responsible integration"],
    process: ["Assess", "Risk-map", "Prototype", "Evaluate", "Operate"],
  },
  {
    slug: "graphic-design",
    name: "Graphic design",
    group: "Brand & content",
    index: "11",
    summary: "Identity and campaign design with clarity and character.",
    description: "Visual systems and assets made to work across the places a brand actually appears.",
    bookingMode: "REQUEST_TO_BOOK",
    pricingMode: "QUOTE",
    useCases: ["Identity", "Campaigns", "Editorial", "Social assets", "Toolkits"],
    process: ["Context", "Direction", "Design", "Refine", "Systemise"],
  },
  {
    slug: "content-support",
    name: "Content creation support",
    group: "Brand & content",
    index: "12",
    summary: "A joined-up content rhythm, from idea to delivery.",
    description: "Editorial planning and production support tailored to capacity, channels and audience.",
    bookingMode: "REQUEST_TO_BOOK",
    pricingMode: "QUOTE",
    useCases: ["Content planning", "Production", "Editorial systems", "Campaign support"],
    process: ["Audit", "Plan", "Create", "Publish", "Learn"],
  },
  {
    slug: "community-management",
    name: "Community management",
    group: "Brand & content",
    index: "13",
    summary: "Human-centred community operations with safety built in.",
    description: "Responsible participation, moderation and feedback systems for organisations building genuine communities.",
    bookingMode: "DISCOVERY_CALL",
    pricingMode: "QUOTE",
    useCases: ["Community strategy", "Moderation", "Programming", "Member feedback"],
    process: ["Listen", "Set policy", "Activate", "Moderate", "Report"],
  },
];

export const portfolio: PortfolioProject[] = [
  { slug: "project-01", title: "Project 01", category: "Moving image", year: "Development sample", summary: "A study in rhythm, people and place.", tone: "ember", orientation: "landscape" },
  { slug: "project-02", title: "Project 02", category: "Portrait", year: "Development sample", summary: "A quiet portrait series built around presence.", tone: "silver", orientation: "portrait" },
  { slug: "project-03", title: "Project 03", category: "Digital", year: "Development sample", summary: "A connected publishing and participation system.", tone: "signal", orientation: "landscape" },
];

export const hubItems: HubItem[] = [
  { type: "Latest", eyebrow: "Sample editorial · Development content", title: "Who gets to shape the city’s next creative chapter?", href: "/media/latest" },
  { type: "Watch", eyebrow: "E-MEDIA original · Preview", title: "New voices, properly heard.", href: "/media/watch" },
  { type: "Live", eyebrow: "No broadcast scheduled", title: "The next live moment starts here.", href: "/media/live", state: "OFF AIR" },
  { type: "Opportunity", eyebrow: "Board ready for editor submissions", title: "A clearer route into creative work.", href: "/media/opportunities" },
  { type: "Community", eyebrow: "Community preview", title: "Ideas become stronger in conversation.", href: "/community" },
];

export const serviceGroups = ["Creative production", "Digital & technology", "Brand & content"] as const;

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export function getProject(slug: string) {
  return portfolio.find((project) => project.slug === slug);
}
