export interface LetterStat {
  asked: number;
  correct: number;
  totalMs: number;
}

export interface Session {
  id: string;
  date: number;
  totalQuestions: number;
  correct: number;
  avgResponseMs: number;
  fastestMs: number;
  slowestMs: number;
  letterStats: Record<string, LetterStat>;
}

export interface Settings {
  questionTypes: ("after" | "before")[];
  difficulty: "easy" | "hard";
  questionsPerSession: number;
}

const DEFAULT_SETTINGS: Settings = {
  questionTypes: ["after"],
  difficulty: "easy",
  questionsPerSession: 20
};

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem("alpha-settings");
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem("alpha-settings", JSON.stringify(settings));
}

export function loadSessions(): Session[] {
  try {
    const stored = localStorage.getItem("alpha-sessions");
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSession(session: Session) {
  const sessions = loadSessions();
  sessions.push(session);
  localStorage.setItem("alpha-sessions", JSON.stringify(sessions));
}
