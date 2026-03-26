import { useAuth } from '@/lib/auth-context';
import { Mail, BookOpen, Hash, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-card overflow-hidden">
        <div className="h-28 campus-gradient relative" />
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="w-20 h-20 rounded-2xl campus-gradient-gold flex items-center justify-center text-2xl font-display text-accent-foreground border-4 border-card shadow-lg">
            {user?.name?.charAt(0)}
          </div>
          <h1 className="text-xl font-display text-foreground mt-3">{user?.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium text-foreground">{user?.department}</p>
              </div>
            </div>
            {user?.rollNumber && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="text-sm font-medium text-foreground">{user.rollNumber}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
