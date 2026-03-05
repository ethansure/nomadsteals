import { MetadataRoute } from "next";
import { popularCities, sampleDeals } from "@/lib/sample-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://nomadsteals.vercel.app";
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${baseUrl}/cities`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/newsletter`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
  ];
  
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
  
  return [...staticPages, ...cityPages, ...dealPages];
}
