import Link from "next/link";
import { ArrowLeft, ListTodo } from "lucide-react";

export default function ListsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href="/problems" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
        
        <div className="bg-[#2c2c2c] p-10 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
          <ListTodo className="w-16 h-16 text-emerald-500 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">My Lists</h1>
          <p className="text-gray-400 max-w-md">
            Custom problem lists (like "Top Interview 150" or "Blind 75") will be available here soon. We are building the curation engine!
          </p>
        </div>
      </div>
    </div>
  );
}
