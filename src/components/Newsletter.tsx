"use client";

import { useState } from "react";

interface NewsletterFormProps {
  variant?: "inline" | "card" | "hero";
  className?: string;
}

export function NewsletterForm({ variant = "inline", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("loading");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, this would call your newsletter API
    setStatus("success");
    setEmail("");
  };

  if (status === "success") {
    return (
      <div className={`text-center p-6 bg-green-50 rounded-2xl border border-green-200 ${className}`}>
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="font-bold text-green-800 text-lg mb-1">You're subscribed!</h3>
        <p className="text-green-700 text-sm">Check your inbox for a welcome email with today's best deals.</p>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <section className={`py-16 px-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white ${className}`}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Deals Before Everyone Else</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join 50,000+ savvy travelers who get our daily deal digest. 
            Error fares, flash sales, and exclusive deals — straight to your inbox.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-6 py-4 rounded-xl text-gray-900 w-full outline-none focus:ring-2 focus:ring-yellow-400"
              required
            />
            <button 
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 bg-yellow-400 text-gray-900 font-semibold rounded-xl hover:bg-yellow-300 transition whitespace-nowrap disabled:opacity-50"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe Free →"}
            </button>
          </form>
          <p className="text-sm text-blue-200 mt-4">
            🔒 No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 border border-gray-100 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📬</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Daily Deal Alerts</h3>
          <p className="text-gray-600 text-sm">
            The best travel deals delivered to your inbox every morning.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button 
            type="submit"
            disabled={status === "loading"}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Get Daily Deals"}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-4">
          Free forever • Unsubscribe anytime
        </p>
      </div>
    );
  }

  // Inline variant (default)
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <button 
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
    </form>
  );
}
