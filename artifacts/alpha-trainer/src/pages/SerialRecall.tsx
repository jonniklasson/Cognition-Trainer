import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateSequence, scoreSequence } from "../lib/serialRecall";
import { saveSerialSession, SerialRound } from "../lib/storage";

type Phase = "showing" | "blank" | "input" | "feedback";

interface Props {
  onComplete: (rounds: SerialRound[], sequenceLength: number) => void;
  onQuit: () => void;
  sequenceLength: number;
  displayMs: number;
  roundsPerSession: number;
}

export function SerialRecall({ onComplete, onQuit, sequenceLength, displayMs, roundsPerSession }: Props) {
  const [phase, setPhase] = useState<Phase>("showing");
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ correct: number[]; attempt: number[]; hits: number } | null>(null);
  const [rounds, setRounds] = useState<SerialRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    const seq = generateSequence(sequenceLength);
    setSequence(seq);
    setCurrentDigitIndex(0);
    setInput("");
    setFeedback(null);
    setPhase("showing");
  }, [sequenceLength]);

  useEffect(() => {
    startRound();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [startRound]);

  // Advance through digit display
  useEffect(() => {
    if (phase !== "showing") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const next = currentDigitIndex + 1;
      if (next < sequence.length) {
        setCurrentDigitIndex(next);
      } else {
        setPhase("blank");
      }
    }, displayMs);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase, currentDigitIndex, sequence.length, displayMs]);

  // Blank pause before input
  useEffect(() => {
    if (phase !== "blank") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setPhase("input");
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 500);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (phase !== "input" || input.length !== sequenceLength) return;

    const attempt = input.split("").map(Number);
    const hits = scoreSequence(sequence, attempt);
    const isFullyCorrect = hits === sequenceLength;

    const round: SerialRound = {
      sequence,
      attempt,
      hits,
      fullyCorrect: isFullyCorrect,
    };

    const newRounds = [...rounds, round];
    setRounds(newRounds);
    setFeedback({ correct: sequence, attempt, hits });
    setPhase("feedback");

    timeoutRef.current = setTimeout(() => {
      const nextIndex = roundIndex + 1;
      if (nextIndex >= roundsPerSession) {
        const session = {
          id: crypto.randomUUID(),
          date: Date.now(),
          sequenceLength,
          rounds: newRounds,
          fullyCorrect: newRounds.filter(r => r.fullyCorrect).length,
          totalRounds: roundsPerSession,
        };
        saveSerialSession(session);
        onComplete(newRounds, sequenceLength);
      } else {
        setRoundIndex(nextIndex);
        startRound();
      }
    }, 2000);
  }, [phase, input, sequenceLength, sequence, rounds, roundIndex, roundsPerSession, onComplete, startRound]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, sequenceLength);
    setInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  const correctSoFar = rounds.filter(r => r.fullyCorrect).length;
  const accuracy = roundIndex > 0 ? Math.round((correctSoFar / roundIndex) * 100) : null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6 border-b border-border text-sm">
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-xs">Round</span>
            <span className="font-bold">{roundIndex + 1} / {roundsPerSession}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase text-xs">Length</span>
            <span className="font-bold">{sequenceLength}</span>
          </div>
          {accuracy !== null && (
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase text-xs">Correct</span>
              <span className="font-bold">{accuracy}%</span>
            </div>
          )}
        </div>
        <button
          onClick={onQuit}
          className="text-muted-foreground hover:text-foreground uppercase text-xs font-bold tracking-widest transition-colors"
        >
          Quit
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <AnimatePresence mode="wait">

          {phase === "showing" && sequence.length > 0 && (
            <motion.div
              key={`digit-${currentDigitIndex}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {currentDigitIndex + 1} of {sequence.length}
              </div>
              <div className="text-[12rem] md:text-[16rem] leading-none font-bold text-primary">
                {sequence[currentDigitIndex]}
              </div>
              {/* Progress dots */}
              <div className="flex gap-2">
                {sequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i <= currentDigitIndex ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {phase === "blank" && (
            <motion.div
              key="blank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-muted-foreground text-sm uppercase tracking-widest"
            >
              ...
            </motion.div>
          )}

          {phase === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <div className="text-sm uppercase tracking-widest text-muted-foreground text-center">
                Type the sequence in order
              </div>

              {/* Digit display slots */}
              <div className="flex gap-3 justify-center">
                {Array.from({ length: sequenceLength }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 border flex items-center justify-center text-2xl font-bold transition-colors ${
                      input[i] !== undefined
                        ? "border-primary text-foreground"
                        : "border-border text-transparent"
                    }`}
                  >
                    {input[i] ?? "0"}
                  </div>
                ))}
              </div>

              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="opacity-0 absolute pointer-events-none"
                aria-label="Enter the sequence"
              />

              <button
                onClick={handleSubmit}
                disabled={input.length !== sequenceLength}
                className="w-full py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest disabled:opacity-30 transition-opacity"
              >
                Submit
              </button>

              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Press Enter or tap Submit when done
              </p>
            </motion.div>
          )}

          {phase === "feedback" && feedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className={`text-2xl font-bold uppercase tracking-widest ${feedback.hits === sequenceLength ? "text-primary" : "text-destructive"}`}>
                {feedback.hits === sequenceLength ? "Correct" : `${feedback.hits} / ${sequenceLength} Right`}
              </div>

              <div className="flex gap-3">
                {feedback.correct.map((digit, i) => {
                  const correct = feedback.attempt[i] === digit;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-14 border flex items-center justify-center text-2xl font-bold ${correct ? "border-primary text-primary" : "border-destructive text-destructive"}`}>
                        {feedback.attempt[i] ?? "–"}
                      </div>
                      {!correct && (
                        <div className="text-xs text-muted-foreground">{digit}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {feedback.hits < sequenceLength && (
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  Correct: {feedback.correct.join(" ")}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
