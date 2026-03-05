import { MetadataRoute } from "next";
import { popularCities, sampleDeals } from "@/lib/sample-data";
import { blogPosts } from "@/lib/blog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nomadsteals.com";
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/cities`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/newsletter`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
  ];
  
  // Blog posts - high priority for SEO
  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  
  // City pages
  const cityPages = popularCities.map((city) => ({
    url: `${baseUrl}/cities/${city.slug || city.code.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
  
  // Deal pages
  const dealPages = sampleDeals.map((deal) => ({
    url: `${baseUrl}/deals/${deal.id}`,
    lastModified: new Date(deal.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
  
  return [...staticPages, ...blogPages, ...cityPages, ...dealPages];
}
