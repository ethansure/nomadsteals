import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NomadSteals - Daily Travel Deals with Value Scores";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.2)" />
            <path d="M12 22L18 16L28 14L30 16L22 20L26 28L24 30L18 24L14 26L12 22Z" fill="url(#planeGrad)" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            <span>Nomad</span>
            <span style={{ color: "#FBBF24" }}>Steals</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255,255,255,0.8)",
              marginTop: 16,
              maxWidth: 600,
            }}
          >
            Daily Travel Deals with Value Scores
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 60,
            marginTop: 50,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 32px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>1,247+</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Active Deals</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 32px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>42%</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Avg Savings</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "16px 32px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 16,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: "#22c55e" }}>⚡ 90+</span>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Value Score</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
