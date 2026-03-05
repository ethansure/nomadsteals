"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { ValueScoreExplainer } from "@/components/ValueScoreBadge";
import { NewsletterForm } from "@/components/Newsletter";
import { SearchBar, SearchResultsHeader } from "@/components/SearchBar";
import { RegionSelectCompact } from "@/components/RegionSelect";
import { filterDeals, sortDeals, searchDeals } from "@/lib/utils";
import { formatSearchTitle, getRegion } from "@/lib/regions";
import { Deal, DealType, SortOption } from "@/lib/types";
import { Plane, Building2, Package, Flame, SlidersHorizontal, Sparkles, MapPin, Compass } from "lucide-react";

const dealTypes: { value: DealType | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Deals", emoji: "🧭" },
  { value: "flight", label: "Flights", emoji: "✈️" },
  { value: "hotel", label: "Hotels", emoji: "🏨" },
  { value: "package", label: "Packages", emoji: "📦" },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "value-score", label: "Value Score" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "savings", label: "Biggest Savings" },
  { value: "newest", label: "Newest First" },
  { value: "popularity", label: "Most Popular" },
];

const priceRanges = [
  { value: "all", label: "Any Price" },
  { value: "500", label: "Under $500" },
  { value: "1000", label: "Under $1,000" },
  { value: "2000", label: "Under $2,000" },
  { value: "5000", label: "Under $5,000" },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

// Inner component that uses useSearchParams (needs Suspense boundary)
function DealsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalDeals: 0, avgSavings: 42, updatedAt: '' });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<DealType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("value-score");
  const [maxPrice, setMaxPrice] = useState<string>("all");
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Region/city filters from URL
  const fromCity = searchParams.get('from') || '';
  const fromRegion = searchParams.get('fromRegion') || '';
  const toCity = searchParams.get('to') || '';
  const toRegion = searchParams.get('toRegion') || '';
  
  const hasLocationFilters = fromCity || fromRegion || toCity || toRegion;

  // Fetch deals from API with location filters
  useEffect(() => {
    async function fetchDeals() {
      try {
        setLoading(true);
        
        // Build API URL with filters
        const params = new URLSearchParams();
        params.set('limit', '100');
        if (fromCity) params.set('from', fromCity);
        if (fromRegion) params.set('fromRegion', fromRegion);
        if (toCity) params.set('to', toCity);
        if (toRegion) params.set('toRegion', toRegion);
        
        const response = await fetch(`/api/deals?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setDeals(data.deals);
          setStats({
            totalDeals: data.pagination.total,
            avgSavings: data.meta.stats.avgSavings || 42,
            updatedAt: data.meta.lastUpdated,
          });
        } else {
          setError('Failed to load deals');
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
        setError('Failed to load deals. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDeals();
  }, [fromCity, fromRegion, toCity, toRegion]);
  
  // Clear location filters
  const clearLocationFilters = () => {
    router.push('/deals');
  };
  
  // Get search title
  const searchTitle = hasLocationFilters
    ? formatSearchTitle({ fromCity, fromRegion, toCity, toRegion })
    : null;

  const filteredDeals = useMemo(() => {
    let filtered = [...deals];
    
    // Search
    if (searchQuery) {
      filtered = searchDeals(filtered, searchQuery);
    }
    
    // Filter by type
    if (selectedType !== "all") {
      filtered = filterDeals(filtered, { types: [selectedType] });
    }
    
    // Filter by price
    if (maxPrice !== "all") {
      filtered = filtered.filter(d => d.currentPrice <= parseInt(maxPrice));
    }
    
    // Filter hot deals only
    if (showHotOnly) {
      filtered = filtered.filter(d => d.isHotDeal);
    }
    
    // Sort
    filtered = sortDeals(filtered, sortBy);
    
    return filtered;
  }, [deals, searchQuery, selectedType, sortBy, maxPrice, showHotOnly]);

  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      
      {/* Page Header - Warm Gradient */}
      <section className="bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white py-16 px-6 relative">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 text-6xl opacity-10">🌴</div>
          <div className="absolute bottom-10 left-20 text-5xl opacity-10">✈️</div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">
              {searchTitle || 'Explore All Deals'}
            </h1>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            {stats.totalDeals > 0 ? (
              <>
                {hasLocationFilters 
                  ? `${filteredDeals.length} matching deals found.`
                  : `${stats.totalDeals.toLocaleString()} curated travel deals.`
                }
                {' '}Average savings of <span className="font-bold">{stats.avgSavings}%</span> across all listings.
                {stats.updatedAt && (
                  <span className="block mt-2 text-sm text-white/70">
                    Last updated: {formatRelativeTime(stats.updatedAt)}
                  </span>
                )}
              </>
            ) : (
              'Loading the best travel deals for you...'
            )}
          </p>
          
          {/* Search Bar */}
          <div className="mt-10">
            <SearchBar 
              variant="hero"
              initialFrom={fromRegion || fromCity}
              initialFromType={fromRegion ? 'region' : 'city'}
              initialTo={toRegion || toCity}
              initialToType={toRegion ? 'region' : 'city'}
            />
          </div>
        </div>
      </section>
      
      {/* Filters & Results */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl shadow-soft p-5 mb-10 border border-[#FF6B6B]/5">
            <div className="flex flex-wrap items-center gap-4">
              {/* Type Filters */}
              <div className="flex flex-wrap gap-2">
                {dealTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      selectedType === type.value
                        ? "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white shadow-lg shadow-[#FF6B6B]/20"
                        : "bg-[#FFF8F0] text-[#2D3436]/70 hover:bg-[#FFEFE5]"
                    }`}
                  >
                    <span>{type.emoji}</span>
                    {type.label}
                  </button>
                ))}
              </div>
              
              <div className="h-8 w-px bg-[#FF6B6B]/10 hidden md:block" />
              
              {/* Hot Deals Toggle */}
              <button
                onClick={() => setShowHotOnly(!showHotOnly)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  showHotOnly
                    ? "bg-gradient-to-r from-[#FF6B6B] to-[#E85555] text-white shadow-lg shadow-[#FF6B6B]/30"
                    : "bg-[#FFF8F0] text-[#2D3436]/70 hover:bg-[#FFEFE5]"
                }`}
              >
                🔥 Hot Deals Only
              </button>
              
              {/* More Filters Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-5 py-2.5 bg-[#FFF8F0] text-[#2D3436]/70 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {showFilters ? "Hide Filters" : "More Filters"}
              </button>
              
              <div className="flex-1" />
              
              {/* Sort & Price - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-4 py-2.5 bg-[#FFF8F0] rounded-xl text-sm outline-none border border-transparent focus:border-[#20B2AA]/30 transition-colors cursor-pointer"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2.5 bg-[#FFF8F0] rounded-xl text-sm outline-none border border-transparent focus:border-[#20B2AA]/30 transition-colors cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>Sort: {option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Mobile Expanded Filters */}
            {showFilters && (
              <div className="md:hidden mt-5 pt-5 border-t border-[#FF6B6B]/10 grid grid-cols-2 gap-3">
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-4 py-3 bg-[#FFF8F0] rounded-xl text-sm outline-none"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 bg-[#FFF8F0] rounded-xl text-sm outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-[#2D3436]/60">
              {loading ? (
                'Loading deals...'
              ) : (
                <>
                  Showing <span className="font-bold text-[#2D3436]">{filteredDeals.length}</span> deals
                  {searchQuery && <span> for "{searchQuery}"</span>}
                </>
              )}
            </p>
          </div>
          
          {/* Results Grid */}
          <div className="grid lg:grid-cols-4 gap-10">
            {/* Deals List */}
            <div className="lg:col-span-3">
              {loading ? (
                // Loading skeleton
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse shadow-soft">
                      <div className="h-52 bg-gradient-to-r from-[#FFF8F0] to-[#FFFAF5]" />
                      <div className="p-6 space-y-4">
                        <div className="h-5 bg-[#FFF8F0] rounded-full w-3/4" />
                        <div className="h-4 bg-[#FFF8F0] rounded-lg w-1/2" />
                        <div className="h-8 bg-[#FFF8F0] rounded-xl w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#FF6B6B]/10 shadow-soft">
                  <div className="text-6xl mb-4">😕</div>
                  <h3 className="text-xl font-bold text-[#2D3436] mb-2">Oops!</h3>
                  <p className="text-[#2D3436]/60 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredDeals.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-[#FF6B6B]/10 shadow-soft">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-[#2D3436] mb-2">No deals found</h3>
                  <p className="text-[#2D3436]/60 mb-6">Try adjusting your filters or search terms</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                      setMaxPrice("all");
                      setShowHotOnly(false);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="hidden lg:block space-y-8">
              {/* Region Quick Filters */}
              <div className="bg-white rounded-3xl p-6 border border-[#FF6B6B]/5 shadow-soft">
                <h3 className="font-bold text-[#2D3436] mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FF6B6B]" />
                  Quick Filters
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#2D3436]/50 mb-2 block uppercase tracking-wide">Destination</label>
                    <RegionSelectCompact
                      value={toRegion || toCity}
                      onChange={(value, type) => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('to');
                        params.delete('toRegion');
                        if (value) {
                          params.set(type === 'region' ? 'toRegion' : 'to', value);
                        }
                        router.push(`/deals?${params.toString()}`);
                      }}
                      placeholder="Any destination"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-[#2D3436]/50 mb-2 block uppercase tracking-wide">Origin</label>
                    <RegionSelectCompact
                      value={fromRegion || fromCity}
                      onChange={(value, type) => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('from');
                        params.delete('fromRegion');
                        if (value) {
                          params.set(type === 'region' ? 'fromRegion' : 'from', value);
                        }
                        router.push(`/deals?${params.toString()}`);
                      }}
                      placeholder="Anywhere"
                    />
                  </div>
                </div>
                
                {/* Popular Routes */}
                <div className="mt-6 pt-6 border-t border-[#FF6B6B]/10">
                  <div className="text-xs font-semibold text-[#2D3436]/50 mb-3 uppercase tracking-wide">Popular Routes</div>
                  <div className="space-y-1">
                    {[
                      { label: '🌴 West Coast → Asia', from: 'us-west', to: 'asia-east' },
                      { label: '🗽 East Coast → Europe', from: 'us-east', to: 'europe-west' },
                      { label: '🏝️ US → Caribbean', from: '', to: 'caribbean' },
                      { label: '🌺 US → Hawaii', from: '', to: 'hawaii' },
                    ].map((route, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (route.from) params.set('fromRegion', route.from);
                          if (route.to) params.set('toRegion', route.to);
                          router.push(`/deals?${params.toString()}`);
                        }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#FFF8F0] hover:text-[#FF6B6B] rounded-xl transition-all duration-300"
                      >
                        {route.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <ValueScoreExplainer />
              <NewsletterForm variant="card" />
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

// Loading fallback for Suspense
function DealsPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      <section className="bg-gradient-to-br from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-white/20 rounded-2xl w-64 mb-4 animate-pulse" />
          <div className="h-6 bg-white/20 rounded-xl w-96 animate-pulse" />
        </div>
      </section>
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse shadow-soft">
                <div className="h-52 bg-gradient-to-r from-[#FFF8F0] to-[#FFFAF5]" />
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-[#FFF8F0] rounded-full w-3/4" />
                  <div className="h-4 bg-[#FFF8F0] rounded-lg w-1/2" />
                  <div className="h-8 bg-[#FFF8F0] rounded-xl w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function DealsPage() {
  return (
    <Suspense fallback={<DealsPageSkeleton />}>
      <DealsPageContent />
    </Suspense>
  );
}
