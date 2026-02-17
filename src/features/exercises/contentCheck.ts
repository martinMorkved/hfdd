import { CONTENT_BLOCKLIST } from './contentBlocklist';

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

/** Returns true if text contains any blocklisted term. */
function containsBlockedTerm(text: string): boolean {
  if (!text || !text.trim()) return false;
  const normalized = normalize(text);
  return CONTENT_BLOCKLIST.some(term => normalized.includes(term));
}

/**
 * Checks exercise fields for inappropriate content.
 * Returns an error message if any field fails, otherwise null.
 */
export function checkExerciseContent(fields: {
  name: string;
  description?: string | null;
  muscle_group?: string | null;
}): string | null {
  if (containsBlockedTerm(fields.name)) {
    return 'Exercise name contains inappropriate content. Please use family-friendly language.';
  }
  if (fields.description && containsBlockedTerm(fields.description)) {
    return 'Description contains inappropriate content. Please use family-friendly language.';
  }
  if (fields.muscle_group && containsBlockedTerm(fields.muscle_group)) {
    return 'Muscle group contains inappropriate content. Please use family-friendly language.';
  }
  return null;
}
