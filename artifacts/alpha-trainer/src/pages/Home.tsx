import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { loadSettings, saveSettings, loadSessions, Settings, Session } from "../lib/storage";

export function Home({ onStart }: { onStart: () => void }) {
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [stats, setStats] = useState<{
    lifetimeAccuracy: number;
    bestAvg: number;
    totalAnswered: number;
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
        if (s.avgResponseMs > 0 && s.avgResponseMs < bestAvg) {
          bestAvg = s.avgResponseMs;
        }
      });

      setStats({
        lifetimeAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
        bestAvg: bestAvg === Infinity ? 0 : bestAvg,
        totalAnswered: totalQuestions
      });
    }
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
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
    updateSettings({ questionTypes: types });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col flex-1 p-6 justify-center"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary uppercase">Alpha Trainer</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto uppercase tracking-wider">
          Build random-access recall of the alphabet. Measure speed to force automaticity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Settings Card */}
        <div className="border border-border p-6 bg-card flex flex-col gap-6">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Configuration</h2>
            <div className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-xs uppercase">Target</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleQuestionType("after")}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.questionTypes.includes("after") ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
                  >
                    AFTER
                  </button>
                  <button 
                    onClick={() => toggleQuestionType("before")}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.questionTypes.includes("before") ? "bg-primary text-primary-foreground border-primary" : "bg-transparent border-border hover:border-primary/50 text-foreground"}`}
                  >
                    BEFORE
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Difficulty</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateSettings({ difficulty: "easy" })}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.difficulty === "easy" ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                  >
                    EASY (A-Z)
                  </button>
                  <button 
                    onClick={() => updateSettings({ difficulty: "hard" })}
                    className={`flex-1 py-2 text-sm border transition-colors ${settings.difficulty === "hard" ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                  >
                    HARD (MID)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase">Questions</label>
                <div className="flex gap-2">
                  {[10, 20, 50].map(num => (
                    <button 
                      key={num}
                      onClick={() => updateSettings({ questionsPerSession: num })}
                      className={`flex-1 py-2 text-sm border transition-colors ${settings.questionsPerSession === num ? "bg-foreground text-background border-foreground" : "bg-transparent border-border hover:border-foreground/50 text-foreground"}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="border border-border p-6 bg-card flex flex-col justify-between">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Lifetime Stats</h2>
            
            {stats ? (
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-bold">{stats.lifetimeAccuracy.toFixed(1)}%</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.bestAvg > 0 ? (stats.bestAvg / 1000).toFixed(2) + "s" : "--"}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Best Avg Time</div>
                </div>
                <div>
                  <div className="text-xl">{stats.totalAnswered}</div>
                  <div className="text-xs uppercase text-muted-foreground mt-1">Total Questions</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                No session data yet.
              </div>
            )}
          </div>
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
