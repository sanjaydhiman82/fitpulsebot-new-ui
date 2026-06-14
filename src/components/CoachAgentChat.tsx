import React, { FormEvent, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react';
import { api, getUserId } from '../api';
import styles from './CoachAgentChat.module.css';

type AgentMode =
  | 'daily_progress'
  | 'nutrition_review'
  | 'weight_loss_review'
  | 'food_advisor'
  | 'meal_recommendation'
  | 'diet_plan'
  | 'goal_coach'
  | 'accountability'
  | 'weekly_review';

type ChatMessage = {
  id: string;
  role: 'user' | 'coach';
  text: string;
  response?: any;
  error?: string;
};

interface CoachAgentChatProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CoachAgentChat({ open, onOpenChange }: CoachAgentChatProps = {}) {
  const userId = getUserId();
  const [selectedMode, setSelectedMode] = useState<AgentMode>('daily_progress');
  const [text, setText] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);

  const ctaOpen = open !== undefined ? open : internalOpen;
  const setCtaOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'coach',
      text: 'Ask me anything about your progress, food, goals, meals, weight loss, or habits.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  async function runCoach(mode: AgentMode, messageText: string) {
    if (!userId) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'coach', text: 'Please sign in again to use AI Coach.', error: 'Missing user session.' }]);
      return;
    }
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: messageText,
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const payload: any = {
        userId,
        mode,
        message: messageText,
        days: 7,
      };
      const response = await api.aiCoach.healthAgent(payload);
      setSelectedMode(response.mode || mode);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'coach',
          text: response.answer || response.summary,
          response,
        },
      ]);
      window.setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'coach',
          text: 'Coach could not complete this review.',
          error: e?.message || 'Unknown error',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    runCoach(selectedMode, trimmed);
  }

  return (
    <div className={styles.floatingCoach}>
      {ctaOpen && (
        <section className={styles.chatPanel} aria-label="iCoach chat">
          <header className={styles.header}>
            <div className={styles.avatar}>
              <img src="/ai-coch.png" alt="" />
            </div>
            <div>
              <h2>iCoach</h2>
              <p>Ask naturally. I will route it to the right coach.</p>
            </div>
            <button type="button" onClick={() => setCtaOpen(false)} className={styles.closeBtn} aria-label="Close iCoach">
              <X size={17} />
            </button>
          </header>

          <div ref={listRef} className={styles.messageList}>
            {messages.map(message => (
              <div key={message.id} className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.coachMessage}`}>
                <div className={styles.messageIcon}>{message.role === 'user' ? 'You' : <Bot size={15} />}</div>
                <div className={styles.bubble}>
                  <p>{message.text}</p>
                  {message.error && <div className={styles.errorText}>{message.error}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.coachMessage}`}>
                <div className={styles.messageIcon}><Bot size={15} /></div>
                <div className={styles.bubble}>
                  <div className={styles.thinkingBlock}>
                    <div className={styles.loadingLine}><Loader2 size={15} /> Reviewing your saved logs and goals</div>
                    <div className={styles.progressRail} aria-hidden="true"><span /></div>
                    <div className={styles.thinkingDots} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form className={styles.composer} onSubmit={submit}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Ask: Can I eat mango?"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !text.trim()} aria-label="Send message" className={loading ? styles.sending : undefined}>
              {loading ? <Loader2 size={18} /> : <Send size={18} />}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={styles.floatingCta}
        onClick={() => setCtaOpen(!ctaOpen)}
        aria-expanded={ctaOpen}
        aria-label="Open iCoach chat"
      >
        <Sparkles size={18} />
        <span>iCoach</span>
      </button>
    </div>
  );
}
