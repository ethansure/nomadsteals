"use client";

import Link from "next/link";
import { Deal } from "@/lib/types";
import { getRegionForCity } from "@/lib/regions";
import { Plane, Building2, Package, Ship, Zap, Flame, TrendingDown, Eye, Heart, Clock, Sparkles } from "lucide-react";

const typeColors = {
  flight: "bg-gradient-to-r from-[#20B2AA] to-[#48D1CC]",
  hotel: "bg-gradient-to-r from-[#FFA07A] to-[#FFD93D]",
  package: "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A]",
  cruise: "bg-gradient-to-r from-[#20B2AA] to-[#178F89]",
};

const TypeIcons = {
  flight: Plane,
  hotel: Building2,
  package: Package,
  cruise: Ship,
};

function ValueScoreBadge({ score }: { score: number }) {
  const getStyle = () => {
    if (score >= 90) return "bg-gradient-to-r from-[#20B2AA] to-[#48D1CC] shadow-[#20B2AA]/30";
    if (score >= 70) return "bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] shadow-[#FF6B6B]/30";
    return "bg-gradient-to-r from-[#DEB887] to-[#F5DEB3] text-[#2D3436]";
  };
  
  return (
    <div className={`${getStyle()} text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg`}>
      <Sparkles className="w-3 h-3" />
      <span>{score}</span>
    </div>
  );
}

export function DealCard({ deal }: { deal: Deal }) {
  const savings = deal.originalPrice - deal.currentPrice;
  
  return (
    <div className="group bg-white rounded-3xl shadow-soft hover:shadow-soft-lg transition-all duration-500 overflow-hidden border border-[#FF6B6B]/5 hover:-translate-y-1">
      {/* Image */}
      <Link href={`/deals/${deal.id}`} className="block relative h-52 overflow-hidden">
        <img 
          src={deal.imageUrl} 
          alt={deal.destinationCity}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Warm Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {(() => {
            const TypeIcon = TypeIcons[deal.type];
            return (
              <span className={`${typeColors[deal.type]} text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg`}>
                <TypeIcon className="w-3.5 h-3.5" />
                {deal.type.charAt(0).toUpperCase() + deal.type.slice(1)}
              </span>
            );
          })()}
          {deal.isHotDeal && (
            <span className="bg-gradient-to-r from-[#FF6B6B] to-[#E85555] text-white text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5 shadow-lg shadow-[#FF6B6B]/30">
              <Flame className="w-3.5 h-3.5" />
              Hot
            </span>
          )}
        </div>
        
        {/* Value Score */}
        <div className="absolute top-4 right-4">
          <ValueScoreBadge score={deal.valueScore} />
        </div>
        
        {/* Historic Low Badge */}
        {deal.isHistoricLow && (
          <div className="absolute bottom-4 left-4 bg-[#2D3436]/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-[#20B2AA]" />
            Historic Low!
          </div>
        )}
      </Link>
      
      {/* Content */}
      <div className="p-6">
        {/* Region Badge */}
        {(() => {
          const region = getRegionForCity(deal.destinationCity);
          return region ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8F0] text-[#2D3436]/70 text-xs rounded-full mb-3 font-medium">
              {region.emoji} {region.name}
            </span>
          ) : null;
        })()}
        
        {/* Route */}
        {deal.originCity && (
          <div className="text-sm text-[#2D3436]/50 mb-2 flex items-center gap-2">
            <span>{deal.originCity}</span>
            <span className="text-[#20B2AA]">→</span>
            <span className="font-medium text-[#2D3436]/80">{deal.destinationCity}</span>
          </div>
        )}
        
        {/* Title */}
        <Link href={`/deals/${deal.id}`}>
          <h3 className="font-bold text-lg text-[#2D3436] mb-2 line-clamp-2 group-hover:text-[#FF6B6B] transition-colors duration-300 cursor-pointer">
            {deal.title}
          </h3>
        </Link>
        
        {/* Description */}
        <p className="text-[#2D3436]/60 text-sm line-clamp-2 mb-4 leading-relaxed">
          {deal.description}
        </p>
        
        {/* Includes */}
        {deal.includes && deal.includes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {deal.includes.slice(0, 3).map((item, i) => (
              <span key={i} className="text-xs bg-[#20B2AA]/10 text-[#178F89] px-2.5 py-1 rounded-full font-medium">
                {item}
              </span>
            ))}
            {deal.includes.length > 3 && (
              <span className="text-xs text-[#2D3436]/40">+{deal.includes.length - 3} more</span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#2D3436]">
                ${deal.currentPrice.toLocaleString()}
              </span>
              {savings > 0 && (
                <span className="text-sm text-[#2D3436]/40 line-through">
                  ${deal.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {savings > 0 && deal.savingsPercent > 0 && (
              <div className="text-sm text-[#20B2AA] font-semibold mt-1">
                Save ${savings.toLocaleString()} ({deal.savingsPercent}% off) 🎉
              </div>
            )}
          </div>
          
          <a
            href={deal.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 text-sm hover:-translate-y-0.5"
          >
            View Deal →
          </a>
        </div>
        
        {/* Footer */}
        <div className="mt-5 pt-5 border-t border-[#FF6B6B]/10 flex items-center justify-between text-xs text-[#2D3436]/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-[#20B2AA] transition-colors cursor-default">
              <Eye className="w-3.5 h-3.5" />
              {deal.views.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 hover:text-[#FF6B6B] transition-colors cursor-default">
              <Heart className="w-3.5 h-3.5" />
              {deal.saves.toLocaleString()}
            </span>
          </div>
          <div>
            {deal.isExpiringSoon ? (
              <span className="text-[#FF6B6B] font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Expires soon!
              </span>
            ) : (
              <span className="text-[#2D3436]/40">via {deal.source}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-[#FF6B6B]/5 animate-pulse">
      <div className="h-52 bg-gradient-to-r from-[#FFF8F0] to-[#FFFAF5]" />
      <div className="p-6">
        <div className="h-5 bg-[#FFF8F0] rounded-full w-1/3 mb-4" />
        <div className="h-6 bg-[#FFF8F0] rounded-xl w-3/4 mb-3" />
        <div className="h-4 bg-[#FFF8F0] rounded-lg w-full mb-5" />
        <div className="flex gap-2 mb-5">
          <div className="h-6 bg-[#FFF8F0] rounded-full w-16" />
          <div className="h-6 bg-[#FFF8F0] rounded-full w-16" />
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="h-8 bg-[#FFF8F0] rounded-xl w-28 mb-2" />
            <div className="h-4 bg-[#FFF8F0] rounded-lg w-20" />
          </div>
          <div className="h-10 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FFA07A]/20 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}
