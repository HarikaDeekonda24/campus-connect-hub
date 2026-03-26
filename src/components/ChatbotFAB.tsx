import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const quickReplies: Record<string, string> = {
  'events': "Here are the upcoming events:\n\n🎯 **HackCampus 2026** — April 15, Main Auditorium\n🤖 **AI/ML Workshop** — April 10, Lab Block C\n🎭 **Cultural Night** — April 25, Open Air Theater\n\nWould you like details about any specific event?",
  'map': "The campus has 8 main buildings:\n\n🏛️ **Block A** — CS & IT Departments\n🏛️ **Block B** — Electronics & Electrical\n🔬 **Block C** — Labs (Computer, Hardware, IoT)\n📚 **Library** — 3 floors, open 8AM-8PM\n🎪 **Auditorium** — Main events venue\n\nYou can explore the full map on the **Campus Map** page!",
  'attendance': "To request attendance permission:\n\n1️⃣ Go to **Attendance** page\n2️⃣ Fill in your details and event info\n3️⃣ Submit with proof of registration\n4️⃣ Wait for HOD/Faculty approval\n5️⃣ Once approved, your class teacher is notified automatically\n\nYou can track your request status anytime!",
};

export function ChatbotFAB() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! 👋 I'm your Campus Connect assistant. Ask me about events, campus navigation, attendance requests, or anything else!" },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const lower = input.toLowerCase();
    let reply = "I'd be happy to help! You can ask me about:\n\n• **Events** — upcoming events and details\n• **Campus Map** — building locations and rooms\n• **Attendance** — how to request permission\n• **Departments** — faculty and course info\n\nWhat would you like to know?";
    for (const [key, val] of Object.entries(quickReplies)) {
      if (lower.includes(key)) { reply = val; break; }
    }
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    }, 600);
    setInput('');
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="fixed bottom-20 right-4 md:right-6 w-[340px] md:w-[380px] h-[480px] bg-card border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
            <div className="campus-gradient p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-foreground" />
                <span className="text-primary-foreground font-medium text-sm">Campus Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'campus-gradient text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask me anything..." className="campus-input flex-1 text-sm" />
                <button onClick={handleSend} className="p-2 rounded-lg campus-gradient text-primary-foreground hover:opacity-90 transition-opacity">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 md:right-6 w-12 h-12 rounded-full campus-gradient-gold text-accent-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-50">
        {open ? <X className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </button>
    </>
  );
}
