"use client";

import Link from "next/link";
import { City } from "@/lib/types";

export function CityCard({ city }: { city: City }) {
  const slug = city.slug || city.code.toLowerCase();
  return (
    <Link 
      href={`/cities/${slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-[4/3] block"
    >
      {/* Background Image */}
      <img 
        src={city.imageUrl} 
        alt={city.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
            <p className="text-white/70 text-sm">{city.country}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{city.dealCount}</div>
            <div className="text-white/70 text-sm">deals</div>
          </div>
        </div>
        
        {/* Savings Badge */}
        <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-green-500/90 rounded-full text-white text-sm font-medium">
          <span>💰</span>
          <span>Avg {city.avgSavings}% off</span>
        </div>
      </div>
      
      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <img 
        src={city.imageUrl} 
        alt={city.name}
        className="w-14 h-14 rounded-xl object-cover"
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {city.name}
        </h4>
        <p className="text-sm text-gray-500">{city.dealCount} deals available</p>
      </div>
      <div className="text-green-600 font-semibold text-sm">
        {city.avgSavings}% off
      </div>
    </Link>
  );
}
