"use client";

import { useState, useRef, useEffect } from 'react';
import { regions, getAllCities, getPopularCities, getRegionForCity } from '@/lib/regions';
import { Globe, Building } from "lucide-react";

interface RegionSelectProps {
  value: string;
  onChange: (value: string, type: 'city' | 'region') => void;
  placeholder?: string;
  label?: string;
  showPopularCities?: boolean;
  className?: string;
}

export function RegionSelect({
  value,
  onChange,
  placeholder = "Select destination",
  label,
  showPopularCities = true,
  className = "",
}: RegionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'regions' | 'cities'>('regions');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display value
  const getDisplayValue = () => {
    if (!value) return '';
    // Check if it's a region
    if (regions[value]) {
      return `${regions[value].emoji} ${regions[value].name}`;
    }
    // Check if it's a city - get its region emoji
    const region = getRegionForCity(value);
    return region ? `${region.emoji} ${value}` : value;
  };

  // Filter regions based on search
  const filteredRegions = Object.values(regions).filter(region =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.nameZh.includes(searchQuery) ||
    region.cities.some(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter cities based on search
  const allCities = getAllCities();
  const filteredCities = searchQuery
    ? allCities.filter(city => city.toLowerCase().includes(searchQuery.toLowerCase()))
    : allCities.slice(0, 20); // Show first 20 if no search

  const popularCities = getPopularCities();

  const handleSelect = (val: string, type: 'city' | 'region') => {
    onChange(val, type);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Input Field */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className="relative cursor-pointer"
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : getDisplayValue()}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-[400px] flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            <button
              onClick={() => setActiveTab('regions')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                activeTab === 'regions'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Regions
            </button>
            <button
              onClick={() => setActiveTab('cities')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition flex items-center justify-center gap-1.5 ${
                activeTab === 'cities'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" />
              Cities
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">
            {activeTab === 'regions' ? (
              <div className="p-2">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map(region => (
                    <button
                      key={region.id}
                      onClick={() => handleSelect(region.id, 'region')}
                      className={`w-full text-left px-3 py-2.5 rounded-lg hover:bg-blue-50 transition flex items-center gap-3 ${
                        value === region.id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="text-xl">{region.emoji}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{region.name}</div>
                        <div className="text-xs text-gray-500">
                          {region.cities.filter(c => !/^[A-Z]{3}$/.test(c)).slice(0, 4).join(', ')}...
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">No regions found</div>
                )}
              </div>
            ) : (
              <div className="p-2">
                {/* Popular Cities */}
                {showPopularCities && !searchQuery && (
                  <div className="mb-3">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Popular Destinations
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {popularCities.map(({ city, emoji }) => (
                        <button
                          key={city}
                          onClick={() => handleSelect(city, 'city')}
                          className={`text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition text-sm ${
                            value === city ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          {emoji} {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Cities or Search Results */}
                <div>
                  {searchQuery && (
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Search Results
                    </div>
                  )}
                  {filteredCities.length > 0 ? (
                    filteredCities.map(city => {
                      const region = getRegionForCity(city);
                      return (
                        <button
                          key={city}
                          onClick={() => handleSelect(city, 'city')}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition flex items-center justify-between ${
                            value === city ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span>
                            {region?.emoji} {city}
                          </span>
                          <span className="text-xs text-gray-400">{region?.name}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">No cities found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Clear Button */}
          {value && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  onChange('', 'city');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function RegionSelectCompact({
  value,
  onChange,
  placeholder = "Anywhere",
  className = "",
}: Omit<RegionSelectProps, 'label' | 'showPopularCities'>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayValue = () => {
    if (!value) return placeholder;
    if (regions[value]) {
      return `${regions[value].emoji} ${regions[value].name}`;
    }
    const region = getRegionForCity(value);
    return region ? `${region.emoji} ${value}` : value;
  };

  const regionGroups = [
    { label: 'Americas', ids: ['us-west', 'us-east', 'us-midwest', 'canada', 'latin-america', 'caribbean', 'hawaii'] },
    { label: 'Europe', ids: ['europe-west', 'europe-south', 'europe-central', 'europe-north'] },
    { label: 'Asia & Pacific', ids: ['asia-east', 'asia-southeast', 'asia-south', 'oceania'] },
    { label: 'Middle East & Africa', ids: ['middle-east', 'africa'] },
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700"
      >
        <span>{getDisplayValue()}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-[100] left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="max-h-[350px] overflow-y-auto p-2">
            {/* Anywhere option */}
            <button
              onClick={() => { onChange('', 'region'); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition ${
                !value ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              🌍 Anywhere
            </button>
            
            <div className="h-px bg-gray-100 my-2" />
            
            {regionGroups.map(group => (
              <div key={group.label} className="mb-2">
                <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {group.label}
                </div>
                {group.ids.map(id => {
                  const region = regions[id];
                  if (!region) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => { onChange(id, 'region'); setIsOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition text-sm ${
                        value === id ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      {region.emoji} {region.name}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
