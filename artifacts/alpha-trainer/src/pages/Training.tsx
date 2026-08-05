import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateQuestion, Question } from "../lib/alphabet";
import { loadSettings, saveSession, LetterStat, Session } from "../lib/storage";

type FeedbackState = "idle" | "correct" | "incorrect";

export function Training({ onComplete, onQuit }: { onComplete: (session: Session) => void, onQuit: () => void }) {
  const settings = loadSettings();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  
  // Stats for the session
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [letterStats, setLetterStats] = useState<Record<string, LetterStat>>({});
  const [times, setTimes] = useState<number[]>([]);
  
  // Timer state
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState<number>(0);
  
  const timerRef = useRef<number | null>(null);
  const isTransitioning = useRef(false);

  const startNewQuestion = useCallback((lastLetter?: string) => {
    isTransitioning.current = false;
    const q = generateQuestion(settings.questionTypes, settings.difficulty, lastLetter);
    setQuestion(q);
    setFeedback("idle");
    const now = performance.now();
    setStartTime(now);
    setElapsed(0);

    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    
    const updateTimer = (time: number) => {
      if (!isTransitioning.current) {
        setElapsed(time - now);
        timerRef.current = requestAnimationFrame(updateTimer);
      }
    };
    timerRef.current = requestAnimationFrame(updateTimer);
  }, [settings]);

  useEffect(() => {
    startNewQuestion();
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [startNewQuestion]);

  const handleComplete = useCallback(() => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    
    const avgResponseMs = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const fastestMs = times.length > 0 ? Math.min(...times) : 0;
    const slowestMs = times.length > 0 ? Math.max(...times) : 0;

    const session: Session = {
      id: crypto.randomUUID(),
      date: Date.now(),
      totalQuestions: settings.questionsPerSession,
      correct: correctCount,
      avgResponseMs,
      fastestMs,
      slowestMs,
      letterStats
    };

    saveSession(session);
    onComplete(session);
  }, [times, correctCount, letterStats, settings.questionsPerSession, onComplete]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!question || isTransitioning.current) return;
    
    const key = e.key.toUpperCase();
    if (!/^[A-Z]$/.test(key)) return;

    isTransitioning.current = true;
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    
    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    
    const isCorrect = key === question.answer;
    
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setStreak(s => s + 1);
      setTimes(prev => [...prev, timeTaken]);
    } else {
      setStreak(0);
    }

    setLetterStats(prev => {
      const stats = prev[question.letter] || { asked: 0, correct: 0, totalMs: 0 };
      return {
        ...prev,
        [question.letter]: {
          asked: stats.asked + 1,
          correct: stats.correct + (isCorrect ? 1 : 0),
          totalMs: stats.totalMs + timeTaken
        }
      };
    });

    setFeedback(isCorrect ? "correct" : "incorrect");

    setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= settings.questionsPerSession) {
        setQuestionIndex(nextIndex); // trigger completion effect
      } else {
        setQuestionIndex(nextIndex);
        startNewQuestion(question.letter);
      }
    }, isCorrect ? 400 : 1200);

  }, [question, questionIndex, startTime, startNewQuestion, settings.questionsPerSession]);

  useEffect(() => {
    if (questionIndex >= settings.questionsPerSession) {
      handleComplete();
    }
  }, [questionIndex, settings.questionsPerSession, handleComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!question) return null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-border text-sm">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-xs">Progress</span>
            <span className="font-bold">{questionIndex + 1} / {settings.questionsPerSession}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-xs">Accuracy</span>
            <span className="font-bold">
              {questionIndex === 0 ? "--" : Math.round((correctCount / questionIndex) * 100)}%
            </span>
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="text-muted-foreground uppercase text-xs">Streak</span>
            <span className="font-bold text-primary">{streak}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-xs">Avg Time</span>
            <span className="font-bold">
              {times.length === 0 ? "--" : (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2) + "s"}
            </span>
          </div>
        </div>
        
        <button 
          onClick={onQuit}
          className="text-muted-foreground hover:text-foreground uppercase text-xs font-bold tracking-widest transition-colors"
        >
          Quit
        </button>
      </div>

      {/* Main Training Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={questionIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(4px)' }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center"
          >
            <div className="text-xl md:text-2xl font-bold uppercase tracking-widest text-muted-foreground mb-8">
              What comes <span className="text-foreground">{question.type === "after" ? "AFTER" : "BEFORE"}</span>?
            </div>
            
            <div className={`text-[12rem] md:text-[16rem] leading-none font-bold transition-colors duration-200 ${
              feedback === "correct" ? "text-success" : 
              feedback === "incorrect" ? "text-destructive" : "text-foreground"
            }`}>
              {question.letter}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feedback Overlay */}
        <div className="absolute bottom-24 h-12 flex items-center justify-center">
          <AnimatePresence>
            {feedback === "correct" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-success font-bold text-xl uppercase tracking-widest"
              >
                +{(times[times.length - 1] / 1000).toFixed(3)}s
              </motion.div>
            )}
            {feedback === "incorrect" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-destructive font-bold text-xl uppercase tracking-widest"
              >
                Incorrect (Was {question.answer})
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Timer */}
        <div className="absolute bottom-8 text-4xl font-bold opacity-30 tracking-tighter">
          {(elapsed / 1000).toFixed(1)}s
        </div>

      </div>
    </div>
  );
}
