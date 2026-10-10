"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Editor, { OnMount } from "@monaco-editor/react";
import dynamic from "next/dynamic";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

// --- TYPES ---
type TestCaseDisplay = {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
};

type TestCaseResult = {
  test_case_id?: string;
  status: "Passed" | "Failed" | "TLE" | "MLE" | "Runtime Error" | "Compilation Error";
  execution_time: number;
  student_output?: string;
  expected_output?: string;
  is_hidden: boolean;
  points_earned: number;
};

// --- ICONS ---
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const Spinner = () => <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

// --- MAIN PAGE COMPONENT ---
export default function QuestionSolvePage({ params }: { params: { labId: string, questionId: string } }) {
  const [question, setQuestion] = useState<any>(null);
  const [testCases, setTestCases] = useState<TestCaseDisplay[]>([]);
  const [submissionResults, setSubmissionResults] = useState<TestCaseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`# Write your solution here (Python 3)\n\nimport sys\n\ndef solve():\n    # Read inputs\n    # line = sys.stdin.readline()\n    pass\n\nif __name__ == "__main__":\n    solve()`);
  const [userId, setUserId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"testcases" | "results">("testcases");
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [runResults, setRunResults] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [nextQuestionId, setNextQuestionId] = useState<string | null>(null);
  
  // Timer
  const [timeElapsed, setTimeElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const supabase = createClient();
  const router = useRouter();
  const STORAGE_KEY = `draft_${userId}_${params.questionId}`;

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const { data: q, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", params.questionId)
          .single();
        if (qError) throw qError;
        setQuestion(q);

        const { data: allQuestions } = await supabase
          .from("questions")
          .select("id")
          .eq("lab_id", params.labId)
          .order("created_at", { ascending: true });
        
        if (allQuestions) {
          const currentIndex = allQuestions.findIndex(qItem => qItem.id === params.questionId);
          if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
            setNextQuestionId(allQuestions[currentIndex + 1].id);
          }
        }

        // Fetch visible test cases from backend
        try {
          const res = await fetch(`http://localhost:8000/testcases/${params.questionId}`);
          if (res.ok) {
            const data = await res.json();
            setTestCases(data.test_cases || []);
          }
        } catch (e) {
          console.error("Error fetching test cases from backend:", e);
        }

        // Load saved code
        if (user) {
          const saved = localStorage.getItem(`draft_${user.id}_${params.questionId}`);
          if (saved) {
            setCode(saved);
          } else {
            const { data: lastSub } = await supabase
              .from("submissions")
              .select("code")
              .eq("student_id", user.id)
              .eq("question_id", params.questionId)
              .order("submitted_at", { ascending: false })
              .limit(1)
              .single();
            if (lastSub?.code) setCode(lastSub.code);
          }
        }
      } catch (err) {
        console.error("Error fetching problem:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.questionId]);

  // Autosave
  useEffect(() => {
    if (!userId) return;
    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, code);
      setIsSaved(true);
    }, 1000);
    setIsSaved(false);
    return () => clearTimeout(handler);
  }, [code, STORAGE_KEY, userId]);

  // Anti-cheating
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'p' || e.key === 'C' || e.key === 'P')) {
        e.preventDefault();
        alert("Copying and printing are disabled.");
      }
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('');
        alert("Screenshots are discouraged.");
      }
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Run against visible test cases
  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab("results");
    setRunResults([]);

    try {
      const response = await fetch('http://localhost:8000/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: "python",
          code: code,
          test_cases: testCases.map(tc => ({
            input: tc.input,
            expected_output: tc.expected_output
          }))
        })
      });

      if (!response.ok) throw new Error("Execution failed");
      const data = await response.json();
      setRunResults(data.results || []);
    } catch (err: any) {
      setRunResults(testCases.map(tc => ({
        status: "Error",
        input: tc.input,
        expected_output: tc.expected_output,
        student_output: "Error: " + err.message,
      })));
    } finally {
      setIsRunning(false);
    }
  };

  // Submit against all test cases
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setActiveTab("results");
    setRunResults([]); // Clear run results to show submission results properly

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert("You must be logged in."); return; }

      const response = await fetch('http://localhost:8000/submit-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          question_id: params.questionId,
          language: "python",
          code: code
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Submission failed");
      }

      const result = await response.json();
      setSubmissionResults(result.results || []);

      const passedCount = (result.results || []).filter((r: any) => r.status === "Passed").length;
      const totalCount = (result.results || []).length;
      if (passedCount === totalCount && totalCount > 0) {
        router.refresh();
      }
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset to template? Your draft will be deleted.")) {
      localStorage.removeItem(STORAGE_KEY);
      setCode(`# Write your solution here (Python 3)\n\nimport sys\n\ndef solve():\n    # Read inputs\n    pass\n\nif __name__ == "__main__":\n    solve()`);
    }
  };

  // Keyboard shortcuts
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun();
    });
  };

  const fullDescription = useMemo(() => {
    if (!question) return "";
    let desc = question.description || "";
    
    if (testCases && testCases.length > 0) {
      desc += "\n\n### Examples\n\n";
      testCases.forEach((tc, idx) => {
        desc += `**Example ${idx + 1}:**\n`;
        desc += "```text\n";
        desc += `Input:\n${tc.input}\n`;
        desc += `Output:\n${tc.expected_output}\n`;
        desc += "```\n\n";
      });
    }
    return desc;
  }, [question, testCases]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#1a1a2e] text-gray-400">
      <div className="flex items-center gap-3"><Spinner /> Loading problem...</div>
    </div>
  );
  if (!question) return <div className="h-screen flex items-center justify-center bg-[#1a1a2e] text-red-400">Problem not found.</div>;

  const passedAll = submissionResults.length > 0 && submissionResults.every(r => r.status === "Passed");

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-gray-200 overflow-hidden">
      {/* Top Navbar */}
      <div className="h-12 bg-[#1a1a2e] border-b border-[#2d2d44] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/problems/${params.labId}`} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Back
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-sm font-semibold text-white truncate max-w-[300px]">{question.title}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
            question.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
            question.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-green-500/20 text-green-400'
          }`}>{question.difficulty}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-400 font-mono text-xs bg-[#262640] px-3 py-1.5 rounded-md border border-[#2d2d44]">
            <ClockIcon />
            {formatTime(timeElapsed)}
          </div>
          <span className="text-[10px] text-gray-500">{isSaved ? "✓ Saved" : "Saving..."}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Problem Description */}
        <div className="w-[45%] border-r border-[#2d2d44] flex flex-col overflow-hidden">
          <div className="h-10 bg-[#262640] border-b border-[#2d2d44] flex items-center px-4">
            <span className="text-xs font-medium text-gray-300">Description</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 select-none" data-color-mode="dark">
            <MarkdownPreview
              source={fullDescription}
              style={{ backgroundColor: 'transparent', color: '#e2e8f0' }}
            />
          </div>
        </div>

        {/* RIGHT: Code Editor + Test Cases */}
        <div className="w-[55%] flex flex-col overflow-hidden">
          {/* Editor Header */}
          <div className="h-10 bg-[#262640] border-b border-[#2d2d44] flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-300 font-mono">main.py</span>
              <span className="text-[10px] text-gray-500 bg-[#1a1a2e] px-2 py-0.5 rounded border border-[#2d2d44]">Python 3</span>
            </div>
            <button onClick={handleReset} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">Reset Code</button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                tabSize: 4,
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                cursorBlinking: 'smooth',
              }}
            />
          </div>

          {/* Test Cases Panel */}
          <div className="h-[280px] border-t border-[#2d2d44] bg-[#1e1e32] flex flex-col shrink-0">
            {/* Tabs */}
            <div className="h-10 bg-[#262640] border-b border-[#2d2d44] flex items-center justify-between px-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("testcases")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === "testcases"
                      ? "bg-[#1a1a2e] text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Testcases
                </button>
                <button
                  onClick={() => setActiveTab("results")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                    activeTab === "results"
                      ? "bg-[#1a1a2e] text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Results
                  {runResults.length > 0 && (
                    <span className={`w-2 h-2 rounded-full ${
                      runResults.every((r: any) => r.status === "Passed") ? "bg-green-400" : "bg-red-400"
                    }`}></span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-200 bg-[#1a1a2e] border border-[#2d2d44] rounded hover:bg-[#2d2d44] transition-colors disabled:opacity-40"
                >
                  {isRunning ? <Spinner /> : <PlayIcon />}
                  {isRunning ? "Running..." : "Run"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-40"
                >
                  {isSubmitting ? <Spinner /> : <UploadIcon />}
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "testcases" && (
                <div>
                  {/* Test Case Selector Pills */}
                  <div className="flex gap-2 mb-4">
                    {testCases.map((tc, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTestCase(i)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          selectedTestCase === i
                            ? "bg-[#3d3d5c] text-white"
                            : "bg-[#262640] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        Case {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected Test Case Content */}
                  {testCases[selectedTestCase] && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Input</label>
                        <div className="mt-1 bg-[#262640] border border-[#2d2d44] rounded-md p-3 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                          {testCases[selectedTestCase].input || "<empty>"}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Expected Output</label>
                        <div className="mt-1 bg-[#262640] border border-[#2d2d44] rounded-md p-3 font-mono text-sm text-gray-300 whitespace-pre-wrap">
                          {testCases[selectedTestCase].expected_output || "<empty>"}
                        </div>
                      </div>
                    </div>
                  )}
                  {testCases.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No visible test cases for this problem.</p>
                  )}
                </div>
              )}

              {activeTab === "results" && (
                <div>
                  {/* Run Results */}
                  {runResults.length > 0 && (
                    <div className="space-y-3">
                      {passedAll && submissionResults.length > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2 text-green-400 text-sm font-medium">
                          <CheckIcon /> All test cases passed! Accepted.
                        </div>
                      )}
                      {runResults.map((r: any, i: number) => (
                        <div key={i} className={`bg-[#262640] border rounded-lg p-3 ${
                          r.status === "Passed" ? "border-green-500/30" : "border-red-500/30"
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400">Test Case {i + 1}</span>
                            <span className={`flex items-center gap-1 text-xs font-bold ${
                              r.status === "Passed" ? "text-green-400" : "text-red-400"
                            }`}>
                              {r.status === "Passed" ? <CheckIcon /> : <XIcon />}
                              {r.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500 block mb-1">Expected</span>
                              <div className="bg-[#1a1a2e] rounded p-2 font-mono text-green-300 whitespace-pre-wrap">{r.expected_output || "<empty>"}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Your Output</span>
                              <div className={`bg-[#1a1a2e] rounded p-2 font-mono whitespace-pre-wrap ${
                                r.status === "Passed" ? "text-green-300" : "text-red-300"
                              }`}>{r.student_output || "<empty>"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submission Results */}
                  {submissionResults.length > 0 && runResults.length === 0 && (
                    <div className="space-y-3">
                      {passedAll && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between gap-2 text-green-400 text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <CheckIcon /> All test cases passed! Accepted.
                          </div>
                          {nextQuestionId && (
                            <Link href={`/problems/${params.labId}/${nextQuestionId}`} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs transition-colors">
                              Next Question &rarr;
                            </Link>
                          )}
                        </div>
                      )}
                      {submissionResults.map((r, i) => (
                        <div key={i} className={`bg-[#262640] border rounded-lg p-3 ${
                          r.status === "Passed" ? "border-green-500/30" : "border-red-500/30"
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-400">Test Case {i + 1}</span>
                            <span className={`flex items-center gap-1 text-xs font-bold ${
                              r.status === "Passed" ? "text-green-400" : "text-red-400"
                            }`}>
                              {r.status === "Passed" ? <CheckIcon /> : <XIcon />}
                              {r.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500 block mb-1">Expected</span>
                              <div className="bg-[#1a1a2e] rounded p-2 font-mono text-green-300 whitespace-pre-wrap">{r.expected_output || "<empty>"}</div>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-1">Your Output</span>
                              <div className={`bg-[#1a1a2e] rounded p-2 font-mono whitespace-pre-wrap ${
                                r.status === "Passed" ? "text-green-300" : "text-red-300"
                              }`}>{r.student_output || "<empty>"}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {runResults.length === 0 && submissionResults.length === 0 && (
                    <p className="text-gray-500 text-sm italic">Click "Run" to test against example cases, or "Submit" to evaluate against all cases.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}