import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Email Verified - NomadSteals",
  description: "Your email has been verified. You're now subscribed to NomadSteals deal alerts!",
};

export default function VerifiedPage({
  searchParams,
}: {
  searchParams: { email?: string; token?: string };
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-lg p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're All Set!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Your email {searchParams.email && <span className="font-medium">({searchParams.email})</span>} has been verified.
              You'll now receive amazing travel deals straight to your inbox.
            </p>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
              <h2 className="font-bold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <strong className="text-gray-900">Check your inbox</strong>
                    <p className="text-gray-600 text-sm">We just sent you a welcome email with today's best deals.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚙️</span>
                  <div>
                    <strong className="text-gray-900">Customize preferences</strong>
                    <p className="text-gray-600 text-sm">Fine-tune your deal alerts to match your travel style.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">✈️</span>
                  <div>
                    <strong className="text-gray-900">Start exploring</strong>
                    <p className="text-gray-600 text-sm">Browse current deals while you wait for new ones!</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={searchParams.token ? `/newsletter/preferences?token=${searchParams.token}` : "/deals"}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition"
              >
                {searchParams.token ? "Customize Preferences" : "Browse Deals"}
              </Link>
              <Link
                href="/deals"
                className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Explore Deals →
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
