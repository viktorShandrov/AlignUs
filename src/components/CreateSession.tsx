import React, { useState } from 'react';
import { DateRangeConfig } from '../types';
import { createSession } from '../lib/storage';
import { Calendar, Clock, Plus, Sparkles, ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { format } from 'date-fns';

interface CreateSessionProps {
  onSessionCreated: (sessionId: string) => void;
}

export const CreateSession: React.FC<CreateSessionProps> = ({ onSessionCreated }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [title, setTitle] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
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
        endDate: isMultiDay ? endDate : startDate,
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
    <div className="max-w-xl mx-auto py-4 px-3 space-y-4">
      {/* Hero Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3 h-3" />
          <span>Frictionless Scheduling</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          New Scheduling Session
        </h1>
        <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
          Share the link & let your team drag availability in seconds.
        </p>
      </div>

      {/* Creation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Meeting Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Product Demo, Q3 Roadmap, Team Sync"
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2 text-xs transition-all outline-none font-medium shadow-2xs"
            />
          </div>

          {/* Date Mode Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>Date Selection</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsMultiDay(!isMultiDay);
                  if (!isMultiDay) setEndDate(startDate);
                }}
                className="flex items-center space-x-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Layers className="w-3 h-3" />
                <span>{isMultiDay ? 'Single Day Only' : '+ Add Multiple Days'}</span>
              </button>
            </div>

            <div className={`grid gap-3 ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">
                  {isMultiDay ? 'Start Date' : 'Event Date'}
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => {
                    setStartDate(e.target.value);
                    if (!isMultiDay) setEndDate(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 rounded-xl px-3 py-2 text-xs outline-none shadow-2xs font-medium"
                />
              </div>

              {isMultiDay && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[10px] font-semibold text-slate-500">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 rounded-xl px-3 py-2 text-xs outline-none shadow-2xs font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Daily Time Window Picker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 rounded-xl px-3 py-2 text-xs outline-none shadow-2xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 rounded-xl px-3 py-2 text-xs outline-none shadow-2xs font-medium"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-4 rounded-xl shadow-sm shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Session & Get Link</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* Compact Bullet Points */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-0.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <h4 className="text-[11px] font-bold text-slate-900">No Auth</h4>
          <p className="text-[10px] text-slate-500">Name strings only.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-0.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <h4 className="text-[11px] font-bold text-slate-900">Drag Grid</h4>
          <p className="text-[10px] text-slate-500">30-min intervals.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-0.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <h4 className="text-[11px] font-bold text-slate-900">Google Cal</h4>
          <p className="text-[10px] text-slate-500">1-click export.</p>
        </div>
      </div>
    </div>
  );
};
