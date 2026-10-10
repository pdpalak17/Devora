import Link from "next/link";
import { ArrowLeft, Palette } from "lucide-react";

export default function AppearancePage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/problems" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="bg-[#2c2c2c] p-10 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
          <Palette className="w-16 h-16 text-pink-500 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Appearance Settings</h1>
          <p className="text-gray-400 max-w-md mb-8">
            Themes (Light/Dark), custom accent colors, and syntax highlighting options are coming in a future update.
          </p>
          <div className="p-4 bg-[#1a1a1a] border border-gray-700 rounded-lg inline-block">
             Current Theme: <span className="font-bold text-white">Devora Dark</span>
          </div>
        </div>
      </div>
    </div>
  );
}
