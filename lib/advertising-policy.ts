export function canEnterHumanReviewQueue(adSubmission: {
  status?: unknown;
  rights_confirmed?: unknown;
}): boolean {
  return adSubmission.status === "manual_review_required" && adSubmission.rights_confirmed === true;
}
