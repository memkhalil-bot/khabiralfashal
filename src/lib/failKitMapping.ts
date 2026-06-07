/**
 * failKitMapping — safe, additive translation layer between Valley
 * Assessment outputs and Fail Kit request fields.
 *
 * IMPORTANT: this does NOT change Valley scoring. It only reads the
 * existing `primary_failure_mode` / `risk_level` outputs and maps them
 * onto the Fail Kit's fixed vocab (failure_category / severity / urgency_level).
 */

export type FailKitCategory =
  | 'Founder Conflict'
  | 'Cash Burn'
  | 'Product Market Fit'
  | 'Fundraising'
  | 'Team Issues'
  | 'Operations';

export type FailKitSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type FailKitUrgency = 'Green' | 'Yellow' | 'Red' | 'Black';

// Valley blind-spot labels (see ValleyAssessment QUESTIONS) → Fail Kit category.
const FAILURE_MODE_TO_CATEGORY: Record<string, FailKitCategory> = {
  'Financial denial':     'Cash Burn',
  'Concentration risk':   'Cash Burn',
  'Leadership isolation': 'Team Issues',
  'Decision paralysis':   'Operations',
  'No exit plan':         'Operations',
  'Burnout proximity':    'Founder Conflict',
  'Identity fusion':      'Founder Conflict',
  'Founder denial':       'Founder Conflict',
};

/** Maps a Valley `primary_failure_mode` (blind spot) to one of the six approved Fail Kit categories. */
export function mapFailureModeToCategory(primaryFailureMode: string | null | undefined): FailKitCategory {
  if (primaryFailureMode && FAILURE_MODE_TO_CATEGORY[primaryFailureMode]) {
    return FAILURE_MODE_TO_CATEGORY[primaryFailureMode];
  }
  return 'Operations';
}

// Valley `risk_level` → Fail Kit severity + urgency. The four Valley levels
// map 1:1 onto the four urgency bands defined for the Fail Kit workflow.
const RISK_LEVEL_TO_SEVERITY: Record<string, FailKitSeverity> = {
  'STABLE':            'Low',
  'EXPOSED':           'Medium',
  'INSIDE THE VALLEY': 'High',
  'COLLAPSE PROXIMITY':'Critical',
};

const RISK_LEVEL_TO_URGENCY: Record<string, FailKitUrgency> = {
  'STABLE':            'Green',
  'EXPOSED':           'Yellow',
  'INSIDE THE VALLEY': 'Red',
  'COLLAPSE PROXIMITY':'Black',
};

/** Maps a Valley `risk_level` to a Fail Kit severity. Falls back to score-based bands when the level is unknown. */
export function mapRiskToSeverity(riskScore: number | null | undefined, riskLevel: string | null | undefined): FailKitSeverity {
  if (riskLevel && RISK_LEVEL_TO_SEVERITY[riskLevel]) return RISK_LEVEL_TO_SEVERITY[riskLevel];
  const score = riskScore ?? 0;
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

/** Maps a Valley `risk_level` to a Fail Kit urgency band. Falls back to score-based bands when the level is unknown. */
export function mapRiskToUrgency(riskScore: number | null | undefined, riskLevel: string | null | undefined): FailKitUrgency {
  if (riskLevel && RISK_LEVEL_TO_URGENCY[riskLevel]) return RISK_LEVEL_TO_URGENCY[riskLevel];
  const score = riskScore ?? 0;
  if (score >= 80) return 'Black';
  if (score >= 60) return 'Red';
  if (score >= 35) return 'Yellow';
  return 'Green';
}

// Suggested follow-on advisory service, surfaced to the admin team as a hint
// alongside the Fail Kit (does not create a booking — informational only).
const URGENCY_TO_RECOMMENDED_SERVICE: Record<FailKitUrgency, string> = {
  Black:  'Emergency Session',
  Red:    'Startup Autopsy',
  Yellow: 'Founder Call',
  Green:  'Self-Paced Recovery',
};

/** Suggests a follow-on advisory service for the admin team based on urgency. Informational only — does not book anything. */
export function getRecommendedService(urgency: FailKitUrgency): string {
  return URGENCY_TO_RECOMMENDED_SERVICE[urgency];
}
