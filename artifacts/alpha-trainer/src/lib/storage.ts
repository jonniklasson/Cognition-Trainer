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

export interface SerialRound {
  sequence: number[];
  attempt: number[];
  hits: number;
  fullyCorrect: boolean;
}

export interface SerialSession {
  id: string;
  date: number;
  sequenceLength: number;
  rounds: SerialRound[];
  fullyCorrect: number;
  totalRounds: number;
}

export interface Settings {
  questionTypes: ("after" | "before")[];
  difficulty: "easy" | "hard";
  questionsPerSession: number;
  mode: "alpha" | "serial";
  serialLength: number;
  serialDisplayMs: number;
  serialRounds: number;
}

const DEFAULT_SETTINGS: Settings = {
  questionTypes: ["after"],
  difficulty: "easy",
  questionsPerSession: 20,
  mode: "alpha",
  serialLength: 5,
  serialDisplayMs: 1000,
  serialRounds: 10,
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

export function loadSerialSessions(): SerialSession[] {
  try {
    const stored = localStorage.getItem("alpha-serial-sessions");
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSerialSession(session: SerialSession) {
  const sessions = loadSerialSessions();
  sessions.push(session);
  localStorage.setItem("alpha-serial-sessions", JSON.stringify(sessions));
}
