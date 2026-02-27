export type OnboardingStudent = {
  examType?: string | null;
  grade?: string | null;
  prioritySubjects?: string[] | null;
  targetScore?: number | null;
  dailyTime?: string | null;
  onboardingCompleted?: boolean | null;
  assessmentCompleted?: boolean | null;
};

export function getNextOnboardingPath(input: {
  student: OnboardingStudent | null;
  hasSchedule?: boolean | null;
}): string {
  const { student, hasSchedule } = input;

  if (!student) return "/onboarding/step-1";

  if (!student.examType || !student.grade) return "/onboarding/step-1";

  const subjects = student.prioritySubjects ?? [];
  if (!Array.isArray(subjects) || subjects.length === 0) return "/onboarding/step-2";

  if (student.targetScore == null || !student.dailyTime) return "/onboarding/step-3";

  if (!hasSchedule) return "/onboarding/step-4";

  // Onboarding done — check assessment
  if (!student.assessmentCompleted) return "/assessment/start";

  return "/dashboard";
}
