"use client";

import Link from "next/link";
import { Deal } from "@/lib/types";

const typeColors = {
  flight: "bg-blue-500",
  hotel: "bg-amber-500",
  package: "bg-emerald-500",
  cruise: "bg-purple-500",
};

const typeEmojis = {
  flight: "✈️",
  hotel: "🏨",
  package: "📦",
  cruise: "🚢",
};

function ValueScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "bg-green-500" : score >= 70 ? "bg-amber-500" : "bg-gray-500";
  return (
    <div className={`${color} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
      <span>⚡</span>
      <span>{score}</span>
    </div>
  );
}

export function DealCard({ deal }: { deal: Deal }) {
  const savings = deal.originalPrice - deal.currentPrice;
  
  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image */}
      <Link href={`/deals/${deal.id}`} className="block relative h-48 overflow-hidden">
        <img 
          src={deal.imageUrl} 
          alt={deal.destinationCity}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${typeColors[deal.type]} text-white text-xs font-medium px-3 py-1 rounded-full`}>
            {typeEmojis[deal.type]} {deal.type.charAt(0).toUpperCase() + deal.type.slice(1)}
          </span>
          {deal.isHotDeal && (
            <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full animate-pulse">
              🔥 Hot
            </span>
          )}
        </div>
        
        {/* Value Score */}
        <div className="absolute top-3 right-3">
          <ValueScoreBadge score={deal.valueScore} />
        </div>
        
        {/* Historic Low Badge */}
        {deal.isHistoricLow && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            📉 Historic Low
          </div>
        )}
      </Link>
      
      {/* Content */}
      <div className="p-5">
        {/* Route */}
        {deal.originCity && (
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
            <span>{deal.originCity}</span>
            <span>→</span>
            <span className="font-medium text-gray-700">{deal.destinationCity}</span>
          </div>
        )}
        
        {/* Title */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer">
            {deal.title}
          </h3>
        </Link>
        
        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {deal.description}
        </p>
        
        {/* Includes */}
        {deal.includes && deal.includes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {deal.includes.slice(0, 3).map((item, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {item}
              </span>
            ))}
            {deal.includes.length > 3 && (
              <span className="text-xs text-gray-500">+{deal.includes.length - 3} more</span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ${deal.currentPrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ${deal.originalPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-green-600 font-medium">
              Save ${savings.toLocaleString()} ({deal.savingsPercent}% off)
            </div>
          </div>
          
          <a
            href={deal.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            View Deal →
          </a>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>👁 {deal.views.toLocaleString()}</span>
            <span>❤️ {deal.saves.toLocaleString()}</span>
          </div>
          <div>
            {deal.isExpiringSoon ? (
              <span className="text-red-500 font-medium">⏰ Expires soon</span>
            ) : (
              <span>via {deal.source}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-16" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="h-8 bg-gray-200 rounded w-24 mb-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
