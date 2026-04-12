/**
 * Incremental average computation.
 * Avoids re-querying all reviews; requires only the current count and avg.
 *
 * newAvg = ((currentAvg * currentCount) + newScore) / (currentCount + 1)
 */
export function computeNewAvg(
    currentAvg: number,
    currentCount: number,
    newScore: number
): number {
    return ((currentAvg * currentCount) + newScore) / (currentCount + 1);
}

/**
 * Auto-computes the `rating` field from dimension scores.
 * - Buyer reviewing seller  → avg of quality, compliance, communication, price
 * - Seller reviewing buyer  → avg of compliance, communication, reliability
 */
export function computeRatingFromDimensions(
    reviewerRole: 'buyer' | 'seller',
    scores: {
        score_quality?: number | null;
        score_compliance?: number | null;
        score_communication?: number | null;
        score_price?: number | null;
        score_reliability?: number | null;
    }
): number {
    if (reviewerRole === 'buyer') {
        const vals = [
            scores.score_quality,
            scores.score_compliance,
            scores.score_communication,
            scores.score_price,
        ].filter((v): v is number => v != null);
        if (vals.length === 0) throw new Error('No dimension scores provided for buyer review');
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    } else {
        const vals = [
            scores.score_compliance,
            scores.score_communication,
            scores.score_reliability,
        ].filter((v): v is number => v != null);
        if (vals.length === 0) throw new Error('No dimension scores provided for seller review');
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    }
}
