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

export type CourseAnnouncement = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdBy: UserSummary;
  createdAt: string;
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

export type CourseAnnouncementListData = {
  items: CourseAnnouncement[];
};

export type CourseAnnouncementCreateData = {
  announcement: CourseAnnouncement;
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

export type LearningTaskType = "MEDIA" | "QUIZ";

export type LearningTaskKind = "LEARNING" | "HOMEWORK";

export type LearningMaterialType = "FILE" | "LINK" | "TEXT";

export type LearningQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_ANSWER";

export type CourseLearningTaskSummary = {
  id: string;
  knowledgePointId: string;
  title: string;
  description: string | null;
  taskType: LearningTaskType;
  taskKind: LearningTaskKind;
  materialType: LearningMaterialType | null;
  questionType: LearningQuestionType | null;
  contentText: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  options: string[];
  referenceAnswer: string | null;
  maxScore: number;
  startAt: string | null;
  dueAt: string | null;
  notifyOnStart: boolean;
  notifyBeforeDue24h: boolean;
  notifyOnDue: boolean;
  required: boolean;
  sortOrder: number;
  createdBy: UserSummary;
  createdAt: string;
};

export type CourseLearningPoint = {
  id: string;
  unitId: string;
  title: string;
  summary: string | null;
  estimatedMinutes: number | null;
  sortOrder: number;
  createdBy: UserSummary;
  createdAt: string;
  tasks: CourseLearningTaskSummary[];
};

export type CourseLearningUnit = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  published: boolean;
  createdBy: UserSummary;
  createdAt: string;
  points: CourseLearningPoint[];
};

export type CourseLearningDetail = {
  courseId: string;
  courseTitle: string;
  courseDescription: string | null;
  inviteCode: string;
  createdAt: string;
  units: CourseLearningUnit[];
};

export type CourseLearningTaskSubmission = {
  id: string;
  taskId: string;
  submittedBy: UserSummary;
  answerText: string | null;
  fileName: string | null;
  filePath: string | null;
  score: number | null;
  feedback: string | null;
  gradedBy: UserSummary | null;
  gradedAt: string | null;
  latest: boolean;
  submittedAt: string;
};

export type CourseLearningTaskSubmissionListData = {
  items: CourseLearningTaskSubmission[];
};

export type LearningTaskProgress = {
  unitId: string;
  unitTitle: string;
  pointId: string;
  pointTitle: string;
  taskId: string;
  taskTitle: string;
  taskType: LearningTaskType;
  taskKind: LearningTaskKind;
  materialType: LearningMaterialType | null;
  questionType: LearningQuestionType | null;
  maxScore: number;
  startAt: string | null;
  dueAt: string | null;
  submissionId: string | null;
  answerText: string | null;
  fileName: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  latest: boolean;
};

export type StudentLearningOverview = {
  student: UserSummary;
  submissionCount: number;
  gradedCount: number;
  averageScore: number | null;
  tasks: LearningTaskProgress[];
};

export type CourseLearningOverview = {
  unitCount: number;
  pointCount: number;
  taskCount: number;
  students: StudentLearningOverview[];
};

export type CourseHomeworkItem = {
  taskId: string;
  courseId: string;
  courseTitle: string;
  taskTitle: string;
  startAt: string | null;
  dueAt: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "OVERDUE";
  latestSubmissionId: string | null;
  latestSubmittedAt: string | null;
  latestScore: number | null;
  submittedCount: number;
  totalStudentCount: number;
  remainingSeconds: number | null;
};

export type CourseHomeworkListData = {
  items: CourseHomeworkItem[];
};
