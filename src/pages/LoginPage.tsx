import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import gnitsLogo from '@/assets/gnits-logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const registered = (location.state as any)?.registered;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    const result = login(email, password);
    if (result.pendingApproval) {
      navigate('/pending-approval');
      return;
    }
    if (result.success) navigate('/dashboard');
    else setError('Invalid credentials. Please check your email and password.');
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
          <img src={gnitsLogo} alt="GNITS Logo" className="w-24 h-24 rounded-2xl mx-auto mb-8 shadow-xl object-contain bg-white p-1" />
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Campus Connect</h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">Your digital gateway to campus events, navigation, and academic life.</p>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={gnitsLogo} alt="GNITS Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5" />
            <h1 className="text-2xl font-display text-foreground">Campus Connect</h1>
          </div>

          <h2 className="text-2xl font-display text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-6">Sign in with your college credentials</p>

          {registered && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 mb-4">
              <p className="text-sm text-accent-foreground">Account created successfully! Please sign in.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">College Email</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@gnits.ac.in" className="campus-input" />
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
            <div className="flex justify-end">
              <button type="button" className="text-xs text-accent-foreground hover:underline">Forgot Password?</button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button type="submit" className="w-full h-10 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-foreground font-medium hover:underline">Register</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
