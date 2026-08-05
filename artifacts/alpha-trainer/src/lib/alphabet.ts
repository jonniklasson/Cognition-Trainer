export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const MID_ALPHABET = "EFGHIJKLMNOPQRSTUV".split("");

export type QuestionType = "after" | "before";
export type Difficulty = "easy" | "hard";

export interface Question {
  letter: string;
  type: QuestionType;
  answer: string;
}

export function generateQuestion(
  types: QuestionType[],
  difficulty: Difficulty,
  lastLetter?: string
): Question {
  let valid = false;
  let letter = "";
  let type: QuestionType = "after";
  let answer = "";

  while (!valid) {
    type = types[Math.floor(Math.random() * types.length)];
    
    let pool = difficulty === "hard" ? MID_ALPHABET : ALPHABET;
    if (difficulty === "hard" && Math.random() > 0.7) {
      pool = ALPHABET;
    }
    
    letter = pool[Math.floor(Math.random() * pool.length)];
    
    if (letter === lastLetter) continue;
    if (type === "after" && letter === "Z") continue;
    if (type === "before" && letter === "A") continue;

    const index = ALPHABET.indexOf(letter);
    answer = type === "after" ? ALPHABET[index + 1] : ALPHABET[index - 1];
    valid = true;
  }

  return { letter, type, answer };
}
