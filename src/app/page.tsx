import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { CityCard } from "@/components/CityCard";
import { NewsletterForm } from "@/components/Newsletter";
import { SearchBar } from "@/components/SearchBar";
import { getServerDeals, getServerStats, formatRelativeTime } from "@/lib/api/server";
import { popularCities } from "@/lib/sample-data";
import { Deal } from "@/lib/types";
import { Compass, Wallet, Flame, Sparkles, MapPin, Calendar, Plane, Building2, Package, Sun, Palmtree, Umbrella } from "lucide-react";

// Force dynamic rendering to always get fresh scraped deals
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  // Fetch real deals from data store
  const [dealsResponse, statsResponse] = await Promise.all([
    getServerDeals({ limit: 12 }),
    getServerStats(),
  ]);
  
  const deals: Deal[] = dealsResponse.deals;
  const stats = {
    totalDeals: statsResponse.stats.totalDeals || dealsResponse.pagination.total,
    avgSavings: statsResponse.stats.avgSavings || 42,
    hotDeals: statsResponse.stats.hotDeals || deals.filter((d: Deal) => d.isHotDeal).length,
    updatedAt: statsResponse.stats.updatedAt || new Date().toISOString(),
  };

  const hotDeals = deals.filter((d) => d.isHotDeal);
  const todayDeals = deals.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />

      {/* Hero Section - Dreamy Sunset Vibe */}
      <section className="relative bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-8xl opacity-10 animate-pulse">🌴</div>
          <div className="absolute bottom-20 right-20 text-7xl opacity-10">✈️</div>
          <div className="absolute top-1/3 right-1/4 text-5xl opacity-5">🌺</div>
          <div className="absolute bottom-1/3 left-1/4 text-4xl opacity-5">🐚</div>
        </div>
        
        {/* Wave Pattern at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 fill-[#FFFAF5]">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V120H0Z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 pb-32 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-8 border border-white/20">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Updated {formatRelativeTime(stats.updatedAt)}</span>
              <span className="mx-2 opacity-50">•</span>
              <span>{stats.totalDeals.toLocaleString()} deals live</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Next
              <br />
              <span className="text-[#2D3436]">Escape</span> ✨
            </h1>

            <p className="text-xl text-white/90 mb-10 max-w-xl leading-relaxed">
              Hand-picked flights, hotels & packages at prices that'll make you smile. 
              Average savings of <span className="font-bold">{stats.avgSavings}%</span> across all deals.
            </p>

            {/* Search/Filter Bar */}
            <SearchBar variant="hero" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {[
              { label: "Active Deals", value: stats.totalDeals, Icon: Compass, emoji: "🧭" },
              { label: "Avg Savings", value: `${stats.avgSavings}%`, Icon: Wallet, emoji: "💰" },
              { label: "Hot Deals", value: stats.hotDeals, Icon: Flame, emoji: "🔥" },
              { label: "Error Fares", value: deals.filter((d) => d.isHistoricLow).length, Icon: Sparkles, emoji: "✨" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 text-center border border-white/20 hover:bg-white/30 transition-all duration-300">
                <div className="text-3xl mb-2">{stat.emoji}</div>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      {hotDeals.length > 0 && (
        <section className="py-20 px-6 bg-[#FFFAF5]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] flex items-center gap-3">
                  <span className="text-4xl">🔥</span>
                  Hot Deals
                  <span className="px-4 py-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white text-sm font-semibold rounded-full shadow-lg shadow-[#FF6B6B]/20">
                    {hotDeals.length} new
                  </span>
                </h2>
                <p className="text-[#2D3436]/60 mt-2 text-lg">Incredible prices that won't last long</p>
              </div>
              <Link 
                href="/deals?hot=true" 
                className="hidden md:flex items-center gap-2 text-[#FF6B6B] font-semibold hover:text-[#E85555] transition-colors"
              >
                View all
                <span>→</span>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hotDeals.slice(0, 3).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Cities */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] flex items-center gap-3">
                <span className="text-4xl">🌴</span>
                Popular Destinations
              </h2>
              <p className="text-[#2D3436]/60 mt-2 text-lg">Browse deals by city</p>
            </div>
            <Link 
              href="/cities" 
              className="hidden md:flex items-center gap-2 text-[#20B2AA] font-semibold hover:text-[#178F89] transition-colors"
            >
              All cities
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {popularCities.slice(0, 8).map(city => (
              <CityCard key={city.code} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* Today's Deals */}
      <section className="py-20 px-6 bg-[#FFFAF5]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] flex items-center gap-3">
                <span className="text-4xl">☀️</span>
                Today's Deals
              </h2>
              <p className="text-[#2D3436]/60 mt-2 text-lg">Fresh deals updated daily</p>
            </div>
            
            <Link 
              href="/deals" 
              className="px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse All Deals →
            </Link>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { label: "All", href: "/deals", Icon: null, active: true },
              { label: "Flights", href: "/deals?type=flight", Icon: Plane, active: false },
              { label: "Hotels", href: "/deals?type=hotel", Icon: Building2, active: false },
              { label: "Packages", href: "/deals?type=package", Icon: Package, active: false },
              { label: "Hot Deals", href: "/deals?hot=true", Icon: Flame, active: false },
            ].map((tag, i) => (
              <Link 
                key={tag.label}
                href={tag.href}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  tag.active 
                    ? "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white shadow-lg shadow-[#FF6B6B]/20" 
                    : "bg-white text-[#2D3436]/70 hover:bg-[#FFF8F0] border border-[#FF6B6B]/10 hover:border-[#FF6B6B]/20"
                }`}
              >
                {tag.Icon && <tag.Icon className="w-4 h-4" />}
                {tag.label}
              </Link>
            ))}
          </div>

          {todayDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {todayDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#FF6B6B]/10 shadow-soft">
              <div className="text-6xl mb-4">✈️</div>
              <h3 className="text-xl font-bold text-[#2D3436] mb-2">No deals available yet</h3>
              <p className="text-[#2D3436]/60 mb-4">Check back soon for the latest travel deals!</p>
            </div>
          )}

          {todayDeals.length > 0 && (
            <div className="text-center mt-14">
              <Link 
                href="/deals"
                className="px-10 py-4 bg-white border-2 border-[#FF6B6B]/20 rounded-full font-semibold text-[#2D3436] hover:bg-[#FFF8F0] hover:border-[#FF6B6B]/30 transition-all duration-300 inline-block"
              >
                Load More Deals 🌊
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Score Explainer */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#2D3436] to-[#4A5154] text-white relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-10 right-10 text-8xl opacity-5">⭐</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-5">💎</div>
        
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="text-5xl mb-6">✨</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-5">What's a Value Score?</h2>
          <p className="text-white/70 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
            Our proprietary Value Score (0-100) compares current prices to historical data 
            to identify truly exceptional deals — not just "on sale" prices.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-7 border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-[#20B2AA] font-bold text-3xl mb-3">90+</div>
              <div className="font-semibold mb-2 text-lg">Incredible 🤩</div>
              <p className="text-white/60 text-sm leading-relaxed">Extremely rare pricing. Book immediately.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-7 border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-[#FFD93D] font-bold text-3xl mb-3">70-89</div>
              <div className="font-semibold mb-2 text-lg">Great Value 😎</div>
              <p className="text-white/60 text-sm leading-relaxed">Well below typical prices. Worth booking.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-7 border border-white/10 hover:bg-white/15 transition-all duration-300">
              <div className="text-[#FFA07A] font-bold text-3xl mb-3">50-69</div>
              <div className="font-semibold mb-2 text-lg">Good 👍</div>
              <p className="text-white/60 text-sm leading-relaxed">Solid savings opportunity.</p>
            </div>
          </div>
          <Link 
            href="/about#value-score"
            className="inline-flex items-center gap-2 mt-10 text-[#20B2AA] font-semibold hover:text-[#48D1CC] transition-colors"
          >
            Learn more about Value Scores
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterForm variant="hero" />

      <Footer />
    </main>
  );
}
