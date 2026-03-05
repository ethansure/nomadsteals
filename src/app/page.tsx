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
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Updated {formatRelativeTime(stats.updatedAt)}</span>
              <span className="mx-2">•</span>
              <span>{stats.totalDeals.toLocaleString()} deals live</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Today's Best
              <br />
              <span className="text-yellow-300">Travel Deals</span>
            </h1>

            <p className="text-xl text-blue-100 mb-8 max-w-xl">
              Hand-picked flights, hotels & packages with Value Scores. 
              Average savings of {stats.avgSavings}% across all deals.
            </p>

            {/* Search/Filter Bar */}
            <SearchBar variant="hero" />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[
              { label: "Active Deals", value: stats.totalDeals, icon: "🎯" },
              { label: "Avg Savings", value: `${stats.avgSavings}%`, icon: "💰" },
              { label: "Hot Deals", value: stats.hotDeals, icon: "🔥" },
              { label: "Error Fares", value: deals.filter((d) => d.isHistoricLow).length, icon: "⚡" },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      {hotDeals.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  🔥 Hot Deals
                  <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                    {hotDeals.length} new
                  </span>
                </h2>
                <p className="text-gray-600 mt-1">Incredible prices that won't last long</p>
              </div>
              <Link href="/deals?hot=true" className="text-blue-600 font-medium hover:text-blue-700 transition">
                View all →
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotDeals.slice(0, 3).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Cities */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">🌆 Popular Destinations</h2>
              <p className="text-gray-600 mt-1">Browse deals by city</p>
            </div>
            <Link href="/cities" className="text-blue-600 font-medium hover:text-blue-700 transition">
              All cities →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularCities.slice(0, 8).map(city => (
              <CityCard key={city.code} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* Today's Deals */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">📅 Today's Deals</h2>
              <p className="text-gray-600 mt-1">Fresh deals updated daily</p>
            </div>
            
            {/* Sort Options */}
            <Link 
              href="/deals" 
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Browse All Deals →
            </Link>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["All", "✈️ Flights", "🏨 Hotels", "📦 Packages", "🔥 Hot Deals"].map((tag, i) => (
              <Link 
                key={tag}
                href={i === 0 ? "/deals" : `/deals?type=${tag.split(" ")[1]?.toLowerCase() || ""}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  i === 0 
                    ? "bg-blue-600 text-white" 
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {tag}
              </Link>
            ))}
          </div>

          {todayDeals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todayDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals available yet</h3>
              <p className="text-gray-600 mb-4">Check back soon for the latest travel deals!</p>
            </div>
          )}

          {todayDeals.length > 0 && (
            <div className="text-center mt-12">
              <Link 
                href="/deals"
                className="px-8 py-4 bg-white border border-gray-200 rounded-2xl font-medium text-gray-700 hover:bg-gray-50 transition inline-block"
              >
                Load More Deals
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Value Score Explainer */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-3xl font-bold mb-4">What's a Value Score?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Our proprietary Value Score (0-100) compares current prices to historical data 
            to identify truly exceptional deals — not just "on sale" prices.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-green-400 font-bold text-2xl mb-2">90+</div>
              <div className="font-semibold mb-1">Incredible</div>
              <p className="text-gray-400 text-sm">Extremely rare pricing. Book immediately.</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-lime-400 font-bold text-2xl mb-2">70-89</div>
              <div className="font-semibold mb-1">Great Value</div>
              <p className="text-gray-400 text-sm">Well below typical prices. Worth booking.</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-6">
              <div className="text-amber-400 font-bold text-2xl mb-2">50-69</div>
              <div className="font-semibold mb-1">Good</div>
              <p className="text-gray-400 text-sm">Solid savings opportunity.</p>
            </div>
          </div>
          <Link 
            href="/about#value-score"
            className="inline-block mt-8 text-blue-400 font-medium hover:text-blue-300 transition"
          >
            Learn more about Value Scores →
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterForm variant="hero" />

      <Footer />
    </main>
  );
}
