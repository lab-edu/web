export type UserRole = "STUDENT" | "TEACHER";

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type UserSummary = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  role: UserRole;
};

export type AuthLoginPayload = {
  identifier: string;
  password: string;
};

export type AuthRegisterPayload = {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role: UserRole;
};

export type AuthLoginData = {
  user: UserSummary;
  tokenType: string;
  expiresAt: string;
};

export type AuthMeData = {
  user: UserSummary;
};

export type AuthRegisterData = {
  user: UserSummary;
};

export type CourseSummary = {
  id: string;
  title: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  createdAt: string;
};

export type CourseMember = {
  user: UserSummary;
  memberRole: "TEACHER" | "STUDENT";
  joinedAt: string;
};

export type ExperimentSummary = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  publishedAt: string;
  dueAt: string | null;
  createdById: string;
  createdByUsername: string;
};

export type ResourceType = "FILE" | "VIDEO" | "LINK";

export type CourseResource = {
  id: string;
  courseId: string;
  name: string;
  type: ResourceType;
  category: string | null;
  fileName: string | null;
  externalUrl: string | null;
  uploadedBy: UserSummary;
  uploadedAt: string;
};

export type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
  inviteCode: string;
  owner: UserSummary;
  members: CourseMember[];
  experiments: ExperimentSummary[];
  createdAt: string;
};

export type SubmissionDetail = {
  id: string;
  experimentId: string;
  submittedBy: UserSummary;
  fileName: string;
  filePath: string;
  note: string | null;
  score: number | null;
  feedback: string | null;
  gradedBy: UserSummary | null;
  gradedAt: string | null;
  latest: boolean;
  submittedAt: string;
};

export type ExperimentGradeItem = {
  experimentId: string;
  experimentTitle: string;
  submissionId: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

export type StudentGradeOverview = {
  student: UserSummary;
  submissionCount: number;
  gradedCount: number;
  averageScore: number | null;
  experiments: ExperimentGradeItem[];
};

export type CourseGradeOverview = {
  students: StudentGradeOverview[];
};

export type CourseListData = {
  items: CourseSummary[];
};

export type CourseCreateData = {
  course: CourseSummary;
};

export type CourseJoinData = {
  course: CourseSummary;
};

export type ExperimentListData = {
  items: ExperimentSummary[];
};

export type ExperimentDetail = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  publishedAt: string;
  dueAt: string | null;
  createdBy: UserSummary;
};

export type ExperimentCreateData = {
  experiment: ExperimentSummary;
};

export type SubmissionListData = {
  items: SubmissionDetail[];
};

export type SubmissionCreateData = {
  submission: SubmissionDetail;
};

export type ResourceListData = {
  items: CourseResource[];
};

export type ResourceCreateData = {
  resource: CourseResource;
};
