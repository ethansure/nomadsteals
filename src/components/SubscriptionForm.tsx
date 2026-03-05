"use client";

import { useState, useEffect } from "react";
import { getRegionOptions, getAllCities, getPopularCities } from "@/lib/regions";
import { SubscriptionPreferences, DEFAULT_PREFERENCES, EmailFrequency } from "@/lib/subscriptions/types";
import { DealType } from "@/lib/types";

interface SubscriptionFormProps {
  initialEmail?: string;
  initialPreferences?: SubscriptionPreferences;
  mode?: "subscribe" | "edit";
  token?: string;
  onSuccess?: () => void;
}

const DEAL_TYPES: { value: DealType; label: string; emoji: string }[] = [
  { value: "flight", label: "Flights", emoji: "✈️" },
  { value: "hotel", label: "Hotels", emoji: "🏨" },
  { value: "package", label: "Packages", emoji: "📦" },
];

const FREQUENCIES: { value: EmailFrequency; label: string; desc: string }[] = [
  { value: "instant", label: "Instant", desc: "Get notified immediately when hot deals drop" },
  { value: "daily", label: "Daily", desc: "One email per day with the best deals" },
  { value: "weekly", label: "Weekly", desc: "Weekly roundup of top deals" },
];

export function SubscriptionForm({ 
  initialEmail = "", 
  initialPreferences,
  mode = "subscribe",
  token,
  onSuccess 
}: SubscriptionFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(mode === "edit");
  
  // Preferences state
  const [preferences, setPreferences] = useState<SubscriptionPreferences>(
    initialPreferences || DEFAULT_PREFERENCES
  );
  
  const regionOptions = getRegionOptions();
  const allCities = getAllCities();
  const popularCities = getPopularCities();

  // Update preferences when initialPreferences changes
  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "subscribe" && !email) return;
    
    setStatus("loading");
    setErrorMessage("");
    
    try {
      const url = mode === "edit" 
        ? `/api/subscribe?token=${token}` 
        : "/api/subscribe";
        
      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit" 
            ? { preferences } 
            : { email, preferences }
        ),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }
      
      setStatus("success");
      onSuccess?.();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const toggleArrayValue = <T,>(arr: T[], value: T): T[] => {
    return arr.includes(value) 
      ? arr.filter(v => v !== value)
      : [...arr, value];
  };

  if (status === "success") {
    return (
      <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-200">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-bold text-green-800 text-xl mb-2">
          {mode === "edit" ? "Preferences Updated!" : "Almost There!"}
        </h3>
        <p className="text-green-700">
          {mode === "edit" 
            ? "Your deal preferences have been saved." 
            : "Check your inbox for a verification email to activate your subscription."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input (only for subscribe mode) */}
      {mode === "subscribe" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      )}

      {/* Quick Preferences Toggle */}
      {mode === "subscribe" && (
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700"
        >
          <span>{showAdvanced ? "−" : "+"}</span>
          {showAdvanced ? "Hide preferences" : "Customize your deal preferences"}
        </button>
      )}

      {/* Advanced Preferences */}
      {showAdvanced && (
        <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
          {/* Email Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📬 Email Frequency
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FREQUENCIES.map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setPreferences({ ...preferences, frequency: freq.value })}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    preferences.frequency === freq.value 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{freq.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{freq.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Deal Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🎫 Deal Types
            </label>
            <div className="flex flex-wrap gap-2">
              {DEAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setPreferences({ 
                    ...preferences, 
                    dealTypes: toggleArrayValue(preferences.dealTypes, type.value) 
                  })}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                    preferences.dealTypes.includes(type.value)
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {type.emoji} {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Origin Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🛫 Where are you flying from?
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.anyOrigin}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    anyOrigin: e.target.checked,
                    originCities: e.target.checked ? [] : preferences.originCities,
                    originRegions: e.target.checked ? [] : preferences.originRegions,
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Anywhere (show all origins)</span>
              </label>
              
              {!preferences.anyOrigin && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Select regions:</div>
                    <div className="flex flex-wrap gap-2">
                      {regionOptions.slice(0, 6).map((region) => (
                        <button
                          key={region.value}
                          type="button"
                          onClick={() => setPreferences({ 
                            ...preferences, 
                            originRegions: toggleArrayValue(preferences.originRegions, region.value) 
                          })}
                          className={`px-3 py-1.5 rounded-full border text-sm transition ${
                            preferences.originRegions.includes(region.value)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {region.emoji} {region.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Or specific cities:</div>
                    <select
                      multiple
                      value={preferences.originCities}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        originCities: Array.from(e.target.selectedOptions, opt => opt.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm h-24"
                    >
                      {allCities.slice(0, 30).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Destination Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🛬 Where do you want to go?
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.anyDestination}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    anyDestination: e.target.checked,
                    destinationCities: e.target.checked ? [] : preferences.destinationCities,
                    destinationRegions: e.target.checked ? [] : preferences.destinationRegions,
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Anywhere (show all destinations)</span>
              </label>
              
              {!preferences.anyDestination && (
                <>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Select regions:</div>
                    <div className="flex flex-wrap gap-2">
                      {regionOptions.map((region) => (
                        <button
                          key={region.value}
                          type="button"
                          onClick={() => setPreferences({ 
                            ...preferences, 
                            destinationRegions: toggleArrayValue(preferences.destinationRegions, region.value) 
                          })}
                          className={`px-3 py-1.5 rounded-full border text-sm transition ${
                            preferences.destinationRegions.includes(region.value)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {region.emoji} {region.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Popular destinations:</div>
                    <div className="flex flex-wrap gap-2">
                      {popularCities.map((city) => (
                        <button
                          key={city.city}
                          type="button"
                          onClick={() => setPreferences({ 
                            ...preferences, 
                            destinationCities: toggleArrayValue(preferences.destinationCities, city.city) 
                          })}
                          className={`px-3 py-1.5 rounded-full border text-sm transition ${
                            preferences.destinationCities.includes(city.city)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {city.emoji} {city.city}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Price & Quality Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Max Price (optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={preferences.maxPrice || ""}
                  onChange={(e) => setPreferences({ 
                    ...preferences, 
                    maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  min="0"
                  step="50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ⚡ Min Value Score (optional)
              </label>
              <input
                type="number"
                value={preferences.minValueScore || ""}
                onChange={(e) => setPreferences({ 
                  ...preferences, 
                  minValueScore: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="No minimum"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Hot Deals Only */}
          <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-xl border border-gray-200">
            <input
              type="checkbox"
              checked={preferences.hotDealsOnly}
              onChange={(e) => setPreferences({ ...preferences, hotDealsOnly: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-gray-900 font-medium">🔥 Hot Deals Only</span>
              <p className="text-xs text-gray-500">Only receive alerts for exceptional, time-sensitive deals</p>
            </div>
          </label>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errorMessage || "Something went wrong. Please try again."}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status === "loading" || (mode === "subscribe" && !email)}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" 
          ? "Saving..." 
          : mode === "edit" 
            ? "Save Preferences" 
            : "Subscribe to Deals →"}
      </button>

      {mode === "subscribe" && (
        <p className="text-xs text-gray-500 text-center">
          🔒 We respect your inbox. No spam, ever. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
