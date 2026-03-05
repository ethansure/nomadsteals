# NomadSteals - Travel Deals Aggregator

A Next.js-powered travel deals platform that aggregates real flight deals from multiple sources and displays them with Value Scores to help travelers find the best deals.

## Features

- 🔥 **Real Travel Deals** - Aggregated from Kiwi.com and Amadeus APIs
- ⚡ **Value Score** - Proprietary scoring system (0-100) comparing prices to historical data
- 📊 **Daily Updates** - Automated cron job refreshes deals daily at 6 AM UTC
- 🏙️ **City Pages** - Browse deals by destination
- 🔍 **Filters** - Filter by type (flights/hotels/packages), price, and more

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Data Sources**: Kiwi.com Tequila API, Amadeus API
- **Storage**: JSON file storage (MVP) - can be upgraded to Vercel KV/Redis
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ethansure/nomadsteals.git
cd nomadsteals

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Kiwi.com Tequila API (FREE tier)
# Sign up at: https://partners.kiwi.com/
KIWI_API_KEY=your_kiwi_api_key_here

# Amadeus API (FREE tier - 2000 calls/month)
# Sign up at: https://developers.amadeus.com/
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

# Cron job protection secret
# Generate with: openssl rand -base64 32
CRON_SECRET=your_random_secret_here
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deals` | GET | List all deals with filters |
| `/api/deals` | POST | Trigger manual refresh (protected) |
| `/api/deals/[id]` | GET | Get single deal by ID |
| `/api/cities/[slug]/deals` | GET | Get deals for a specific city |
| `/api/stats` | GET | Get deal statistics |
| `/api/cron/refresh` | GET | Daily cron job endpoint |
| `/api/subscribe` | POST | Create new subscription |
| `/api/subscribe` | GET | Get subscription preferences |
| `/api/subscribe` | PUT | Update subscription preferences |
| `/api/subscribe/verify` | GET | Verify email address |
| `/api/subscribe/unsubscribe` | GET/POST | Unsubscribe from emails |

### Query Parameters for `/api/deals`

- `type` - Filter by deal type (flight, hotel, package)
- `destination` - Filter by destination city
- `origin` - Filter by origin city
- `maxPrice` - Maximum price filter
- `minValueScore` - Minimum value score filter
- `hot` - Show only hot deals (true/false)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset

## Data Sources

### Kiwi.com Tequila API (Free Tier)
- Rate limited (~50 requests/minute)
- Provides flight search and booking links
- Sign up: https://partners.kiwi.com/

### Amadeus API (Free Tier)
- 2000 free API calls per month
- Provides flight inspiration and pricing
- Sign up: https://developers.amadeus.com/

### Demo Data
When no API keys are configured, the app falls back to demo data with 20 realistic deals.

## Email Subscription System

NomadSteals includes a personalized email subscription system for deal alerts.

### Features
- 📧 **Email verification** - Confirm subscriptions before sending deals
- ⚙️ **Personalized preferences** - Filter by origin, destination, deal type, price
- ⏰ **Flexible frequency** - Instant, daily, or weekly digest options
- 🔥 **Hot deals only** - Option to receive only exceptional deals (Value Score 90+)
- 🚫 **Easy unsubscribe** - One-click unsubscribe in every email

### Setup Email Service (Resend)

1. Sign up at [resend.com](https://resend.com) (Free tier: 3000 emails/month)
2. Get your API key from the dashboard
3. Add to environment variables:

```bash
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

4. (Optional) Verify your domain in Resend to use custom sender address

### Subscription Preferences

Users can customize:
- **Origin regions/cities** - Where they fly from
- **Destination regions/cities** - Where they want to go
- **Deal types** - Flights, hotels, packages
- **Max price** - Budget limit
- **Min value score** - Quality threshold
- **Frequency** - Instant / Daily / Weekly
- **Hot deals only** - Only exceptional deals

## Cron Job

A daily cron job runs at 6 AM UTC to:
1. Remove expired deals
2. Fetch new deals from configured sources
3. Calculate Value Scores
4. Update the data store
5. Send email alerts to matching subscribers

The cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 6 * * *"
    }
  ]
}
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The GitHub integration will automatically deploy on push.

### Environment Variables in Vercel

Add these in your Vercel project settings:
- `KIWI_API_KEY` - Kiwi.com API key
- `AMADEUS_CLIENT_ID` - Amadeus client ID
- `AMADEUS_CLIENT_SECRET` - Amadeus client secret
- `CRON_SECRET` - Secret for protecting cron endpoints
- `RESEND_API_KEY` - Resend.com API key for email delivery
- `NEXT_PUBLIC_BASE_URL` - Your deployed URL (for email links)

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## License

MIT
