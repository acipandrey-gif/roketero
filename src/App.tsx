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
  Settings,
  Smartphone,
  MessageSquare,
  Bell,
  Star,
  Filter,
  Menu,
  MoreVertical
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
  Message
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
  getDocFromServer,
  addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from './firebase';

// --- Toast System ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`px-6 py-3 rounded-2xl shadow-lg border flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
            toast.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
            'bg-slate-50 border-slate-100 text-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5" />}
          {toast.type === 'info' && <Clock className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-2 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Data States
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUser(userData);
          // Navigate based on role if on login page
          if (currentPage === "login") {
            if (userData.role === "admin") setCurrentPage("admin-dashboard");
            else if (userData.role === "business") setCurrentPage("business-dashboard");
            else setCurrentPage("seeker-dashboard");
          }
        } else {
          // New user, need to pick role
          const role = firebaseUser.email === "acipandrey@gmail.com" ? "admin" : "seeker";
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "",
            role
          });
          if (role === "admin") {
            // Create admin doc if it doesn't exist
            await setDoc(doc(db, "users", firebaseUser.uid), {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || "Admin",
              role: "admin"
            });
            setCurrentPage("admin-dashboard");
          } else {
            setCurrentPage("login");
          }
        }
      } else {
        setUser(null);
        setCurrentPage("login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubscribers = [
      onSnapshot(collection(db, "businesses"), (snapshot) => {
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      }),
      onSnapshot(collection(db, "seekers"), (snapshot) => {
        setSeekers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seeker)));
      }),
      onSnapshot(collection(db, "jobs"), (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
      }),
      onSnapshot(collection(db, "applications"), (snapshot) => {
        setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
      }),
      onSnapshot(query(collection(db, "notifications"), where("userId", "==", user.id)), (snapshot) => {
        setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      }),
      onSnapshot(query(collection(db, "messages"), where("senderId", "==", user.id)), (snapshot) => {
        // This is simplified, usually you'd query both sender and receiver
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
      })
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentPage("login");
    addToast("Logged out successfully", "info");
  };

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfb]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#5a5a40] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={handleLogout} onNavigate={navigate} currentPage={currentPage} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <AnimatePresence mode="wait">
          {currentPage === "login" && (
            <LoginPage key="login" onAuthSuccess={() => {}} />
          )}

          {currentPage === "business-dashboard" && (
            <BusinessDashboard 
              key="business-dash"
              business={businesses.find(b => b.id === user?.id)}
              jobs={jobs.filter(j => j.businessId === user?.id)}
              applications={applications.filter(a => a.businessId === user?.id)}
              onNavigate={navigate}
            />
          )}

          {currentPage === "seeker-dashboard" && (
            <SeekerDashboard 
              key="seeker-dash"
              seeker={seekers.find(s => s.id === user?.id)}
              jobs={jobs.filter(j => j.status === "Active")}
              applications={applications.filter(a => a.seekerId === user?.id)}
              onNavigate={navigate}
              onViewJob={(id) => { setSelectedJobId(id); navigate("job-details"); }}
            />
          )}

          {currentPage === "job-details" && selectedJobId && (
            <JobDetailsPage 
              key="job-details"
              job={jobs.find(j => j.id === selectedJobId)}
              onBack={() => navigate(user?.role === "business" ? "business-dashboard" : "seeker-dashboard")}
              onApply={async (notes) => {
                if (!user) return;
                const newApp: Partial<Application> = {
                  jobId: selectedJobId,
                  businessId: jobs.find(j => j.id === selectedJobId)?.businessId,
                  seekerId: user.id,
                  seekerName: user.name,
                  status: ApplicationStatus.PENDING,
                  appliedAt: new Date().toISOString(),
                  notes
                };
                await addDoc(collection(db, "applications"), newApp);
                addToast("Application submitted!", "success");
                navigate("seeker-dashboard");
              }}
            />
          )}

          {currentPage === "post-job" && (
            <PostJobForm 
              key="post-job"
              onPost={async (jobData) => {
                if (!user) return;
                const newJob: Partial<Job> = {
                  ...jobData,
                  businessId: user.id,
                  businessName: user.name,
                  postedAt: new Date().toISOString(),
                  status: "Active"
                };
                await addDoc(collection(db, "jobs"), newJob);
                addToast("Job posted successfully!", "success");
                navigate("business-dashboard");
              }}
              onCancel={() => navigate("business-dashboard")}
            />
          )}

          {currentPage === "business-register" && (
            <BusinessRegisterPage 
              key="biz-reg"
              onRegister={async (data) => {
                if (!user) return;
                await setDoc(doc(db, "users", user.id), { ...user, role: "business" });
                await setDoc(doc(db, "businesses", user.id), { ...data, id: user.id, verificationStatus: VerificationStatus.PENDING });
                setUser({ ...user, role: "business" });
                navigate("business-dashboard");
                addToast("Business profile created!", "success");
              }}
            />
          )}

          {currentPage === "seeker-register" && (
            <SeekerRegisterPage 
              key="seek-reg"
              onRegister={async (data) => {
                if (!user) return;
                await setDoc(doc(db, "users", user.id), { ...user, role: "seeker" });
                await setDoc(doc(db, "seekers", user.id), { ...data, id: user.id, verificationStatus: VerificationStatus.PENDING });
                setUser({ ...user, role: "seeker" });
                navigate("seeker-dashboard");
                addToast("Seeker profile created!", "success");
              }}
            />
          )}

          {currentPage === "admin-dashboard" && (
            <AdminDashboard 
              key="admin-dash"
              businesses={businesses}
              seekers={seekers}
              onVerify={async (type, id, status) => {
                const coll = type === "business" ? "businesses" : "seekers";
                await updateDoc(doc(db, coll, id), { verificationStatus: status });
                addToast(`User ${status.toLowerCase()}`, "info");
              }}
            />
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <footer className="bg-[#f5f5f0] border-t border-[#e5e2d5] py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="w-6 h-6 text-[#5a5a40]" />
            <span className="text-xl font-bold serif tracking-tight">Raketero</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 Raketero. Connecting local talent with local needs.</p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function Navbar({ user, onLogout, onNavigate, currentPage }: { user: UserProfile | null, onLogout: () => void, onNavigate: (p: Page) => void, currentPage: Page }) {
  return (
    <nav className="bg-white border-bottom border-[#e5e2d5] sticky top-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-6xl">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => onNavigate(user ? (user.role === "admin" ? "admin-dashboard" : user.role === "business" ? "business-dashboard" : "seeker-dashboard") : "login")}
        >
          <div className="w-10 h-10 bg-[#5a5a40] rounded-xl flex items-center justify-center text-white">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold serif tracking-tight">Raketero</span>
        </div>

        {user && (
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate("notifications")} className="relative p-2 text-slate-500 hover:text-[#5a5a40] transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-[#e5e2d5]"></div>
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate("profile")}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#3a3a30] leading-none">{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40] font-bold border border-[#e5e2d5] group-hover:border-[#5a5a40] transition-all">
                {user.name.charAt(0)}
              </div>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function LoginPage({ onAuthSuccess, key }: { onAuthSuccess: () => void, key?: any }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Initial user doc creation will be handled by the onAuthStateChanged listener's "else" block or here
        await setDoc(doc(db, "users", res.user.uid), {
          id: res.user.uid,
          email,
          name,
          role: "seeker" // Default
        });
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: any) => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto py-12"
    >
      <div className="card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold serif mb-2">{isLogin ? "Welcome Back" : "Join Raketero"}</h1>
          <p className="text-slate-500">{isLogin ? "Sign in to manage your side jobs" : "Start your journey as a seeker or employer"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="label">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="John Doe" required />
            </div>
          )}
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="name@example.com" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5e2d5]"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleSocialLogin(googleProvider)} className="btn-secondary flex items-center justify-center gap-2 py-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button onClick={() => handleSocialLogin(facebookProvider)} className="btn-secondary flex items-center justify-center gap-2 py-2.5">
            <Facebook className="w-5 h-5 text-blue-600" />
            Facebook
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#5a5a40] font-bold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

function BusinessDashboard({ business, jobs, applications, onNavigate, key }: { business?: Business, jobs: Job[], applications: Application[], onNavigate: (p: Page) => void, key?: any }) {
  if (!business) {
    return (
      <div className="text-center py-20">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold serif">Employer Profile Required</h2>
        <p className="text-slate-500 mt-2 mb-8">Complete your employer profile to start posting side jobs.</p>
        <button onClick={() => onNavigate("business-register")} className="btn-primary">Complete Profile</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold serif">{business.name}</h1>
            {business.verificationStatus === VerificationStatus.VERIFIED ? (
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> {business.verificationStatus}
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5 text-sm"><MapPin className="w-4 h-4" /> {business.address}</p>
        </div>
        <button onClick={() => onNavigate("post-job")} className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Post a Side Job
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold serif">Active Postings</h2>
            <span className="text-sm text-slate-400 font-bold">{jobs.length} Jobs</span>
          </div>
          {jobs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 italic">No active job postings yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="card hover:border-[#5a5a40] transition-all cursor-pointer group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-[#5a5a40] transition-colors">{job.title}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(job.postedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{job.category}</span>
                      <span className="text-xs font-bold text-[#5a5a40]">{applications.filter(a => a.jobId === job.id).length} Applicants</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold serif">Recent Applications</h2>
          <div className="space-y-4">
            {applications.slice(0, 5).map(app => (
              <div key={app.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40] font-bold">
                  {app.seekerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{app.seekerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{jobs.find(j => j.id === app.jobId)?.title}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    app.status === ApplicationStatus.ACCEPTED ? 'text-emerald-600' :
                    app.status === ApplicationStatus.DECLINED ? 'text-rose-600' :
                    'text-amber-600'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
            {applications.length === 0 && <p className="text-slate-400 text-sm italic text-center py-8">No applications yet.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SeekerDashboard({ seeker, jobs, applications, onNavigate, onViewJob, key }: { seeker?: Seeker, jobs: Job[], applications: Application[], onNavigate: (p: Page) => void, onViewJob: (id: string) => void, key?: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...new Set(jobs.map(j => j.category))];
  const filteredJobs = jobs.filter(j => 
    (selectedCategory === "All" || j.category === selectedCategory) &&
    (j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!seeker) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold serif">Seeker Profile Required</h2>
        <p className="text-slate-500 mt-2 mb-8">Complete your profile to start applying for side jobs.</p>
        <button onClick={() => onNavigate("seeker-register")} className="btn-primary">Complete Profile</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold serif">Find Your Next Raket</h1>
          <p className="text-slate-500 mt-1">Browse available side jobs and errands in your area.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              className="input-field pl-12"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat ? 'bg-[#5a5a40] text-white' : 'bg-white text-slate-500 border border-[#e5e2d5] hover:border-[#5a5a40]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map(job => (
          <div key={job.id} className="card group hover:border-[#5a5a40] transition-all flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-[#5a5a40] font-bold serif text-xl">
                {job.businessName.charAt(0)}
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">{job.category}</span>
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-[#5a5a40] transition-colors">{job.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{job.description}</p>
            <div className="mt-auto pt-4 border-t border-[#f5f5f0] flex items-center justify-between">
              <div className="text-sm font-bold text-[#5a5a40]">{job.salary}</div>
              <button onClick={() => onViewJob(job.id)} className="text-[#5a5a40] font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredJobs.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 italic">No jobs found matching your criteria.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function JobDetailsPage({ job, onBack, onApply, key }: { job?: Job, onBack: () => void, onApply: (notes: string) => Promise<void>, key?: any }) {
  const [notes, setNotes] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  if (!job) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-[#5a5a40] mb-8 font-bold text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-[#5a5a40] font-bold serif text-2xl">
                {job.businessName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold serif">{job.title}</h1>
                <p className="text-slate-500 font-medium">{job.businessName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-3 bg-[#fdfdfb] rounded-2xl border border-[#f5f5f0]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Category</p>
                <p className="text-sm font-bold">{job.category}</p>
              </div>
              <div className="p-3 bg-[#fdfdfb] rounded-2xl border border-[#f5f5f0]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Location</p>
                <p className="text-sm font-bold">{job.location}</p>
              </div>
              <div className="p-3 bg-[#fdfdfb] rounded-2xl border border-[#f5f5f0]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Salary</p>
                <p className="text-sm font-bold">{job.salary}</p>
              </div>
              <div className="p-3 bg-[#fdfdfb] rounded-2xl border border-[#f5f5f0]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Type</p>
                <p className="text-sm font-bold">{job.employmentType}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold serif mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-bold serif mb-3">Requirements</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card sticky top-28">
            <h3 className="text-xl font-bold serif mb-4">Apply for this Job</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Cover Note (Optional)</label>
                <textarea 
                  className="input-field h-32 resize-none" 
                  placeholder="Why are you a good fit for this raket?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
              <button 
                onClick={() => { setIsApplying(true); onApply(notes).finally(() => setIsApplying(false)); }}
                disabled={isApplying}
                className="btn-primary w-full"
              >
                {isApplying ? "Submitting..." : "Submit Application"}
              </button>
              <p className="text-[10px] text-center text-slate-400 px-4">
                By applying, your profile details will be shared with the employer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PostJobForm({ onPost, onCancel, key }: { onPost: (data: any) => Promise<void>, onCancel: () => void, key?: any }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    category: "Errand",
    location: "",
    employmentType: "One-time",
    salary: ""
  });
  const [loading, setLoading] = useState(false);

  const categories = ["Errand", "Delivery", "Cleaning", "Tutoring", "Technical", "Creative", "Other"];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold serif mb-8">Post a New Side Job</h1>
        <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await onPost(formData); setLoading(false); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label">Job Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="e.g. Grocery Delivery" required />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="input-field" placeholder="e.g. Quezon City" required />
            </div>
            <div>
              <label className="label">Salary / Pay</label>
              <input type="text" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="input-field" placeholder="e.g. ₱500" required />
            </div>
            <div>
              <label className="label">Employment Type</label>
              <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="input-field">
                <option value="One-time">One-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field h-32" placeholder="Describe the task in detail..." required />
          </div>

          <div>
            <label className="label">Requirements</label>
            <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="input-field h-32" placeholder="What skills or tools are needed?" />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "Posting..." : "Post Job"}</button>
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function BusinessRegisterPage({ onRegister, key }: { onRegister: (data: any) => Promise<void>, key?: any }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    idUpload: "placeholder-id-url"
  });
  const [loading, setLoading] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold serif mb-2">Employer Registration</h1>
        <p className="text-slate-500 mb-8">Tell us about your business or yourself as an employer.</p>
        
        <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await onRegister(formData); setLoading(false); }} className="space-y-6">
          <div>
            <label className="label">Business / Employer Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Contact Phone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="label">Address / Location</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label">About / Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field h-32" required />
          </div>
          <div>
            <label className="label">Upload Valid ID</label>
            <div className="border-2 border-dashed border-[#e5e2d5] rounded-2xl p-8 text-center hover:border-[#5a5a40] transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-bold">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Registering..." : "Complete Registration"}</button>
        </form>
      </div>
    </motion.div>
  );
}

function SeekerRegisterPage({ onRegister, key }: { onRegister: (data: any) => Promise<void>, key?: any }) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    idUpload: "placeholder-id-url",
    attachments: []
  });
  const [loading, setLoading] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold serif mb-2">Seeker Registration</h1>
        <p className="text-slate-500 mb-8">Set up your profile to start finding local opportunities.</p>
        
        <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); await onRegister(formData); setLoading(false); }} className="space-y-6">
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="label">Current Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label">Upload Valid ID</label>
            <div className="border-2 border-dashed border-[#e5e2d5] rounded-2xl p-8 text-center hover:border-[#5a5a40] transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-bold">Verification is required for trust</p>
              <p className="text-xs text-slate-400 mt-1">Government ID, Student ID, etc.</p>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Registering..." : "Complete Profile"}</button>
        </form>
      </div>
    </motion.div>
  );
}

function AdminDashboard({ businesses, seekers, onVerify, key }: { businesses: Business[], seekers: Seeker[], onVerify: (type: "business" | "seeker", id: string, status: VerificationStatus) => Promise<void>, key?: any }) {
  const [activeTab, setActiveTab] = useState<"businesses" | "seekers">("businesses");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold serif">Admin Control</h1>
        <div className="flex bg-[#f5f5f0] p-1 rounded-full">
          <button 
            onClick={() => setActiveTab("businesses")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "businesses" ? 'bg-white shadow-sm text-[#5a5a40]' : 'text-slate-500'}`}
          >
            Businesses
          </button>
          <button 
            onClick={() => setActiveTab("seekers")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "seekers" ? 'bg-white shadow-sm text-[#5a5a40]' : 'text-slate-500'}`}
          >
            Seekers
          </button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdfdfb] border-b border-[#e5e2d5]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f5f0]">
            {(activeTab === "businesses" ? businesses : seekers).map(item => (
              <tr key={item.id} className="hover:bg-[#fdfdfb] transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{item.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{item.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    item.verificationStatus === VerificationStatus.VERIFIED ? 'bg-emerald-50 text-emerald-700' :
                    item.verificationStatus === VerificationStatus.REJECTED ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {item.verificationStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {item.verificationStatus === VerificationStatus.PENDING && (
                    <>
                      <button onClick={() => onVerify(activeTab === "businesses" ? "business" : "seeker", item.id, VerificationStatus.VERIFIED)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                      <button onClick={() => onVerify(activeTab === "businesses" ? "business" : "seeker", item.id, VerificationStatus.REJECTED)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><XCircle className="w-5 h-5" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
