import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/problems" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="bg-[#2c2c2c] p-10 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
          <Sparkles className="w-16 h-16 text-yellow-400 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Try New Features</h1>
          <p className="text-gray-400 max-w-md">
            Join the Beta program to test our upcoming AI-powered hint system and real-time multiplayer coding contests!
          </p>
        </div>
      </div>
    </div>
  );
}
