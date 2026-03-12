"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegionSelect } from './RegionSelect';
import { formatSearchTitle } from '@/lib/regions';
import { Search, ArrowLeftRight, MapPin, Plane } from 'lucide-react';

interface SearchBarProps {
  variant?: 'hero' | 'compact' | 'inline';
  initialFrom?: string;
  initialFromType?: 'city' | 'region';
  initialTo?: string;
  initialToType?: 'city' | 'region';
  onSearch?: (params: SearchParams) => void;
  className?: string;
}

interface SearchParams {
  from: string;
  fromType: 'city' | 'region';
  to: string;
  toType: 'city' | 'region';
}

export function SearchBar({
  variant = 'hero',
  initialFrom = '',
  initialFromType = 'region',
  initialTo = '',
  initialToType = 'region',
  onSearch,
  className = '',
}: SearchBarProps) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [fromType, setFromType] = useState<'city' | 'region'>(initialFromType);
  const [to, setTo] = useState(initialTo);
  const [toType, setToType] = useState<'city' | 'region'>(initialToType);

  const handleSearch = () => {
    // Build query params
    const params = new URLSearchParams();
    
    if (from) {
      if (fromType === 'region') {
        params.set('fromRegion', from);
      } else {
        params.set('from', from);
      }
    }
    
    if (to) {
      if (toType === 'region') {
        params.set('toRegion', to);
      } else {
        params.set('to', to);
      }
    }

    // Callback or navigate
    if (onSearch) {
      onSearch({ from, fromType, to, toType });
    } else {
      const queryString = params.toString();
      router.push(`/deals${queryString ? `?${queryString}` : ''}`);
    }
  };

  const handleFromChange = (value: string, type: 'city' | 'region') => {
    setFrom(value);
    setFromType(type);
  };

  const handleToChange = (value: string, type: 'city' | 'region') => {
    setTo(value);
    setToType(type);
  };

  // Swap origin and destination
  const handleSwap = () => {
    const tempVal = from;
    const tempType = fromType;
    setFrom(to);
    setFromType(toType);
    setTo(tempVal);
    setToType(tempType);
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <RegionSelect
          value={from}
          onChange={handleFromChange}
          placeholder="From..."
          className="flex-1"
        />
        <button
          onClick={handleSwap}
          className="p-2 hover:bg-[#FFF8F0] rounded-full transition-colors text-[#2D3436]/60 hover:text-[#FF6B6B]"
          title="Swap origin and destination"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>
        <RegionSelect
          value={to}
          onChange={handleToChange}
          placeholder="To..."
          className="flex-1"
        />
        <button
          onClick={handleSearch}
          className="px-5 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 whitespace-nowrap"
        >
          Search
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#2D3436]/50">From:</span>
          <RegionSelect
            value={from}
            onChange={handleFromChange}
            placeholder="Anywhere"
            className="min-w-[140px]"
          />
        </div>
        <button
          onClick={handleSwap}
          className="p-1.5 hover:bg-[#FFF8F0] rounded-full transition-colors text-[#2D3436]/40 hover:text-[#FF6B6B]"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-[#2D3436]/50">To:</span>
          <RegionSelect
            value={to}
            onChange={handleToChange}
            placeholder="Anywhere"
            className="min-w-[140px]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all duration-300"
        >
          Go
        </button>
      </div>
    );
  }

  // Hero variant (default)
  return (
    <div className={`bg-white rounded-3xl p-4 shadow-soft-lg border border-white/50 text-[#2D3436] ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Origin */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#2D3436]/50 mb-2 px-1 uppercase tracking-wide flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5" />
            From
          </label>
          <RegionSelect
            value={from}
            onChange={handleFromChange}
            placeholder="Where are you flying from?"
            showPopularCities={false}
          />
        </div>

        {/* Swap Button */}
        <div className="flex items-end pb-3 justify-center">
          <button
            onClick={handleSwap}
            className="p-3 bg-[#FFF8F0] hover:bg-[#FFEFE5] rounded-full transition-all duration-300 text-[#FF6B6B] hover:rotate-180"
            title="Swap origin and destination"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>
        </div>

        {/* Destination */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#2D3436]/50 mb-2 px-1 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            To
          </label>
          <RegionSelect
            value={to}
            onChange={handleToChange}
            placeholder="Where do you want to go?"
            showPopularCities={true}
          />
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-[#FF6B6B]/30 transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" />
            Search Deals
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-5 flex flex-wrap items-center gap-2 px-1">
        <span className="text-sm text-[#2D3436]/60 font-medium">Popular:</span>
        {[
          { from: 'us-west', to: 'asia-east', label: '🌴 West Coast → Asia' },
          { from: 'us-east', to: 'europe-west', label: '🗽 East Coast → Europe' },
          { from: '', to: 'asia-southeast', label: '🏝️ Southeast Asia' },
          { from: '', to: 'caribbean', label: '🌊 Caribbean' },
        ].map((route, i) => (
          <button
            key={i}
            onClick={() => {
              setFrom(route.from);
              setFromType('region');
              setTo(route.to);
              setToType('region');
            }}
            className="px-4 py-2 text-sm bg-white/90 text-[#2D3436] hover:bg-white hover:text-[#FF6B6B] rounded-full transition-all duration-300 font-medium shadow-sm"
          >
            {route.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Region Badge for deal cards
export function RegionBadge({ city, className = '' }: { city: string; className?: string }) {
  const { getRegionForCity } = require('@/lib/regions');
  const region = getRegionForCity(city);
  
  if (!region) return null;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF8F0] text-[#2D3436]/70 text-xs rounded-full font-medium ${className}`}>
      {region.emoji} {region.name}
    </span>
  );
}

// Search Results Header
export function SearchResultsHeader({
  fromCity,
  fromRegion,
  toCity,
  toRegion,
  resultCount,
  onClear,
}: {
  fromCity?: string;
  fromRegion?: string;
  toCity?: string;
  toRegion?: string;
  resultCount: number;
  onClear: () => void;
}) {
  const title = formatSearchTitle({
    fromCity,
    fromRegion,
    toCity,
    toRegion,
  });

  const hasFilters = fromCity || fromRegion || toCity || toRegion;

  if (!hasFilters) return null;

  return (
    <div className="bg-gradient-to-r from-[#FFF8F0] to-[#FFFAF5] rounded-2xl p-5 mb-6 flex items-center justify-between border border-[#FF6B6B]/10">
      <div>
        <h2 className="text-xl font-bold text-[#2D3436]">{title}</h2>
        <p className="text-sm text-[#2D3436]/60">
          {resultCount} {resultCount === 1 ? 'deal' : 'deals'} found
        </p>
      </div>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm text-[#2D3436]/60 hover:text-[#FF6B6B] hover:bg-white rounded-xl transition-all duration-300"
      >
        ✕ Clear search
      </button>
    </div>
  );
}
