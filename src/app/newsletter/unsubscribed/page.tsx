import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Unsubscribed - NomadSteals",
  description: "You've been unsubscribed from NomadSteals deal alerts.",
};

export default function UnsubscribedPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-lg p-12">
            <div className="text-7xl mb-6">👋</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You've Been Unsubscribed
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Sorry to see you go! You won't receive any more deal alerts from us.
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h2 className="font-bold text-gray-900 mb-2">Changed your mind?</h2>
              <p className="text-gray-600 text-sm mb-4">
                You can always subscribe again if you want to receive amazing travel deals.
              </p>
              <Link
                href="/newsletter"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Subscribe Again
              </Link>
            </div>
            
            <div className="text-gray-500 text-sm">
              <p>Have feedback? We'd love to hear how we can improve.</p>
              <a href="mailto:feedback@nomadsteals.com" className="text-blue-600 hover:underline">
                Send us feedback →
              </a>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
