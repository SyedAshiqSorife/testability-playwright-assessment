export const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches an element whose whole (whitespace-trimmed) text is exactly `text`. */
export const exactText = (text: string): RegExp => new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);
