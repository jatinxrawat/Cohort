import React, { useState } from 'react';
import { X, Smartphone, Bell, Check } from 'lucide-react';

const AndroidIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.6 9.48l1.65-2.86c.12-.2.05-.46-.15-.57-.2-.12-.46-.05-.57.15l-1.68 2.9C15.22 8.43 13.67 8 12 8s-3.22.43-4.85 1.1l-1.68-2.9c-.11-.2-.37-.27-.57-.15-.2.11-.27.37-.15.57L6.4 9.48C3.9 10.96 2.18 13.49 2 16.5h20c-.18-3.01-1.9-5.54-4.4-7.02zM8 13.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
  </svg>
);

const AppleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export default function DownloadAppModal({ isOpen, onClose }) {
  const [notifyLaunch, setNotifyLaunch] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-neutral-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span>App Download Live</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/25 border border-white/20 relative z-10">
          <Smartphone className="w-8 h-8" />
        </div>

        <div className="space-y-2 relative z-10">
          <h3 className="text-xl font-extrabold text-white tracking-tight">Get Cohort on Mobile</h3>
          <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto font-medium">
            Experience instant campus notifications, zero-latency chats, and exclusive mobile features directly from your phone.
          </p>
        </div>

        <div className="space-y-3 pt-2 relative z-10">
          <div className="space-y-1">
            <a
              href="/cohort.apk"
              download="cohort.apk"
              onClick={onClose}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <AndroidIcon className="w-5 h-5 flex-shrink-0" />
              <span>Download Android APK</span>
            </a>
            <p className="text-[10px] text-neutral-500 font-medium">Latest Build · APK format (direct install)</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-neutral-800/80 border border-neutral-800 text-neutral-500 font-extrabold text-sm select-none">
              <AppleIcon className="w-5 h-5 flex-shrink-0" />
              <span>iOS App (TestFlight Soon)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 text-left relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${notifyLaunch ? 'bg-purple-500/20 text-purple-400' : 'bg-neutral-800 text-neutral-500'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h5 className="font-bold text-xs text-white truncate">App Update Alerts</h5>
              <p className="text-[10px] text-neutral-400 truncate">{notifyLaunch ? "You'll be notified of new releases" : 'Alerts disabled'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotifyLaunch(!notifyLaunch)}
            className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative cursor-pointer flex-shrink-0 ${notifyLaunch ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-sm' : 'bg-neutral-800'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${notifyLaunch ? 'translate-x-5' : 'translate-x-0'}`}>
              {notifyLaunch && <Check className="w-3 h-3 text-purple-600 stroke-[3]" />}
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-2xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold text-xs transition-colors cursor-pointer relative z-10"
        >
          Close
        </button>
      </div>
    </div>
  );
}
