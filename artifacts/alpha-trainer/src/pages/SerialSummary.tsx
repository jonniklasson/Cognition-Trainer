import { motion } from "framer-motion";
import { SerialRound } from "../lib/storage";

interface Props {
  rounds: SerialRound[];
  sequenceLength: number;
  onHome: () => void;
  onRetry: () => void;
}

export function SerialSummary({ rounds, sequenceLength, onHome, onRetry }: Props) {
  const total = rounds.length;
  const fullyCorrect = rounds.filter(r => r.fullyCorrect).length;
  const accuracy = total > 0 ? (fullyCorrect / total) * 100 : 0;

  // Total digit accuracy
  const totalDigits = total * sequenceLength;
  const totalHits = rounds.reduce((sum, r) => sum + r.hits, 0);
  const digitAccuracy = totalDigits > 0 ? (totalHits / totalDigits) * 100 : 0;

  // Per-position accuracy
  const positionHits = Array(sequenceLength).fill(0);
  rounds.forEach(r => {
    r.sequence.forEach((digit, i) => {
      if (r.attempt[i] === digit) positionHits[i]++;
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col flex-1 p-6"
    >
      <div className="text-center mb-10 mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary uppercase mb-2">Session Complete</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">
          {total} sequences — length {sequenceLength}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatBox label="Sequences Correct" value={`${fullyCorrect} / ${total}`} highlight={fullyCorrect === total} />
        <StatBox label="Sequence Accuracy" value={`${accuracy.toFixed(0)}%`} highlight={accuracy === 100} />
        <StatBox label="Digit Accuracy" value={`${digitAccuracy.toFixed(1)}%`} />
      </div>

      {/* Position breakdown */}
      <div className="mb-10">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Accuracy by Position</h2>
        <div className="flex gap-3 flex-wrap">
          {positionHits.map((hits, i) => {
            const pct = total > 0 ? (hits / total) * 100 : 0;
            const good = pct >= 80;
            const ok = pct >= 50;
            return (
              <div key={i} className={`flex flex-col items-center border px-4 py-3 min-w-[60px] ${
                good ? "border-primary bg-primary/10" :
                ok ? "border-border bg-card" :
                "border-destructive/50 bg-destructive/10"
              }`}>
                <span className="text-xs uppercase text-muted-foreground mb-1">Pos {i + 1}</span>
                <span className={`text-xl font-bold ${good ? "text-primary" : ok ? "text-foreground" : "text-destructive"}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round history */}
      <div className="mb-10 flex-1">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Round History</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {rounds.map((r, i) => (
            <div key={i} className={`flex items-center gap-4 p-3 border text-sm ${r.fullyCorrect ? "border-primary/30 bg-primary/5" : "border-destructive/20 bg-destructive/5"}`}>
              <span className="text-muted-foreground w-6">{i + 1}</span>
              <span className="font-mono tracking-widest flex-1">
                {r.sequence.map((digit, j) => (
                  <span key={j} className={r.attempt[j] === digit ? "text-foreground" : "text-destructive"}>
                    {digit}
                  </span>
                ))}
              </span>
              <span className="font-mono tracking-widest flex-1 text-muted-foreground">
                {r.attempt.map((digit, j) => (
                  <span key={j} className={digit === r.sequence[j] ? "text-foreground" : "text-destructive"}>
                    {digit ?? "–"}
                  </span>
                ))}
              </span>
              <span className={`text-xs font-bold ${r.fullyCorrect ? "text-primary" : "text-destructive"}`}>
                {r.hits}/{sequenceLength}
              </span>
            </div>
          ))}
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

function StatBox({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-4 border flex flex-col items-center justify-center text-center ${highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <div className={`text-2xl font-bold mb-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-widest">{label}</div>
    </div>
  );
}
