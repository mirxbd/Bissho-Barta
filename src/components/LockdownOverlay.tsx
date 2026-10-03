import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Lock, Unlock, LogOut, LogIn, Mail, Phone, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { isLockdownActive, setLockdownState } from '../utils/controlPanelStorage';

interface LockdownOverlayProps {
  userEmail?: string;
  onShowToast?: (msg: string) => void;
}

export default function LockdownOverlay({ userEmail = 'mirxbd@gmail.com', onShowToast }: LockdownOverlayProps) {
  const [locked, setLocked] = useState(isLockdownActive);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Unlock verification flow
  const [verifyMethod, setVerifyMethod] = useState<'email' | 'phone'>('email');
  const [codeSent, setCodeSent] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // Login modal inputs
  const [loginIdentifier, setLoginIdentifier] = useState(userEmail);
  const [loginPassword, setLoginPassword] = useState('••••••••');

  useEffect(() => {
    const handleLockdownEvent = (e: any) => {
      setLocked(Boolean(e.detail));
    };
    window.addEventListener('lockdown-mode-changed', handleLockdownEvent);
    return () => window.removeEventListener('lockdown-mode-changed', handleLockdownEvent);
  }, []);

  if (!locked) return null;

  const handleSendCode = () => {
    setCodeSent(true);
    setInputCode('202688'); // Auto-fill demo verification code for smooth testing
    setVerifyError('');
    onShowToast?.(`Verification code sent to ${verifyMethod === 'email' ? userEmail : '+880 1712-345678'}`);
  };

  const handleVerifyUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode || inputCode.length < 4) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    // Success: disable lockdown
    setLockdownState(false);
    setLocked(false);
    setShowUnlockModal(false);
    setCodeSent(false);
    setInputCode('');
    onShowToast?.('Lockdown Mode disabled. Welcome back!');
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onShowToast?.('Logged out successfully. Feed cleared.');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLoginModal(false);
    onShowToast?.(`Authenticated as ${loginIdentifier}. Lockdown mode remains active until verified.`);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center"
      >
        {/* Pulsing Lock Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-full bg-linear-to-tr from-amber-600 to-red-600 flex items-center justify-center shadow-lg border-2 border-amber-400">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.2} />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Lockdown Mode Active</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Account In Lockdown
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Your social media feed, direct messages, calls, and public profile updates are temporarily turned off.
            No one can interact with you until lockdown is lifted.
          </p>
        </div>

        {/* Action Buttons: Turn Off Lockdown, Logout, Login */}
        <div className="pt-2 space-y-3 max-w-sm mx-auto">
          {/* Main Unlock Button */}
          <button
            type="button"
            onClick={() => {
              setShowUnlockModal(true);
              setCodeSent(false);
              setInputCode('');
              setVerifyError('');
            }}
            className="w-full h-12 bg-linear-to-r from-emerald-600 to-[#076653] hover:from-emerald-500 hover:to-[#0C342C] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Unlock className="w-4 h-4" />
            <span>Turn Off Lockdown Mode</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            {/* Log Out button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-400 hover:text-red-300 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            {/* Log In button */}
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="h-11 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Security policy: Turning off lockdown requires multi-factor verification via your registered email or mobile phone.
        </p>
      </motion.div>

      {/* MODAL 1: Turn Off Lockdown Verification Modal */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 text-slate-900 space-y-5 shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Verify to Exit Lockdown</h3>
                  <p className="text-xs text-gray-500">Confirm your identity via email or phone</p>
                </div>
              </div>

              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Send Verification Code To:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyMethod('email');
                      setCodeSent(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      verifyMethod === 'email'
                        ? 'border-[#076653] bg-[#EBF7F2] text-[#076653] font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">Email ({userEmail})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerifyMethod('phone');
                      setCodeSent(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      verifyMethod === 'phone'
                        ? 'border-[#076653] bg-[#EBF7F2] text-[#076653] font-semibold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">Phone (+880 17XX)</span>
                  </button>
                </div>
              </div>

              {!codeSent ? (
                <button
                  type="button"
                  onClick={handleSendCode}
                  className="w-full h-11 bg-[#076653] hover:bg-[#0C342C] text-white font-semibold text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Send 6-Digit Code
                </button>
              ) : (
                <form onSubmit={handleVerifyUnlock} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">Enter Verification Code</label>
                      <span className="text-[11px] text-emerald-700 font-medium">Demo Code: 202688</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      placeholder="202688"
                      className="w-full h-12 text-center text-xl font-mono tracking-widest bg-gray-50 border border-gray-300 rounded-xl focus:border-[#076653] focus:ring-2 focus:ring-[#076653]/20 focus:outline-none"
                    />
                    {verifyError && <p className="text-xs text-red-600 mt-1">{verifyError}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(false)}
                      className="flex-1 h-11 border border-gray-300 hover:bg-gray-100 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-11 bg-[#076653] hover:bg-[#0C342C] text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      Verify & Turn Off
                    </button>
                  </div>
                </form>
              )}

              {!codeSent && (
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="w-full text-center text-xs text-gray-500 hover:underline pt-1 cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 text-slate-900 space-y-4 shadow-2xl text-left"
            >
              <h3 className="font-bold text-base text-gray-900">Log out of Bissho Barta?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Logging out while Lockdown is enabled keeps your account protected. You can log back in anytime.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-11 border border-gray-300 hover:bg-gray-100 font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Log In Dialog */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 text-slate-900 space-y-4 shadow-2xl text-left"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Account Log In</h3>
                  <p className="text-xs text-gray-500">Sign in to another account or re-authenticate</p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email or Phone</label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#076653]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#076653]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 h-11 border border-gray-300 hover:bg-gray-100 font-semibold text-sm rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-[#076653] hover:bg-[#0C342C] text-white font-bold text-sm rounded-xl cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
