const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    {/* Briefcase Body */}
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
      <defs>
        <linearGradient id="briefcaseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#0061ff" />
        </linearGradient>
      </defs>
      {/* Handle */}
      <path d="M35 25 Q35 15 50 15 Q65 15 65 25" fill="none" stroke="url(#briefcaseGradient)" strokeWidth="6" strokeLinecap="round" />
      {/* Main Body */}
      <rect x="15" y="25" width="70" height="50" rx="8" fill="url(#briefcaseGradient)" />
      {/* Lightning Bolt */}
      <path d="M55 30 L40 55 L50 55 L45 80 L65 45 L55 45 Z" fill="white" className="drop-shadow-sm" />
      {/* Speed Lines */}
      <line x1="5" y1="45" x2="12" y2="45" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <line x1="2" y1="55" x2="10" y2="55" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="8" y1="65" x2="14" y2="65" stroke="#4facfe" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
    </svg>
  </div>
);

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  Briefcase, 
  User, 
  Upload,
  X,
  PlusCircle, 
  LayoutDashboard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Users,
  ArrowLeft,
  Calendar,
  Facebook,
  ShieldCheck as ShieldCheckIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ApplicationStatus, 
  VerificationStatus,
  Business, 
  Seeker,
  Job, 
  Application, 
  Notification,
  UserProfile, 
  Page,
  Interview,
  Message,
  Review
} from "./types";

// Firebase Imports
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from './firebase';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './components/AdminDashboard';

// --- Toast System ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return { toasts, addToast };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center gap-3 min-w-[300px] border ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
              'bg-blue-50 border-blue-100 text-blue-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <ShieldAlert className="w-5 h-5" />}
            {toast.type === 'info' && <Mail className="w-5 h-5" />}
            <p className="text-sm font-bold">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

// --- Error Boundary ---
const ErrorBoundary: any = class extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl border border-rose-100 text-center">
            <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">
              {(this as any).state.error?.message?.includes('{') 
                ? "A database permission error occurred. Please check your access rights."
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  // --- State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const { toasts, addToast } = useToasts();

  // --- Error Handling ---
  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    }
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    
    let userMessage = "A database error occurred.";
    if (errInfo.error.includes("permission-denied")) {
      userMessage = "You don't have permission to perform this action.";
    } else if (errInfo.error.includes("quota-exceeded")) {
      userMessage = "Database quota exceeded. Please try again later.";
    }
    
    addToast(userMessage, 'error');
  };

  // --- Firebase Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            console.log("User profile found:", userData.role);
            
            // Special check for the default admin
            if (firebaseUser.email === "acipandrey@gmail.com" && userData.role !== "admin") {
              await updateDoc(doc(db, 'users', firebaseUser.uid), { role: "admin" });
              setUser({ ...userData, role: "admin" });
            } else {
              setUser(userData);
            }
          } else if (!isCreatingProfile) {
            console.log("User profile not found, auto-creating...");
            // User exists in Auth but not in Firestore (e.g., just signed up via social)
            if (currentPage === "login") {
              const role = firebaseUser.email === "acipandrey@gmail.com" ? "admin" : "seeker";
              const newUser: UserProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "New Neighbor",
                email: firebaseUser.email || "",
                role: role as any
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUser(newUser);
              
              if (role === "admin") setCurrentPage("admin-dashboard");
              else setCurrentPage("seeker-register");
            }
          }
        } catch (error) {
          console.error("Error in auth listener:", error);
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
        if (currentPage !== "login") setCurrentPage("login");
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [isCreatingProfile, currentPage]); // Added isCreatingProfile to dependencies

  // --- Navigation Logic ---
  useEffect(() => {
    if (!isAuthReady || !user || currentPage !== "login") return;

    if (user.role === "admin") setCurrentPage("admin-dashboard");
    else if (user.role === "seeker") setCurrentPage("seeker-dashboard");
    else if (user.role === "business") setCurrentPage("business-dashboard");
  }, [isAuthReady, user, currentPage]);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const unsubBusinesses = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => doc.data() as Business));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'businesses'));

    const unsubSeekers = onSnapshot(collection(db, 'seekers'), (snapshot) => {
      setSeekers(snapshot.docs.map(doc => doc.data() as Seeker));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'seekers'));

    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      setJobs(snapshot.docs.map(doc => doc.data() as Job));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'jobs'));

    const unsubApplications = onSnapshot(collection(db, 'applications'), (snapshot) => {
      setApplications(snapshot.docs.map(doc => doc.data() as Application));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'applications'));

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', user.id)),
      (snapshot) => {
        setNotifications(snapshot.docs.map(doc => doc.data() as Notification));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
    );
    
    const unsubInterviews = onSnapshot(collection(db, 'interviews'), (snapshot) => {
      setInterviews(snapshot.docs.map(doc => doc.data() as Interview));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'interviews'));

    const unsubMessages = onSnapshot(
      query(collection(db, 'messages'), where('chatId', '!=', '')), // Simple query for all messages for now
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => doc.data() as Message));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'messages')
    );

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      setReviews(snapshot.docs.map(doc => doc.data() as Review));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reviews'));

    return () => {
      unsubBusinesses();
      unsubSeekers();
      unsubJobs();
      unsubApplications();
      unsubNotifications();
      unsubInterviews();
      unsubMessages();
      unsubReviews();
    };
  }, [isAuthReady, user]);

  // Test Connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // --- Handlers ---
  const addNotification = async (userId: string, title: string, message: string, type: "info" | "success" | "warning" = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: Notification = {
      id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `notifications/${id}`);
    }
  };

  const logSecurityEvent = async (action: string, details: string, severity: 'low' | 'medium' | 'high' = 'low') => {
    const id = Math.random().toString(36).substr(2, 9);
    const log = {
      id,
      action,
      userId: user?.id || 'anonymous',
      details,
      timestamp: new Date().toISOString(),
      severity
    };
    try {
      await setDoc(doc(db, 'system_logs', id), log);
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        const role = firebaseUser.email === "acipandrey@gmail.com" ? "admin" : "seeker";
        const newUser: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "New Neighbor",
          email: firebaseUser.email || "",
          role: role as any
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
        
        if (role === "admin") setCurrentPage("admin-dashboard");
        else setCurrentPage("seeker-register");
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const firebaseUser = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        const role = firebaseUser.email === "acipandrey@gmail.com" ? "admin" : "seeker";
        const newUser: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "New Neighbor",
          email: firebaseUser.email || "",
          role: role as any
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        setUser(newUser);
        
        if (role === "admin") setCurrentPage("admin-dashboard");
        else setCurrentPage("seeker-register");
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage("login");
      addToast("Logged out successfully", 'info');
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const registerBusiness = async (data: Omit<Business, "id" | "verificationStatus">) => {
    if (!user) return;
    const newBusiness: Business = { 
      ...data, 
      email: user.email,
      id: user.id, 
      verificationStatus: VerificationStatus.PENDING 
    };
    try {
      await setDoc(doc(db, 'businesses', user.id), newBusiness);
      addNotification("admin-id", "New Employer Registration", `Employer ${data.name} is awaiting verification.`, "warning");
      setCurrentPage("business-dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `businesses/${user.id}`);
    }
  };

  const registerSeeker = async (data: Omit<Seeker, "id" | "verificationStatus">) => {
    if (!user) return;
    const newSeeker: Seeker = { 
      ...data, 
      email: user.email,
      id: user.id, 
      verificationStatus: VerificationStatus.PENDING 
    };
    try {
      await setDoc(doc(db, 'seekers', user.id), newSeeker);
      setCurrentPage("seeker-dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `seekers/${user.id}`);
    }
  };

  const postJob = async (data: Omit<Job, "id" | "businessId" | "businessName" | "postedAt" | "status">) => {
    if (!user) return;
    const business = businesses.find(b => b.id === user.id);
    if (!business || business.verificationStatus !== VerificationStatus.VERIFIED) {
      addToast("Only verified employers can post jobs.", 'error');
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newJob: Job = {
      ...data,
      id,
      businessId: user.id,
      businessName: business.name,
      postedAt: new Date().toISOString(),
      status: "Active",
    };
    try {
      await setDoc(doc(db, 'jobs', id), newJob);
      setCurrentPage("business-dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `jobs/${id}`);
    }
  };

  const updateJobStatus = async (jobId: string, status: "Active" | "Closed") => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
    }
  };

  const applyForJob = async (job: Job) => {
    if (!user) return;
    const seeker = seekers.find(s => s.id === user.id);
    const existing = applications.find(a => a.jobId === job.id && a.seekerId === user.id);
    if (existing) {
      addToast("You've already applied for this job!", 'info');
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newApplication: Application = {
      id,
      jobId: job.id,
      businessId: job.businessId,
      seekerId: user.id,
      seekerName: user.name,
      seekerContact: user.email,
      attachments: seeker?.attachments || [],
      notes: "Interested in this local opportunity.",
      status: ApplicationStatus.PENDING,
      appliedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'applications', id), newApplication);
      addNotification(job.businessId, "New Applicant", `You have a new applicant for ${job.title}.`, "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `applications/${id}`);
    }
  };

  const updateApplicationStatus = async (appId: string, status: ApplicationStatus) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    
    try {
      await updateDoc(doc(db, 'applications', appId), { status });
      addNotification(app.seekerId, "Application Update", `Your application for ${jobs.find(j => j.id === app.jobId)?.title} is now ${status}.`, status === ApplicationStatus.ACCEPTED ? "success" : "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const verifyEntity = async (id: string, role: "business" | "seeker", status: VerificationStatus) => {
    const collectionName = role === "business" ? 'businesses' : 'seekers';
    try {
      if (status === VerificationStatus.REJECTED) {
        await deleteDoc(doc(db, collectionName, id));
        addNotification(id, "Account Rejected", `Your ${role} profile has been rejected and removed.`, "warning");
      } else {
        await updateDoc(doc(db, collectionName, id), { verificationStatus: status });
        addNotification(id, "Verification Update", `Your ${role} profile has been ${status}.`, status === VerificationStatus.VERIFIED ? "success" : "warning");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    }
  };

  const scheduleInterview = async (data: Omit<Interview, "id" | "status">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newInterview: Interview = { ...data, id, status: "Scheduled" };
    try {
      await setDoc(doc(db, 'interviews', id), newInterview);
      await updateApplicationStatus(data.applicationId, ApplicationStatus.INTERVIEW_SCHEDULED);
      addNotification(data.seekerId, "Interview Scheduled", `An interview has been scheduled for ${jobs.find(j => j.id === data.jobId)?.title}.`, "success");
      addToast("Interview scheduled!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `interviews/${id}`);
    }
  };

  const sendMessage = async (chatId: string, receiverId: string, content: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      id,
      chatId,
      senderId: user.id,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    try {
      await setDoc(doc(db, 'messages', id), newMessage);
      addNotification(receiverId, "New Message", `You have a new message from ${user.name}.`, "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `messages/${id}`);
    }
  };

  const addReview = async (targetUserId: string, rating: number, comment: string) => {
    if (!user) return;
    const id = Math.random().toString(36).substr(2, 9);
    const newReview: Review = {
      id,
      targetUserId,
      authorId: user.id,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'reviews', id), newReview);
      addToast("Review submitted!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reviews/${id}`);
    }
  };

  // --- Derived State ---
  const currentBusiness = user ? businesses.find(b => b.id === user.id) : null;
  const businessJobs = jobs.filter(j => j.businessId === user?.id);
  const businessApplications = applications.filter(a => a.businessId === user?.id);
  const seekerApplications = applications.filter(a => a.seekerId === user?.id);

  // --- Navigation ---
  const navigate = (page: Page) => setCurrentPage(page);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("profile")}>
              <Logo className="w-10 h-10" />
              <span className="text-xl font-bold text-[#1a365d] tracking-tight uppercase">Raketero</span>
            </div>

            {user && (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => {
                    if (user.role === "admin") navigate("admin-dashboard");
                    else if (user.role === "business") navigate("business-dashboard");
                    else navigate("seeker-dashboard");
                  }}
                  className="text-slate-600 hover:text-[#5a5a40] font-medium transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate("messages")}
                  className="text-slate-600 hover:text-[#5a5a40] font-medium transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Messages
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentPage === "login" && (
            <LoginPage 
              key="login" 
              onGoogleLogin={handleGoogleLogin}
              onFacebookLogin={handleFacebookLogin}
            />
          )}

          {currentPage === "profile" && (
            <ProfilePage key="profile" user={user} />
          )}

          {currentPage === "business-register" && (
            <BusinessRegisterPage key="register" onRegister={registerBusiness} />
          )}

          {currentPage === "seeker-register" && (
            <SeekerRegisterPage key="seeker-reg" onRegister={registerSeeker} initialData={{ email: user?.email, name: user?.name }} />
          )}

          {currentPage === "business-dashboard" && (
            <BusinessDashboard 
              key="business-dash"
              business={currentBusiness}
              jobs={businessJobs}
              applications={businessApplications}
              onNavigate={navigate}
              onUpdateStatus={updateApplicationStatus}
              seekers={seekers}
              onMessage={(receiverId) => {
                // Create a chatId if it doesn't exist or find existing
                const existingMessage = messages.find(m => 
                  (m.senderId === user?.id && m.receiverId === receiverId) ||
                  (m.senderId === receiverId && m.receiverId === user?.id)
                );
                const chatId = existingMessage ? existingMessage.chatId : `${user?.id}_${receiverId}`;
                navigate("messages");
                // We could also set the active chat here if we had a way to pass it to MessagesPage
              }}
            />
          )}

          {currentPage === "post-job" && (
            <PostJobForm key="post-job" onPost={postJob} onCancel={() => navigate("business-dashboard")} />
          )}

          {currentPage === "seeker-dashboard" && (
            <SeekerDashboard 
              key="seeker-dash"
              user={user}
              jobs={jobs}
              applications={seekerApplications}
              onApply={applyForJob}
              onViewDetails={(jobId) => {
                setSelectedJobId(jobId);
                navigate("job-details");
              }}
              verificationStatus={seekers.find(s => s.id === user?.id)?.verificationStatus ?? VerificationStatus.PENDING}
              businesses={businesses}
            />
          )}

          {currentPage === "job-details" && selectedJobId && (
            <JobDetailsPage 
              key="job-details"
              job={jobs.find(j => j.id === selectedJobId)}
              business={businesses.find(b => b.id === jobs.find(j => j.id === selectedJobId)?.businessId)}
              hasApplied={applications.some(a => a.jobId === selectedJobId && a.seekerId === user?.id)}
              onApply={() => {
                const job = jobs.find(j => j.id === selectedJobId);
                if (job) applyForJob(job);
              }}
              onBack={() => navigate("seeker-dashboard")}
              onMessage={(receiverId) => {
                const existingMessage = messages.find(m => 
                  (m.senderId === user?.id && m.receiverId === receiverId) ||
                  (m.senderId === receiverId && m.receiverId === user?.id)
                );
                const chatId = existingMessage ? existingMessage.chatId : `${user?.id}_${receiverId}`;
                navigate("messages");
              }}
            />
          )}

          {currentPage === "admin-dashboard" && (
            <ProtectedRoute 
              user={user} 
              allowedRoles={['admin']} 
              fallback={<div className="text-center py-20"><ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" /><h2 className="text-2xl font-bold">Access Denied</h2><p className="text-slate-500">You do not have permission to view this page.</p></div>}
            >
              <AdminDashboard 
                key="admin-dash"
                businesses={businesses}
                seekers={seekers}
                onVerify={verifyEntity}
              />
            </ProtectedRoute>
          )}

          {currentPage === "messages" && (
            <MessagesPage 
              key="messages"
              user={user}
              messages={messages}
              onSendMessage={sendMessage}
              businesses={businesses}
              seekers={seekers}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Page Components ---

function LoginPage({ onGoogleLogin, onFacebookLogin }: { 
  onGoogleLogin: () => Promise<void>,
  onFacebookLogin: () => Promise<void>,
  key?: any 
}) {
  const [loading, setLoading] = useState(false);

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      if (provider === 'google') await onGoogleLogin();
      else await onFacebookLogin();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-12 px-4"
    >
      <div className="card-warm shadow-2xl border border-[#e5e2d5]/50">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="w-24 h-24" />
            </motion.div>
          </div>
          <h1 className="text-4xl font-black text-[#3a3a30] serif tracking-tight">Raketero</h1>
          <p className="text-[#5a5a40] font-bold text-[10px] tracking-[0.3em] uppercase mt-2 opacity-70">Empowering Local Talents</p>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-[#e5e2d5]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Social Connect</span>
            <div className="h-[1px] flex-1 bg-[#e5e2d5]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-3 py-3.5 border border-[#e5e2d5] rounded-2xl hover:bg-slate-50 transition-all group disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
              <span className="text-sm font-bold text-slate-600">Google</span>
            </button>
            <button 
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-3 py-3.5 border border-[#e5e2d5] rounded-2xl hover:bg-slate-50 transition-all group disabled:opacity-50"
            >
              <Facebook className="w-4 h-4 text-slate-400 group-hover:text-[#1877f2] transition-all" />
              <span className="text-sm font-bold text-slate-600">Facebook</span>
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            {loading ? "Connecting..." : "Sign in with your social account to continue."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ProfilePage({ user }: { user: UserProfile | null, key?: any }) {
  if (!user) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl mx-auto"
      >
        <div className="card-warm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5f5f0] rounded-bl-full -z-10" />
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-[#5a5a40] rounded-full flex items-center justify-center text-white text-3xl font-bold serif">
              {user.name?.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3a3a30] serif">{user.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-[#fdfcf8] rounded-2xl border border-[#e5e2d5]">
              <p className="text-xs text-[#5a5a40] uppercase tracking-wider font-semibold mb-1">Role</p>
              <p className="text-lg font-bold text-[#3a3a30] capitalize">{user.role === 'business' ? 'Employer / Hiring' : user.role === 'admin' ? 'Administrator' : 'Job Seeker / Looking'}</p>
            </div>
            <div className="p-6 bg-[#fdfcf8] rounded-2xl border border-[#e5e2d5]">
              <p className="text-xs text-[#5a5a40] uppercase tracking-wider font-semibold mb-1">Member Since</p>
              <p className="text-lg font-bold text-[#3a3a30]">March 2026</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
}

function MessagesPage({ user, messages, onSendMessage, businesses, seekers }: { 
  user: UserProfile | null, 
  messages: Message[], 
  onSendMessage: (chatId: string, receiverId: string, content: string) => Promise<void>,
  businesses: Business[],
  seekers: Seeker[],
  key?: any
}) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  if (!user) return null;

  const userMessages = messages.filter(m => m.senderId === user.id || m.receiverId === user.id);
  const chats = Array.from(new Set(userMessages.map(m => m.chatId)));
  
  const activeChatMessages = userMessages.filter(m => m.chatId === activeChatId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const getOtherParty = (chatId: string) => {
    const firstMsg = userMessages.find(m => m.chatId === chatId);
    if (!firstMsg) return null;
    const otherId = firstMsg.senderId === user.id ? firstMsg.receiverId : firstMsg.senderId;
    return businesses.find(b => b.id === otherId) || seekers.find(s => s.id === otherId) || { name: "Unknown User", id: otherId };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId) return;
    
    const otherParty = getOtherParty(activeChatId);
    if (otherParty) {
      await onSendMessage(activeChatId, otherParty.id, newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      <div className="md:col-span-1 bg-white rounded-[32px] border border-[#e5e2d5] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#e5e2d5] bg-[#fdfcf8]">
          <h2 className="text-xl font-bold text-[#3a3a30] serif">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.length === 0 ? (
            <div className="text-center py-10 text-slate-400 italic text-sm">No conversations yet</div>
          ) : (
            chats.map(chatId => {
              const otherParty = getOtherParty(chatId);
              return (
                <button
                  key={chatId}
                  onClick={() => setActiveChatId(chatId)}
                  className={`w-full p-4 rounded-2xl text-left transition-all ${activeChatId === chatId ? 'bg-[#5a5a40] text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                >
                  <p className="font-bold truncate">{otherParty?.name}</p>
                  <p className={`text-xs truncate ${activeChatId === chatId ? 'text-white/70' : 'text-slate-400'}`}>
                    {userMessages.filter(m => m.chatId === chatId).pop()?.content}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-[32px] border border-[#e5e2d5] overflow-hidden flex flex-col">
        {activeChatId ? (
          <>
            <div className="p-6 border-b border-[#e5e2d5] bg-[#fdfcf8] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#3a3a30] serif">{getOtherParty(activeChatId)?.name}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {activeChatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.senderId === user.id ? 'bg-[#5a5a40] text-white rounded-tr-none' : 'bg-white border border-[#e5e2d5] text-slate-700 rounded-tl-none'}`}>
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-white/50' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="p-6 border-t border-[#e5e2d5] bg-white">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-6 py-3 rounded-2xl border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40]/20 focus:border-[#5a5a40] outline-none transition-all"
                />
                <button type="submit" className="bg-[#5a5a40] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#3a3a30] transition-all shadow-lg">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
            <Mail className="w-16 h-16 mb-4 opacity-20" />
            <p className="serif text-xl">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessRegisterPage({ onRegister }: { onRegister: (data: Omit<Business, "id" | "verificationStatus">) => void, key?: any }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    idUpload: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(formData as any);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="card-warm">
        <h2 className="text-2xl font-bold text-[#3a3a30] mb-6 serif">Employer Verification</h2>
        <p className="text-slate-500 mb-8 -mt-4">Verify your identity to start posting errands or job opportunities for your neighbors.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Full Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Contact Number</label>
              <input 
                required
                type="tel" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="0912 345 6789"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Address</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="Barangay, City"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Valid ID (Base64/URL)</label>
            <p className="text-[10px] text-slate-400 mb-2 italic">Upload a photo of your National ID, Driver's License, or Passport for verification.</p>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
              placeholder="Paste ID image URL or Base64"
              value={formData.idUpload}
              onChange={e => setFormData({...formData, idUpload: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">About You / Your Needs</label>
            <textarea 
              required
              className="w-full px-4 py-3 rounded-[24px] border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none h-32"
              placeholder="Briefly describe what kind of help you usually need (e.g., errands, home cleaning, tutoring)..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="btn-primary w-full"
          >
            Submit for Verification
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function SeekerRegisterPage({ onRegister, initialData }: { onRegister: (data: Omit<Seeker, "id" | "verificationStatus">) => void, initialData: Partial<Seeker>, key?: any }) {
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    phone: "",
    address: "",
    idUpload: "",
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    const newAttachments: string[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      
      newAttachments.push(base64);
    }

    setAttachments(newAttachments);
    setIsUploading(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      ...formData,
      attachments,
    } as any);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="card-warm">
        <h2 className="text-2xl font-bold text-[#3a3a30] mb-6 serif">Seeker Profile Validation</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Full Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Contact Number</label>
              <input 
                required
                type="tel" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Address / Location</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Attachments (Resume, Certificates, Portfolio)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#e5e2d5] border-dashed rounded-[24px] cursor-pointer bg-[#fdfcf8] hover:bg-[#f5f5f0] transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-[#5a5a40] mb-2" />
                  <p className="text-sm text-slate-500">
                    <span className="font-bold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">Images or PDF (Max 5MB)</p>
                </div>
                <input type="file" className="hidden" multiple onChange={handleFileChange} accept="image/*,.pdf" />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {attachments.map((file, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-[#e5e2d5]">
                    {file.startsWith("data:image") ? (
                      <img src={file} className="w-full h-full object-cover" alt={`Attachment ${index + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {isUploading && <p className="text-xs text-[#5a5a40] animate-pulse">Processing files...</p>}
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Valid ID (URL or Base64)</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="Paste ID image URL or Base64"
                value={formData.idUpload}
                onChange={e => setFormData({...formData, idUpload: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="btn-primary w-full"
            disabled={isUploading}
          >
            Complete Profile
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function BusinessDashboard({ 
  business, 
  jobs, 
  applications, 
  onNavigate,
  onUpdateStatus,
  seekers,
  onMessage
}: { 
  business: Business | null | undefined, 
  jobs: Job[], 
  applications: Application[],
  onNavigate: (page: Page) => void,
  onUpdateStatus: (id: string, status: ApplicationStatus) => void,
  seekers: Seeker[],
  onMessage: (receiverId: string) => void,
  key?: any
}) {
  if (!business) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#3a3a30] serif">Employer Profile Required</h2>
        <p className="text-slate-500 mt-2 mb-8">Complete your employer profile to start posting errands or job opportunities.</p>
        <button 
          onClick={() => onNavigate("business-register")}
          className="btn-primary"
        >
          Complete Profile
        </button>
      </div>
    );
  }

  const businessJobs = jobs.filter(j => j.businessId === business.id);
  const jobIds = businessJobs.map(j => j.id);
  const businessApplications = applications.filter(a => jobIds.includes(a.jobId));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-[#5a5a40] font-bold text-2xl serif">
            {business.name?.charAt(0) || "?"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#3a3a30] serif">{business.name}</h1>
              {business.verificationStatus === VerificationStatus.VERIFIED ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Employer
                </div>
              ) : business.verificationStatus === VerificationStatus.PENDING ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" /> Verification Rejected
                </div>
              )}
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4" /> {business.address}
            </p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate("post-job")}
          className="btn-primary flex items-center gap-2"
          disabled={business.verificationStatus !== VerificationStatus.VERIFIED}
        >
          <PlusCircle className="w-5 h-5" /> Post a Side Job
        </button>
      </div>

      {business.verificationStatus !== VerificationStatus.VERIFIED && (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">Verification Required</h3>
            <p className="text-amber-700 text-sm mt-1">
              Your account is currently {business.verificationStatus.toLowerCase()}. You will be able to post side jobs once our administrators have verified your identity.
            </p>
          </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#f5f5f0] rounded-2xl text-[#5a5a40]">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Posts</p>
              <p className="text-2xl font-bold text-[#3a3a30]">{businessJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Applicants</p>
              <p className="text-2xl font-bold text-[#3a3a30]">{businessApplications.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#5a5a40] p-6 rounded-[24px] shadow-lg shadow-[#5a5a40]/10 flex items-center justify-between">
          <div>
            <p className="text-[#f5f5f0] text-xs font-medium uppercase tracking-wider">Hiring Status</p>
            <p className="text-white text-lg font-bold serif">Manage your team</p>
          </div>
          <div className="bg-white/20 p-2 rounded-full">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applicants List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-[#3a3a30] flex items-center gap-2 serif">
            <User className="w-5 h-5 text-[#5a5a40]" />
            Recent Applications
          </h3>
          {businessApplications.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center border border-[#e5e2d5]">
              <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">Waiting for neighbors to reach out...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {businessApplications.map(app => {
                const job = jobs.find(j => j.id === app.jobId);
                const seeker = seekers.find(s => s.id === app.seekerId);
                return (
                  <div key={app.id} className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40] font-bold serif relative">
                          {seeker?.name?.charAt(0) || "?"}
                          {seeker?.verificationStatus === VerificationStatus.VERIFIED && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                              <ShieldCheck className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#3a3a30]">{seeker?.name}</h4>
                            {seeker?.verificationStatus === VerificationStatus.VERIFIED && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified Seeker</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500">Interested in <span className="text-[#5a5a40] font-medium">{job?.title}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onMessage(app.seekerId)}
                          className="p-2 text-[#5a5a40] hover:bg-[#f5f5f0] rounded-full transition-colors"
                          title="Send Message"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            app.status === ApplicationStatus.ACCEPTED ? 'bg-emerald-100 text-emerald-700' :
                            app.status === ApplicationStatus.DECLINED ? 'bg-rose-100 text-rose-700' :
                            app.status === ApplicationStatus.INTERVIEW_SCHEDULED ? 'bg-blue-100 text-blue-700' :
                            app.status === ApplicationStatus.UNDER_REVIEW ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {app.status?.replace('_', ' ') || app.status}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Unknown date"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-[#fdfcf8] rounded-2xl border border-[#f5f5f0] text-sm">
                      <p className="text-slate-600 italic">"{app.notes || "No additional notes provided."}"</p>
                      {app.attachments && app.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {app.attachments.map((file, idx) => (
                            <a 
                              key={idx}
                              href={file} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e2d5] rounded-xl text-[#5a5a40] font-bold hover:bg-slate-50 transition-colors text-xs"
                            >
                              <FileText className="w-3.5 h-3.5" /> 
                              {file.startsWith("data:image") ? "View Image" : "View Document"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#f5f5f0]">
                      {app.status === ApplicationStatus.PENDING && (
                        <button 
                          onClick={() => onUpdateStatus(app.id, ApplicationStatus.UNDER_REVIEW)}
                          className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full font-bold text-xs hover:bg-amber-100 transition-colors"
                        >
                          Mark Under Review
                        </button>
                      )}
                      {app.status === ApplicationStatus.UNDER_REVIEW && (
                        <button 
                          onClick={() => onUpdateStatus(app.id, ApplicationStatus.INTERVIEW_SCHEDULED)}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-xs hover:bg-blue-100 transition-colors"
                        >
                          Schedule Interview
                        </button>
                      )}
                      {(app.status === ApplicationStatus.PENDING || app.status === ApplicationStatus.UNDER_REVIEW || app.status === ApplicationStatus.INTERVIEW_SCHEDULED) && (
                        <>
                          <button 
                            onClick={() => onUpdateStatus(app.id, ApplicationStatus.ACCEPTED)}
                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs hover:bg-emerald-100 transition-colors"
                          >
                            Hire Seeker
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(app.id, ApplicationStatus.DECLINED)}
                            className="px-4 py-2 bg-rose-50 text-rose-700 rounded-full font-bold text-xs hover:bg-rose-100 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Jobs List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-[#3a3a30] flex items-center gap-2 serif">
            <FileText className="w-5 h-5 text-[#5a5a40]" />
            Your Postings
          </h3>
          {businessJobs.length === 0 ? (
            <div className="bg-[#fdfcf8] border-2 border-dashed border-[#e5e2d5] rounded-[24px] p-8 text-center">
              <p className="text-slate-400 text-sm">No roles posted yet</p>
            </div>
          ) : (
            businessJobs.map(job => (
              <div key={job.id} className="bg-white p-5 rounded-[20px] border border-[#e5e2d5] hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-[#3a3a30]">{job.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.employmentType}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-[#f5f5f0] flex items-center justify-between text-[10px] font-bold text-[#5a5a40] uppercase tracking-widest">
                  <span>{applications.filter(a => a.jobId === job.id).length} Applicants</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PostJobForm({ onPost, onCancel }: { onPost: (data: Omit<Job, "id" | "businessId" | "status" | "postedAt">) => void, onCancel: () => void, key?: any }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    category: "",
    location: "",
    salary: "",
    employmentType: "Side Job",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPost(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="card-warm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#3a3a30] serif">Post a Local Opportunity</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Role Title</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
              placeholder="e.g. Weekend Barista / Dog Walker"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Category</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="Hospitality / Service"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Employment Type</label>
              <select 
                required
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none bg-white"
                value={formData.employmentType}
                onChange={e => setFormData({...formData, employmentType: e.target.value})}
              >
                <option value="Side Job">Side Job</option>
                <option value="Part-time">Part-time</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Location</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="Downtown / North End"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Pay / Compensation</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-full border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none"
                placeholder="$20/hr / Negotiable"
                value={formData.salary}
                onChange={e => setFormData({...formData, salary: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Description</label>
            <textarea 
              required
              className="w-full px-4 py-3 rounded-[24px] border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none h-40"
              placeholder="Describe the errand or job. What do you need help with? What are the hours?"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#5a5a40] mb-1">Requirements</label>
            <textarea 
              required
              className="w-full px-4 py-3 rounded-[24px] border border-[#e5e2d5] focus:ring-2 focus:ring-[#5a5a40] outline-none h-40"
              placeholder="What skills or experience are needed?"
              value={formData.requirements}
              onChange={e => setFormData({...formData, requirements: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary flex-[2]"
            >
              Post Opportunity
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function JobDetailsPage({ 
  job, 
  business, 
  hasApplied, 
  onApply, 
  onBack,
  onMessage
}: { 
  job: Job | undefined, 
  business: Business | undefined, 
  hasApplied: boolean, 
  onApply: () => void, 
  onBack: () => void,
  onMessage: (receiverId: string) => void,
  key?: any
}) {
  if (!job || !business) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <AlertTriangle className="w-16 h-16 text-rose-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#3a3a30] serif">Opportunity Not Found</h2>
        <p className="text-slate-500 mt-2 mb-8">The job posting you're looking for may have been removed or is no longer available.</p>
        <button onClick={onBack} className="btn-primary">Back to Search</button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-[#5a5a40] font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Opportunities
      </button>

      <div className="bg-white rounded-[40px] border border-[#e5e2d5] overflow-hidden shadow-sm">
        <div className="bg-[#fdfcf8] p-8 md:p-12 border-b border-[#f5f5f0]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-3xl border border-[#e5e2d5] flex items-center justify-center text-[#5a5a40] font-bold text-3xl serif shadow-sm">
                {job.businessName?.charAt(0) || "?"}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-[#3a3a30] serif">{job.title}</h1>
                  {business.verificationStatus === VerificationStatus.VERIFIED && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-tighter border border-emerald-100">Verified</span>
                  )}
                </div>
                <p className="text-lg text-slate-500 font-medium">{job.businessName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 bg-white border border-[#e5e2d5] rounded-full text-xs font-bold text-[#5a5a40] uppercase tracking-wider">
                {job.category}
              </span>
              <span className="px-4 py-1.5 bg-white border border-[#e5e2d5] rounded-full text-xs font-bold text-[#5a5a40] uppercase tracking-wider">
                {job.employmentType}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10">
            <section>
              <h3 className="text-xl font-bold text-[#3a3a30] serif mb-4">Description</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-[#3a3a30] serif mb-4">Requirements</h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </p>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-[#fdfcf8] p-6 rounded-[32px] border border-[#e5e2d5] space-y-6">
              <h4 className="font-bold text-[#3a3a30] serif">Opportunity Details</h4>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#e5e2d5] flex items-center justify-center text-[#5a5a40]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Location</p>
                    <p className="text-slate-700 font-medium">{job.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#e5e2d5] flex items-center justify-center text-[#5a5a40]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Compensation</p>
                    <p className="text-slate-700 font-medium">{job.salary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#e5e2d5] flex items-center justify-center text-[#5a5a40]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Posted On</p>
                    <p className="text-slate-700 font-medium">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "Unknown date"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  disabled={hasApplied}
                  onClick={onApply}
                  className={`w-full py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${
                    hasApplied 
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "btn-primary shadow-lg shadow-[#5a5a40]/10"
                  }`}
                >
                  {hasApplied ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  {hasApplied ? "Already Applied" : "Apply for this Job"}
                </button>
                <button 
                  onClick={() => onMessage(business.id)}
                  className="w-full py-4 rounded-full font-bold border border-[#5a5a40] text-[#5a5a40] hover:bg-[#f5f5f0] transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Message Employer
                </button>
              </div>
            </div>

            <div className="p-6 rounded-[32px] border border-[#e5e2d5] bg-white">
              <h4 className="font-bold text-[#3a3a30] serif mb-4">About the Employer</h4>
              <p className="text-sm text-slate-600 mb-4">{business.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Community Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SeekerDashboard({ 
  user,
  jobs, 
  applications, 
  onApply,
  onViewDetails,
  verificationStatus,
  businesses
}: { 
  user: UserProfile | null,
  jobs: Job[], 
  applications: Application[], 
  onApply: (job: Job) => void,
  onViewDetails: (jobId: string) => void,
  verificationStatus: VerificationStatus,
  businesses: Business[],
  key?: any
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");

  const categories = ["All Categories", ...Array.from(new Set(jobs.map(j => j.category)))];
  const locations = ["All Locations", ...Array.from(new Set(jobs.map(j => j.location)))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All Categories" || job.category === selectedCategory;
    const matchesLocation = selectedLocation === "All Locations" || job.location === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-[#5a5a40] font-bold text-2xl serif">
            {user?.name?.charAt(0) || "S"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[#3a3a30] serif">Welcome, {user?.name}</h1>
              {verificationStatus === VerificationStatus.VERIFIED ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Seeker
                </div>
              ) : verificationStatus === VerificationStatus.PENDING ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" /> Verification Rejected
                </div>
              )}
            </div>
            <p className="text-slate-500 mt-1 text-sm">Find your next local opportunity today.</p>
          </div>
        </div>
      </div>

      {verificationStatus !== VerificationStatus.VERIFIED && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800">
          <Clock className="w-5 h-5" />
          <p className="text-sm font-medium">
            {verificationStatus === VerificationStatus.PENDING 
              ? "Your profile is pending verification by a moderator. Verified neighbors often get faster responses from employers."
              : "Your profile is not yet verified. Please complete your profile validation to increase your chances of being hired."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Search & Listings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by role or business..."
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white border border-[#e5e2d5] shadow-sm focus:ring-2 focus:ring-[#5a5a40] outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[160px]">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#e5e2d5] shadow-sm focus:ring-2 focus:ring-[#5a5a40] outline-none appearance-none text-sm font-medium text-slate-600"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 min-w-[160px]">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-[#e5e2d5] shadow-sm focus:ring-2 focus:ring-[#5a5a40] outline-none appearance-none text-sm font-medium text-slate-600"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#3a3a30] serif">Local Opportunities</h3>
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-[32px] p-12 text-center border border-[#e5e2d5]">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No opportunities found matching your search.</p>
              </div>
            ) : (
              filteredJobs.map(job => {
                const hasApplied = applications.some(a => a.jobId === job.id);
                const business = businesses.find(b => b.id === job.businessId);
                return (
                  <div 
                    key={job.id} 
                    onClick={() => onViewDetails(job.id)}
                    className="bg-white p-6 rounded-[32px] border border-[#e5e2d5] hover:shadow-md transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40] font-bold text-xl serif relative">
                          {job.businessName?.charAt(0) || "?"}
                          {business?.verificationStatus === VerificationStatus.VERIFIED && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-[#3a3a30] group-hover:text-[#5a5a40] transition-colors serif">{job.title}</h4>
                            {business?.verificationStatus === VerificationStatus.VERIFIED && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified Employer</span>
                            )}
                          </div>
                          <p className="text-slate-500 font-medium">{job.businessName}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-[#fdfcf8] text-[#5a5a40] border border-[#e5e2d5] rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {job.category}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm line-clamp-2 mb-6">
                      {job.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#f5f5f0]">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
                        <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.employmentType}</span>
                      </div>
                      <button 
                        disabled={hasApplied}
                        onClick={(e) => {
                          e.stopPropagation();
                          onApply(job);
                        }}
                        className={`px-8 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 ${
                          hasApplied 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : "btn-primary"
                        }`}
                      >
                        {hasApplied ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {hasApplied ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Application Status */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xl font-bold text-[#3a3a30] serif">My Applications</h3>
          {applications.length === 0 ? (
            <div className="bg-[#fdfcf8] border-2 border-dashed border-[#e5e2d5] rounded-[32px] p-8 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">You haven't applied to any opportunities yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => {
                const job = jobs.find(j => j.id === app.jobId);
                return (
                  <div 
                    key={app.id} 
                    onClick={() => onViewDetails(app.jobId)}
                    className="bg-white p-5 rounded-[24px] border border-[#e5e2d5] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-[#3a3a30] group-hover:text-[#5a5a40] transition-colors">{job?.title || "Unknown Role"}</h4>
                        <p className="text-sm text-slate-500">{job?.businessName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === ApplicationStatus.PENDING ? "bg-amber-100 text-amber-700" :
                        app.status === ApplicationStatus.UNDER_REVIEW ? "bg-blue-100 text-blue-700" :
                        app.status === ApplicationStatus.INTERVIEW_SCHEDULED ? "bg-purple-100 text-purple-700" :
                        app.status === ApplicationStatus.ACCEPTED ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {app.status?.replace('_', ' ') || app.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Unknown date"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

