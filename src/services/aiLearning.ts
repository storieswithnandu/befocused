import { db } from '../db/db';

export interface LearnedPattern {
    id?: number;
    phrasing: string;
    intent: string;
    frequency: number;
    lastUsed: Date;
}

/**
 * Saves a phrased-to-intent mapping to local storage.
 * If the phrasing already exists, increments the frequency.
 */
export async function learnPattern(phrasing: string, intent: string) {
    const cleanPhrasing = phrasing.toLowerCase().trim();
    if (!cleanPhrasing || !intent) return;

    const existing = await db.learnedPatterns.where('phrasing').equals(cleanPhrasing).first();

    if (existing && existing.id) {
        await db.learnedPatterns.update(existing.id, {
            frequency: existing.frequency + 1,
            lastUsed: new Date(),
            intent // Update intent in case user corrects it (future feature)
        });
    } else {
        await db.learnedPatterns.add({
            phrasing: cleanPhrasing,
            intent,
            frequency: 1,
            lastUsed: new Date()
        });
    }
}

/**
 * Finds a learned intent for a given phrasing using exact or fuzzy match.
 */
export async function findLearnedIntent(text: string): Promise<string | null> {
    const cleanText = text.toLowerCase().trim();

    // Check for exact match first
    const exact = await db.learnedPatterns.where('phrasing').equals(cleanText).first();
    if (exact && exact.frequency > 1) return exact.intent;

    // Check for "contains" or fuzzy matches (simplistic keyword matching)
    // In a real Jarvis, this would be more complex, but for local-first:
    const all = await db.learnedPatterns.toArray();

    // Find better match by checking if the phrasing is contained within the input
    const match = all.find(p => cleanText.includes(p.phrasing) && p.frequency > 2);
    if (match) return match.intent;

    return null;
}
