// Region definitions for travel search
// Maps cities to geographic regions for flexible searching

export interface Region {
  id: string;
  name: string;
  nameZh: string;
  cities: string[];
  emoji: string;
}

export const regions: Record<string, Region> = {
  // North America
  'us-west': {
    id: 'us-west',
    name: 'US West Coast',
    nameZh: '美西',
    emoji: '🌴',
    cities: ['Los Angeles', 'San Francisco', 'Seattle', 'Portland', 'San Diego', 'Las Vegas', 'Phoenix', 'LAX', 'SFO', 'SEA', 'PDX', 'SAN', 'LAS', 'PHX']
  },
  'us-east': {
    id: 'us-east',
    name: 'US East Coast',
    nameZh: '美东',
    emoji: '🗽',
    cities: ['New York', 'Boston', 'Washington', 'Miami', 'Philadelphia', 'Atlanta', 'JFK', 'EWR', 'BOS', 'DCA', 'IAD', 'MIA', 'PHL', 'ATL']
  },
  'us-midwest': {
    id: 'us-midwest',
    name: 'US Midwest',
    nameZh: '美中',
    emoji: '🌾',
    cities: ['Chicago', 'Detroit', 'Minneapolis', 'Denver', 'Dallas', 'Houston', 'ORD', 'DTW', 'MSP', 'DEN', 'DFW', 'IAH']
  },
  'canada': {
    id: 'canada',
    name: 'Canada',
    nameZh: '加拿大',
    emoji: '🍁',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'YYZ', 'YVR', 'YUL', 'YYC']
  },
  
  // Europe
  'europe-west': {
    id: 'europe-west',
    name: 'Western Europe',
    nameZh: '西欧',
    emoji: '🗼',
    cities: ['London', 'Paris', 'Amsterdam', 'Brussels', 'Dublin', 'LHR', 'CDG', 'AMS', 'BRU', 'DUB']
  },
  'europe-south': {
    id: 'europe-south',
    name: 'Southern Europe',
    nameZh: '南欧',
    emoji: '🏛️',
    cities: ['Rome', 'Milan', 'Barcelona', 'Madrid', 'Lisbon', 'Athens', 'FCO', 'MXP', 'BCN', 'MAD', 'LIS', 'ATH']
  },
  'europe-central': {
    id: 'europe-central',
    name: 'Central Europe',
    nameZh: '中欧',
    emoji: '🏰',
    cities: ['Berlin', 'Munich', 'Vienna', 'Prague', 'Zurich', 'Frankfurt', 'BER', 'MUC', 'VIE', 'PRG', 'ZRH', 'FRA']
  },
  'europe-north': {
    id: 'europe-north',
    name: 'Northern Europe',
    nameZh: '北欧',
    emoji: '❄️',
    cities: ['Stockholm', 'Copenhagen', 'Oslo', 'Helsinki', 'Reykjavik', 'ARN', 'CPH', 'OSL', 'HEL', 'KEF']
  },
  
  // Asia
  'asia-east': {
    id: 'asia-east',
    name: 'East Asia',
    nameZh: '东亚',
    emoji: '🏯',
    cities: ['Tokyo', 'Seoul', 'Beijing', 'Shanghai', 'Hong Kong', 'Taipei', 'Osaka', 'NRT', 'HND', 'ICN', 'PEK', 'PVG', 'HKG', 'TPE', 'KIX']
  },
  'asia-southeast': {
    id: 'asia-southeast',
    name: 'Southeast Asia',
    nameZh: '东南亚',
    emoji: '🌺',
    cities: ['Bangkok', 'Singapore', 'Bali', 'Ho Chi Minh', 'Manila', 'Kuala Lumpur', 'Phuket', 'BKK', 'SIN', 'DPS', 'SGN', 'MNL', 'KUL', 'HKT']
  },
  'asia-south': {
    id: 'asia-south',
    name: 'South Asia',
    nameZh: '南亚',
    emoji: '🕌',
    cities: ['New Delhi', 'Mumbai', 'Colombo', 'Kathmandu', 'DEL', 'BOM', 'CMB', 'KTM']
  },
  
  // Oceania
  'oceania': {
    id: 'oceania',
    name: 'Oceania',
    nameZh: '大洋洲',
    emoji: '🦘',
    cities: ['Sydney', 'Melbourne', 'Auckland', 'Fiji', 'Brisbane', 'SYD', 'MEL', 'AKL', 'NAN', 'BNE']
  },
  
  // Americas
  'latin-america': {
    id: 'latin-america',
    name: 'Latin America',
    nameZh: '拉美',
    emoji: '🌮',
    cities: ['Mexico City', 'Cancun', 'Lima', 'Buenos Aires', 'Rio de Janeiro', 'Bogota', 'Sao Paulo', 'MEX', 'CUN', 'LIM', 'EZE', 'GIG', 'BOG', 'GRU']
  },
  'caribbean': {
    id: 'caribbean',
    name: 'Caribbean',
    nameZh: '加勒比',
    emoji: '🏝️',
    cities: ['San Juan', 'Punta Cana', 'Nassau', 'Montego Bay', 'Aruba', 'SJU', 'PUJ', 'NAS', 'MBJ', 'AUA']
  },
  
  // Middle East & Africa
  'middle-east': {
    id: 'middle-east',
    name: 'Middle East',
    nameZh: '中东',
    emoji: '🐪',
    cities: ['Dubai', 'Tel Aviv', 'Istanbul', 'Doha', 'Abu Dhabi', 'DXB', 'TLV', 'IST', 'DOH', 'AUH']
  },
  'africa': {
    id: 'africa',
    name: 'Africa',
    nameZh: '非洲',
    emoji: '🦁',
    cities: ['Cape Town', 'Nairobi', 'Marrakech', 'Cairo', 'Johannesburg', 'CPT', 'NBO', 'RAK', 'CAI', 'JNB']
  },
  
  // Hawaii & Pacific Islands
  'hawaii': {
    id: 'hawaii',
    name: 'Hawaii',
    nameZh: '夏威夷',
    emoji: '🌺',
    cities: ['Honolulu', 'Maui', 'Kona', 'Kauai', 'HNL', 'OGG', 'KOA', 'LIH']
  },
};

// Get all region options for dropdowns
export function getRegionOptions(): { value: string; label: string; emoji: string }[] {
  return Object.values(regions).map(region => ({
    value: region.id,
    label: region.name,
    emoji: region.emoji,
  }));
}

// Get region by ID
export function getRegion(id: string): Region | undefined {
  return regions[id];
}

// Get region for a city (returns first matching region)
export function getRegionForCity(city: string): Region | undefined {
  const cityLower = city.toLowerCase();
  for (const region of Object.values(regions)) {
    if (region.cities.some(c => c.toLowerCase() === cityLower)) {
      return region;
    }
  }
  return undefined;
}

// Check if a city belongs to a region
export function cityInRegion(city: string, regionId: string): boolean {
  const region = regions[regionId];
  if (!region) return false;
  
  const cityLower = city.toLowerCase();
  return region.cities.some(c => c.toLowerCase() === cityLower);
}

// Get all cities in a region
export function getCitiesInRegion(regionId: string): string[] {
  const region = regions[regionId];
  return region?.cities || [];
}

// Get all cities across all regions (deduplicated main city names, not codes)
export function getAllCities(): string[] {
  const citySet = new Set<string>();
  for (const region of Object.values(regions)) {
    for (const city of region.cities) {
      // Only add if it's a city name (not an airport code - 3 uppercase letters)
      if (!/^[A-Z]{3}$/.test(city)) {
        citySet.add(city);
      }
    }
  }
  return Array.from(citySet).sort();
}

// Get popular cities for quick selection
export function getPopularCities(): { city: string; region: string; emoji: string }[] {
  return [
    { city: 'Tokyo', region: 'asia-east', emoji: '🗼' },
    { city: 'Paris', region: 'europe-west', emoji: '🗼' },
    { city: 'London', region: 'europe-west', emoji: '🎡' },
    { city: 'Bali', region: 'asia-southeast', emoji: '🌴' },
    { city: 'Rome', region: 'europe-south', emoji: '🏛️' },
    { city: 'Bangkok', region: 'asia-southeast', emoji: '🛕' },
    { city: 'Barcelona', region: 'europe-south', emoji: '⛪' },
    { city: 'New York', region: 'us-east', emoji: '🗽' },
    { city: 'Sydney', region: 'oceania', emoji: '🦘' },
    { city: 'Dubai', region: 'middle-east', emoji: '🏙️' },
    { city: 'Cancun', region: 'latin-america', emoji: '🏖️' },
    { city: 'Hawaii', region: 'hawaii', emoji: '🌺' },
  ];
}

// Format region display name with emoji
export function formatRegionDisplay(regionId: string, includeEmoji = true): string {
  const region = regions[regionId];
  if (!region) return regionId;
  return includeEmoji ? `${region.emoji} ${region.name}` : region.name;
}

// Format search title (e.g., "US West Coast → East Asia")
export function formatSearchTitle(options: {
  fromCity?: string;
  fromRegion?: string;
  toCity?: string;
  toRegion?: string;
}): string {
  const parts: string[] = [];
  
  // Origin
  if (options.fromCity) {
    parts.push(options.fromCity);
  } else if (options.fromRegion) {
    const region = regions[options.fromRegion];
    parts.push(region ? `${region.emoji} ${region.name}` : options.fromRegion);
  } else {
    parts.push('Anywhere');
  }
  
  parts.push('→');
  
  // Destination
  if (options.toCity) {
    parts.push(options.toCity);
  } else if (options.toRegion) {
    const region = regions[options.toRegion];
    parts.push(region ? `${region.emoji} ${region.name}` : options.toRegion);
  } else {
    parts.push('Anywhere');
  }
  
  return parts.join(' ');
}
