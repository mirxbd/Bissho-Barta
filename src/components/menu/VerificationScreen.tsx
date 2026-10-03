import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';

interface VerificationScreenProps {
  profile: UserProfile;
  verificationSubmitted: boolean;
  onSubmitVerification: () => void;
  onBack: () => void;
}

export default function VerificationScreen({
  profile,
  verificationSubmitted,
  onSubmitVerification,
  onBack,
}: VerificationScreenProps) {
  const [fullName, setFullName] = useState(profile.name);
  const [category, setCategory] = useState('Creator / Public Figure');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitVerification();
  };

  return (
    <div className="p-4 space-y-6">
      {verificationSubmitted ? (
        <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-2">
          <h3 className="text-base font-semibold text-[#111827]">
            Application Submitted (Demo)
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Your verification request for <span className="font-medium text-[#111827]">{fullName}</span> has been recorded in demo mode. No live identity verification is performed.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-4"
        >
          <div>
            <h3 className="text-base font-semibold text-[#111827]">
              Request Verification (Demo)
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              Verified badges confirm that a profile belongs to an authentic creator, journalist, or organization.
            </p>
          </div>

          <div>
            <label
              htmlFor="verification-full-name"
              className="block text-sm font-medium text-[#111827] mb-1.5"
            >
              Legal or Public Name
            </label>
            <input
              id="verification-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
            />
            <p className="text-xs text-[#6B7280] mt-1.5">
              Must match your public identity on Bissho Barta.
            </p>
          </div>

          <div>
            <label
              htmlFor="verification-category"
              className="block text-sm font-medium text-[#111827] mb-1.5"
            >
              Account Category
            </label>
            <input
              id="verification-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
            />
            <p className="text-xs text-[#6B7280] mt-1.5">
              Demo simulation only. Not connected to an external verification provider.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!fullName.trim()}
              className="w-full h-11 bg-[#076653] menu-btn-primary hover:bg-[#0C342C] text-white font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2"
            >
              Submit Request (Demo)
            </button>
          </div>
        </form>
      )}

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Menu"
        className="w-full h-11 bg-white border border-[#076653] text-[#076653] hover:bg-[#EBF7F2] font-semibold text-sm rounded-[10px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        <span>Back to Menu</span>
      </button>
    </div>
  );
}
