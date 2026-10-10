import Link from "next/link";
import { ArrowLeft, MonitorPlay } from "lucide-react";

export default function PlaygroundsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/problems" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="bg-[#2c2c2c] p-10 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
          <MonitorPlay className="w-16 h-16 text-purple-500 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">My Playgrounds</h1>
          <p className="text-gray-400 max-w-md">
            A free-form coding sandbox where you can test ideas outside of specific problems is currently in development.
          </p>
        </div>
      </div>
    </div>
  );
}
