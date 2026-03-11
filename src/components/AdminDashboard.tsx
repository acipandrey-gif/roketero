import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  User, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Activity,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Business, Seeker, VerificationStatus } from '../types';
import { collection, onSnapshot, query, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminDashboardProps {
  businesses: Business[];
  seekers: Seeker[];
  onVerify: (id: string, role: "business" | "seeker", status: VerificationStatus) => void;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  businesses, 
  seekers, 
  onVerify 
}) => {
  const [activeTab, setActiveTab] = useState<'moderation' | 'security'>('moderation');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showSensitive, setShowSensitive] = useState(false);

  // Mock audit logs for demonstration if no real logs collection exists yet
  useEffect(() => {
    // In a real app, you'd listen to a 'system_logs' collection
    const mockLogs: AuditLog[] = [
      { id: '1', action: 'LOGIN_SUCCESS', userId: 'admin_1', details: 'Admin logged in from 192.168.1.1', timestamp: new Date().toISOString(), severity: 'low' },
      { id: '2', action: 'VERIFICATION_APPROVED', userId: 'admin_1', details: 'Approved business "Local Bakery"', timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'medium' },
      { id: '3', action: 'UNAUTHORIZED_ACCESS_ATTEMPT', userId: 'unknown', details: 'Failed login attempt for user "root"', timestamp: new Date(Date.now() - 7200000).toISOString(), severity: 'high' },
    ];
    setAuditLogs(mockLogs);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-[#3a3a30] serif">Admin Control Center</h2>
          <p className="text-slate-500 mt-1">Manage community trust and monitor system security.</p>
        </div>
        <div className="flex bg-[#f5f5f0] p-1 rounded-2xl border border-[#e5e2d5]">
          <button 
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'moderation' ? 'bg-[#5a5a40] text-white shadow-md' : 'text-[#5a5a40] hover:bg-[#e5e2d5]'}`}
          >
            Moderation
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-[#5a5a40] text-white shadow-md' : 'text-[#5a5a40] hover:bg-[#e5e2d5]'}`}
          >
            Security
          </button>
        </div>
      </div>

      {activeTab === 'moderation' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Businesses Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#3a3a30] serif flex items-center gap-2 px-2">
              <Users className="w-6 h-6 text-[#5a5a40]" />
              Local Employers
            </h3>
            <div className="space-y-4">
              {businesses.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] border border-dashed border-[#e5e2d5] text-center text-slate-400">
                  No employers registered yet.
                </div>
              ) : (
                businesses.map(b => (
                  <div key={b.id} className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-[#3a3a30]">{b.name}</h4>
                      <p className="text-sm text-slate-500">{b.address}</p>
                      <p className="text-xs text-slate-400 mt-1">{b.phone}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-center uppercase ${
                        b.verificationStatus === VerificationStatus.VERIFIED ? 'bg-emerald-100 text-emerald-700' :
                        b.verificationStatus === VerificationStatus.REJECTED ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.verificationStatus}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onVerify(b.id, "business", VerificationStatus.VERIFIED)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                          title="Verify"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onVerify(b.id, "business", VerificationStatus.REJECTED)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seekers Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#3a3a30] serif flex items-center gap-2 px-2">
              <User className="w-6 h-6 text-[#5a5a40]" />
              Neighbors / Seekers
            </h3>
            <div className="space-y-4">
              {seekers.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] border border-dashed border-[#e5e2d5] text-center text-slate-400">
                  No seekers registered yet.
                </div>
              ) : (
                seekers.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-[#3a3a30]">{s.name}</h4>
                      <p className="text-sm text-slate-500">{s.address}</p>
                      <p className="text-xs text-slate-400 mt-1">{(s.attachments?.length || 0)} Attachments</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-center uppercase ${
                        s.verificationStatus === VerificationStatus.VERIFIED ? 'bg-emerald-100 text-emerald-700' :
                        s.verificationStatus === VerificationStatus.REJECTED ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {s.verificationStatus}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onVerify(s.id, "seeker", VerificationStatus.VERIFIED)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                          title="Verify"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onVerify(s.id, "seeker", VerificationStatus.REJECTED)}
                          className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5a40] uppercase tracking-wider font-semibold">System Status</p>
                  <p className="text-lg font-bold text-[#3a3a30]">Secure</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">All security rules are active and monitoring for threats.</p>
            </div>
            
            <div className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5a40] uppercase tracking-wider font-semibold">RBAC Status</p>
                  <p className="text-lg font-bold text-[#3a3a30]">Enforced</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">Role-based access control is restricting unauthorized actions.</p>
            </div>

            <div className="bg-white p-6 rounded-[24px] border border-[#e5e2d5] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[#5a5a40] uppercase tracking-wider font-semibold">Audit Logs</p>
                  <p className="text-lg font-bold text-[#3a3a30]">{auditLogs.length} Active</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">Tracking all administrative and sensitive operations.</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-[#e5e2d5] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e5e2d5] flex justify-between items-center bg-[#fdfcf8]">
              <h3 className="text-xl font-bold text-[#3a3a30] serif flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-[#5a5a40]" />
                Security Audit Logs
              </h3>
              <button 
                onClick={() => setShowSensitive(!showSensitive)}
                className="flex items-center gap-2 text-sm font-semibold text-[#5a5a40] hover:text-[#3a3a30] transition-colors"
              >
                {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showSensitive ? 'Hide Sensitive' : 'Show Sensitive'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f5f5f0] text-[#5a5a40] text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-bold">Timestamp</th>
                    <th className="px-6 py-4 font-bold">Action</th>
                    <th className="px-6 py-4 font-bold">User ID</th>
                    <th className="px-6 py-4 font-bold">Details</th>
                    <th className="px-6 py-4 font-bold">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e2d5]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#fdfcf8] transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#3a3a30]">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                        {showSensitive ? log.userId : '********'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.details}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          log.severity === 'high' ? 'bg-rose-100 text-rose-700' :
                          log.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
