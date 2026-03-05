"use client";

import { getValueScoreColor, getValueScoreLabel } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

interface ValueScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ValueScoreBadge({ score, size = "md", showLabel = false, className = "" }: ValueScoreBadgeProps) {
  const colorClass = getValueScoreColor(score);
  const label = getValueScoreLabel(score);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`${colorClass} ${sizeClasses[size]} text-white font-bold rounded-full flex items-center gap-1`}>
        <svg className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>{score}</span>
      </div>
      {showLabel && (
        <span className="text-gray-600 text-sm font-medium">{label}</span>
      )}
    </div>
  );
}

export function ValueScoreExplainer() {
  const examples = [
    { score: 95, label: "Incredible", desc: "Extremely rare pricing" },
    { score: 85, label: "Great", desc: "Well below typical prices" },
    { score: 70, label: "Good", desc: "Solid savings opportunity" },
    { score: 50, label: "Average", desc: "Normal market pricing" },
  ];
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Value Score Explained</h3>
          <p className="text-sm text-gray-600">How we rate deal quality</p>
        </div>
      </div>
      
      <p className="text-gray-700 text-sm mb-4">
        Our proprietary Value Score (0-100) analyzes current prices against historical data, 
        seasonal trends, and market averages to help you identify truly exceptional deals.
      </p>
      
      <div className="space-y-2">
        {examples.map(({ score, label, desc }) => (
          <div key={score} className="flex items-center gap-3 py-2 border-b border-blue-100 last:border-0">
            <ValueScoreBadge score={score} size="sm" />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{label}</span>
              <span className="text-gray-500 text-sm ml-2">— {desc}</span>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-4 flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5" />
        Tip: Look for deals with scores above 80 for the best value
      </p>
    </div>
  );
}
