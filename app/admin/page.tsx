"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  BookOpen,
  HelpCircle,
  Trophy,
  Plus,
  Edit2,
  Trash2,
  Languages,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import Loading from "@/components/Loading";
import api from "@/lib/axios";

export default function AdminPage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState({
    usersCount: 0,
    testsCount: 0,
    questionsCount: 0,
    attemptsCount: 0,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Tests state
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState("");
  const [testTimeLimit, setTestTimeLimit] = useState(134);
  const [testDifficulty, setTestDifficulty] = useState("medium");

  // Questions state
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Question Form Fields
  const [qType, setQType] = useState<"multiple_choice" | "spr">("multiple_choice");
  const [qSection, setQSection] = useState("Reading and Writing");
  const [qModule, setQModule] = useState(1);
  const [qText, setQText] = useState("");
  const [qPassage, setQPassage] = useState("");
  const [qChoices, setQChoices] = useState<string[]>(["", "", "", ""]);
  const [qCorrectAnswer, setQCorrectAnswer] = useState("A");
  const [qAcceptedAnswers, setQAcceptedAnswers] = useState("28");
  const [qExplanation, setQExplanation] = useState("");
  const [qDomain, setQDomain] = useState("Information and Ideas");
  const [qSkill, setQSkill] = useState("Central Ideas and Details");
  const [qDifficulty, setQDifficulty] = useState("medium");
  const [qImageUrl, setQImageUrl] = useState("");

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // System Vocab state
  const [vocabDecks, setVocabDecks] = useState<any[]>([]);
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDesc, setDeckDesc] = useState("");

  const isAdmin = session?.user?.role === "admin";

  // Fetch metrics on mount
  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
      fetchTests();
      fetchUsers();
      fetchVocabDecks();
    }
  }, [isAdmin]);

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await api.get("/api/admin/metrics");
      setMetrics(res.data?.metrics || {});
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const res = await api.get("/api/admin/tests");
      const list = res.data?.tests || [];
      setTests(list);
      if (list.length > 0 && !selectedTestId) {
        setSelectedTestId(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load tests:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchQuestions = async (testId: string) => {
    try {
      setLoadingQuestions(true);
      const res = await api.get(`/api/questions?testId=${testId}`);
      setQuestions(res.data?.questions || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (selectedTestId) {
      fetchQuestions(selectedTestId);
    }
  }, [selectedTestId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/api/admin/users");
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchVocabDecks = async () => {
    try {
      setLoadingVocab(true);
      const res = await api.get("/api/admin/vocab/decks");
      setVocabDecks(res.data?.decks || []);
    } catch (err) {
      console.error("Failed to load system decks:", err);
    } finally {
      setLoadingVocab(false);
    }
  };

  // -------------------------------------------------------------------------
  // TEST HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenTestModal = (test?: any) => {
    if (test) {
      setEditingTestId(test._id);
      setTestTitle(test.title);
      setTestTimeLimit(test.timeLimit || 134);
      setTestDifficulty(test.difficulty || "medium");
    } else {
      setEditingTestId(null);
      setTestTitle("");
      setTestTimeLimit(134);
      setTestDifficulty("medium");
    }
    setTestModalOpen(true);
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    try {
      if (editingTestId) {
        await api.put(`/api/admin/tests/${editingTestId}`, {
          title: testTitle.trim(),
          timeLimit: testTimeLimit,
          difficulty: testDifficulty,
        });
      } else {
        await api.post("/api/admin/tests", {
          title: testTitle.trim(),
          timeLimit: testTimeLimit,
          difficulty: testDifficulty,
          sections: [
            { name: "Reading and Writing", module: 1, questionsCount: 27, timeLimit: 32 },
            { name: "Reading and Writing", module: 2, questionsCount: 27, timeLimit: 32 },
            { name: "Math", module: 1, questionsCount: 22, timeLimit: 35 },
            { name: "Math", module: 2, questionsCount: 22, timeLimit: 35 },
          ],
        });
      }
      setTestModalOpen(false);
      fetchTests();
      fetchMetrics();
    } catch (err) {
      console.error("Failed to save test:", err);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test and its associated questions?")) return;
    try {
      await api.delete(`/api/admin/tests/${testId}`);
      fetchTests();
      fetchMetrics();
    } catch (err) {
      console.error("Failed to delete test:", err);
    }
  };

  // -------------------------------------------------------------------------
  // QUESTION HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenQuestionModal = (q?: any) => {
    if (q) {
      setEditingQuestionId(q._id);
      setQType(q.questionType === "spr" ? "spr" : "multiple_choice");
      setQSection(q.section || "Reading and Writing");
      setQModule(q.module || 1);
      setQText(q.questionText || "");
      setQPassage(q.passage || "");
      setQChoices(q.choices?.length === 4 ? q.choices : ["", "", "", ""]);
      setQCorrectAnswer(q.correctAnswer || "A");
      setQAcceptedAnswers(q.acceptedAnswers ? q.acceptedAnswers.join(", ") : "");
      setQExplanation(q.explanation || "");
      setQDomain(q.domain || "Craft and Structure");
      setQSkill(q.skill || "Words in Context");
      setQDifficulty(q.difficulty || "medium");
      setQImageUrl(q.imageUrl || "");
    } else {
      setEditingQuestionId(null);
      setQType("multiple_choice");
      setQSection("Reading and Writing");
      setQModule(1);
      setQText("");
      setQPassage("");
      setQChoices(["", "", "", ""]);
      setQCorrectAnswer("A");
      setQAcceptedAnswers("");
      setQExplanation("");
      setQDomain("Craft and Structure");
      setQSkill("Words in Context");
      setQDifficulty("medium");
      setQImageUrl("");
    }
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId || !qText.trim()) return;

    const acceptedArr = qAcceptedAnswers
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const payload = {
      testId: selectedTestId,
      section: qSection,
      module: qModule,
      questionText: qText.trim(),
      passage: qPassage.trim() || undefined,
      questionType: qType,
      choices: qType === "multiple_choice" ? qChoices : undefined,
      correctAnswer: qType === "multiple_choice" ? qCorrectAnswer : undefined,
      acceptedAnswers: qType === "spr" ? acceptedArr : undefined,
      explanation: qExplanation.trim() || undefined,
      domain: qDomain.trim(),
      skill: qSkill.trim(),
      difficulty: qDifficulty,
      imageUrl: qImageUrl.trim() || undefined,
    };

    try {
      if (editingQuestionId) {
        await api.put(`/api/admin/questions/${editingQuestionId}`, payload);
      } else {
        await api.post("/api/admin/questions", payload);
      }
      setQuestionModalOpen(false);
      fetchQuestions(selectedTestId);
      fetchMetrics();
    } catch (err) {
      console.error("Failed to save question:", err);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Delete this question from the test?")) return;
    try {
      await api.delete(`/api/admin/questions/${qId}`);
      if (selectedTestId) fetchQuestions(selectedTestId);
      fetchMetrics();
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  // -------------------------------------------------------------------------
  // USER ROLE HANDLERS
  // -------------------------------------------------------------------------
  const handleChangeRole = async (userId: string, newRole: "student" | "admin") => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error("Failed to change user role:", err);
    }
  };

  // -------------------------------------------------------------------------
  // SYSTEM VOCAB DECK HANDLERS
  // -------------------------------------------------------------------------
  const handleOpenVocabModal = (deck?: any) => {
    if (deck) {
      setEditingDeckId(deck._id);
      setDeckTitle(deck.title);
      setDeckDesc(deck.description || "");
    } else {
      setEditingDeckId(null);
      setDeckTitle("");
      setDeckDesc("");
    }
    setVocabModalOpen(true);
  };

  const handleSaveVocabDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckTitle.trim()) return;

    try {
      if (editingDeckId) {
        await api.put(`/api/admin/vocab/decks/${editingDeckId}`, {
          title: deckTitle.trim(),
          description: deckDesc.trim(),
        });
      } else {
        await api.post("/api/admin/vocab/decks", {
          title: deckTitle.trim(),
          description: deckDesc.trim(),
        });
      }
      setVocabModalOpen(false);
      fetchVocabDecks();
    } catch (err) {
      console.error("Failed to save system deck:", err);
    }
  };

  const handleDeleteVocabDeck = async (deckId: string) => {
    if (!confirm("Delete this system vocab deck?")) return;
    try {
      await api.delete(`/api/admin/vocab/decks/${deckId}`);
      fetchVocabDecks();
    } catch (err) {
      console.error("Failed to delete system deck:", err);
    }
  };

  // -------------------------------------------------------------------------
  // ACCESS GUARD
  // -------------------------------------------------------------------------
  if (status === "loading") {
    return <Loading message="Checking administrative permissions..." />;
  }

  if (!session || !isAdmin) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#fdede8] text-[var(--state-danger)] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] font-display">
          Unauthorized Access
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          You must be logged in with an administrator account to view the Admin Studio.
        </p>
        <Link href="/auth">
          <Button variant="primary" size="sm">
            Sign In as Admin
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Admin Management Studio"
        description="Unified management panel for tests, questions, users, and system vocabulary."
        badge={<Badge variant="brand">Admin Role</Badge>}
      />

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: "overview", label: "Overview Metrics", icon: <Trophy className="w-4 h-4" /> },
          { key: "tests", label: "Tests Catalog", icon: <BookOpen className="w-4 h-4" /> },
          { key: "questions", label: "Questions Editor", icon: <HelpCircle className="w-4 h-4" /> },
          { key: "users", label: "Users & Roles", icon: <Users className="w-4 h-4" /> },
          { key: "vocab", label: "System Vocab", icon: <Languages className="w-4 h-4" /> },
        ]}
      />

      {/* -------------------------------------------------------------------
          TAB 1: OVERVIEW METRICS
      -------------------------------------------------------------------- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Registered Users"
              value={metrics.usersCount}
              sublabel="Students &amp; Admins"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Tests Catalog"
              value={metrics.testsCount}
              sublabel="Active Official Tests"
              icon={<BookOpen className="w-4 h-4" />}
            />
            <StatCard
              label="Questions Bank"
              value={metrics.questionsCount}
              sublabel="MCQ &amp; SPR items"
              icon={<HelpCircle className="w-4 h-4" />}
            />
            <StatCard
              label="Student Attempts"
              value={metrics.attemptsCount}
              sublabel="Graded sessions"
              icon={<Trophy className="w-4 h-4" />}
            />
          </div>

          <Card>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-2">
              Platform Status
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              RonanSAT OOP Edition is running with in-memory MongoDB persistence and zero-config demo
              accounts. All question imports from College Board sample tests have been verified with KaTeX
              math rendering and SPR answer equivalences.
            </p>
          </Card>
        </div>
      )}

      {/* -------------------------------------------------------------------
          TAB 2: TESTS CRUD
      -------------------------------------------------------------------- */}
      {activeTab === "tests" && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                Tests Catalog ({tests.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Manage test titles, timing limits, and section structure.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenTestModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              New Test
            </Button>
          </div>

          {loadingTests ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Time Limit</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3">Questions</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {tests.map((test) => (
                    <tr key={test._id} className="hover:bg-[var(--bg-canvas)]/50">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)] text-sm">
                        {test.title}
                      </td>
                      <td className="py-3 px-3">{test.timeLimit || 134} mins</td>
                      <td className="py-3 px-3">
                        <Badge variant="brand" size="sm">
                          {test.difficulty || "medium"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">{test.questionsCount || 98} Qs</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenTestModal(test)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                            title="Edit test"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTest(test._id)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)] hover:bg-[#fdede8] cursor-pointer"
                            title="Delete test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------
          TAB 3: QUESTIONS CRUD & EDITOR
      -------------------------------------------------------------------- */}
      {activeTab === "questions" && (
        <Card className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Select Test:
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="workbook-input max-w-xs text-xs font-bold"
              >
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenQuestionModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Question
            </Button>
          </div>

          {loadingQuestions ? (
            <TableSkeleton rows={5} />
          ) : questions.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-8 h-8" />}
              title="No questions in this test"
              description="Add your first question to build out this test."
              action={
                <Button variant="primary" size="sm" onClick={() => handleOpenQuestionModal()}>
                  Create Question
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Section / Module</th>
                    <th className="py-2.5 px-3">Question Snippet</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Skill</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {questions.map((q, idx) => (
                    <tr key={q._id} className="hover:bg-[var(--bg-canvas)]/50">
                      <td className="py-3 px-3 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                        {q.section} (M{q.module || 1})
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[var(--text-primary)]">
                        <p className="line-clamp-2">{q.questionText}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={q.questionType === "spr" ? "info" : "muted"} size="sm">
                          {q.questionType === "spr" ? "SPR" : "MCQ"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">{q.skill}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenQuestionModal(q)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                            title="Edit question"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q._id)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)] hover:bg-[#fdede8] cursor-pointer"
                            title="Delete question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------
          TAB 4: USERS & ROLE MANAGEMENT
      -------------------------------------------------------------------- */}
      {activeTab === "users" && (
        <Card className="space-y-4">
          <div className="pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
              User Accounts &amp; Roles ({users.length})
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Manage platform credentials and switch roles between student and administrator.
            </p>
          </div>

          {loadingUsers ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Current Role</th>
                    <th className="py-2.5 px-3 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-[var(--bg-canvas)]/50">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                        {u.name || "Student"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[var(--text-muted)]">{u.email}</td>
                      <td className="py-3 px-3">
                        <Badge variant={u.role === "admin" ? "brand" : "info"} size="sm">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeRole(u._id, e.target.value as "student" | "admin")
                          }
                          className="workbook-input max-w-[120px] text-xs font-semibold"
                        >
                          <option value="student">student</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------
          TAB 5: SYSTEM VOCAB DECKS
      -------------------------------------------------------------------- */}
      {activeTab === "vocab" && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] font-display">
                System Vocab Decks ({vocabDecks.length})
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Manage global vocabulary decks available to all platform students.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenVocabModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              New System Deck
            </Button>
          </div>

          {loadingVocab ? (
            <TableSkeleton rows={3} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Card Count</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {vocabDecks.map((deck) => (
                    <tr key={deck._id} className="hover:bg-[var(--bg-canvas)]/50">
                      <td className="py-3 px-3 font-bold text-[var(--text-primary)] text-sm">
                        {deck.title}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)] max-w-sm">
                        {deck.description}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{deck.totalCards || 0}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenVocabModal(deck)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                            title="Edit deck"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVocabDeck(deck._id)}
                            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--state-danger)] hover:bg-[#fdede8] cursor-pointer"
                            title="Delete deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT TEST
      -------------------------------------------------------------------- */}
      <Dialog
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={editingTestId ? "Edit Test" : "Create New SAT Test"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveTest} className="space-y-4 pt-2">
          <Input
            label="Test Title"
            required
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="e.g. SAT Practice Test #3"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Total Time Limit (Minutes)"
                type="number"
                required
                value={testTimeLimit}
                onChange={(e) => setTestTimeLimit(parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={testDifficulty}
                onChange={(e) => setTestDifficulty(e.target.value)}
                className="workbook-input"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setTestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingTestId ? "Save Changes" : "Create Test"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT QUESTION (Both MCQ & SPR)
      -------------------------------------------------------------------- */}
      <Dialog
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title={editingQuestionId ? "Edit Question" : "Create Question"}
        description="Configure question text, passage, answers, domain, and skill."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Question Type Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Question Type:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQType("multiple_choice")}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                  qType === "multiple_choice"
                    ? "bg-[var(--accent-brand)] text-[var(--text-on-brand)]"
                    : "bg-white text-[var(--text-muted)] border border-[var(--border-subtle)]"
                }`}
              >
                Multiple Choice (MCQ)
              </button>
              <button
                type="button"
                onClick={() => setQType("spr")}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer ${
                  qType === "spr"
                    ? "bg-[var(--accent-brand)] text-[var(--text-on-brand)]"
                    : "bg-white text-[var(--text-muted)] border border-[var(--border-subtle)]"
                }`}
              >
                Student Produced Response (SPR)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                value={qSection}
                onChange={(e) => setQSection(e.target.value)}
                className="workbook-input"
              >
                <option value="Reading and Writing">Reading and Writing</option>
                <option value="Math">Math</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                Module Number
              </label>
              <select
                value={qModule}
                onChange={(e) => setQModule(parseInt(e.target.value, 10))}
                className="workbook-input"
              >
                <option value={1}>Module 1</option>
                <option value={2}>Module 2</option>
              </select>
            </div>
          </div>

          {/* Passage (optional for R&W) */}
          <Textarea
            label="Reading Passage (Optional)"
            value={qPassage}
            onChange={(e) => setQPassage(e.target.value)}
            placeholder="Passage text if this is a reading question..."
          />

          {/* Question Text */}
          <Textarea
            label="Question Prompt / Text"
            required
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="The main question prompt (KaTeX math supported e.g. \( f(x) = x^2 \))..."
          />

          {/* Image URL (Optional) */}
          <Input
            label="Figure / Graphic Image URL (Optional)"
            value={qImageUrl}
            onChange={(e) => setQImageUrl(e.target.value)}
            placeholder="/demo-figures/fig-xxx.png"
          />

          {/* Answers based on Type */}
          {qType === "multiple_choice" ? (
            <div className="space-y-2.5 p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                Choices (A, B, C, D) &amp; Correct Key
              </span>
              {["A", "B", "C", "D"].map((letter, idx) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 font-bold text-xs text-[var(--text-muted)] text-center">
                    {letter}
                  </span>
                  <input
                    type="text"
                    required
                    value={qChoices[idx] || ""}
                    onChange={(e) => {
                      const updated = [...qChoices];
                      updated[idx] = e.target.value;
                      setQChoices(updated);
                    }}
                    placeholder={`Choice ${letter}...`}
                    className="workbook-input text-xs flex-1"
                  />
                  <input
                    type="radio"
                    name="correct-answer-radio"
                    checked={qCorrectAnswer === qChoices[idx] || qCorrectAnswer === letter}
                    onChange={() => setQCorrectAnswer(qChoices[idx] || letter)}
                    className="w-4 h-4 text-[var(--accent-brand)]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-[var(--ui-radius-sm)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                SPR Accepted Answers (Comma-separated)
              </span>
              <Input
                value={qAcceptedAnswers}
                onChange={(e) => setQAcceptedAnswers(e.target.value)}
                placeholder="e.g. 28, 0.5, 1/2"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Our OOP question model will automatically validate equivalent fractions and decimals.
              </p>
            </div>
          )}

          {/* Domain & Skill */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Domain"
              value={qDomain}
              onChange={(e) => setQDomain(e.target.value)}
              placeholder="e.g. Algebra"
            />
            <Input
              label="Skill"
              value={qSkill}
              onChange={(e) => setQSkill(e.target.value)}
              placeholder="e.g. Linear equations"
            />
          </div>

          {/* Explanation */}
          <Textarea
            label="Detailed Explanation"
            value={qExplanation}
            onChange={(e) => setQExplanation(e.target.value)}
            placeholder="Step-by-step breakdown and rationale..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingQuestionId ? "Save Question" : "Create Question"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT SYSTEM VOCAB DECK
      -------------------------------------------------------------------- */}
      <Dialog
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        title={editingDeckId ? "Edit System Deck" : "Create System Vocab Deck"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveVocabDeck} className="space-y-4 pt-2">
          <Input
            label="Deck Title"
            required
            value={deckTitle}
            onChange={(e) => setDeckTitle(e.target.value)}
            placeholder="e.g. Essential SAT Vocabulary (Core 30)"
          />
          <Textarea
            label="Description"
            value={deckDesc}
            onChange={(e) => setDeckDesc(e.target.value)}
            placeholder="Brief explanation of the deck scope..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setVocabModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingDeckId ? "Save Changes" : "Create System Deck"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
