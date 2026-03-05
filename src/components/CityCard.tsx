"use client";

import Link from "next/link";
import { City } from "@/lib/types";
import { MapPin, Sparkles } from "lucide-react";

export function CityCard({ city }: { city: City }) {
  const slug = city.slug || city.code.toLowerCase();
  return (
    <Link 
      href={`/cities/${slug}`}
      className="group relative rounded-3xl overflow-hidden aspect-[4/3] block shadow-soft hover:shadow-soft-lg transition-all duration-500 hover:-translate-y-1"
    >
      {/* Background Image */}
      <img 
        src={city.imageUrl} 
        alt={city.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      
      {/* Warm Sunset Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2D3436] via-[#2D3436]/30 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
      
      {/* Top Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B6B] via-[#FFA07A] to-[#FFD93D] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#FFD93D] transition-colors duration-300">
              {city.name}
            </h3>
            <p className="text-white/60 text-sm flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {city.country}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{city.dealCount}</div>
            <div className="text-white/60 text-sm">deals</div>
          </div>
        </div>
        
        {/* Savings Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#20B2AA] to-[#48D1CC] rounded-full text-white text-sm font-semibold shadow-lg shadow-[#20B2AA]/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Avg {city.avgSavings}% off</span>
        </div>
      </div>
      
      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-[#FF6B6B]">
        <span className="text-white text-lg">→</span>
      </div>
    </Link>
  );
}

export function CityCardSmall({ city }: { city: City }) {
  const slug = city.slug || city.code.toLowerCase();
  return (
    <Link 
      href={`/cities/${slug}`}
      className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-[#FFF8F0] transition-all duration-300 border border-transparent hover:border-[#FF6B6B]/10"
    >
      <img 
        src={city.imageUrl} 
        alt={city.name}
        className="w-14 h-14 rounded-2xl object-cover shadow-soft group-hover:shadow-warm transition-all duration-300"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[#2D3436] group-hover:text-[#FF6B6B] transition-colors duration-300">
          {city.name}
        </h4>
        <p className="text-sm text-[#2D3436]/50">{city.dealCount} deals available</p>
      </div>
      <div className="text-[#20B2AA] font-bold text-sm bg-[#20B2AA]/10 px-3 py-1 rounded-full">
        {city.avgSavings}% off
      </div>
    </Link>
  );
}
