import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Trophy, 
  ArrowLeft, 
  Medal,
  Activity
} from "lucide-react"; 

export const revalidate = 0;

const AVATAR_COLORS: Record<string, string> = {
  indigo: "#6366f1", rose: "#f43f5e", emerald: "#10b981", amber: "#f59e0b",
  cyan: "#06b6d4", violet: "#8b5cf6", pink: "#ec4899", sky: "#0ea5e9",
  orange: "#f97316", teal: "#14b8a6"
};

interface StudentScore {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  avatarColor: string;
  totalScore: number;
  questionsSolved: number;
  totalQuestions: number;
  completionRate: number;
}

export default async function GlobalLeaderboard() {
  const supabase = createClient();

  // 1. Check Access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)!
  );

  // 2. Fetch Helper Data
  const [studentsReq, questionsReq, authUsersReq] = await Promise.all([
    supabaseAdmin.from("profiles").select("id").eq("role", "student"),
    supabase.from("questions").select("*", { count: 'exact', head: true }),
    supabaseAdmin.auth.admin.listUsers()
  ]);

  const authUsers = authUsersReq.data.users || [];
  const students = (studentsReq.data || []).map(s => {
    const authUser = authUsers.find(u => u.id === s.id);
    return {
      id: s.id,
      email: authUser?.email || "Unknown Student",
      displayName: authUser?.user_metadata?.username || authUser?.email?.split("@")[0] || "Unknown",
      avatarUrl: authUser?.user_metadata?.avatar_url || "",
      avatarColor: authUser?.user_metadata?.avatar_color || "indigo",
    };
  });
  const totalQuestionsCount = questionsReq.count || 0;

  // 3. Build Submissions Query
  const { data: submissions } = await supabaseAdmin
    .from("submissions")
    .select(`
      student_id, 
      total_score, 
      question_id, 
      status
    `);
    
  const safeSubmissions = submissions || [];

  // 4. Calculate Leaderboard
  const leaderboard: StudentScore[] = students.map((student) => {
    const mySubs = safeSubmissions.filter((s) => s.student_id === student.id);
    const bestScores = new Map<string, number>();

    mySubs.forEach((sub: any) => {
      const status = sub.status ? sub.status.toLowerCase().trim() : "";
      const isCompleted = ["completed", "passed", "accepted", "success"].includes(status);
      const score = sub.total_score || 0;
      
      if (sub.question_id && isCompleted && score > 0) {
        const currentMax = bestScores.get(sub.question_id) || 0;
        if (score > currentMax) bestScores.set(sub.question_id, score);
      }
    });

    let totalScore = 0;
    bestScores.forEach((s) => (totalScore += s));
    const solvedCount = bestScores.size;

    return {
      id: student.id,
      email: student.email,
      displayName: student.displayName,
      avatarUrl: student.avatarUrl,
      avatarColor: student.avatarColor,
      totalScore,
      questionsSolved: solvedCount,
      totalQuestions: totalQuestionsCount,
      completionRate: totalQuestionsCount > 0 ? Math.round((solvedCount / totalQuestionsCount) * 100) : 0,
    };
  });

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="min-h-screen bg-black p-6 md:p-12 font-sans text-gray-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-gray-800">
          <div className="space-y-2">
            <Link 
              href="/problems" 
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" /> Global Leaderboard
              </h1>
              <p className="text-gray-400 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Rankings across all Lab Sections
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-4 text-center w-20">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 w-1/3">Progress</th>
                  <th className="px-6 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {leaderboard.map((student, index) => {
                  let rankBadge;
                  if (index === 0) rankBadge = "bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30";
                  else if (index === 1) rankBadge = "bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/30";
                  else if (index === 2) rankBadge = "bg-orange-500/20 text-orange-500 ring-1 ring-orange-500/30";
                  else rankBadge = "text-gray-500 font-medium";

                  const isCurrentUser = user.id === student.id;
                  const avatarBg = AVATAR_COLORS[student.avatarColor] || AVATAR_COLORS.indigo;

                  return (
                    <tr key={student.id} className={`group hover:bg-gray-800/50 transition-colors ${isCurrentUser ? "bg-indigo-900/10" : ""}`}>
                      <td className="px-6 py-4 text-center">
                        <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm ${typeof rankBadge === 'string' && rankBadge.includes('bg-') ? rankBadge + ' font-bold' : rankBadge}`}>
                          {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 overflow-hidden shrink-0 ${isCurrentUser ? "ring-indigo-400" : "ring-gray-700"}`}
                            style={{ backgroundColor: student.avatarUrl ? undefined : avatarBg }}
                          >
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white">{student.displayName[0].toUpperCase()}</span>
                            )}
                          </div>
                          <span className={`font-medium transition-colors ${isCurrentUser ? "text-indigo-400" : "text-gray-300 group-hover:text-white"}`}>
                            {student.displayName} {isCurrentUser && "(You)"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-500">
                             <span>{student.questionsSolved} <span className="text-gray-600 font-normal">/ {student.totalQuestions} Qs</span></span>
                             <span className={student.completionRate === 100 ? "text-emerald-500" : ""}>{student.completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                student.completionRate === 100 ? "bg-emerald-500" : "bg-indigo-500"
                              }`} 
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-gray-800 text-gray-300 border border-gray-700">
                          {student.totalScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
