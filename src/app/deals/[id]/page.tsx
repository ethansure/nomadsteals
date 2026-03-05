import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { ValueScoreBadge, ValueScoreExplainer } from "@/components/ValueScoreBadge";
import { NewsletterForm } from "@/components/Newsletter";
import { getServerDeal, getServerDeals } from "@/lib/api/server";
import { getDealById as getSampleDealById, sampleDeals } from "@/lib/sample-data";
import { formatPrice, formatDate, timeAgo, getValueScoreLabel } from "@/lib/utils";
import { Deal } from "@/lib/types";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 300; // Revalidate every 5 minutes

async function getDeal(id: string): Promise<Deal | null> {
  const response = await getServerDeal(id);
  if (response.success && response.deal) {
    return response.deal;
  }
  // Fall back to sample data
  return getSampleDealById(id) || null;
}

async function getSimilarDeals(deal: Deal): Promise<Deal[]> {
  const response = await getServerDeals({ limit: 10 });
  if (response.success) {
    return response.deals
      .filter((d: Deal) => d.id !== deal.id && (d.type === deal.type || d.destinationCity === deal.destinationCity))
      .slice(0, 3);
  }
  // Fall back to sample data
  return sampleDeals
    .filter(d => d.id !== deal.id && (d.type === deal.type || d.destinationCity === deal.destinationCity))
    .slice(0, 3);
}

export async function generateMetadata({ params }: DealPageProps): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  
  if (!deal) {
    return { title: "Deal Not Found" };
  }
  
  return {
    title: deal.title,
    description: deal.description,
    openGraph: {
      title: `${deal.title} - NomadSteals`,
      description: `${formatPrice(deal.currentPrice)} (${deal.savingsPercent}% off) - ${deal.description}`,
      images: [{ url: deal.imageUrl, width: 800, height: 600 }],
    },
  };
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;
  const deal = await getDeal(id);
  
  if (!deal) {
    notFound();
  }
  
  const similarDeals = await getSimilarDeals(deal);
  
  const typeEmojis: Record<string, string> = {
    flight: "✈️",
    hotel: "🏨",
    package: "📦",
    cruise: "🚢",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img 
          src={deal.imageUrl} 
          alt={deal.destinationCity}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {deal.isHotDeal && (
            <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full animate-pulse">
              🔥 Hot Deal
            </span>
          )}
          {deal.isHistoricLow && (
            <span className="bg-green-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              📉 Historic Low
            </span>
          )}
          {deal.isExpiringSoon && (
            <span className="bg-amber-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              ⏰ Expires Soon
            </span>
          )}
        </div>
        
        {/* Back Button */}
        <Link 
          href="/deals"
          className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-gray-900 hover:bg-white transition"
        >
          ← Back to Deals
        </Link>
      </div>
      
      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl">{typeEmojis[deal.type] || "🎯"}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full capitalize">
                        {deal.type}
                      </span>
                      <ValueScoreBadge score={deal.valueScore} showLabel />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{deal.title}</h1>
                  </div>
                </div>
                
                {/* Route */}
                {deal.originCity && (
                  <div className="flex items-center gap-3 text-gray-600 mb-4">
                    <span className="font-medium">{deal.originCity}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-bold text-gray-900">{deal.destinationCity}</span>
                  </div>
                )}
                
                <p className="text-gray-600 text-lg leading-relaxed">{deal.description}</p>
                
                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                  <span>👁 {(deal.views || 0).toLocaleString()} views</span>
                  <span>❤️ {(deal.saves || 0).toLocaleString()} saves</span>
                  <span>Posted {timeAgo(deal.postedAt)}</span>
                  <span>via {deal.source}</span>
                </div>
              </div>
              
              {/* Deal Details */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Deal Details</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Travel Window */}
                  {deal.travelWindow && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span>📅</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Travel Window</div>
                        <div className="font-semibold text-gray-900">{deal.travelWindow}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Airline */}
                  {deal.airline && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span>✈️</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Airline</div>
                        <div className="font-semibold text-gray-900">{deal.airline}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hotel */}
                  {deal.hotel && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span>🏨</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Hotel</div>
                        <div className="font-semibold text-gray-900">{deal.hotel}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Nights */}
                  {deal.nights && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span>🌙</span>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Duration</div>
                        <div className="font-semibold text-gray-900">{deal.nights} nights</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Book By */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span>⏰</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Book By</div>
                      <div className="font-semibold text-gray-900">{formatDate(deal.bookByDate)}</div>
                    </div>
                  </div>
                  
                  {/* Value Score */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span>⚡</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Value Score</div>
                      <div className="font-semibold text-gray-900">{deal.valueScore}/100 - {getValueScoreLabel(deal.valueScore)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* What's Included */}
              {deal.includes && deal.includes.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {deal.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-700">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Restrictions */}
              {deal.restrictions && deal.restrictions.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <h2 className="text-lg font-bold text-amber-800 mb-4">⚠️ Important Notes</h2>
                  <ul className="space-y-2">
                    {deal.restrictions.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-amber-700">
                        <span className="text-amber-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Tags */}
              {deal.tags && deal.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/deals?tag=${tag}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 sticky top-24">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(deal.currentPrice, deal.currency)}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(deal.originalPrice, deal.currency)}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    <span>🎉</span>
                    Save {formatPrice(deal.originalPrice - deal.currentPrice)} ({deal.savingsPercent}% off)
                  </div>
                </div>
                
                <a
                  href={deal.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl text-center hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 mb-4"
                >
                  Book This Deal →
                </a>
                
                <p className="text-xs text-gray-500 text-center">
                  Clicking will take you to {deal.source}. We may earn a commission.
                </p>
                
                {deal.isExpiringSoon && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl text-center">
                    <span className="text-red-600 font-medium text-sm">⚡ This deal expires soon!</span>
                  </div>
                )}
              </div>
              
              <ValueScoreExplainer />
              <NewsletterForm variant="card" />
            </div>
          </div>
          
          {/* Similar Deals */}
          {similarDeals.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Deals You Might Like</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {similarDeals.map(d => (
                  <DealCard key={d.id} deal={d} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
