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
import { Target, Plane, Building2, Package, Flame, Globe, Search, Frown, Palmtree, MapPin, Umbrella } from "lucide-react";

const DealTypeIcons = {
  all: Target,
  flight: Plane,
  hotel: Building2,
  package: Package,
};

const dealTypes: { value: DealType | "all"; label: string; Icon: typeof Target }[] = [
  { value: "all", label: "All Deals", Icon: Target },
  { value: "flight", label: "Flights", Icon: Plane },
  { value: "hotel", label: "Hotels", Icon: Building2 },
  { value: "package", label: "Packages", Icon: Package },
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
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {searchTitle || 'Browse All Deals'}
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            {stats.totalDeals > 0 ? (
              <>
                {hasLocationFilters 
                  ? `${filteredDeals.length} matching deals found.`
                  : `${stats.totalDeals.toLocaleString()} curated travel deals.`
                }
                {' '}Average savings of {stats.avgSavings}% across all listings.
                {stats.updatedAt && (
                  <span className="block mt-1 text-sm text-blue-200">
                    Last updated: {formatRelativeTime(stats.updatedAt)}
                  </span>
                )}
              </>
            ) : (
              'Loading the best travel deals for you...'
            )}
          </p>
          
          {/* Search Bar */}
          <div className="mt-8">
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
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 border border-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              {/* Type Filters */}
              <div className="flex flex-wrap gap-2">
                {dealTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                      selectedType === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <type.Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
              
              <div className="h-8 w-px bg-gray-200 hidden md:block" />
              
              {/* Hot Deals Toggle */}
              <button
                onClick={() => setShowHotOnly(!showHotOnly)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  showHotOnly
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Flame className="w-4 h-4" />
                Hot Deals Only
              </button>
              
              {/* More Filters Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium"
              >
                {showFilters ? "Hide Filters" : "More Filters"}
              </button>
              
              <div className="flex-1" />
              
              {/* Sort & Price - Desktop */}
              <div className="hidden md:flex items-center gap-3">
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-sm outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>Sort: {option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Mobile Expanded Filters */}
            {showFilters && (
              <div className="md:hidden mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none"
                >
                  {priceRanges.map((range) => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {loading ? (
                'Loading deals...'
              ) : (
                <>
                  Showing <span className="font-semibold text-gray-900">{filteredDeals.length}</span> deals
                  {searchQuery && <span> for "{searchQuery}"</span>}
                </>
              )}
            </p>
          </div>
          
          {/* Results Grid */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Deals List */}
            <div className="lg:col-span-3">
              {loading ? (
                // Loading skeleton
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                      <div className="h-48 bg-gray-200" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="flex justify-center mb-4">
                    <Frown className="w-14 h-14 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredDeals.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="flex justify-center mb-4">
                    <Search className="w-14 h-14 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No deals found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedType("all");
                      setMaxPrice("all");
                      setShowHotOnly(false);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="hidden lg:block space-y-6">
              {/* Region Quick Filters */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Quick Filters
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Destination</label>
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
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Origin</label>
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
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-500 mb-2">Popular Routes</div>
                  <div className="space-y-1">
                    {[
                      { label: 'West Coast → Asia', from: 'us-west', to: 'asia-east', Icon: Palmtree },
                      { label: 'East Coast → Europe', from: 'us-east', to: 'europe-west', Icon: Building2 },
                      { label: 'US → Caribbean', from: '', to: 'caribbean', Icon: Umbrella },
                      { label: 'US → Hawaii', from: '', to: 'hawaii', Icon: MapPin },
                    ].map((route, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (route.from) params.set('fromRegion', route.from);
                          if (route.to) params.set('toRegion', route.to);
                          router.push(`/deals?${params.toString()}`);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 rounded-lg transition flex items-center gap-2"
                      >
                        <route.Icon className="w-4 h-4 text-gray-400" />
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
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-white/20 rounded-xl w-64 mb-4 animate-pulse" />
          <div className="h-6 bg-white/20 rounded-xl w-96 animate-pulse" />
        </div>
      </section>
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
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
