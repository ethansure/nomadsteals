"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { Deal } from "@/lib/types";
import { History, Search, Calendar, MapPin, Filter, ChevronLeft, ChevronRight } from "lucide-react";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

function HistoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalArchived, setTotalArchived] = useState(0);
  
  // Filters
  const [destination, setDestination] = useState(searchParams.get('to') || '');
  const [origin, setOrigin] = useState(searchParams.get('from') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch deals
  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String((page - 1) * limit));
        if (destination) params.set('to', destination);
        if (origin) params.set('from', origin);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        
        const response = await fetch(`/api/deals/history?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setDeals(data.deals);
          setTotal(data.pagination.total);
          setTotalArchived(data.meta.totalArchived);
        } else {
          setError('Failed to load deal history');
        }
      } catch (err) {
        console.error('Error fetching history:', err);
        setError('Failed to load deal history. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchHistory();
  }, [page, destination, origin, dateFrom, dateTo]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    
    // Update URL params
    const params = new URLSearchParams();
    if (destination) params.set('to', destination);
    if (origin) params.set('from', origin);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    router.push(`/deals/history?${params.toString()}`);
  };
  
  // Clear filters
  const clearFilters = () => {
    setDestination('');
    setOrigin('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    router.push('/deals/history');
  };
  
  const totalPages = Math.ceil(total / limit);
  const hasFilters = destination || origin || dateFrom || dateTo;

  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      
      {/* Page Header */}
      <section className="bg-gradient-to-br from-[#6B5B95] via-[#8B78A9] to-[#A99BBD] text-white py-16 px-6 relative overflow-hidden">
        <div className="absolute top-10 right-20 text-6xl opacity-10">📚</div>
        <div className="absolute bottom-10 left-20 text-5xl opacity-10">🕐</div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Deal History</h1>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Browse past deals to see price trends and historical offers.
            {totalArchived > 0 && (
              <span className="block mt-2">
                <span className="font-bold">{totalArchived.toLocaleString()}</span> deals in our archive.
              </span>
            )}
          </p>
        </div>
      </section>
      
      {/* Filters & Search */}
      <section className="py-8 px-6 border-b border-[#6B5B95]/10">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="bg-white rounded-3xl shadow-soft p-5 border border-[#6B5B95]/5">
            <div className="flex flex-wrap items-center gap-4">
              {/* Destination */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-[#2D3436]/50 mb-1 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B95]/50" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Any destination"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F5FF] rounded-xl text-sm outline-none border border-transparent focus:border-[#6B5B95]/30 transition-colors"
                  />
                </div>
              </div>
              
              {/* Origin */}
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-[#2D3436]/50 mb-1 block">Origin</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B95]/50" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Any origin"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F5FF] rounded-xl text-sm outline-none border border-transparent focus:border-[#6B5B95]/30 transition-colors"
                  />
                </div>
              </div>
              
              {/* Toggle more filters on mobile */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden px-4 py-2.5 bg-[#F8F5FF] text-[#6B5B95] rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Less' : 'More'}
              </button>
              
              {/* Date filters - desktop */}
              <div className={`flex-1 min-w-[150px] ${showFilters ? 'block' : 'hidden md:block'}`}>
                <label className="text-xs font-semibold text-[#2D3436]/50 mb-1 block">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B95]/50" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F5FF] rounded-xl text-sm outline-none border border-transparent focus:border-[#6B5B95]/30 transition-colors"
                  />
                </div>
              </div>
              
              <div className={`flex-1 min-w-[150px] ${showFilters ? 'block' : 'hidden md:block'}`}>
                <label className="text-xs font-semibold text-[#2D3436]/50 mb-1 block">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B95]/50" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#F8F5FF] rounded-xl text-sm outline-none border border-transparent focus:border-[#6B5B95]/30 transition-colors"
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#6B5B95] to-[#8B78A9] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#6B5B95]/25 transition-all duration-300 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-4 py-2.5 bg-[#F8F5FF] text-[#6B5B95] rounded-xl font-semibold hover:bg-[#F0EBFF] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
      
      {/* Results */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-[#2D3436]/60">
              {loading ? (
                'Loading historical deals...'
              ) : (
                <>
                  Found <span className="font-bold text-[#2D3436]">{total}</span> expired deals
                  {hasFilters && ' matching your filters'}
                </>
              )}
            </p>
            
            {/* Pagination Info */}
            {!loading && total > 0 && (
              <p className="text-sm text-[#2D3436]/50">
                Page {page} of {totalPages}
              </p>
            )}
          </div>
          
          {/* Results Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse shadow-soft">
                  <div className="h-40 bg-gradient-to-r from-[#F8F5FF] to-[#F0EBFF]" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-[#F8F5FF] rounded-full w-3/4" />
                    <div className="h-3 bg-[#F8F5FF] rounded-lg w-1/2" />
                    <div className="h-6 bg-[#F8F5FF] rounded-xl w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#6B5B95]/10 shadow-soft">
              <div className="text-6xl mb-4">😕</div>
              <h3 className="text-xl font-bold text-[#2D3436] mb-2">Oops!</h3>
              <p className="text-[#2D3436]/60 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-gradient-to-r from-[#6B5B95] to-[#8B78A9] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-[#6B5B95]/25 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : deals.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {deals.map(deal => (
                  <div key={deal.id} className="relative">
                    {/* Expired Badge */}
                    <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-[#6B5B95]/90 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Expired {formatRelativeTime(deal.expiredAt || deal.bookByDate)}
                    </div>
                    <DealCard deal={deal} />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-[#6B5B95]/20 rounded-xl font-semibold text-[#6B5B95] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8F5FF] transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-xl font-semibold transition-colors ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-[#6B5B95] to-[#8B78A9] text-white'
                              : 'bg-white border border-[#6B5B95]/20 text-[#6B5B95] hover:bg-[#F8F5FF]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border border-[#6B5B95]/20 rounded-xl font-semibold text-[#6B5B95] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F8F5FF] transition-colors flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#6B5B95]/10 shadow-soft">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-[#2D3436] mb-2">No historical deals found</h3>
              <p className="text-[#2D3436]/60 mb-6">
                {hasFilters 
                  ? 'Try adjusting your filters to see more results'
                  : 'Deal history will appear here as deals expire'
                }
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-8 py-3 bg-gradient-to-r from-[#6B5B95] to-[#8B78A9] text-white rounded-full font-semibold hover:shadow-lg hover:shadow-[#6B5B95]/25 transition-all duration-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>
      
      {/* Info Section */}
      <section className="py-12 px-6 bg-gradient-to-br from-[#F8F5FF] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#2D3436] mb-4">Why Browse Deal History?</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-2xl p-6 shadow-soft">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-[#2D3436] mb-2">Price Trends</h3>
              <p className="text-sm text-[#2D3436]/60">See how prices have changed over time for your favorite routes</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-[#2D3436] mb-2">Set Expectations</h3>
              <p className="text-sm text-[#2D3436]/60">Know what prices to expect and when to pull the trigger</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-soft">
              <div className="text-4xl mb-3">🔔</div>
              <h3 className="font-bold text-[#2D3436] mb-2">Don't Miss Out</h3>
              <p className="text-sm text-[#2D3436]/60">Subscribe to alerts so you never miss a deal like these again</p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

function HistoryPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />
      <section className="bg-gradient-to-br from-[#6B5B95] via-[#8B78A9] to-[#A99BBD] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 bg-white/20 rounded-2xl w-64 mb-4 animate-pulse" />
          <div className="h-6 bg-white/20 rounded-xl w-96 animate-pulse" />
        </div>
      </section>
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse shadow-soft">
                <div className="h-40 bg-gradient-to-r from-[#F8F5FF] to-[#F0EBFF]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#F8F5FF] rounded-full w-3/4" />
                  <div className="h-3 bg-[#F8F5FF] rounded-lg w-1/2" />
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

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistoryPageSkeleton />}>
      <HistoryPageContent />
    </Suspense>
  );
}
