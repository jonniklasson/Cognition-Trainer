import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loadSettings, saveSettings, loadSessions, loadSerialSessions, Settings } from "../lib/storage";

export function Home({ onStart }: { onStart: () => void }) {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [alphaStats, setAlphaStats] = useState<{
    lifetimeAccuracy: number;
    bestAvg: number;
    totalAnswered: number;
  } | null>(null);
  const [serialStats, setSerialStats] = useState<{
    sequenceAccuracy: number;
    bestLength: number;
    totalRounds: number;
  } | null>(null);

  useEffect(() => {
    const sessions = loadSessions();
    if (sessions.length > 0) {
      let totalQuestions = 0;
      let totalCorrect = 0;
      let bestAvg = Infinity;
      sessions.forEach(s => {
        totalQuestions += s.totalQuestions;
        totalCorrect += s.correct;
        if (s.avgResponseMs > 0 && s.avgResponseMs < bestAvg) bestAvg = s.avgResponseMs;
      });
      setAlphaStats({
        lifetimeAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        bestAvg: bestAvg === Infinity ? 0 : bestAvg,
        totalAnswered: totalQuestions,
      });
    }

    const serialSessions = loadSerialSessions();
    if (serialSessions.length > 0) {
      let totalRounds = 0;
      let totalCorrect = 0;
      let bestLength = 0;
      serialSessions.forEach(s => {
        totalRounds += s.totalRounds;
        totalCorrect += s.fullyCorrect;
        if (s.sequenceLength > bestLength) bestLength = s.sequenceLength;
      });
      setSerialStats({
        sequenceAccuracy: totalRounds > 0 ? (totalCorrect / totalRounds) * 100 : 0,
        bestLength,
        totalRounds,
      });
    }
  }, []);

  const update = (patch: Partial<Settings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSettings(updated);
  };

  const toggleQuestionType = (type: "after" | "before") => {
    let types = [...settings.questionTypes];
    if (types.includes(type)) {
      if (types.length > 1) types = types.filter(t => t !== type);
    } else {
      types.push(type);
    }
    update({ questionTypes: types });
  };

  const isAlpha = settings.mode === "alpha";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col flex-1 p-6 justify-center"
    >
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary uppercase">Alpha Trainer</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto uppercase tracking-wider">
          Build random-access recall. Measure speed to force automaticity.
        </p>
      </div>

      {/* Mode selector */}
      <div className="mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => update({ mode: "alpha" })}
            className={`flex-1 py-3 text-sm font-bold border uppercase tracking-widest transition-colors ${isAlpha ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
          >
            Alphabet
          </button>
          <button
            onClick={() => update({ mode: "serial" })}
            className={`flex-1 py-3 text-sm font-bold border uppercase tracking-widest transition-colors ${!isAlpha ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
          >
            Serial Recall
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Settings */}
        <div className="border border-border p-6 bg-card flex flex-col gap-5">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Configuration</h2>

          {isAlpha ? (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase">Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleQuestionType("after")}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.questionTypes.includes("after") ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
                  >
                    After
                  </button>
                  <button
                    onClick={() => toggleQuestionType("before")}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.questionTypes.includes("before") ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
                  >
                    Before
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Difficulty</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => update({ difficulty: "easy" })}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.difficulty === "easy" ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                  >
                    Easy (A–Z)
                  </button>
                  <button
                    onClick={() => update({ difficulty: "hard" })}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.difficulty === "hard" ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                  >
                    Hard (Mid)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Questions</label>
                <div className="flex gap-2">
                  {[10, 20, 50].map(num => (
                    <button
                      key={num}
                      onClick={() => update({ questionsPerSession: num })}
                      className={`flex-1 py-2 text-sm border transition-colors ${settings.questionsPerSession === num ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-xs uppercase">Sequence Length</label>
                <div className="flex gap-2">
                  {[3, 5, 7, 9].map(len => (
                    <button
                      key={len}
                      onClick={() => update({ serialLength: len })}
                      className={`flex-1 py-2 text-sm border transition-colors ${settings.serialLength === len ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Display Speed</label>
                <div className="flex gap-2">
                  {[{ label: "Fast", ms: 600 }, { label: "Normal", ms: 1000 }, { label: "Slow", ms: 1500 }].map(opt => (
                    <button
                      key={opt.ms}
                      onClick={() => update({ serialDisplayMs: opt.ms })}
                      className={`flex-1 py-2 text-sm border transition-colors ${settings.serialDisplayMs === opt.ms ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Rounds</label>
                <div className="flex gap-2">
                  {[5, 10, 20].map(num => (
                    <button
                      key={num}
                      onClick={() => update({ serialRounds: num })}
                      className={`flex-1 py-2 text-sm border transition-colors ${settings.serialRounds === num ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="border border-border p-6 bg-card flex flex-col">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Lifetime Stats</h2>

          {isAlpha ? (
            alphaStats ? (
              <div className="space-y-5">
                <div>
                  <div className="text-3xl font-bold">{alphaStats.lifetimeAccuracy.toFixed(1)}%</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{alphaStats.bestAvg > 0 ? (alphaStats.bestAvg / 1000).toFixed(2) + "s" : "--"}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Best Avg Time</div>
                </div>
                <div>
                  <div className="text-xl">{alphaStats.totalAnswered}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Total Questions</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                No session data yet.
              </div>
            )
          ) : (
            serialStats ? (
              <div className="space-y-5">
                <div>
                  <div className="text-3xl font-bold">{serialStats.sequenceAccuracy.toFixed(1)}%</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Sequence Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{serialStats.bestLength}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Longest Sequence</div>
                </div>
                <div>
                  <div className="text-xl">{serialStats.totalRounds}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Total Rounds</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                No session data yet.
              </div>
            )
          )}
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-primary text-primary-foreground py-6 text-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors active:scale-[0.98]"
      >
        Start Training
      </button>
    </motion.div>
  );
}
