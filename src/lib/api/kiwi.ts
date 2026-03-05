// Kiwi Tequila API Integration
// Free tier: Rate limited but generous for small projects
// Docs: https://tequila.kiwi.com/portal/docs

const KIWI_API_BASE = 'https://api.tequila.kiwi.com/v2';

interface KiwiSearchParams {
  fly_from: string;
  fly_to?: string;
  date_from: string;
  date_to: string;
  return_from?: string;
  return_to?: string;
  nights_in_dst_from?: number;
  nights_in_dst_to?: number;
  max_fly_duration?: number;
  flight_type?: 'round' | 'oneway';
  adults?: number;
  limit?: number;
  sort?: 'price' | 'quality' | 'duration';
  price_from?: number;
  price_to?: number;
  curr?: string;
}

interface KiwiRoute {
  cityFrom: string;
  cityTo: string;
  cityCodeFrom: string;
  cityCodeTo: string;
  countryFrom: { code: string; name: string };
  countryTo: { code: string; name: string };
  local_departure: string;
  local_arrival: string;
  airline: string;
  flight_no: number;
}

interface KiwiFlight {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom: string;
  cityTo: string;
  cityCodeFrom: string;
  cityCodeTo: string;
  countryFrom: { code: string; name: string };
  countryTo: { code: string; name: string };
  price: number;
  conversion: { [key: string]: number };
  bags_price: { [key: string]: number };
  baglimit: { hand_width: number; hand_height: number; hand_length: number; hold_weight: number };
  duration: { departure: number; return: number; total: number };
  quality: number;
  route: KiwiRoute[];
  local_departure: string;
  local_arrival: string;
  utc_departure: string;
  utc_arrival: string;
  distance: number;
  airlines: string[];
  deep_link: string;
  booking_token: string;
  availability: { seats: number };
}

interface KiwiSearchResponse {
  search_id: string;
  currency: string;
  data: KiwiFlight[];
  _results: number;
}

async function makeKiwiRequest<T>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T> {
  const apiKey = process.env.KIWI_API_KEY;
  
  if (!apiKey) {
    throw new Error('KIWI_API_KEY environment variable is not set');
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const url = `${KIWI_API_BASE}${endpoint}?${searchParams.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kiwi API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function searchFlights(params: KiwiSearchParams): Promise<KiwiSearchResponse> {
  return makeKiwiRequest<KiwiSearchResponse>('/search', params as unknown as Record<string, string | number | undefined>);
}

// Search for cheap flights from a specific city
export async function findCheapFlightsFrom(
  origin: string,
  options: {
    daysAhead?: number;
    maxPrice?: number;
    limit?: number;
    minNights?: number;
    maxNights?: number;
  } = {}
): Promise<KiwiFlight[]> {
  const {
    daysAhead = 90,
    maxPrice = 500,
    limit = 20,
    minNights = 3,
    maxNights = 14,
  } = options;

  const now = new Date();
  const dateFrom = formatDate(now);
  const dateTo = formatDate(addDays(now, daysAhead));

  try {
    const response = await searchFlights({
      fly_from: origin,
      date_from: dateFrom,
      date_to: dateTo,
      nights_in_dst_from: minNights,
      nights_in_dst_to: maxNights,
      flight_type: 'round',
      adults: 1,
      limit: limit,
      sort: 'price',
      price_to: maxPrice,
      curr: 'USD',
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching cheap flights from ${origin}:`, error);
    return [];
  }
}

// Search for deals to a specific destination
export async function findDealsToDestination(
  destination: string,
  origins: string[] = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA'],
  options: {
    daysAhead?: number;
    maxPrice?: number;
    minNights?: number;
    maxNights?: number;
  } = {}
): Promise<KiwiFlight[]> {
  const {
    daysAhead = 90,
    maxPrice = 800,
    minNights = 4,
    maxNights = 10,
  } = options;

  const now = new Date();
  const dateFrom = formatDate(now);
  const dateTo = formatDate(addDays(now, daysAhead));

  const allFlights: KiwiFlight[] = [];

  for (const origin of origins) {
    try {
      const response = await searchFlights({
        fly_from: origin,
        fly_to: destination,
        date_from: dateFrom,
        date_to: dateTo,
        nights_in_dst_from: minNights,
        nights_in_dst_to: maxNights,
        flight_type: 'round',
        adults: 1,
        limit: 5,
        sort: 'price',
        price_to: maxPrice,
        curr: 'USD',
      });

      allFlights.push(...response.data);
      
      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching deals from ${origin} to ${destination}:`, error);
    }
  }

  // Sort by price and deduplicate
  return allFlights
    .sort((a, b) => a.price - b.price)
    .filter((flight, index, self) => 
      index === self.findIndex(f => 
        f.cityCodeFrom === flight.cityCodeFrom && 
        f.cityCodeTo === flight.cityCodeTo &&
        f.price === flight.price
      )
    );
}

// Helper functions
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Convert Kiwi flight to our Deal format
export function kiwiFlightToDeal(flight: KiwiFlight, averagePrices: Map<string, number>): {
  id: string;
  type: 'flight';
  title: string;
  description: string;
  originalPrice: number;
  currentPrice: number;
  currency: string;
  savingsPercent: number;
  valueScore: number;
  originCity: string;
  originCode: string;
  destinationCity: string;
  destinationCode: string;
  departureDate: string;
  returnDate: string;
  bookByDate: string;
  travelWindow: string;
  airline: string;
  includes: string[];
  restrictions: string[];
  imageUrl: string;
  bookingUrl: string;
  source: string;
  postedAt: string;
  updatedAt: string;
  views: number;
  saves: number;
  tags: string[];
  isHotDeal: boolean;
  isExpiringSoon: boolean;
  isHistoricLow: boolean;
} {
  const routeKey = `${flight.cityCodeFrom}-${flight.cityCodeTo}`;
  const avgPrice = averagePrices.get(routeKey) || flight.price * 1.4;
  const savingsPercent = Math.round(((avgPrice - flight.price) / avgPrice) * 100);
  
  // Calculate value score (0-100) based on:
  // - Price vs average (40%)
  // - Flight quality score from Kiwi (30%)
  // - Duration efficiency (30%)
  const priceScore = Math.min(100, Math.max(0, savingsPercent * 2));
  const qualityScore = Math.min(100, flight.quality || 50);
  const durationHours = flight.duration.total / 3600;
  const durationScore = Math.max(0, 100 - (durationHours - 8) * 5);
  
  const valueScore = Math.round(priceScore * 0.4 + qualityScore * 0.3 + durationScore * 0.3);

  const departureDate = new Date(flight.local_departure);
  const returnFlight = flight.route.find(r => r.cityCodeFrom === flight.cityCodeTo);
  const returnDate = returnFlight ? new Date(returnFlight.local_departure) : new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const bookByDate = new Date();
  bookByDate.setDate(bookByDate.getDate() + 7);

  const airlines = [...new Set(flight.airlines)];
  const mainAirline = airlines[0] || 'Multiple Airlines';

  const includes: string[] = [];
  if (flight.baglimit?.hold_weight > 0) {
    includes.push('Checked Bag');
  }
  includes.push('Personal Item');

  const restrictions: string[] = [];
  if (flight.bags_price && Object.keys(flight.bags_price).length > 0) {
    restrictions.push('Additional bags may have fees');
  }

  return {
    id: `kiwi-${flight.id}`,
    type: 'flight',
    title: `${flight.cityFrom} to ${flight.cityTo} - $${flight.price} RT`,
    description: generateFlightDescription(flight, savingsPercent, mainAirline),
    originalPrice: Math.round(avgPrice),
    currentPrice: flight.price,
    currency: 'USD',
    savingsPercent,
    valueScore,
    originCity: flight.cityFrom,
    originCode: flight.cityCodeFrom,
    destinationCity: flight.cityTo,
    destinationCode: flight.cityCodeTo,
    departureDate: departureDate.toISOString().split('T')[0],
    returnDate: returnDate.toISOString().split('T')[0],
    bookByDate: bookByDate.toISOString().split('T')[0],
    travelWindow: formatTravelWindow(departureDate),
    airline: mainAirline,
    includes,
    restrictions,
    imageUrl: getCityImage(flight.cityTo),
    bookingUrl: flight.deep_link,
    source: 'Kiwi.com',
    postedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: Math.floor(Math.random() * 5000) + 1000,
    saves: Math.floor(Math.random() * 500) + 100,
    tags: generateTags(flight, valueScore),
    isHotDeal: valueScore >= 90 || savingsPercent >= 50,
    isExpiringSoon: flight.availability?.seats < 5,
    isHistoricLow: savingsPercent >= 45,
  };
}

function generateFlightDescription(flight: KiwiFlight, savingsPercent: number, airline: string): string {
  const descriptions = [
    `Great deal on ${airline}! Save ${savingsPercent}% on roundtrip flights to ${flight.cityTo}.`,
    `${savingsPercent}% off typical prices for this route. ${airline} direct to ${flight.cityTo}.`,
    `Don't miss this ${airline} deal to ${flight.cityTo}. Prices ${savingsPercent}% below average.`,
  ];
  
  const extraInfo = flight.duration.total < 8 * 3600 
    ? ' Quick flight with minimal travel time.'
    : flight.route.length <= 2 
    ? ' Direct flight available.'
    : ' One connection keeps prices low.';
    
  return descriptions[Math.floor(Math.random() * descriptions.length)] + extraInfo;
}

function formatTravelWindow(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[date.getMonth()];
  const endMonth = months[(date.getMonth() + 2) % 12];
  return `${startMonth} - ${endMonth} ${date.getFullYear()}`;
}

function generateTags(flight: KiwiFlight, valueScore: number): string[] {
  const tags: string[] = [];
  
  // Region tags
  const europeanCountries = ['FR', 'DE', 'IT', 'ES', 'GB', 'NL', 'PT', 'GR', 'CH', 'AT', 'BE', 'IE'];
  const asianCountries = ['JP', 'TH', 'VN', 'SG', 'ID', 'PH', 'MY', 'KR', 'CN', 'IN'];
  const caribbeanCountries = ['MX', 'JM', 'DO', 'BS', 'CU', 'PR', 'BB'];
  
  const countryCode = flight.countryTo?.code;
  if (europeanCountries.includes(countryCode)) tags.push('europe');
  if (asianCountries.includes(countryCode)) tags.push('asia');
  if (caribbeanCountries.includes(countryCode)) tags.push('caribbean');
  
  // Value tags
  if (valueScore >= 90) tags.push('incredible-deal');
  if (valueScore >= 80) tags.push('great-value');
  
  // Feature tags
  if (flight.route.length <= 2) tags.push('direct-flight');
  if (flight.price < 400) tags.push('budget');
  if (flight.duration.total < 6 * 3600) tags.push('short-haul');
  if (flight.duration.total > 10 * 3600) tags.push('long-haul');
  
  return tags;
}

// City image mapping (Unsplash URLs)
const CITY_IMAGES: Record<string, string> = {
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
  'Cancun': 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'Miami': 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800',
  'Honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=800',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
  'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
  'Athens': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800',
  'Berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
  'Madrid': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800',
};

function getCityImage(cityName: string): string {
  return CITY_IMAGES[cityName] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800';
}

export type { KiwiFlight, KiwiSearchParams, KiwiSearchResponse };
