export function generateSequence(length: number): number[] {
  const seq: number[] = [];
  let last = -1;
  for (let i = 0; i < length; i++) {
    let digit: number;
    do {
      digit = Math.floor(Math.random() * 10);
    } while (digit === last);
    seq.push(digit);
    last = digit;
  }
  return seq;
}

export function scoreSequence(correct: number[], attempt: number[]): number {
  let hits = 0;
  const len = correct.length;
  for (let i = 0; i < len; i++) {
    if (attempt[i] === correct[i]) hits++;
  }
  return hits;
}
