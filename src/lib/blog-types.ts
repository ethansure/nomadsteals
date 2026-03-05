// Blog Post Type Definitions

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  category: BlogCategory;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  readingTime: number; // in minutes
  featured: boolean;
}

export type BlogCategory = 
  | "flights"
  | "hotels"
  | "destinations"
  | "tips"
  | "deals"
  | "guides";

export interface BlogCategoryInfo {
  slug: BlogCategory;
  name: string;
  description: string;
  emoji: string;
}

export const blogCategories: BlogCategoryInfo[] = [
  { slug: "flights", name: "Flights", description: "Flight deals and booking tips", emoji: "✈️" },
  { slug: "hotels", name: "Hotels", description: "Hotel deals and accommodation guides", emoji: "🏨" },
  { slug: "destinations", name: "Destinations", description: "Travel destination guides", emoji: "🌴" },
  { slug: "tips", name: "Tips & Tricks", description: "Travel hacking and money-saving tips", emoji: "💡" },
  { slug: "deals", name: "Deals", description: "Deal alerts and analysis", emoji: "🔥" },
  { slug: "guides", name: "Guides", description: "Comprehensive travel guides", emoji: "📖" },
];
