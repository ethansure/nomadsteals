"use client";

import { useState } from "react";
import { Bell, Plane, MapPin, DollarSign, Sparkles, Check, Loader2 } from "lucide-react";

interface PriceAlertFormProps {
  variant?: "inline" | "modal" | "card";
  defaultOrigin?: string;
  defaultDestination?: string;
  onSuccess?: () => void;
}

// Popular cities for quick selection
const POPULAR_ORIGINS = [
  { code: "NYC", name: "New York" },
  { code: "LAX", name: "Los Angeles" },
  { code: "SFO", name: "San Francisco" },
  { code: "CHI", name: "Chicago" },
  { code: "MIA", name: "Miami" },
  { code: "SEA", name: "Seattle" },
  { code: "BOS", name: "Boston" },
  { code: "DFW", name: "Dallas" },
];

const POPULAR_DESTINATIONS = [
  { code: "PAR", name: "Paris", emoji: "🇫🇷" },
  { code: "TYO", name: "Tokyo", emoji: "🇯🇵" },
  { code: "LON", name: "London", emoji: "🇬🇧" },
  { code: "ROM", name: "Rome", emoji: "🇮🇹" },
  { code: "BCN", name: "Barcelona", emoji: "🇪🇸" },
  { code: "BKK", name: "Bangkok", emoji: "🇹🇭" },
  { code: "CUN", name: "Cancún", emoji: "🇲🇽" },
  { code: "DXB", name: "Dubai", emoji: "🇦🇪" },
];

export function PriceAlertForm({ 
  variant = "card",
  defaultOrigin = "",
  defaultDestination = "",
  onSuccess 
}: PriceAlertFormProps) {
  const [email, setEmail] = useState("");
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [maxPrice, setMaxPrice] = useState("");
  const [frequency, setFrequency] = useState<"instant" | "daily">("instant");
  const [hotDealsOnly, setHotDealsOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const preferences = {
        originCities: origin ? [origin] : [],
        anyOrigin: !origin,
        destinationCities: destination ? [destination] : [],
        anyDestination: !destination,
        maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        frequency,
        hotDealsOnly,
        minValueScore: hotDealsOnly ? 85 : undefined,
        dealTypes: ["flight", "hotel", "package", "cruise"],
      };

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create alert");
      }

      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`${variant === "card" ? "bg-white rounded-2xl shadow-lg p-8" : ""} text-center`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Alert Created! 🎉</h3>
        <p className="text-gray-600">
          Check your email to verify your alert. We'll notify you when we find matching deals!
        </p>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={`${variant === "card" ? "bg-white rounded-2xl shadow-lg p-6 md:p-8" : ""}`}
    >
      {variant === "card" && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B6B] to-[#FFA07A] rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Set Price Alert</h3>
            <p className="text-gray-500 text-sm">Get notified when prices drop</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Origin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            From (optional)
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Any city or leave blank for all"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POPULAR_ORIGINS.slice(0, 4).map((city) => (
              <button
                key={city.code}
                type="button"
                onClick={() => setOrigin(city.name)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  origin === city.name
                    ? "bg-[#FF6B6B] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Plane className="w-4 h-4 inline mr-1" />
            To (optional)
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Any destination or leave blank for all"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POPULAR_DESTINATIONS.slice(0, 4).map((city) => (
              <button
                key={city.code}
                type="button"
                onClick={() => setDestination(city.name)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  destination === city.name
                    ? "bg-[#FF6B6B] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {city.emoji} {city.name}
              </button>
            ))}
          </div>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Max Price (optional)
          </label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g., 500"
            min="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Options Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Frequency */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Frequency
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFrequency("instant")}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  frequency === "instant"
                    ? "bg-[#FF6B6B] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ⚡ Instant
              </button>
              <button
                type="button"
                onClick={() => setFrequency("daily")}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  frequency === "daily"
                    ? "bg-[#FF6B6B] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📅 Daily
              </button>
            </div>
          </div>

          {/* Hot Deals Only */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Quality
            </label>
            <button
              type="button"
              onClick={() => setHotDealsOnly(!hotDealsOnly)}
              className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                hotDealsOnly
                  ? "bg-[#FFD93D] text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {hotDealsOnly ? "Hot Deals Only 🔥" : "All Deals"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !email}
          className="w-full py-4 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#FF6B6B]/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Alert...
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              Create Price Alert
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Free forever. Unsubscribe anytime. No spam, just deals.
        </p>
      </div>
    </form>
  );
}
