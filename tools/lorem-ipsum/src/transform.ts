import { LoremIpsum } from 'lorem-ipsum';
const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 8, min: 4 },
  wordsPerSentence: { max: 16, min: 4 },
});
export function generateLorem(count: number, units: 'paragraphs' | 'sentences' | 'words'): string {
  return units === 'paragraphs'
    ? lorem.generateParagraphs(count)
    : units === 'sentences'
      ? lorem.generateSentences(count)
      : lorem.generateWords(count);
}
