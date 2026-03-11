export enum ApplicationStatus {
  PENDING = "Pending",
  UNDER_REVIEW = "Under Review",
  INTERVIEW_SCHEDULED = "Interview Scheduled",
  ACCEPTED = "Accepted",
  DECLINED = "Declined",
}

export enum VerificationStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected",
}

export interface Business {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  idUpload: string; // Base64 or URL
  description: string;
  verificationStatus: VerificationStatus;
}

export interface Seeker {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  attachments: string[]; // URLs or Base64
  idUpload: string; // Base64 or URL
  verificationStatus: VerificationStatus;
}

export interface Job {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  requirements: string;
  category: string;
  location: string;
  employmentType: string;
  salary: string;
  postedAt: string;
  status: "Active" | "Closed";
}

export interface Application {
  id: string;
  jobId: string;
  businessId: string;
  seekerId: string;
  seekerName: string;
  seekerContact: string;
  attachments: string[];
  notes: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "business" | "seeker" | "admin";
}

export type Page = "login" | "profile" | "business-register" | "seeker-register" | "business-dashboard" | "post-job" | "seeker-dashboard" | "admin-dashboard" | "notifications" | "job-details";
