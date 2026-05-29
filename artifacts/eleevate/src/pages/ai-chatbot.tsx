import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, RotateCcw, BookOpen, Calendar, Globe2, GraduationCap, Zap } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: GraduationCap, text: "What IELTS score do I need for UK universities?" },
  { icon: Globe2, text: "What are the visa requirements for Canada student visa?" },
  { icon: Calendar, text: "When are the application deadlines for September intake?" },
  { icon: BookOpen, text: "Which scholarships are available for Indian students?" },
];

async function sendMessage(message: string): Promise<{ reply: string; timestamp: string }> {
  const res = await fetch("/api/consultant/chatbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export default function AiChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI counselling assistant. I can help with university eligibility, visa requirements, application deadlines, English tests, scholarships, and more. What would you like to know?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { reply, timestamp } = await sendMessage(msg);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply, timestamp }]);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I'm having trouble right now. Please try again in a moment, or book a session with one of our human consultants.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI counselling assistant. I can help with university eligibility, visa requirements, application deadlines, English tests, scholarships, and more. What would you like to know?",
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <AppLayout>
      <div data-testid="ai-chatbot-page" className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">AI Counselling Assistant</h1>
            <p className="text-muted-foreground mt-1">Get instant answers to overseas education questions.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700"><Zap className="h-3 w-3 mr-1" />AI Powered</Badge>
            <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1.5" />Reset</Button>
          </div>
        </div>

        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }) => (
                <button key={text} onClick={() => handleSend(text)}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left text-sm"
                >
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-foreground">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Card className="border border-border flex flex-col" style={{ height: "500px" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4 text-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1.5 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask about universities, visas, scholarships..."
                disabled={isLoading}
                className="flex-1"
                data-testid="chatbot-input"
              />
              <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} data-testid="btn-send-message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              AI responses are for guidance only. Book a session with a human consultant for personalised advice.
            </p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
