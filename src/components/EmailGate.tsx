import React, { useState } from 'react';
import { ArrowRight, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config/appConfig';

interface EmailGateProps {
  initialEmail: string;
  onProceed: (email: string) => void;
}

export const EmailGate: React.FC<EmailGateProps> = ({ initialEmail, onProceed }) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Sila masukkan alamat email anda.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('Sila masukkan alamat email yang sah.');
      return;
    }

    setError(null);
    onProceed(cleanEmail);
  };

  return (
    <div id="email-gate-card" className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8 transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 ring-8 ring-indigo-50/50">
          <Mail className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Bina QR Code Anda
        </h2>
        <p className="text-sm text-slate-500 mt-2 font-normal">
          {APP_CONFIG.subTagline}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="user-email-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Alamat Email
          </label>
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="user-email-input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Masukkan alamat email anda"
              className={`block w-full pl-11 pr-4 py-3.5 text-slate-900 bg-slate-50/70 placeholder-slate-400 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-base ${
                error
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
              }`}
              autoFocus
            />
          </div>
          {error && (
            <div id="email-error-message" className="flex items-center gap-1.5 text-rose-600 text-xs font-medium mt-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          id="btn-email-gate-proceed"
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <span>Teruskan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-slate-500 text-xs leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>{APP_CONFIG.privacyNotice}</p>
      </div>
    </div>
  );
};
