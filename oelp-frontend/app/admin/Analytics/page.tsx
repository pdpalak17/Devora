import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import LabSelector from "./LabSelector";
import { 
  Trophy, 
  Users, 
  Target, 
  ArrowLeft, 
  ExternalLink, 
  Medal,
  Activity
} from "lucide-react"; 

export const revalidate = 0;

interface StudentScore {
  id: string;
  email: string;
  totalScore: number;
  questionsSolved: number;
  totalQuestionsInLab: number;
  completionRate: number;
  lastActive: string | null;
}

export default async function AnalyticsDashboard({
  searchParams,
}: {
  searchParams: { labId?: string };
}) {
  const supabase = createClient();
  const selectedLabId = searchParams.labId;

  // --- CORE LOGIC START (Untouched) ---
  // 1. Check Admin Access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)!
  );

  // 2. Fetch Helper Data
  const [labsReq, studentsReq, authUsersReq] = await Promise.all([
    supabase.from("lab_sections").select("id, title").order("created_at"),
    supabaseAdmin.from("profiles").select("id").eq("role", "student"),
    supabaseAdmin.auth.admin.listUsers()
  ]);

  const labs = labsReq.data || [];
  const authUsers = authUsersReq.data.users || [];
  const students = (studentsReq.data || []).map(s => ({
    id: s.id,
    email: authUsers.find(u => u.id === s.id)?.email || "Unknown Student"
  }));

  // 3. Build Submissions Query
  let query = supabaseAdmin
    .from("submissions")
    .select(`
      student_id, 
      total_score, 
      submitted_at, 
      question_id, 
      status,
      questions!inner (
        id,
        lab_id
      )
    `);

  if (selectedLabId) {
    query = query.eq("questions.lab_id", selectedLabId);
  }

  const { data: submissions } = await query;
  const safeSubmissions = submissions || [];

  // 4. Calculate Questions Count
  let totalQuestionsCount = 0;
  if (selectedLabId) {
    const { count } = await supabase
      .from("questions")
      .select("*", { count: 'exact', head: true })
      .eq("lab_id", selectedLabId);
    totalQuestionsCount = count || 0;
  } else {
    const { count } = await supabase.from("questions").select("*", { count: 'exact', head: true });
    totalQuestionsCount = count || 0;
  }

  // 5. Calculate Leaderboard
  const leaderboard: StudentScore[] = students.map((student) => {
    const mySubs = safeSubmissions.filter((s) => s.student_id === student.id);
    const bestScores = new Map<string, number>();
    let lastActiveTimestamp = 0;

    mySubs.forEach((sub: any) => {
      const status = sub.status ? sub.status.toLowerCase().trim() : "";
      const isCompleted = ["completed", "passed", "accepted", "success"].includes(status);
      const score = sub.total_score || 0;
      
      if (sub.question_id && isCompleted && score > 0) {
        const currentMax = bestScores.get(sub.question_id) || 0;
        if (score > currentMax) bestScores.set(sub.question_id, score);
      }
      
      const time = new Date(sub.submitted_at).getTime();
      if (time > lastActiveTimestamp) lastActiveTimestamp = time;
    });

    let totalScore = 0;
    bestScores.forEach((s) => (totalScore += s));
    const solvedCount = bestScores.size;

    return {
      id: student.id,
      email: student.email,
      totalScore,
      questionsSolved: solvedCount,
      totalQuestionsInLab: totalQuestionsCount,
      completionRate: totalQuestionsCount > 0 ? Math.round((solvedCount / totalQuestionsCount) * 100) : 0,
      lastActive: lastActiveTimestamp > 0 ? new Date(lastActiveTimestamp).toLocaleDateString() : "Never",
    };
  });

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);
  const currentLabTitle = labs.find(l => l.id.toString() === selectedLabId)?.title || "All Labs";
  // --- CORE LOGIC END ---

  // --- UI CONSTANTS & HELPERS ---
  const stats = [
    { 
      label: "Average Score", 
      value: leaderboard.length > 0 ? Math.round(leaderboard.reduce((a, b) => a + b.totalScore, 0) / leaderboard.length) : 0,
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    { 
      label: "Active Students", 
      value: `${leaderboard.filter(s => s.totalScore > 0).length} / ${students.length}`,
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    { 
      label: "Top Score", 
      value: leaderboard.length > 0 ? leaderboard[0].totalScore : 0,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-2">
            <Link 
              href="/admin/upload" 
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {currentLabTitle}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {selectedLabId ? "Lab Performance Analytics" : "Cumulative Class Performance"}
              </p>
            </div>
          </div>
          <div className="w-full md:w-72">
            {/* Added a label wrapper for the selector */}
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Filter by Lab
            </label>
            <div className="shadow-sm">
              <LabSelector labs={labs} currentLabId={selectedLabId} />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-2 tracking-tight">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Student Leaderboard</h3>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">
              {leaderboard.length} Students
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="px-6 py-4 text-center w-20">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4 w-1/3">Progress</th>
                  <th className="px-6 py-4 text-right">Score</th>
                  <th className="px-6 py-4 text-right">Last Active</th>
                  <th className="px-6 py-4 text-right w-24">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.map((student, index) => {
                  // Rank Badge Logic
                  let rankBadge;
                  if (index === 0) rankBadge = "bg-amber-100 text-amber-700 ring-1 ring-amber-400/30";
                  else if (index === 1) rankBadge = "bg-slate-100 text-slate-700 ring-1 ring-slate-400/30";
                  else if (index === 2) rankBadge = "bg-orange-100 text-orange-800 ring-1 ring-orange-400/30";
                  else rankBadge = "text-slate-500 font-medium";

                  return (
                    <tr key={student.id} className="group hover:bg-slate-50/80 transition-colors">
                      {/* Rank Column */}
                      <td className="px-6 py-4 text-center">
                        <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-sm ${typeof rankBadge === 'string' && rankBadge.includes('bg-') ? rankBadge + ' font-bold' : rankBadge}`}>
                          {index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
                        </div>
                      </td>

                      {/* Student Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                          {(student?.email?.[0] ?? "?").toUpperCase()}
                        </div>

                          <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            {student.email}
                          </span>
                        </div>
                      </td>

                      {/* Progress Column */}
                      <td className="px-6 py-4">
                        <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-500">
                             <span>{student.questionsSolved} <span className="text-slate-400 font-normal">/ {totalQuestionsCount} Qs</span></span>
                             <span className={student.completionRate === 100 ? "text-emerald-600" : ""}>{student.completionRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                student.completionRate === 100 ? "bg-emerald-500" : "bg-indigo-600"
                              }`} 
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Score Column */}
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-slate-50 text-slate-700 border border-slate-200">
                          {student.totalScore}
                        </span>
                      </td>

                      {/* Last Active Column */}
                      <td className="px-6 py-4 text-right text-sm text-slate-500">
                        {student.lastActive}
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/Analytics/${student.id}`} 
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Student Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
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
