import React, { useState } from 'react';
import { DateRangeConfig } from '../types';
import { createSession } from '../lib/storage';
import { Calendar, Clock, Plus, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface CreateSessionProps {
  onSessionCreated: (sessionId: string) => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onSessionCreated }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const threeDaysLaterStr = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(threeDaysLaterStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const config: DateRangeConfig = {
        startDate,
        endDate,
        startTime,
        endTime,
      };

      const session = await createSession(title.trim(), config);
      onSessionCreated(session.id);
    } catch (err) {
      console.error('Failed to create session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Frictionless Group Scheduling</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
          Find the Perfect Meeting Time <br />
          <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            Without the Back-and-Forth
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Create a session, share the unique link, and let your team drag-and-drop their availability in seconds.
        </p>
      </div>

      {/* Creation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Meeting / Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Product Demo Sync, Q3 Roadmap, Game Night"
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm transition-all outline-none font-medium"
            />
          </div>

          {/* Date Range Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {/* Daily Time Window Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Earliest Hour</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Latest Hour</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-sm py-3.5 px-6 rounded-xl shadow-xl shadow-teal-500/20 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Create Session & Get Share Link</span>
            <ArrowRight className="w-4 h-4 ml-1 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* Feature Bullet Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 space-y-1">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <h4 className="text-xs font-bold text-slate-200">No Passwords or Logins</h4>
          <p className="text-[11px] text-slate-400">Participants join instantly by typing their name.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 space-y-1">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <h4 className="text-xs font-bold text-slate-200">Drag-to-Select Grid</h4>
          <p className="text-[11px] text-slate-400">Intuitive mouse gestures with 30-minute intervals.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4 space-y-1">
          <CheckCircle2 className="w-5 h-5 text-teal-400" />
          <h4 className="text-xs font-bold text-slate-200">Smart Heatmap</h4>
          <p className="text-[11px] text-slate-400">Automatically calculates top overlap & preferred slots.</p>
        </div>
      </div>
    </div>
  );
};
