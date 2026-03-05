"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { SubscriptionPreferences } from "@/lib/subscriptions/types";

function PreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [preferences, setPreferences] = useState<SubscriptionPreferences | null>(null);
  
  useEffect(() => {
    if (!token) {
      setError("Missing access token. Please use the link from your email.");
      setLoading(false);
      return;
    }
    
    // Fetch current preferences
    fetch(`/api/subscribe?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEmail(data.email);
          setPreferences(data.preferences);
        } else {
          setError(data.error || "Failed to load preferences");
        }
      })
      .catch(() => setError("Failed to load preferences"))
      .finally(() => setLoading(false));
  }, [token]);
  
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⚙️ Your Deal Preferences
            </h1>
            {email && (
              <p className="text-gray-600">
                Customize alerts for <span className="font-medium">{email}</span>
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your preferences...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">😕</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link
                  href="/newsletter"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Go to Newsletter Page
                </Link>
              </div>
            ) : preferences ? (
              <SubscriptionForm
                mode="edit"
                token={token || undefined}
                initialPreferences={preferences}
              />
            ) : null}
          </div>
          
          {/* Unsubscribe Link */}
          {token && !error && (
            <div className="text-center mt-6">
              <Link
                href={`/api/subscribe/unsubscribe?token=${token}`}
                className="text-gray-500 text-sm hover:text-red-600 transition"
              >
                Unsubscribe from all emails
              </Link>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PreferencesContent />
    </Suspense>
  );
}
