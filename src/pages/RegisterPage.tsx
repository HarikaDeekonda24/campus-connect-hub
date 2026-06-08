import { useState } from 'react';
import { useAuth, ALL_BRANCHES, Branch } from '@/lib/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import gnitsLogo from '@/assets/gnits-logo.png';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: '' as '' | 'student' | 'faculty',
    branches: [] as Branch[],
    rollNumber: '',
    section: '',
    password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleBranch = (branch: Branch) => {
    if (form.role === 'student') {
      updateField('branches', [branch]);
    } else {
      setForm(prev => ({
        ...prev,
        branches: prev.branches.includes(branch)
          ? prev.branches.filter(b => b !== branch)
          : [...prev.branches, branch],
      }));
      setError('');
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.firstName.trim()) return 'First name is required';
      if (!form.lastName.trim()) return 'Last name is required';
      if (!form.email.trim()) return 'Email is required';
      if (!form.email.endsWith('@gnits.ac.in')) return 'Please use a valid college email (@gnits.ac.in)';
      if (!form.phone.trim()) return 'Phone number is required';
      if (!/^\d{10}$/.test(form.phone)) return 'Enter a valid 10-digit phone number';
    }
    if (step === 2) {
      if (!form.role) return 'Please select a role';
      if (form.branches.length === 0) return 'Please select at least one branch';
      if (form.role === 'student' && !form.rollNumber.trim()) return 'Roll number is required';
      if (form.role === 'student' && !form.section.trim()) return 'Section is required';
    }
    if (step === 3) {
      if (form.password.length < 6) return 'Password must be at least 6 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep();
    if (err) { setError(err); return; }

    setIsLoading(true);
    setError('');

    const result = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      role: form.role as 'student' | 'faculty',
      branches: form.branches,
      rollNumber: form.role === 'student' ? form.rollNumber : undefined,
      section: form.role === 'student' ? form.section : undefined,
      password: form.password,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Registration failed');
      return;
    }

    if (result.pendingApproval) {
      navigate('/pending-approval');
    } else {
      navigate('/', { state: { registered: true } });
    }
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
          <h1 className="text-4xl font-display text-primary-foreground mb-4">Join Campus Connect</h1>
          <p className="text-primary-foreground/70 text-lg max-w-md">Create your account and become part of the campus community.</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-lg">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={gnitsLogo} alt="GNITS Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5" />
            <h1 className="text-2xl font-display text-foreground">Campus Connect</h1>
          </div>

          <h2 className="text-2xl font-display text-foreground mb-1">Create Account</h2>
          <p className="text-muted-foreground mb-6">Fill in your details to get started</p>

          {/* Step indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  s < step ? 'bg-accent text-accent-foreground' :
                  s === step ? 'campus-gradient text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {s === 1 ? 'Personal' : s === 2 ? 'Role' : 'Credentials'}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">First Name</label>
                    <input value={form.firstName} onChange={e => updateField('firstName', e.target.value)} placeholder="Arun" className="campus-input" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Last Name</label>
                    <input value={form.lastName} onChange={e => updateField('lastName', e.target.value)} placeholder="Kumar" className="campus-input" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">College Email</label>
                  <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="you@gnits.ac.in" className="campus-input" />
                  <p className="text-xs text-muted-foreground mt-1">Must be a valid @gnits.ac.in email</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className="campus-input" />
                </div>
              </motion.div>
            )}

            {/* Step 2: Role & Branch */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Select Your Role</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(['student', 'faculty'] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => { updateField('role', role); updateField('branches', []); updateField('rollNumber', ''); }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          form.role === role
                            ? 'border-accent bg-accent/10 shadow-sm'
                            : 'border-border bg-card hover:border-muted-foreground/30'
                        }`}
                      >
                        <span className="text-sm font-semibold text-foreground capitalize">{role}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role === 'student' ? 'Access events, submit requests' : 'Post events, receive notifications'}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">HOD and Admin accounts are created by the administrator.</p>
                </div>

                {form.role && (
                  <>
                    {form.role === 'student' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Roll Number</h3>
                          <input value={form.rollNumber} onChange={e => updateField('rollNumber', e.target.value.toUpperCase())} placeholder="e.g. 22251A0501" className="campus-input" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Section</h3>
                          <input value={form.section} onChange={e => updateField('section', e.target.value.toUpperCase().slice(0, 3))} placeholder="e.g. A" className="campus-input" />
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                        Select Branch{form.role === 'faculty' ? 'es' : ''}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {form.role === 'student' ? 'Choose your department branch' : 'Select all branches you teach in'}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {ALL_BRANCHES.map(branch => {
                          const selected = form.branches.includes(branch);
                          return (
                            <button
                              key={branch}
                              type="button"
                              onClick={() => toggleBranch(branch)}
                              className={`h-10 rounded-lg text-sm font-medium transition-all ${
                                selected
                                  ? 'campus-gradient text-primary-foreground shadow-sm'
                                  : 'border bg-card text-foreground hover:bg-muted'
                              }`}
                            >
                              {branch}
                            </button>
                          );
                        })}
                      </div>
                      {form.branches.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {form.branches.map(b => (
                            <span key={b} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/15 text-accent-foreground text-xs font-medium">
                              {b}
                              {form.role === 'faculty' && (
                                <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleBranch(b)} />
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Credentials */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Account Credentials</h3>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Min. 6 characters" className="campus-input pr-10" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} placeholder="Re-enter password" className="campus-input pr-10" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {form.role === 'faculty' && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-accent-foreground">
                      <strong>Note:</strong> Faculty accounts require admin approval. You'll be notified once your account is activated.
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/50 border space-y-1.5 mt-2">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Registration Summary</p>
                  <p className="text-sm text-foreground">{form.firstName} {form.lastName}</p>
                  <p className="text-xs text-muted-foreground">{form.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">Role: {form.role}</p>
                  {form.role === 'student' && <p className="text-xs text-muted-foreground">Roll No: {form.rollNumber}</p>}
                  <p className="text-xs text-muted-foreground">Branch: {form.branches.join(', ')}</p>
                </div>
              </motion.div>
            )}

            {error && <p className="text-destructive text-sm mt-3">{error}</p>}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 h-10 rounded-lg border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={handleNext} className="flex-1 h-10 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
                  Continue
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="flex-1 h-10 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-accent-foreground font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
