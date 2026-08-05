import { useState } from 'react';
import { Home } from './pages/Home';
import { Training } from './pages/Training';
import { Summary } from './pages/Summary';
import { SerialRecall } from './pages/SerialRecall';
import { SerialSummary } from './pages/SerialSummary';
import { Session, SerialRound, loadSettings } from './lib/storage';

type View = "home" | "training" | "summary" | "serial" | "serial-summary";

function SerialRecallWrapper({ onComplete, onQuit }: {
  onComplete: (rounds: SerialRound[], length: number) => void;
  onQuit: () => void;
}) {
  const [settings] = useState(() => loadSettings());
  return (
    <SerialRecall
      sequenceLength={settings.serialLength}
      displayMs={settings.serialDisplayMs}
      roundsPerSession={settings.serialRounds}
      onComplete={onComplete}
      onQuit={onQuit}
    />
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
  const [lastSession, setLastSession] = useState<Session | null>(null);
  const [lastSerialRounds, setLastSerialRounds] = useState<SerialRound[]>([]);
  const [lastSerialLength, setLastSerialLength] = useState(5);

  const goHome = () => setView("home");

  const startTraining = () => {
    const settings = loadSettings();
    setView(settings.mode === "serial" ? "serial" : "training");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <main className="flex-1 flex flex-col relative w-full max-w-2xl mx-auto">

        {view === "home" && (
          <Home onStart={startTraining} />
        )}

        {view === "training" && (
          <Training
            onComplete={(session) => {
              setLastSession(session);
              setView("summary");
            }}
            onQuit={goHome}
          />
        )}

        {view === "summary" && lastSession && (
          <Summary
            session={lastSession}
            onHome={goHome}
            onRetry={() => setView("training")}
          />
        )}

        {view === "serial" && (
          <SerialRecallWrapper
            onComplete={(rounds, length) => {
              setLastSerialRounds(rounds);
              setLastSerialLength(length);
              setView("serial-summary");
            }}
            onQuit={goHome}
          />
        )}

        {view === "serial-summary" && (
          <SerialSummary
            rounds={lastSerialRounds}
            sequenceLength={lastSerialLength}
            onHome={goHome}
            onRetry={() => setView("serial")}
          />
        )}

      </main>
    </div>
  );
}
