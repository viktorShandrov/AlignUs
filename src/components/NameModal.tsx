import React, { useState, useEffect } from 'react';
import { Participant } from '../types';
import { User, UserPlus, AlertCircle, Check, X } from 'lucide-react';

interface NameModalProps {
  isOpen: boolean;
  currentName: string;
  onSaveName: (name: string) => void;
  onClose?: () => void;
  participants: Participant[];
  currentUserId?: string;
}

export const NameModal: React.FC<NameModalProps> = ({
  isOpen,
  currentName,
  onSaveName,
  onClose,
  participants,
  currentUserId,
}) => {
  const [nameInput, setNameInput] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(currentName);
    setError(null);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const isNameTaken = participants.some(
    p =>
      p.name.trim().toLowerCase() === nameInput.trim().toLowerCase() &&
      (p.userId ? p.userId !== currentUserId : true)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) {
      setError('Моля, въведете име.');
      return;
    }
    if (isNameTaken) {
      setError('Това име вече се използва от друг участник в тази среща.');
      return;
    }
    onSaveName(clean);
  };

  const isFirstTime = !currentName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 relative">
        {!isFirstTime && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isFirstTime ? 'Добре дошли в AlignUs!' : 'Промяна на име'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {isFirstTime
                ? 'Моля, въведете вашето име, за да отбележите наличност.'
                : 'Въведете новото име, с което ще се виждате в графика.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Вашето Име</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nameInput}
              onChange={e => {
                setNameInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="напр. Петър, Мария..."
              className={`w-full border text-slate-900 placeholder-slate-400 rounded-xl px-3 py-2.5 text-sm transition-all outline-none font-medium shadow-2xs ${
                error || isNameTaken
                  ? 'bg-rose-50/50 border-rose-400 focus:border-rose-600 text-rose-900'
                  : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white'
              }`}
            />
            {(error || isNameTaken) && (
              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error || 'Това име вече е заето в тази сесия.'}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            {!isFirstTime && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Отказ
              </button>
            )}
            <button
              type="submit"
              disabled={!nameInput.trim() || isNameTaken}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isFirstTime ? 'Продължи' : 'Запази Име'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
