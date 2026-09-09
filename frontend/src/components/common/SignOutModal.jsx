import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, ShieldAlert, Loader2, X } from 'lucide-react';

export default function SignOutModal({ isOpen, onClose, onConfirm, loading = false, userRole = 'USER', user }) {
  if (!isOpen) return null;

  const isResponder = userRole === 'RESPONSE_UNIT' || user?.role === 'RESPONSE_UNIT' || user?.unit_id;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          onClick={loading ? undefined : onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Icon */}
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>

          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 shadow-inner border border-red-100 dark:border-red-500/20">
            <LogOut size={30} />
          </div>

          {/* Title & Description */}
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Confirm Sign Out
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
            Are you sure you want to end your current active session?
          </p>

          {/* Special Context Warning for Responders */}
          {isResponder && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                  Duty Status Synchronization
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">
                  Signing out will automatically mark your unit status as <span className="font-black underline">OFFLINE</span> and unregister your device from live dispatching.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 px-5 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-4 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing Out...</span>
                </>
              ) : (
                <span>Yes, Sign Out</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
