import { useState } from 'react';
import { Home } from './pages/Home';
import { Training } from './pages/Training';
import { Summary } from './pages/Summary';
import { Session } from './lib/storage';

export default function App() {
  const [view, setView] = useState<"home" | "training" | "summary">("home");
  const [lastSession, setLastSession] = useState<Session | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      <main className="flex-1 flex flex-col relative w-full max-w-2xl mx-auto">
        {view === "home" && (
          <Home onStart={() => setView("training")} />
        )}
        {view === "training" && (
          <Training 
            onComplete={(session) => {
              setLastSession(session);
              setView("summary");
            }}
            onQuit={() => setView("home")}
          />
        )}
        {view === "summary" && lastSession && (
          <Summary 
            session={lastSession}
            onHome={() => setView("home")}
            onRetry={() => setView("training")}
          />
        )}
      </main>
    </div>
  );
}
