import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    const success = login(email, password);
    if (success) navigate('/dashboard');
    else setError('Invalid credentials');
  };

  const demoLogin = (role: string) => {
    login(`${role}@campus.edu`, 'demo');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 campus-gradient relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full border border-primary-foreground/20" style={{ width: `${100 + i * 60}px`, height: `${100 + i * 60}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-2xl campus-gradient-gold flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Shield className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Campus Connect</h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">Your digital gateway to campus events, navigation, and academic life.</p>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl campus-gradient-gold flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-display text-foreground">Campus Connect</h1>
          </div>

          <h2 className="text-2xl font-display text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in with your college credentials</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@campus.edu" className="campus-input" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="campus-input pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button type="submit" className="w-full h-10 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </form>

          <div className="mt-8">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick demo access</p>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'faculty', 'hod', 'admin'].map(role => (
                <button key={role} onClick={() => demoLogin(role)} className="h-9 rounded-lg border bg-card text-sm font-medium capitalize hover:bg-muted transition-colors text-foreground">
                  {role === 'hod' ? 'HOD' : role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
