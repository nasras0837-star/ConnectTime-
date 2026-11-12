export type ReportInput = {
  category: string;
  targetType: string;
  targetUserId: string;
  contentReference: string;
  details: string;
  reporterUserId: string;
};

export function validateReportInput(input: ReportInput): boolean {
  const categories = ["harassment", "intimidation", "threats", "hate", "privacy", "sexual-content", "spam", "other"];
  const targetTypes = ["member", "post", "message", "other"];
  if (!categories.includes(input.category) || !targetTypes.includes(input.targetType)) return false;
  if (input.targetUserId && input.targetUserId === input.reporterUserId) return false;
  if (input.details.trim().length < 10) return false;
  if (input.targetType === "member") return Boolean(input.targetUserId) && !input.contentReference;
  if (input.targetType === "post" || input.targetType === "message") return Boolean(input.contentReference);
  return Boolean(input.targetUserId || input.contentReference);
}
