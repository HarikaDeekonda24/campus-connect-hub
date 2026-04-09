import { useState } from 'react';
import { Users, Calendar, Shield, AlertCircle, Activity, GitBranch, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockEvents, mockConcerns } from '@/lib/mock-data';
import { ALL_BRANCHES, Branch } from '@/lib/auth-context';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, registeredUsers, pendingFaculty, approveFaculty, rejectFaculty, createHOD } = useAuth();

  // HOD creation form state
  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodBranches, setHodBranches] = useState<Branch[]>([]);
  const [hodError, setHodError] = useState('');

  const handleApprove = (id: string, name: string) => {
    approveFaculty(id);
    toast.success(`${name} has been approved as Faculty`);
  };

  const handleReject = (id: string, name: string) => {
    rejectFaculty(id);
    toast.info(`${name}'s registration has been rejected`);
  };

  const toggleHodBranch = (b: Branch) => {
    setHodBranches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const handleCreateHOD = async (e: React.FormEvent) => {
    e.preventDefault();
    setHodError('');
    if (!hodName.trim() || !hodEmail.trim()) { setHodError('Name and email are required'); return; }
    if (hodBranches.length === 0) { setHodError('Select at least one branch'); return; }
    const result = await createHOD({ name: hodName.trim(), email: hodEmail.trim(), branches: hodBranches });
    if (result.success) {
      toast.success(`HOD account created for ${hodName}`);
      setHodName(''); setHodEmail(''); setHodBranches([]);
    } else {
      setHodError(result.error || 'Failed to create HOD');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground">
        <p className="text-primary-foreground/60 text-sm">Admin Panel</p>
        <h1 className="text-2xl md:text-3xl font-display mt-1">Welcome, {user?.name}</h1>
        <p className="text-primary-foreground/70 mt-2 text-sm">Full system access · All branches</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: registeredUsers.length, icon: Users, color: 'text-info' },
          { label: 'Total Events', value: mockEvents.length, icon: Calendar, color: 'text-success' },
          { label: 'Pending Faculty', value: pendingFaculty.length, icon: AlertCircle, color: 'text-warning' },
          { label: 'Open Concerns', value: mockConcerns.filter(c => c.status === 'new').length, icon: Shield, color: 'text-destructive' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
            <div className="flex items-center justify-between">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-2xl font-display text-foreground">{s.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Faculty Approval */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="campus-card p-5">
          <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" /> Pending Faculty Approvals
          </h2>
          {pendingFaculty.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending faculty registrations</p>
          ) : (
            <div className="space-y-3">
              {pendingFaculty.map(f => (
                <div key={f.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center text-warning text-sm font-medium">{f.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.email}</p>
                      <p className="text-xs text-muted-foreground">Branches: {f.branches.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(f.id, f.name)} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(f.id, f.name)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create HOD */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="campus-card p-5">
          <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Create HOD Account
          </h2>
          <form onSubmit={handleCreateHOD} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Full Name</label>
              <input value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Dr. Name" className="campus-input text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">College Email</label>
              <input type="email" value={hodEmail} onChange={e => setHodEmail(e.target.value)} placeholder="name@gnits.ac.in" className="campus-input text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Assign Branches</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ALL_BRANCHES.map(b => (
                  <button key={b} type="button" onClick={() => toggleHodBranch(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hodBranches.includes(b) ? 'campus-gradient text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            {hodError && <p className="text-destructive text-xs">{hodError}</p>}
            <button type="submit" className="w-full h-9 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Create HOD
            </button>
          </form>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User list */}
        <div className="campus-card p-5">
          <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> All Users</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {registeredUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full campus-gradient flex items-center justify-center text-primary-foreground text-xs font-medium">{u.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.branches.join(', ')}</p>
                  </div>
                </div>
                <span className={`campus-badge capitalize ${u.role === 'admin' ? 'campus-badge-destructive' : u.role === 'hod' ? 'campus-badge-gold' : u.role === 'faculty' ? 'campus-badge-navy' : 'campus-badge-success'}`}>
                  {u.role === 'hod' ? 'HOD' : u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Branches & Activity */}
        <div className="space-y-6">
          <div className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5" /> Branches</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_BRANCHES.map(b => (
                <span key={b} className="campus-badge-navy">{b}</span>
              ))}
            </div>
          </div>
          <div className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h2>
            <div className="space-y-4">
              {[
                { text: 'New event "Web Dev Bootcamp" submitted (CSE)', time: '2h ago', icon: Calendar },
                { text: 'Student concern about Wi-Fi submitted', time: '5h ago', icon: AlertCircle },
                { text: 'HOD approved HackCampus 2026', time: '1d ago', icon: Shield },
                { text: 'New student registered: Arun Kumar (CSE)', time: '2d ago', icon: Users },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <activity.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
