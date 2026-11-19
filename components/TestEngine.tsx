"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Coffee, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { TestHeader, TestFooter } from "@/components/TestLayout";
import QuestionViewer from "@/components/QuestionViewer";
import DesmosCalculator from "@/components/DesmosCalculator";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/Button";
import { ModalDialog } from "@/components/ui/ModalDialog";
import api from "@/lib/axios";

interface TestStage {
  section: string;
  module: number;
  duration: number; // in seconds
}

const TEST_STAGES: TestStage[] = [
  { section: "Reading and Writing", module: 1, duration: 32 * 60 },
  { section: "Reading and Writing", module: 2, duration: 32 * 60 },
  { section: "Math", module: 1, duration: 35 * 60 },
  { section: "Math", module: 2, duration: 35 * 60 },
];

export default function TestEngine({ testId }: { testId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") || "full_length";
  const targetSection = searchParams.get("section");
  const targetModule = searchParams.get("module")
    ? parseInt(searchParams.get("module") as string, 10)
    : null;
  const initialAttemptId = searchParams.get("attemptId");

  const [attemptId, setAttemptId] = useState<string | null>(initialAttemptId);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSubmitting] = useState(false);

  // Active stage / module
  const [currentStageIndex, setCurrentStageIndex] = useState(() => {
    if (mode === "sectional" && targetSection && targetModule) {
      const idx = TEST_STAGES.findIndex(
        (s) => s.section === targetSection && s.module === targetModule
      );
      return idx !== -1 ? idx : 0;
    }
    return 0;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    return TEST_STAGES[currentStageIndex]?.duration || 32 * 60;
  });
  const [isTimerHidden, setIsTimerHidden] = useState(false);

  // Tools
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Module Transition Modal State
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [isBreakTime, setIsBreakTime] = useState(false);

  const currentStage = TEST_STAGES[currentStageIndex];
  const currentModuleQuestions = questions.filter(
    (q) => q.section === currentStage.section && q.module === currentStage.module
  );

  // 1. Fetch questions and initialize Attempt session
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        setLoading(true);

        // Fetch questions for this test
        const questionsRes = await api.get(`/api/questions?testId=${testId}`);
        const allQuestions = questionsRes.data?.questions || [];

        if (isMounted) {
          setQuestions(allQuestions);
        }

        // Initialize attempt if not provided in URL and not previewing
        const isPreview = searchParams.get("preview") === "true" || mode === "preview";
        let activeAttemptId = initialAttemptId;
        if (!activeAttemptId && !isPreview) {
          const attemptPayload =
            mode === "sectional" && targetSection && targetModule
              ? {
                  testId,
                  mode: "sectional",
                  sectionalSubject: targetSection,
                  sectionalModule: targetModule,
                }
              : {
                  testId,
                  mode: "full_length",
                };

          const startRes = await api.post("/api/attempts/start", attemptPayload);
          activeAttemptId = startRes.data?.attemptId || startRes.data?.attempt?._id;
        }

        if (isMounted && activeAttemptId) {
          setAttemptId(activeAttemptId);
        }
      } catch (err) {
        console.error("Failed to initialize test room:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [testId, mode, targetSection, targetModule, initialAttemptId]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || timeRemaining <= 0 || transitionModalOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleModuleAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, timeRemaining, transitionModalOpen]);

  // 3. Record Answer (both MCQ and SPR)
  const handleAnswerSelect = async (questionId: string, answerText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerText }));

    // Send answer asynchronously to server if attemptId is active
    if (attemptId) {
      try {
        await api.post(`/api/attempts/${attemptId}/answer`, {
          questionId,
          answer: answerText,
        });
      } catch (err) {
        console.error("Could not record answer on server:", err);
      }
    }
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleNext = () => {
    if (currentIndex < currentModuleQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleJump = (index: number) => {
    setCurrentIndex(index);
  };

  // 4. Advance Module or Final Submit
  const handleModuleAdvance = async () => {
    // If Sectional mode -> Final submit immediately
    if (mode === "sectional") {
      await finalizeAttempt();
      return;
    }

    // Full-Length mode transitions
    if (currentStageIndex < 3) {
      // If moving from Module 2 (Reading & Writing) to Module 3 (Math), offer break screen
      if (currentStageIndex === 1) {
        setIsBreakTime(true);
      } else {
        setIsBreakTime(false);
      }
      setTransitionModalOpen(true);
    } else {
      // Completed all 4 modules -> Final submit
      await finalizeAttempt();
    }
  };

  const proceedToNextModule = () => {
    const nextIndex = currentStageIndex + 1;
    setCurrentStageIndex(nextIndex);
    setCurrentIndex(0);
    setTimeRemaining(TEST_STAGES[nextIndex].duration);
    setTransitionModalOpen(false);
    setIsBreakTime(false);
  };

  const finalizeAttempt = async () => {
    if (!attemptId) {
      alert("No active attempt found. Please return to practice catalog.");
      router.push("/practice");
      return;
    }

    try {
      setSubmitting(true);
      const submitRes = await api.post(`/api/attempts/${attemptId}/submit`, {});
      const submittedId = submitRes.data?.attemptId || attemptId;
      router.push(`/results/${submittedId}`);
    } catch (err: any) {
      console.error("Error submitting attempt:", err);
      alert(err.response?.data?.error || "Failed to submit attempt. Redirecting to practice catalog.");
      router.push("/practice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Loading message="Preparing testing room and College Board question set..." />
      </div>
    );
  }

  if (questions.length === 0 || currentModuleQuestions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-canvas text-center">
        <AlertCircle className="w-12 h-12 text-brand-strong mb-3" />
        <h2 className="text-2xl font-bold text-ink-fg font-display">
          No questions found for this module
        </h2>
        <p className="mt-2 text-sm text-ink-muted max-w-md">
          The requested section has no imported questions in the database.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-6"
          onClick={() => router.push("/practice")}
        >
          Return to Practice Library
        </Button>
      </div>
    );
  }

  const currentQuestion = currentModuleQuestions[currentIndex] || currentModuleQuestions[0];
  const isLastStage = mode === "sectional" || currentStageIndex === 3;
  const isMathSection = currentStage.section === "Math";

  return (
    <div className="min-h-screen flex flex-col bg-surface-white overflow-hidden relative select-none">
      {/* Test Top Navigation Bar */}
      <TestHeader
        sectionName={`${currentStage.section} - Module ${currentStage.module}`}
        timeRemaining={timeRemaining}
        onTimeUp={handleModuleAdvance}
        isTimerHidden={isTimerHidden}
        setIsTimerHidden={setIsTimerHidden}
        showCalculator={isMathSection}
        onToggleCalculator={() => setIsCalculatorOpen(!isCalculatorOpen)}
        buttonText={isLastStage ? "Submit Test" : "Next Module"}
        confirmTitle={isLastStage ? "Submit Test?" : "End This Module?"}
        confirmDescription={
          isLastStage
            ? "Are you ready to submit your test? Once submitted, your score will be calculated and missed questions added to your error log."
            : "You are about to finish this module and proceed to the next. You will not be able to return to these questions."
        }
      />

      {/* Desmos Graphing Calculator (Math only) */}
      <DesmosCalculator
        isOpen={isCalculatorOpen && isMathSection}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Main Question Display Surface */}
      <main className="flex-1 w-full bg-canvas relative">
        <QuestionViewer
          question={currentQuestion}
          userAnswer={answers[currentQuestion._id] || ""}
          onAnswerSelect={handleAnswerSelect}
          isFlagged={!!flagged[currentQuestion._id]}
          onToggleFlag={toggleFlag}
          index={currentIndex}
        />
      </main>

      {/* Test Footer with Question Navigator and Prev/Next */}
      <TestFooter
        currentIndex={currentIndex}
        totalQuestions={currentModuleQuestions.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onJump={handleJump}
        answers={answers}
        flagged={flagged}
        questions={currentModuleQuestions}
      />

      {/* -------------------------------------------------------------------
          MODULE TRANSITION & 10-MINUTE BREAK DIALOG (Full-Length Tests)
      -------------------------------------------------------------------- */}
      <ModalDialog
        open={transitionModalOpen}
        onClose={() => {}} // User must explicitly click proceed
        title={isBreakTime ? "10-Minute Break (Optional)" : "Module Completed"}
        description={
          isBreakTime
            ? "You have finished the Reading and Writing section! Take a short break before starting Math."
            : `You have completed ${currentStage.section} Module ${currentStage.module}.`
        }
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4 py-2">
          {isBreakTime ? (
            <div className="p-4 rounded-[var(--ui-radius-sm)] bg-brand-tint border border-[#ecd49d] text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#f6e5be] text-brand-strong flex items-center justify-center mx-auto">
                <Coffee className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-brand-strong">Scheduled Break</p>
              <p className="text-xs text-[#a07c24] max-w-sm mx-auto leading-relaxed">
                On the official Digital SAT, you receive an optional 10-minute break between
                Reading &amp; Writing and Math. When you are ready, click below to start Math Module 1.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-[var(--ui-radius-sm)] bg-[#e8f7f0] border border-[#b2e5ce] flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[var(--state-success)] shrink-0" />
              <p className="text-xs text-[#166e4b] leading-relaxed">
                Answers for this module have been saved. Ready for{" "}
                <strong>
                  {TEST_STAGES[currentStageIndex + 1]?.section} Module{" "}
                  {TEST_STAGES[currentStageIndex + 1]?.module}
                </strong>
                ?
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              variant="primary"
              size="md"
              onClick={proceedToNextModule}
              className="w-full sm:w-auto"
            >
              <span>
                {isBreakTime ? "Resume & Start Math" : "Proceed to Next Module"}
              </span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
