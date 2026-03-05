import Link from "next/link";
import { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { blogPosts, getFeaturedPosts, getRecentPosts } from "@/lib/blog-data";
import { blogCategories } from "@/lib/blog-types";
import { Calendar, Clock, ChevronRight, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Travel Blog - Tips, Guides & Flight Deal Insights",
  description: "Expert travel tips, flight deal strategies, and destination guides. Learn how to find cheap flights, score error fares, and travel smart in 2026.",
  keywords: [
    "travel blog",
    "flight deals blog",
    "cheap flight tips",
    "error fares guide",
    "travel tips",
    "budget travel",
  ],
  openGraph: {
    title: "NomadSteals Travel Blog - Expert Tips & Flight Deal Guides",
    description: "Master the art of finding cheap flights with our expert guides, tips, and destination insights.",
    type: "website",
    url: "https://nomadsteals.com/blog",
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts(10);

  return (
    <main className="min-h-screen bg-[#FFFAF5]">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2D3436] via-[#3D4749] to-[#4A5154] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
              <span className="text-2xl">✍️</span>
              <span>Travel Insights & Guides</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              The NomadSteals Blog
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Expert tips on finding cheap flights, scoring error fares, and traveling smarter. 
              Your guide to getting more travel for less money.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-[#2D3436] mb-8 flex items-center gap-2">
              <span className="text-3xl">⭐</span> Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.slice(0, 3).map((post) => (
                <Link 
                  key={post.slug} 
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img 
                      src={post.imageUrl} 
                      alt={post.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-[#FF6B6B] mb-2">
                      <span>{blogCategories.find(c => c.slug === post.category)?.emoji}</span>
                      <span className="font-medium capitalize">{post.category}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#2D3436] mb-2 group-hover:text-[#FF6B6B] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[#2D3436]/60 text-sm line-clamp-2 mb-4">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-[#2D3436]/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readingTime} min read
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2D3436] mb-6 flex items-center gap-2">
            <span className="text-3xl">📚</span> Browse by Category
          </h2>
          <div className="flex flex-wrap gap-3">
            {blogCategories.map((category) => {
              const count = blogPosts.filter(p => p.category === category.slug).length;
              return (
                <Link
                  key={category.slug}
                  href={`/blog?category=${category.slug}`}
                  className="px-5 py-3 bg-[#FFFAF5] rounded-full text-[#2D3436] hover:bg-[#FF6B6B] hover:text-white transition-colors flex items-center gap-2 border border-[#FF6B6B]/10"
                >
                  <span>{category.emoji}</span>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm opacity-60">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2D3436] mb-8 flex items-center gap-2">
            <span className="text-3xl">📝</span> Latest Articles
          </h2>
          <div className="grid gap-6">
            {recentPosts.map((post) => (
              <Link 
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex gap-6 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                <div className="hidden md:block w-48 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-[#FF6B6B] mb-2">
                    <span>{blogCategories.find(c => c.slug === post.category)?.emoji}</span>
                    <span className="font-medium capitalize">{post.category}</span>
                    {post.featured && (
                      <span className="px-2 py-0.5 bg-[#FFD93D] text-[#2D3436] text-xs font-bold rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3436] mb-2 group-hover:text-[#FF6B6B] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[#2D3436]/60 text-sm line-clamp-2 mb-3">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[#2D3436]/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readingTime} min read
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center">
                  <ChevronRight className="w-6 h-6 text-[#FF6B6B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#FF6B6B] to-[#FFA07A]">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Deal or Article</h2>
          <p className="text-white/80 mb-6">
            Join 50,000+ travelers getting daily deals and weekly travel insights.
          </p>
          <Link 
            href="/newsletter"
            className="inline-block px-8 py-4 bg-white text-[#FF6B6B] font-bold rounded-full hover:shadow-lg transition-all"
          >
            Subscribe to Our Newsletter →
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
