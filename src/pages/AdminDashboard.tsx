import { useState, useEffect } from 'react';
import { Users, Calendar, Shield, AlertCircle, UserPlus, CheckCircle, XCircle, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ALL_BRANCHES, Branch, UserRole } from '@/lib/campus-types';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type Tab = 'overview' | 'users' | 'pending';

interface Profile {
  id: string; name: string; email: string; role: string;
  branches: string[]; is_approved: boolean; created_at: string;
}

export default function AdminDashboard() {
  const { user, createHOD } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');
  const [hodBranches, setHodBranches] = useState<Branch[]>([]);
  const [hodError, setHodError] = useState('');
  const [hodLoading, setHodLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllUsers(data || []);
    setLoading(false);
  };

  const approvedUsers = allUsers.filter(u => u.is_approved);
  const pendingFaculty = allUsers.filter(u => !u.is_approved && u.role === 'faculty');

  const filteredUsers = approvedUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (roleFilter === 'all' || u.role === roleFilter);
  });

  const handleApprove = async (id: string, name: string) => {
    const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(`${name} approved as Faculty`); await loadUsers(); }
  };

  const handleReject = async (id: string, name: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.info(`${name}'s registration rejected`); await loadUsers(); }
  };

  const handleCreateHOD = async (e: React.FormEvent) => {
    e.preventDefault();
    setHodError('');
    if (!hodName.trim() || !hodEmail.trim()) { setHodError('Name and email are required'); return; }
    if (hodBranches.length === 0) { setHodError('Select at least one branch'); return; }
    setHodLoading(true);
    const result = await createHOD({ name: hodName.trim(), email: hodEmail.trim(), branches: hodBranches });
    if (result.success) {
      toast.success(`HOD invite created for ${hodEmail}`, { description: 'They will get HOD role when they register with this email.' });
      setHodName(''); setHodEmail(''); setHodBranches([]);
    } else {
      setHodError(result.error || 'Failed');
    }
    setHodLoading(false);
  };

  const toggleHodBranch = (b: Branch) => setHodBranches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin': return 'campus-badge-destructive';
      case 'hod': return 'campus-badge-gold';
      case 'faculty': return 'campus-badge-navy';
      default: return 'campus-badge-success';
    }
  };

  const tabs = [
    { key: 'overview' as Tab, label: 'Overview', icon: Shield, badge: 0 },
    { key: 'users' as Tab, label: 'User Management', icon: Users, badge: 0 },
    { key: 'pending' as Tab, label: 'Pending Faculty', icon: AlertCircle, badge: pendingFaculty.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-gold/10 -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-sm">Admin Panel</p>
          <h1 className="text-2xl md:text-3xl font-display mt-1">Welcome, {user?.name}</h1>
          <p className="text-primary-foreground/70 mt-1 text-sm">Full system access · All branches</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: approvedUsers.length, icon: Users, color: 'text-info' },
          { label: 'Pending Faculty', value: pendingFaculty.length, icon: AlertCircle, color: 'text-warning' },
          { label: 'HODs', value: approvedUsers.filter(u => u.role === 'hod').length, icon: Shield, color: 'text-success' },
          { label: 'Students', value: approvedUsers.filter(u => u.role === 'student').length, icon: Calendar, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
            <div className="flex items-center justify-between"><s.icon className={`w-5 h-5 ${s.color}`} /><span className="text-2xl font-display text-foreground">{s.value}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.badge > 0 && <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Invite HOD</h2>
            <p className="text-xs text-muted-foreground mb-4">Enter the HOD's email and branches. When they register with this email, they'll automatically receive the HOD role.</p>
            <form onSubmit={handleCreateHOD} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Full Name (for reference)</label>
                <input value={hodName} onChange={e => setHodName(e.target.value)} placeholder="Dr. Name" className="campus-input text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">College Email *</label>
                <input type="email" value={hodEmail} onChange={e => setHodEmail(e.target.value)} placeholder="name@gnits.ac.in" className="campus-input text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Assign Branches *</label>
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
              <button type="submit" disabled={hodLoading} className="w-full h-9 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-60">
                {hodLoading ? 'Creating Invite...' : 'Create HOD Invite'}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Users by Role</h2>
            <div className="space-y-3">
              {(['admin', 'hod', 'faculty', 'student'] as UserRole[]).map(role => {
                const count = approvedUsers.filter(u => u.role === role).length;
                return (
                  <div key={role} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className={`campus-badge capitalize ${roleBadge(role)}`}>{role === 'hod' ? 'HOD' : role}</span>
                    <span className="text-sm font-medium text-foreground">{count} user{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Branches</p>
              <div className="flex flex-wrap gap-1.5">{ALL_BRANCHES.map(b => <span key={b} className="campus-badge-navy">{b}</span>)}</div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="campus-input pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'student', 'faculty', 'hod', 'admin'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${roleFilter === r ? 'campus-gradient text-primary-foreground' : 'bg-card border text-foreground hover:bg-muted'}`}>
                  {r === 'hod' ? 'HOD' : r}
                </button>
              ))}
            </div>
          </div>
          {loading ? <p className="text-muted-foreground text-sm">Loading users...</p>
          : filteredUsers.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No users found.</p></div>
          : (
            <div className="campus-card divide-y divide-border">
              {filteredUsers.map((u, i) => (
                <motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full campus-gradient flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0">{u.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      {u.branches?.length > 0 && <p className="text-xs text-muted-foreground">{u.branches.join(', ')}</p>}
                    </div>
                  </div>
                  <span className={`campus-badge capitalize flex-shrink-0 ${roleBadge(u.role)}`}>{u.role === 'hod' ? 'HOD' : u.role}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          <h2 className="text-lg font-display text-foreground">Pending Faculty Approvals</h2>
          {loading ? <p className="text-muted-foreground text-sm">Loading...</p>
          : pendingFaculty.length === 0 ? <div className="text-center py-16 text-muted-foreground"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No pending faculty registrations.</p></div>
          : (
            <div className="campus-card divide-y divide-border">
              {pendingFaculty.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center text-warning text-sm font-medium flex-shrink-0">{f.name.charAt(0)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                      {f.branches?.length > 0 && <p className="text-xs text-muted-foreground">Branches: {f.branches.join(', ')}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleApprove(f.id, f.name)} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => handleReject(f.id, f.name)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Reject"><XCircle className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
