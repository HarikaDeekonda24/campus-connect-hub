import { Router, Request, Response } from 'express';
import * as storage from './storage';
import type { UserRole, Branch } from '../shared/schema';

const router = Router();

function requireAuth(req: Request, res: Response, next: Function) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: Function) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const user = await storage.getUserById(userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

router.post('/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, branches, rollNumber, section, password } = req.body;
    if (!email?.endsWith('@gnits.ac.in')) {
      return res.status(400).json({ error: 'Please use a valid college email (@gnits.ac.in)' });
    }
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const fullName = `${firstName} ${lastName}`.trim();
    const department = (branches && branches[0]) || 'General';
    const approved = role === 'faculty' ? false : true;

    await storage.createUser({
      name: fullName,
      email,
      password,
      role: role as UserRole,
      department,
      branches: branches || [],
      rollNumber: role === 'student' ? rollNumber : undefined,
      phone,
      section: role === 'student' ? section : undefined,
      approved,
    });

    res.json({ success: true, pendingApproval: role === 'faculty' });
  } catch (err: any) {
    console.error('[register]', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const row = await storage.getUserByEmail(email);
    if (!row) return res.status(401).json({ error: 'Invalid credentials. Please check your email and password.' });

    const valid = await storage.verifyPassword(password, row.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials. Please check your email and password.' });

    if (!row.approved && row.role !== 'student') {
      return res.status(403).json({ error: 'Account pending approval', pendingApproval: true });
    }

    (req.session as any).userId = row.id;
    const user = await storage.getUserById(row.id);
    res.json({ success: true, user, role: user?.role });
  } catch (err: any) {
    console.error('[login]', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/auth/me', async (req, res) => {
  const userId = (req.session as any).userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = await storage.getUserById(userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user });
});

router.get('/events', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let events;
    if (status === 'pending') events = await storage.getPendingEvents();
    else if (status === 'all') events = await storage.getAllEvents();
    else events = await storage.getApprovedEvents();
    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/events', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { title, description, date, time, location, branch } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Event title is required' });
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const event = await storage.createEvent({
      title: title.trim(),
      description: description?.trim() || null,
      date,
      time: time || null,
      location: location?.trim() || null,
      branch: branch || null,
      status: 'pending',
      createdBy: userId,
    });
    res.json({ event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/events/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = await storage.getUserById(userId);
    if (!user || !['hod', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const { status } = req.body;
    const event = await storage.updateEventStatus(req.params.id, status);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/attendance', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    let requests;
    if (user.role === 'student') {
      requests = await storage.getAttendanceRequestsByStudent(userId);
    } else if (user.role === 'hod' && user.branches[0]) {
      requests = await storage.getAttendanceRequestsByBranch(user.branches[0]);
    } else if (user.role === 'faculty') {
      const all = await storage.getAllAttendanceRequests();
      requests = all.filter(r => user.branches.includes(r.branch as Branch));
    } else {
      requests = await storage.getAllAttendanceRequests();
    }
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/attendance', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = await storage.getUserById(userId);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { eventId, studentName, rollNumber, branch, department, proof } = req.body;
    if (!proof?.trim()) return res.status(400).json({ error: 'Proof is required' });

    const request = await storage.createAttendanceRequest({
      studentId: userId,
      eventId: eventId || null,
      studentName: studentName || user.name,
      rollNumber: rollNumber || user.rollNumber || '',
      branch: branch || user.branches[0] || 'CSE',
      department: department || user.department || '',
      proof,
    });
    res.json({ request });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/attendance/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const user = await storage.getUserById(userId);
    if (!user || !['hod', 'admin', 'faculty'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const { status } = req.body;
    const request = await storage.updateAttendanceStatus(req.params.id, status);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', requireAuth, async (req, res) => {
  try {
    const userId = (req.session as any).userId;
    const caller = await storage.getUserById(userId);
    if (!caller || !['admin', 'hod'].includes(caller.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const users = await storage.getAllUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/approve', requireRole('admin'), async (req, res) => {
  try {
    await storage.approveUser(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  try {
    await storage.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/hod', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, branches } = req.body;
    if (!email?.endsWith('@gnits.ac.in')) {
      return res.status(400).json({ error: 'Must use @gnits.ac.in email' });
    }
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hod = await storage.createHOD({ name, email, password: 'gnits@hod2026', branches });
    res.json({ success: true, user: hod });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const SYSTEM_PROMPT = `You are an AI chatbot assistant for G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad, India.

Your purpose is to help students with accurate academic, administrative, and college-related information. You must always behave like an official college helpdesk assistant.

📌 COLLEGE INFORMATION:
- Name: G. Narayanamma Institute of Technology and Science
- Program: B.Tech (4 years, 8 semesters)
- Total Credits: 160
- Maximum Duration: 8 years
- College Timings: 9:00 AM to 4:00 PM

📌 ACADEMIC RULES:
Attendance:
- Minimum attendance required: 75%
- 65%–75% attendance may be condoned with valid reasons and approval
- Below 65% attendance is NOT allowed and student may be detained
- Detained students must repeat the semester

Examinations:
- Internal Evaluation (CIE): 40 marks
- External Exam (SEE): 60 marks
- Minimum passing: 35% internal, 35% external, 40% overall

Failure Rules:
- F grade if failed; must take supplementary exams
- Internal marks carried forward
- Absence in exams = failure

Grading: O (90+), A+ (80–89), A (70–79), B+ (60–69), B (50–59), C (40–49), F (<40)

Promotion Rules:
- 1st→2nd year: 20 credits
- 2nd→3rd year: 48 credits
- 3rd→4th year: 72 credits

Degree Requirement: Minimum CGPA 5.0, minimum 160 credits

📌 RESPONSE RULES:
- Clear, short, student-friendly answers
- Ask follow-up if unclear
- If unknown, say: "Please contact your department or academic office for accurate details."
- Never invent rules. Accuracy over creativity.

📌 CHAT STYLE:
- Friendly but professional
- Simple English, bullet points when explaining rules
- Avoid long paragraphs

You are NOT a general chatbot. You are a GNITS academic assistant only. Politely refuse off-topic requests.`;

router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages is required' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (GEMINI_API_KEY) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages.map((m: any) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          }),
        }
      );
      const data = await response.json() as any;
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
      return res.json({ reply });
    }

    if (OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        }),
      });
      const data = await response.json() as any;
      const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
      return res.json({ reply });
    }

    return res.json({
      reply: "The AI assistant is not configured yet. Please set up an AI API key in Replit's Secrets (GEMINI_API_KEY or OPENAI_API_KEY) to enable the chatbot."
    });
  } catch (err: any) {
    console.error('[chat]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
