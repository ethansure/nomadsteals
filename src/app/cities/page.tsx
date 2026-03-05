import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CityCard } from "@/components/CityCard";
import { NewsletterForm } from "@/components/Newsletter";
import { popularCities, dealStats } from "@/lib/sample-data";
import { MapPin, Palmtree, Globe, Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Browse travel deals by destination. Find the best flights, hotels, and packages to your dream city.",
  openGraph: {
    title: "Explore Destinations - NomadSteals",
    description: "Browse travel deals by destination. Find the best flights, hotels, and packages to your dream city.",
  },
};

export default function CitiesPage() {
  // Group cities by region
  const regions = {
    "North America": { emoji: "🗽", cities: popularCities.filter(c => ["USA", "Mexico"].includes(c.country)) },
    "Europe": { emoji: "🏰", cities: popularCities.filter(c => ["UK", "France", "Spain", "Italy", "Netherlands"].includes(c.country)) },
    "Asia & Pacific": { emoji: "🏯", cities: popularCities.filter(c => ["Japan", "Thailand", "Singapore", "Indonesia", "Australia"].includes(c.country)) },
    "Middle East": { emoji: "🕌", cities: popularCities.filter(c => ["UAE"].includes(c.country)) },
  };

  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      
      {/* Hero Section - Tropical Vibe */}
      <section className="bg-gradient-to-br from-[#20B2AA] via-[#48D1CC] to-[#20B2AA] text-white py-20 px-6 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-10 right-20 text-7xl opacity-10">🌴</div>
        <div className="absolute bottom-10 left-20 text-6xl opacity-10">🌺</div>
        <div className="absolute top-1/2 left-1/3 text-4xl opacity-5">✈️</div>
        
        {/* Wave at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-[#FFFAF5]">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-8 border border-white/20">
            <Globe className="w-4 h-4" />
            <span>{popularCities.length} destinations</span>
            <span className="mx-2 opacity-50">•</span>
            <span>{dealStats.totalDeals.toLocaleString()} deals</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Explore Destinations 🌴
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {popularCities.length} popular destinations with {dealStats.totalDeals.toLocaleString()} active deals. 
            Find your next adventure.
          </p>
        </div>
      </section>
      
      {/* All Cities Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Featured Cities */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">🔥</span>
              <h2 className="text-3xl font-bold text-[#2D3436]">Trending Destinations</h2>
            </div>
            <p className="text-[#2D3436]/60 mb-8 text-lg">Most popular cities with the best deals right now</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCities.slice(0, 4).map(city => (
                <CityCard key={city.code} city={city} />
              ))}
            </div>
          </div>
          
          {/* Cities by Region */}
          {Object.entries(regions).map(([region, data]) => (
            data.cities.length > 0 && (
              <div key={region} className="mb-16">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{data.emoji}</span>
                  <h2 className="text-3xl font-bold text-[#2D3436]">{region}</h2>
                </div>
                <p className="text-[#2D3436]/60 mb-8 text-lg">{data.cities.length} destinations</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {data.cities.map(city => (
                    <CityCard key={city.code} city={city} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-5xl mb-6">🧳</div>
          <h2 className="text-3xl font-bold text-[#2D3436] mb-4">Can't find your destination?</h2>
          <p className="text-[#2D3436]/60 mb-8 text-lg max-w-xl mx-auto">
            We're constantly adding new destinations. Subscribe to get notified when we add deals to your dream destination.
          </p>
          <a 
            href="/newsletter"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Get Notified ✨
          </a>
        </div>
      </section>
      
      {/* Newsletter */}
      <NewsletterForm variant="hero" />
      
      <Footer />
    </main>
  );
}
