import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Trophy, Flame, ChevronRight } from "lucide-react";

export const revalidate = 0;

export default async function ProgressDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all questions to determine available difficulty pools
  const { data: questions } = await supabase.from("questions").select("id, difficulty");
  const allQuestions = questions || [];

  // Fetch user submissions for progress
  const { data: submissions } = await supabase
    .from("submissions")
    .select("question_id, status")
    .eq("student_id", user.id);

  const safeSubmissions = submissions || [];

  // Calculate unique solved questions
  const solvedQuestionIds = new Set<string>();
  safeSubmissions.forEach(sub => {
    const status = sub.status ? sub.status.toLowerCase().trim() : "";
    if (["completed", "passed", "accepted", "success"].includes(status)) {
      solvedQuestionIds.add(String(sub.question_id));
    }
  });

  // Calculate stats by difficulty
  const difficulties = ["Easy", "Medium", "Hard"];
  const stats: Record<string, { total: number; solved: number }> = {
    Easy: { total: 0, solved: 0 },
    Medium: { total: 0, solved: 0 },
    Hard: { total: 0, solved: 0 },
  };

  allQuestions.forEach(q => {
    const diff = q.difficulty || "Easy";
    if (stats[diff]) {
      stats[diff].total += 1;
      if (solvedQuestionIds.has(String(q.id))) {
        stats[diff].solved += 1;
      }
    }
  });

  const totalQuestions = allQuestions.length;
  const totalSolved = solvedQuestionIds.size;
  const completionPercentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

  // Generate dynamic tasks/tips based on progress
  const tasks = [];
  if (totalSolved === 0) {
    tasks.push({ title: "Getting Started", desc: "Solve your first problem to start your streak!", reward: "Beginner Badge" });
  } else if (stats.Easy.solved < stats.Easy.total) {
    tasks.push({ title: "Master the Basics", desc: `Solve ${stats.Easy.total - stats.Easy.solved} more Easy questions.`, reward: "100 Points" });
  } else if (stats.Medium.solved < stats.Medium.total) {
    tasks.push({ title: "Level Up", desc: "You've mastered Easy! Try tackling Medium problems next.", reward: "Intermediate Badge" });
  } else {
    tasks.push({ title: "Challenge Yourself", desc: "Time for the Hard questions. Push your limits!", reward: "Expert Badge" });
  }

  tasks.push({ title: "Consistency is Key", desc: "Solve at least 1 problem for 5 consecutive days.", reward: "Flame Streak" });

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-gray-800">
          <div className="space-y-2">
            <Link 
              href="/problems" 
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
               My Progress
            </h1>
            <p className="text-gray-400 mt-1">
              Track your problem-solving journey and complete daily tasks.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#2c2c2c] px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-3">
               <Flame className="w-5 h-5 text-orange-500" />
               <div>
                 <p className="text-xs text-gray-400">Current Streak</p>
                 <p className="text-lg font-bold text-white leading-tight">1 Day</p>
               </div>
            </div>
            <div className="bg-[#2c2c2c] px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-3">
               <Trophy className="w-5 h-5 text-amber-500" />
               <div>
                 <p className="text-xs text-gray-400">Rank</p>
                 <p className="text-lg font-bold text-white leading-tight">Novice</p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Progress Ring (Left Column) */}
          <div className="lg:col-span-1 bg-[#2c2c2c] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-white mb-6 w-full text-left">Solved Problems</h2>
            
            <div className="relative w-48 h-48 mb-6">
              {/* SVG Ring Background */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#3f3f46" strokeWidth="8" />
                {/* Dynamic Progress Ring */}
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="8" 
                  strokeDasharray={`${(completionPercentage / 100) * 283} 283`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{totalSolved}</span>
                <span className="text-xs text-gray-400 mt-1">/ {totalQuestions} Solved</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-500 font-medium">Easy</span>
                <span className="text-white font-semibold">{stats.Easy.solved} <span className="text-gray-500 font-normal">/ {stats.Easy.total}</span></span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.Easy.total > 0 ? (stats.Easy.solved / stats.Easy.total) * 100 : 0}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-500 font-medium">Medium</span>
                <span className="text-white font-semibold">{stats.Medium.solved} <span className="text-gray-500 font-normal">/ {stats.Medium.total}</span></span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.Medium.total > 0 ? (stats.Medium.solved / stats.Medium.total) * 100 : 0}%` }}></div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-red-500 font-medium">Hard</span>
                <span className="text-white font-semibold">{stats.Hard.solved} <span className="text-gray-500 font-normal">/ {stats.Hard.total}</span></span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.Hard.total > 0 ? (stats.Hard.solved / stats.Hard.total) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Tasks & Badges (Right Column) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-[#2c2c2c] p-6 rounded-2xl border border-gray-800 shadow-lg">
              <div className="flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">Recommended Tasks</h2>
              </div>
              
              <div className="space-y-4">
                {tasks.map((task, idx) => (
                  <div key={idx} className="group bg-[#3c3c3c] hover:bg-[#4c4c4c] p-4 rounded-xl border border-gray-700 transition-colors cursor-pointer flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-medium group-hover:text-indigo-300 transition-colors">{task.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{task.desc}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md mb-2">
                        {task.reward}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
