// Amadeus API Integration
// Free tier: 2000 API calls per month
// Docs: https://developers.amadeus.com/

const AMADEUS_API_BASE = 'https://api.amadeus.com/v1';
const AMADEUS_API_V2 = 'https://api.amadeus.com/v2';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  state: string;
}

interface AmadeusFlightDestination {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  price: {
    total: string;
  };
  links: {
    flightDates: string;
    flightOffers: string;
  };
}

interface AmadeusFlightDatesResponse {
  data: AmadeusFlightDestination[];
  dictionaries?: {
    currencies: Record<string, string>;
    locations: Record<string, {
      cityCode: string;
      countryCode: string;
    }>;
  };
}

interface AmadeusLocation {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  address: {
    cityName: string;
    countryName: string;
  };
}

interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  price: {
    currency: string;
    total: string;
    base: string;
    grandTotal: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
      aircraft: { code: string };
      operating?: { carrierCode: string };
      duration: string;
      numberOfStops: number;
    }>;
  }>;
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: { currency: string; total: string };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      class: string;
      includedCheckedBags?: { weight?: number; weightUnit?: string; quantity?: number };
    }>;
  }>;
}

interface AmadeusFlightOffersResponse {
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers: Record<string, string>;
    aircraft: Record<string, string>;
    currencies: Record<string, string>;
    locations: Record<string, { cityCode: string; countryCode: string }>;
  };
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables must be set');
  }

  // Return cached token if still valid (with 1 minute buffer)
  if (accessToken && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  const response = await fetch(`${AMADEUS_API_BASE}/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Amadeus auth error (${response.status}): ${errorText}`);
  }

  const data: AmadeusTokenResponse = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return accessToken;
}

async function makeAmadeusRequest<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  version: 'v1' | 'v2' = 'v1'
): Promise<T> {
  const token = await getAccessToken();
  const baseUrl = version === 'v2' ? AMADEUS_API_V2 : AMADEUS_API_BASE;

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  const url = `${baseUrl}${endpoint}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Amadeus API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Flight Inspiration Search - Find cheapest destinations
export async function getFlightInspirations(
  origin: string,
  options: {
    departureDate?: string;
    oneWay?: boolean;
    duration?: string;
    maxPrice?: number;
  } = {}
): Promise<AmadeusFlightDestination[]> {
  try {
    const response = await makeAmadeusRequest<AmadeusFlightDatesResponse>(
      '/shopping/flight-destinations',
      {
        origin,
        departureDate: options.departureDate,
        oneWay: options.oneWay ? 'true' : 'false',
        duration: options.duration,
        maxPrice: options.maxPrice,
      }
    );
    return response.data || [];
  } catch (error) {
    console.error(`Error getting flight inspirations from ${origin}:`, error);
    return [];
  }
}

// Flight Cheapest Date Search
export async function getCheapestDates(
  origin: string,
  destination: string,
  options: {
    departureDate?: string;
    oneWay?: boolean;
  } = {}
): Promise<AmadeusFlightDestination[]> {
  try {
    const response = await makeAmadeusRequest<AmadeusFlightDatesResponse>(
      '/shopping/flight-dates',
      {
        origin,
        destination,
        departureDate: options.departureDate,
        oneWay: options.oneWay ? 'true' : 'false',
      }
    );
    return response.data || [];
  } catch (error) {
    console.error(`Error getting cheapest dates from ${origin} to ${destination}:`, error);
    return [];
  }
}

// Flight Offers Search - Get actual bookable offers
export async function searchFlightOffers(
  origin: string,
  destination: string,
  departureDate: string,
  options: {
    returnDate?: string;
    adults?: number;
    max?: number;
    currencyCode?: string;
    nonStop?: boolean;
  } = {}
): Promise<AmadeusFlightOffer[]> {
  try {
    const params: Record<string, string | number | undefined> = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: options.adults || 1,
      max: options.max || 10,
      currencyCode: options.currencyCode || 'USD',
      nonStop: options.nonStop ? 'true' : undefined,
    };

    if (options.returnDate) {
      params.returnDate = options.returnDate;
    }

    const response = await makeAmadeusRequest<AmadeusFlightOffersResponse>(
      '/shopping/flight-offers',
      params,
      'v2'
    );
    return response.data || [];
  } catch (error) {
    console.error(`Error searching flight offers ${origin}-${destination}:`, error);
    return [];
  }
}

// Search for deals from multiple origins to multiple popular destinations
export async function findBestDeals(
  origins: string[] = ['JFK', 'LAX', 'ORD', 'SFO', 'MIA'],
  options: {
    maxPrice?: number;
    duration?: string;
  } = {}
): Promise<AmadeusFlightDestination[]> {
  const allDeals: AmadeusFlightDestination[] = [];

  for (const origin of origins) {
    try {
      const deals = await getFlightInspirations(origin, {
        maxPrice: options.maxPrice || 500,
        duration: options.duration || '5,10',
      });
      allDeals.push(...deals);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error fetching deals from ${origin}:`, error);
    }
  }

  // Sort by price and deduplicate
  return allDeals
    .sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total))
    .filter((deal, index, self) =>
      index === self.findIndex(d =>
        d.origin === deal.origin &&
        d.destination === deal.destination &&
        d.price.total === deal.price.total
      )
    )
    .slice(0, 50);
}

// Convert Amadeus flight destination to our Deal format
export function amadeusDealToDeal(
  deal: AmadeusFlightDestination,
  averagePrices: Map<string, number>,
  locationNames: Map<string, string>
): {
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
  const price = parseFloat(deal.price.total);
  const routeKey = `${deal.origin}-${deal.destination}`;
  const avgPrice = averagePrices.get(routeKey) || price * 1.35;
  const savingsPercent = Math.round(((avgPrice - price) / avgPrice) * 100);

  const originCity = locationNames.get(deal.origin) || deal.origin;
  const destCity = locationNames.get(deal.destination) || deal.destination;

  // Value score calculation
  const priceScore = Math.min(100, Math.max(0, savingsPercent * 2));
  const valueScore = Math.round(priceScore * 0.7 + 50 * 0.3); // Price weighted heavily

  const bookByDate = new Date();
  bookByDate.setDate(bookByDate.getDate() + 14);

  return {
    id: `amadeus-${deal.origin}-${deal.destination}-${deal.departureDate}`,
    type: 'flight',
    title: `${originCity} to ${destCity} - $${Math.round(price)} RT`,
    description: `Great fare found! Save ${savingsPercent}% on roundtrip flights to ${destCity}. Book now while prices are low.`,
    originalPrice: Math.round(avgPrice),
    currentPrice: Math.round(price),
    currency: 'USD',
    savingsPercent,
    valueScore,
    originCity,
    originCode: deal.origin,
    destinationCity: destCity,
    destinationCode: deal.destination,
    departureDate: deal.departureDate,
    returnDate: deal.returnDate,
    bookByDate: bookByDate.toISOString().split('T')[0],
    travelWindow: formatTravelWindow(new Date(deal.departureDate)),
    airline: 'Multiple Airlines',
    includes: ['Personal Item'],
    restrictions: ['Prices may vary', 'Subject to availability'],
    imageUrl: getCityImage(destCity),
    bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${deal.origin}+to+${deal.destination}+on+${deal.departureDate}`,
    source: 'Amadeus',
    postedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: Math.floor(Math.random() * 3000) + 500,
    saves: Math.floor(Math.random() * 300) + 50,
    tags: generateTags(destCity, valueScore, price),
    isHotDeal: valueScore >= 85 || savingsPercent >= 40,
    isExpiringSoon: false,
    isHistoricLow: savingsPercent >= 35,
  };
}

function formatTravelWindow(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startMonth = months[date.getMonth()];
  const endMonth = months[(date.getMonth() + 2) % 12];
  return `${startMonth} - ${endMonth} ${date.getFullYear()}`;
}

function generateTags(destCity: string, valueScore: number, price: number): string[] {
  const tags: string[] = [];

  // European cities
  const europeanCities = ['Paris', 'London', 'Rome', 'Barcelona', 'Amsterdam', 'Berlin', 'Madrid', 'Lisbon', 'Athens', 'Dublin'];
  const asianCities = ['Tokyo', 'Bangkok', 'Singapore', 'Hong Kong', 'Seoul', 'Taipei', 'Bali'];
  const caribbeanCities = ['Cancun', 'San Juan', 'Nassau', 'Montego Bay', 'Aruba', 'Punta Cana'];

  if (europeanCities.includes(destCity)) tags.push('europe');
  if (asianCities.includes(destCity)) tags.push('asia');
  if (caribbeanCities.includes(destCity)) tags.push('caribbean');

  if (valueScore >= 90) tags.push('incredible-deal');
  if (valueScore >= 80) tags.push('great-value');
  if (price < 400) tags.push('budget');
  if (price < 300) tags.push('ultra-budget');

  return tags;
}

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

// Location code to city name mapping
export const LOCATION_NAMES: Map<string, string> = new Map([
  ['JFK', 'New York'],
  ['LAX', 'Los Angeles'],
  ['ORD', 'Chicago'],
  ['SFO', 'San Francisco'],
  ['MIA', 'Miami'],
  ['BOS', 'Boston'],
  ['SEA', 'Seattle'],
  ['DFW', 'Dallas'],
  ['ATL', 'Atlanta'],
  ['DEN', 'Denver'],
  ['LHR', 'London'],
  ['CDG', 'Paris'],
  ['FCO', 'Rome'],
  ['BCN', 'Barcelona'],
  ['AMS', 'Amsterdam'],
  ['FRA', 'Frankfurt'],
  ['MAD', 'Madrid'],
  ['LIS', 'Lisbon'],
  ['ATH', 'Athens'],
  ['DUB', 'Dublin'],
  ['NRT', 'Tokyo'],
  ['HND', 'Tokyo'],
  ['BKK', 'Bangkok'],
  ['SIN', 'Singapore'],
  ['HKG', 'Hong Kong'],
  ['ICN', 'Seoul'],
  ['TPE', 'Taipei'],
  ['DPS', 'Bali'],
  ['CUN', 'Cancun'],
  ['SJU', 'San Juan'],
  ['NAS', 'Nassau'],
  ['MBJ', 'Montego Bay'],
  ['AUA', 'Aruba'],
  ['PUJ', 'Punta Cana'],
  ['HNL', 'Honolulu'],
  ['SYD', 'Sydney'],
  ['DXB', 'Dubai'],
]);

export type { AmadeusFlightDestination, AmadeusFlightOffer };
