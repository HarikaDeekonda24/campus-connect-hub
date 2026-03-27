import { Link } from 'react-router-dom';
import { Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl campus-gradient flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Clock className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display text-foreground mb-3">Registration Pending Approval</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Your faculty account has been submitted for review. An administrator will review and approve your registration shortly. You'll be notified via email once your account is activated.
        </p>
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-6">
          <div className="flex items-center gap-2 justify-center text-accent-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Estimated approval time: 24-48 hours</span>
          </div>
        </div>
        <Link to="/" className="inline-flex h-10 px-6 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity items-center">
          Back to Login
        </Link>
      </motion.div>
    </div>
  );
}
