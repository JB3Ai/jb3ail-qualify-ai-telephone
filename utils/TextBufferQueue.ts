export class TextBufferQueue {
  private buffer = '';
  private readonly minWords = 4;
  private readonly maxChars = 150;

  enqueue(chunk: string): string[] {
    if (!chunk) return [];

    this.buffer += chunk;
    return this.extractReadyPhrases();
  }

  flush(): string[] {
    const trimmed = this.buffer.trim();
    this.buffer = '';
    return trimmed ? [trimmed] : [];
  }

  cleanup() {
    this.buffer = '';
  }

  private extractReadyPhrases(): string[] {
    const ready: string[] = [];

    while (true) {
      const trimmed = this.buffer.trim();
      if (!trimmed) {
        this.buffer = '';
        return ready;
      }

      const wordCount = trimmed.split(/\s+/).length;
      const terminalMatch = this.buffer.match(/^([\s\S]*?[.!?]+["')\]]*\s+)/);
      const pauseMatch = this.buffer.match(/^([\s\S]*?[,;:]+["')\]]*\s+)/);

      if (terminalMatch && this.countWords(terminalMatch[1]) >= this.minWords) {
        ready.push(terminalMatch[1].trim());
        this.buffer = this.buffer.slice(terminalMatch[1].length);
        continue;
      }

      if (pauseMatch && this.countWords(pauseMatch[1]) >= this.minWords + 3) {
        ready.push(pauseMatch[1].trim());
        this.buffer = this.buffer.slice(pauseMatch[1].length);
        continue;
      }

      if (wordCount >= this.minWords && this.buffer.length >= this.maxChars) {
        const flushIndex = this.findBestFlushIndex();
        ready.push(this.buffer.slice(0, flushIndex).trim());
        this.buffer = this.buffer.slice(flushIndex);
        continue;
      }

      return ready;
    }
  }

  private countWords(text: string): number {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }

  private findBestFlushIndex(): number {
    const limited = this.buffer.slice(0, this.maxChars);
    const punctuationIndex = Math.max(
      limited.lastIndexOf('.'),
      limited.lastIndexOf('!'),
      limited.lastIndexOf('?'),
      limited.lastIndexOf(','),
      limited.lastIndexOf(';'),
      limited.lastIndexOf(':'),
    );

    if (punctuationIndex >= this.maxChars * 0.6) {
      return punctuationIndex + 1;
    }

    const whitespaceIndex = limited.lastIndexOf(' ');
    if (whitespaceIndex >= this.maxChars * 0.6) {
      return whitespaceIndex + 1;
    }

    return limited.length;
  }
}
