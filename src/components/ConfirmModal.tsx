import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastNotice {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastBannerProps {
  toast: ToastNotice | null;
  onDismiss?: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={`fixed top-14 left-1/2 z-80 px-4 py-2.5 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-bold max-w-md w-max ${
            toast.type === 'error'
              ? 'bg-red-950 text-red-100 border-red-700'
              : toast.type === 'info'
              ? 'bg-gray-900 text-white border-gray-700'
              : 'bg-[#0C342C] text-white border-[#076653]'
          }`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-4 h-4 text-[#E3EF26] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#E3EF26] shrink-0" />
          )}
          <span>{toast.message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5 opacity-80" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-[#076653]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-600 leading-relaxed">{message}</p>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#076653] hover:bg-[#0C342C]'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
