"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { ValueScoreExplainer } from "@/components/ValueScoreBadge";
import { NewsletterForm } from "@/components/Newsletter";
import { sampleDeals, dealStats } from "@/lib/sample-data";
import { filterDeals, sortDeals, searchDeals } from "@/lib/utils";
import { DealType, SortOption } from "@/lib/types";

const dealTypes: { value: DealType | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Deals", emoji: "🎯" },
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

export default function DealsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<DealType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("value-score");
  const [maxPrice, setMaxPrice] = useState<string>("all");
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredDeals = useMemo(() => {
    let deals = sampleDeals;
    
    // Search
    if (searchQuery) {
      deals = searchDeals(deals, searchQuery);
    }
    
    // Filter by type
    if (selectedType !== "all") {
      deals = filterDeals(deals, { types: [selectedType] });
    }
    
    // Filter by price
    if (maxPrice !== "all") {
      deals = deals.filter(d => d.currentPrice <= parseInt(maxPrice));
    }
    
    // Filter hot deals only
    if (showHotOnly) {
      deals = deals.filter(d => d.isHotDeal);
    }
    
    // Sort
    deals = sortDeals(deals, sortBy);
    
    return deals;
  }, [searchQuery, selectedType, sortBy, maxPrice, showHotOnly]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Header */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse All Deals</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            {dealStats.totalDeals.toLocaleString()} curated travel deals updated daily. 
            Average savings of {dealStats.avgSavings}% across all listings.
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, airlines, hotels..."
                className="w-full px-5 py-4 pl-12 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-white/50"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
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
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      selectedType === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>
              
              <div className="h-8 w-px bg-gray-200 hidden md:block" />
              
              {/* Hot Deals Toggle */}
              <button
                onClick={() => setShowHotOnly(!showHotOnly)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  showHotOnly
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🔥 Hot Deals Only
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
              Showing <span className="font-semibold text-gray-900">{filteredDeals.length}</span> deals
              {searchQuery && <span> for "{searchQuery}"</span>}
            </p>
          </div>
          
          {/* Results Grid */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Deals List */}
            <div className="lg:col-span-3">
              {filteredDeals.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDeals.map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-4">🔍</div>
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
