"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RegionSelect } from './RegionSelect';
import { formatSearchTitle } from '@/lib/regions';

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
      <div className={`flex items-center gap-2 ${className}`}>
        <RegionSelect
          value={from}
          onChange={handleFromChange}
          placeholder="From..."
          className="flex-1"
        />
        <button
          onClick={handleSwap}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Swap origin and destination"
        >
          ⇄
        </button>
        <RegionSelect
          value={to}
          onChange={handleToChange}
          placeholder="To..."
          className="flex-1"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition whitespace-nowrap"
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
          <span className="text-gray-500">From:</span>
          <RegionSelect
            value={from}
            onChange={handleFromChange}
            placeholder="Anywhere"
            className="min-w-[140px]"
          />
        </div>
        <button
          onClick={handleSwap}
          className="p-1 hover:bg-gray-100 rounded transition text-gray-400"
        >
          ⇄
        </button>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-500">To:</span>
          <RegionSelect
            value={to}
            onChange={handleToChange}
            placeholder="Anywhere"
            className="min-w-[140px]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Go
        </button>
      </div>
    );
  }

  // Hero variant (default)
  return (
    <div className={`bg-white rounded-2xl p-3 shadow-xl ${className}`}>
      <div className="flex flex-col md:flex-row gap-3">
        {/* Origin */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 px-1">
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
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
            title="Swap origin and destination"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Destination */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 px-1">
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
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Deals
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-4 flex flex-wrap items-center gap-2 px-1">
        <span className="text-sm text-gray-500">Popular:</span>
        {[
          { from: 'us-west', to: 'asia-east', label: 'West Coast → Asia' },
          { from: 'us-east', to: 'europe-west', label: 'East Coast → Europe' },
          { from: '', to: 'asia-southeast', label: 'Southeast Asia' },
          { from: '', to: 'caribbean', label: 'Caribbean' },
        ].map((route, i) => (
          <button
            key={i}
            onClick={() => {
              setFrom(route.from);
              setFromType('region');
              setTo(route.to);
              setToType('region');
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-full transition"
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full ${className}`}>
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">
          {resultCount} {resultCount === 1 ? 'deal' : 'deals'} found
        </p>
      </div>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-white rounded-lg transition"
      >
        ✕ Clear search
      </button>
    </div>
  );
}
