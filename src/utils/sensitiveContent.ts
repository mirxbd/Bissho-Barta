// Algorithm for reducing sensitive content
// Replaces heavy sensitive terms with neutral/better alternatives automatically without adding visible notice text to the view.
// Also provides helper to filter or down-rank sensitive posts when enabled.

const SENSITIVE_REPLACEMENTS: Array<[RegExp, string]> = [
  // Genocide -> Humanitarian crisis
  [/\bGenocide\b/g, 'Humanitarian crisis'],
  [/\bgenocide\b/g, 'humanitarian crisis'],
  
  // Massacre -> Deadly attack
  [/\bMassacre\b/g, 'Deadly attack'],
  [/\bmassacre\b/g, 'deadly attack'],
  
  // Murdered -> Killed
  [/\bMurdered\b/g, 'Killed'],
  [/\bmurdered\b/g, 'killed'],
  
  // Slaughter -> Deadly assault
  [/\bSlaughter\b/g, 'Deadly assault'],
  [/\bslaughter\b/g, 'deadly assault'],
  
  // Terrorist -> Militant group
  [/\bTerrorist\b/g, 'Militant group'],
  [/\bterrorist\b/g, 'militant group'],
  [/\bTerrorists\b/g, 'Militant groups'],
  [/\bterrorists\b/g, 'militant groups'],
];

/**
 * Transforms sensitive text using alternative phrasing algorithm when reduce sensitive content is active.
 * Does not add any UI disclaimer or text warning to the view.
 */
export function applySensitiveContentAlgorithm(text: string, isEnabled: boolean = true): string {
  if (!text || !isEnabled) return text;
  let sanitized = text;
  for (const [pattern, replacement] of SENSITIVE_REPLACEMENTS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

/**
 * Checks if a post contains heavy sensitive keywords.
 */
export function isSensitiveContent(text: string): boolean {
  if (!text) return false;
  return /\b(genocide|massacre|murdered|slaughter|terrorist|terrorists)\b/i.test(text);
}
