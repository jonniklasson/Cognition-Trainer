import { motion } from "framer-motion";
import { Session, LetterStat } from "../lib/storage";
import { ALPHABET } from "../lib/alphabet";
import { EASY_TARGET_MS, HARD_TARGET_MS } from "../lib/constants";

export function Summary({ session, onHome, onRetry }: { session: Session, onHome: () => void, onRetry: () => void }) {
  const accuracy = (session.correct / session.totalQuestions) * 100;

  // Pick the benchmark for this session's difficulty
  const targetMs = session.difficulty === "hard" ? HARD_TARGET_MS : EASY_TARGET_MS;
  const beatTarget = session.avgResponseMs > 0 && session.avgResponseMs < targetMs;

  // Find trouble letters (lowest accuracy or slowest)
  const lettersArray = Object.entries(session.letterStats).map(([letter, stats]) => ({
    letter,
    ...stats,
    accuracy: stats.correct / stats.asked,
    avgMs: stats.totalMs / stats.asked
  }));

  const troubleLetters = [...lettersArray]
    .filter(l => l.accuracy < 1 || l.avgMs > session.avgResponseMs * 1.5)
    .sort((a, b) => a.accuracy - b.accuracy || b.avgMs - a.avgMs)
    .slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 p-6"
    >
      <div className="text-center mb-10 mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary uppercase mb-2">Session Complete</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">
          {session.totalQuestions} questions — {session.difficulty} mode
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Accuracy" value={`${accuracy.toFixed(1)}%`} highlight={accuracy === 100} />
        <StatBox label="Avg Time" value={`${(session.avgResponseMs / 1000).toFixed(2)}s`} highlight={beatTarget} />
        <StatBox label="Fastest" value={`${(session.fastestMs / 1000).toFixed(2)}s`} />
        <StatBox label="Slowest" value={`${(session.slowestMs / 1000).toFixed(2)}s`} />
      </div>

      {/* Benchmark comparison */}
      <div className="mb-8 p-4 border border-border bg-card flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
            Human benchmark ({session.difficulty} mode)
          </div>
          <div className="text-sm font-bold">{(targetMs / 1000).toFixed(1)}s avg — automatic recall threshold</div>
        </div>
        <div className={`text-sm font-bold uppercase tracking-widest px-3 py-1 border ${beatTarget ? "text-primary border-primary bg-primary/10" : "text-muted-foreground border-border"}`}>
          {beatTarget ? "Beat" : "Not yet"}
        </div>
      </div>

      {troubleLetters.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Trouble Letters</h2>
          <div className="flex flex-wrap gap-3">
            {troubleLetters.map(l => (
              <div key={l.letter} className="border border-destructive/50 bg-destructive/10 px-4 py-3 flex flex-col items-center min-w-[80px]">
                <span className="text-2xl font-bold text-destructive mb-1">{l.letter}</span>
                <span className="text-[10px] uppercase opacity-70">{(l.avgMs / 1000).toFixed(2)}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10 flex-1">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Letter Performance Heatmap</h2>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
          {ALPHABET.map(letter => {
            const stat = session.letterStats[letter];
            let bgClass = "bg-card border-border"; // not tested
            
            if (stat) {
              const acc = stat.correct / stat.asked;
              if (acc === 1) {
                // Check speed
                if (stat.totalMs / stat.asked < session.avgResponseMs) {
                  bgClass = "bg-primary text-primary-foreground border-primary";
                } else {
                  bgClass = "bg-success/20 text-success border-success/30";
                }
              } else {
                bgClass = "bg-destructive/20 text-destructive border-destructive/50";
              }
            }

            return (
              <div 
                key={letter}
                className={`aspect-square flex items-center justify-center text-sm font-bold border ${bgClass}`}
                title={stat ? `${stat.asked} asked, ${(stat.correct/stat.asked*100).toFixed(0)}% acc` : "Not asked"}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 mt-auto pt-6">
        <button 
          onClick={onHome}
          className="flex-1 py-4 border border-border bg-card text-foreground uppercase text-sm font-bold tracking-widest hover:border-foreground/50 transition-colors"
        >
          Menu
        </button>
        <button 
          onClick={onRetry}
          className="flex-1 py-4 bg-primary text-primary-foreground uppercase text-sm font-bold tracking-widest hover:bg-primary/90 transition-colors"
        >
          Train Again
        </button>
      </div>

    </motion.div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className={`p-4 border flex flex-col items-center justify-center text-center ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className={`text-2xl font-bold mb-1 ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{label}</div>
    </div>
  );
}
