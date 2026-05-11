export function appendPhrase(currentText: string, phrase: string): string {
  const trimmedPhrase = phrase.trim();
  if (!trimmedPhrase) return currentText;
  if (!currentText) return trimmedPhrase;
  if (/\s$/.test(currentText)) return `${currentText}${trimmedPhrase}`;
  return `${currentText} ${trimmedPhrase}`;
}
