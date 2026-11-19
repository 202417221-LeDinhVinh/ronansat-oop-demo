"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { Tabs } from "@/components/ui/Tabs";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchControl } from "@/components/ui/SearchControl";
import { CompactPagination } from "@/components/ui/CompactPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [, setLoadingMetrics] = useState(true);

  // Tests state
  const [tests, setTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testSearch, setTestSearch] = useState("");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState("");
  const [testTimeLimit, setTestTimeLimit] = useState(134);
  const [testDifficulty, setTestDifficulty] = useState("medium");
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Questions state
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const QUESTIONS_PER_PAGE = 10;
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

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
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 10;

  // System Vocab state
  const [vocabDecks, setVocabDecks] = useState<any[]>([]);
  const [loadingVocab, setLoadingVocab] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabModalOpen, setVocabModalOpen] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [vocabDeckToDelete, setVocabDeckToDelete] = useState<string | null>(null);

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
      setQuestionPage(1);
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
      setUserPage(1);
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

  const confirmDeleteTest = async () => {
    if (!testToDelete) return;
    try {
      await api.delete(`/api/admin/tests/${testToDelete}`);
      setTestToDelete(null);
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

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
      await api.delete(`/api/admin/questions/${questionToDelete}`);
      setQuestionToDelete(null);
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

  const confirmDeleteVocabDeck = async () => {
    if (!vocabDeckToDelete) return;
    try {
      await api.delete(`/api/admin/vocab/decks/${vocabDeckToDelete}`);
      setVocabDeckToDelete(null);
      fetchVocabDecks();
    } catch (err) {
      console.error("Failed to delete system deck:", err);
    }
  };

  // Filtered and Paginated Collections
  const filteredTests = useMemo(() => {
    if (!testSearch.trim()) return tests;
    const q = testSearch.toLowerCase();
    return tests.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.difficulty?.toLowerCase().includes(q)
    );
  }, [tests, testSearch]);

  const filteredQuestions = useMemo(() => {
    if (!questionSearch.trim()) return questions;
    const q = questionSearch.toLowerCase();
    return questions.filter(
      (item) =>
        item.questionText?.toLowerCase().includes(q) ||
        item.skill?.toLowerCase().includes(q) ||
        item.domain?.toLowerCase().includes(q) ||
        item.section?.toLowerCase().includes(q)
    );
  }, [questions, questionSearch]);

  const paginatedQuestions = useMemo(() => {
    const start = (questionPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, questionPage]);

  const totalQuestionPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const filteredVocab = useMemo(() => {
    if (!vocabSearch.trim()) return vocabDecks;
    const q = vocabSearch.toLowerCase();
    return vocabDecks.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
    );
  }, [vocabDecks, vocabSearch]);

  // -------------------------------------------------------------------------
  // ACCESS GUARD
  // -------------------------------------------------------------------------
  if (status === "loading") {
    return <Loading message="Checking administrative permissions..." />;
  }

  if (!session || !isAdmin) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-[#fdede8] border border-[#f8c4b4] text-[var(--state-danger)] flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-ink-fg font-display">
            Unauthorized Access
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            You must be logged in with an administrator account to view the Admin Studio.
          </p>
        </div>
        <Link href="/auth">
          <Button variant="primary" size="sm">
            Sign In as Admin
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Admin Management Studio"
        description="Unified management panel for tests, questions, users, and system vocabulary."
        badge={<Badge variant="brand">Administrator</Badge>}
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
              sublabel="Students & Admins"
              icon={<Users className="w-4 h-4" />}
            />
            <StatCard
              label="Tests Catalog"
              value={metrics.testsCount}
              sublabel="Practice Tests"
              icon={<BookOpen className="w-4 h-4" />}
            />
            <StatCard
              label="Questions Bank"
              value={metrics.questionsCount}
              sublabel="MCQ & SPR items"
              icon={<HelpCircle className="w-4 h-4" />}
            />
            <StatCard
              label="Student Attempts"
              value={metrics.attemptsCount}
              sublabel="Graded sessions"
              icon={<Trophy className="w-4 h-4" />}
            />
          </div>

          <div className="workbook-panel p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <h3 className="text-base font-bold text-ink-fg font-display">
                RonanSAT Platform Status
              </h3>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
              RonanSAT OOP Edition is running with in-memory MongoDB persistence and zero-config demo accounts.
              Question imports are formatted with KaTeX mathematical typography,
              SPR answer equivalences, and Leitner spaced-repetition vocabulary tracking.
            </p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          TAB 2: TESTS CRUD
      -------------------------------------------------------------------- */}
      {activeTab === "tests" && (
        <div className="workbook-panel p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-ink-fg font-display">
                Tests Catalog ({tests.length})
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Manage test titles, timing limits, and section structure.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <SearchControl
                query={testSearch}
                onQueryChange={setTestSearch}
                placeholder="Search tests..."
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenTestModal()}
                icon={<Plus className="w-4 h-4" />}
              >
                <span>New Test</span>
              </Button>
            </div>
          </div>

          {loadingTests ? (
            <TableSkeleton rows={3} />
          ) : filteredTests.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-ink-muted" />}
              title="No tests found"
              description="Create your first test or clear your search query."
            />
          ) : (
            <div className="relative overflow-x-auto max-h-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-surface-white z-10">Title</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-32">Time Limit</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-28">Difficulty</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-28">Questions</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.map((test) => (
                    <TableRow key={test._id} className="hover:bg-canvas/50">
                      <TableCell className="font-bold text-ink-fg font-display text-sm">
                        {test.title}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{test.timeLimit || 134} mins</TableCell>
                      <TableCell>
                        <Badge variant="brand" size="sm">
                          {test.difficulty || "medium"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold">{test.questionsCount || 98} Qs</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenTestModal(test)}
                            className="p-1.5 rounded text-ink-muted hover:text-ink-fg hover:bg-canvas transition-colors"
                            title="Edit test"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTestToDelete(test._id)}
                            className="p-1.5 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors"
                            title="Delete test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------
          TAB 3: QUESTIONS CRUD & EDITOR
      -------------------------------------------------------------------- */}
      {activeTab === "questions" && (
        <div className="workbook-panel p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Select Test:
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="workbook-input max-w-xs text-xs font-bold bg-surface-white"
              >
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <SearchControl
                query={questionSearch}
                onQueryChange={(val) => {
                  setQuestionSearch(val);
                  setQuestionPage(1);
                }}
                placeholder="Search questions..."
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenQuestionModal()}
                icon={<Plus className="w-4 h-4" />}
              >
                <span>Add Question</span>
              </Button>
            </div>
          </div>

          {loadingQuestions ? (
            <TableSkeleton rows={5} />
          ) : filteredQuestions.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="w-8 h-8 text-ink-muted" />}
              title="No questions in this test"
              description="Add your first question to build out this test."
              action={
                <Button variant="primary" size="sm" onClick={() => handleOpenQuestionModal()}>
                  Create Question
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto max-h-[560px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-12 font-mono">#</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-36">Section / Mod</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 max-w-[320px]">Question Snippet</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-20">Type</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-56 min-w-[200px]">Skill</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQuestions.map((q, idx) => {
                      const absoluteIdx = (questionPage - 1) * QUESTIONS_PER_PAGE + idx + 1;
                      return (
                        <TableRow key={q._id} className="hover:bg-canvas/50">
                          <TableCell className="font-mono font-bold text-ink-muted text-xs">
                            {absoluteIdx}
                          </TableCell>
                          <TableCell className="font-semibold text-ink-fg text-xs">
                            {q.section} (M{q.module || 1})
                          </TableCell>
                          <TableCell className="max-w-[320px] text-ink-fg">
                            <p className="line-clamp-2 text-xs font-medium leading-relaxed">
                              {q.questionText}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={q.questionType === "spr" ? "info" : "muted"} size="sm">
                              {q.questionType === "spr" ? "SPR" : "MCQ"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-ink-muted font-medium leading-snug max-w-[220px] whitespace-normal break-words">
                            {q.skill}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenQuestionModal(q)}
                                className="p-1.5 rounded text-ink-muted hover:text-ink-fg hover:bg-canvas transition-colors"
                                title="Edit question"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuestionToDelete(q._id)}
                                className="p-1.5 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors"
                                title="Delete question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {totalQuestionPages > 1 && (
                <div className="pt-2 flex justify-center">
                  <CompactPagination
                    page={questionPage}
                    totalPages={totalQuestionPages}
                    onChange={setQuestionPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------
          TAB 4: USERS & ROLE MANAGEMENT
      -------------------------------------------------------------------- */}
      {activeTab === "users" && (
        <div className="workbook-panel p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-ink-fg font-display">
                User Accounts &amp; Roles ({users.length})
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Manage platform credentials and switch roles between student and administrator.
              </p>
            </div>
            <SearchControl
              query={userSearch}
              onQueryChange={(val) => {
                setUserSearch(val);
                setUserPage(1);
              }}
              placeholder="Search users..."
            />
          </div>

          {loadingUsers ? (
            <TableSkeleton rows={3} />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-ink-muted" />}
              title="No users found"
              description="No user accounts match your search filter."
            />
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto max-h-[560px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky top-0 bg-surface-white z-10">User</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10">Email</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-32">Current Role</TableHead>
                      <TableHead className="sticky top-0 bg-surface-white z-10 w-36 text-right">Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((u) => (
                      <TableRow key={u._id} className="hover:bg-canvas/50">
                        <TableCell className="font-bold text-ink-fg font-display text-sm">
                          {u.name || "Student"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-ink-muted">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === "admin" ? "brand" : "info"} size="sm">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleChangeRole(u._id, e.target.value as "student" | "admin")
                            }
                            className="workbook-input max-w-[120px] text-xs font-semibold bg-surface-white"
                          >
                            <option value="student">student</option>
                            <option value="admin">admin</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalUserPages > 1 && (
                <div className="pt-2 flex justify-center">
                  <CompactPagination
                    page={userPage}
                    totalPages={totalUserPages}
                    onChange={setUserPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------
          TAB 5: SYSTEM VOCAB DECKS
      -------------------------------------------------------------------- */}
      {activeTab === "vocab" && (
        <div className="workbook-panel p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-ink-fg font-display">
                System Vocab Decks ({vocabDecks.length})
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Manage global vocabulary decks available to all platform students.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <SearchControl
                query={vocabSearch}
                onQueryChange={setVocabSearch}
                placeholder="Search decks..."
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenVocabModal()}
                icon={<Plus className="w-4 h-4" />}
              >
                <span>New System Deck</span>
              </Button>
            </div>
          </div>

          {loadingVocab ? (
            <TableSkeleton rows={3} />
          ) : filteredVocab.length === 0 ? (
            <EmptyState
              icon={<Languages className="w-8 h-8 text-ink-muted" />}
              title="No system decks found"
              description="Create a system vocabulary deck or adjust your search filter."
            />
          ) : (
            <div className="relative overflow-x-auto max-h-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-surface-white z-10">Title</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10">Description</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-28">Card Count</TableHead>
                    <TableHead className="sticky top-0 bg-surface-white z-10 w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVocab.map((deck) => (
                    <TableRow key={deck._id} className="hover:bg-canvas/50">
                      <TableCell className="font-bold text-ink-fg font-display text-sm">
                        {deck.title}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted max-w-sm leading-relaxed">
                        {deck.description}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-brand-strong">
                        {deck.totalCards || 0} cards
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenVocabModal(deck)}
                            className="p-1.5 rounded text-ink-muted hover:text-ink-fg hover:bg-canvas transition-colors"
                            title="Edit deck"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVocabDeckToDelete(deck._id)}
                            className="p-1.5 rounded text-ink-muted hover:text-[var(--state-danger)] hover:bg-[#fdede8] transition-colors"
                            title="Delete deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT TEST
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={editingTestId ? "Edit Test" : "Create New SAT Test"}
        description="Configure test metadata, overall duration, and difficulty level."
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSaveTest} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Test Title
            </label>
            <input
              type="text"
              required
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="e.g. SAT Practice Test #3"
              className="workbook-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Time Limit (Mins)
              </label>
              <input
                type="number"
                required
                value={testTimeLimit}
                onChange={(e) => setTestTimeLimit(parseInt(e.target.value, 10))}
                className="workbook-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={testDifficulty}
                onChange={(e) => setTestDifficulty(e.target.value)}
                className="workbook-input w-full bg-surface-white"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setTestModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingTestId ? "Save Changes" : "Create Test"}
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT QUESTION (Both MCQ & SPR)
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title={editingQuestionId ? "Edit Question" : "Create Question"}
        description="Configure question text, passage, answers, domain, and skill."
        maxWidthClassName="max-w-2xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4 pt-2 max-h-[72vh] overflow-y-auto pr-1">
          {/* Question Type Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-[var(--ui-radius-sm)] bg-canvas border border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Question Type:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQType("multiple_choice")}
                className={`px-3 py-1 rounded-[var(--ui-radius-sm)] text-xs font-bold cursor-pointer transition-colors ${
                  qType === "multiple_choice"
                    ? "bg-brand text-ink-fg brutal-shadow-xs"
                    : "bg-surface-white text-ink-muted border border-border"
                }`}
              >
                Multiple Choice (MCQ)
              </button>
              <button
                type="button"
                onClick={() => setQType("spr")}
                className={`px-3 py-1 rounded-[var(--ui-radius-sm)] text-xs font-bold cursor-pointer transition-colors ${
                  qType === "spr"
                    ? "bg-brand text-ink-fg brutal-shadow-xs"
                    : "bg-surface-white text-ink-muted border border-border"
                }`}
              >
                Student Produced Response (SPR)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                value={qSection}
                onChange={(e) => setQSection(e.target.value)}
                className="workbook-input w-full bg-surface-white"
              >
                <option value="Reading and Writing">Reading and Writing</option>
                <option value="Math">Math</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Module Number
              </label>
              <select
                value={qModule}
                onChange={(e) => setQModule(parseInt(e.target.value, 10))}
                className="workbook-input w-full bg-surface-white"
              >
                <option value={1}>Module 1</option>
                <option value={2}>Module 2</option>
              </select>
            </div>
          </div>

          {/* Passage (optional for R&W) */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Reading Passage (Optional)
            </label>
            <textarea
              rows={3}
              value={qPassage}
              onChange={(e) => setQPassage(e.target.value)}
              placeholder="Passage text if this is a reading question..."
              className="workbook-input w-full resize-none"
            />
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Question Prompt / Text
            </label>
            <textarea
              rows={3}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="The main question prompt (KaTeX math supported e.g. \( f(x) = x^2 \))..."
              className="workbook-input w-full resize-none"
            />
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Figure / Graphic Image URL (Optional)
            </label>
            <input
              type="text"
              value={qImageUrl}
              onChange={(e) => setQImageUrl(e.target.value)}
              placeholder="/demo-figures/fig-xxx.png"
              className="workbook-input w-full"
            />
          </div>

          {/* Answers based on Type */}
          {qType === "multiple_choice" ? (
            <div className="space-y-2.5 p-3.5 rounded-[var(--ui-radius-sm)] bg-canvas border border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">
                Choices (A, B, C, D) &amp; Select Correct Answer
              </span>
              {["A", "B", "C", "D"].map((letter, idx) => (
                <div key={letter} className="flex items-center gap-2">
                  <span className="w-6 font-mono font-bold text-xs text-ink-muted text-center">
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
                    className="workbook-input text-xs flex-1 bg-surface-white"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-ink-muted">
                    <input
                      type="radio"
                      name="correct-answer-radio"
                      checked={qCorrectAnswer === qChoices[idx] || qCorrectAnswer === letter}
                      onChange={() => setQCorrectAnswer(qChoices[idx] || letter)}
                      className="w-4 h-4 text-brand focus:ring-brand"
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-[var(--ui-radius-sm)] bg-canvas border border-border space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                SPR Accepted Answers (Comma-separated)
              </label>
              <input
                type="text"
                value={qAcceptedAnswers}
                onChange={(e) => setQAcceptedAnswers(e.target.value)}
                placeholder="e.g. 28, 0.5, 1/2"
                className="workbook-input w-full bg-surface-white"
              />
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Our OOP question model will automatically validate equivalent fractions and decimals.
              </p>
            </div>
          )}

          {/* Domain & Skill */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Domain
              </label>
              <input
                type="text"
                value={qDomain}
                onChange={(e) => setQDomain(e.target.value)}
                placeholder="e.g. Algebra"
                className="workbook-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                Skill
              </label>
              <input
                type="text"
                value={qSkill}
                onChange={(e) => setQSkill(e.target.value)}
                placeholder="e.g. Linear equations"
                className="workbook-input w-full"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Detailed Explanation
            </label>
            <textarea
              rows={3}
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Step-by-step breakdown and rationale..."
              className="workbook-input w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setQuestionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingQuestionId ? "Save Question" : "Create Question"}
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* -------------------------------------------------------------------
          MODAL: CREATE / EDIT SYSTEM VOCAB DECK
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={vocabModalOpen}
        onClose={() => setVocabModalOpen(false)}
        title={editingDeckId ? "Edit System Deck" : "Create System Vocab Deck"}
        description="Configure titles and descriptions for global vocabulary decks."
        maxWidthClassName="max-w-md"
      >
        <form onSubmit={handleSaveVocabDeck} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Deck Title
            </label>
            <input
              type="text"
              required
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="e.g. Essential SAT Vocabulary (Core 30)"
              className="workbook-input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={deckDesc}
              onChange={(e) => setDeckDesc(e.target.value)}
              placeholder="Brief explanation of the deck scope..."
              className="workbook-input w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button variant="secondary" size="sm" type="button" onClick={() => setVocabModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingDeckId ? "Save Changes" : "Create System Deck"}
            </Button>
          </div>
        </form>
      </ModalDialog>

      {/* Delete Test Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(testToDelete)}
        onOpenChange={(open) => !open && setTestToDelete(null)}
        title="Delete SAT Test"
        description="Are you sure you want to permanently delete this test and all its questions? This action cannot be undone."
        confirmLabel="Delete Test"
        onConfirm={confirmDeleteTest}
      />

      {/* Delete Question Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(questionToDelete)}
        onOpenChange={(open) => !open && setQuestionToDelete(null)}
        title="Delete Question"
        description="Are you sure you want to delete this question from the test? Historical student test attempts referencing this question will remain intact."
        confirmLabel="Delete Question"
        onConfirm={confirmDeleteQuestion}
      />

      {/* Delete Vocab Deck Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(vocabDeckToDelete)}
        onOpenChange={(open) => !open && setVocabDeckToDelete(null)}
        title="Delete System Vocab Deck"
        description="Are you sure you want to delete this global system deck? All associated flashcards will be permanently removed."
        confirmLabel="Delete System Deck"
        onConfirm={confirmDeleteVocabDeck}
      />
    </div>
  );
}
