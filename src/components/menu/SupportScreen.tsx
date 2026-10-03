import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface SupportScreenProps {
  onShowToast?: (msg: string) => void;
  onBack: () => void;
}

export default function SupportScreen({ onShowToast, onBack }: SupportScreenProps) {
  const [subject, setSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setSubject('');
    setSupportMessage('');
    onShowToast?.('Support message submitted.');
  };

  return (
    <div className="p-4 space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-4"
      >
        <div>
          <h3 className="text-base font-semibold text-[#111827]">
            Contact Support
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            Tell us how we can help with your account or report a problem.
          </p>
        </div>

        <div>
          <label
            htmlFor="support-subject"
            className="block text-sm font-medium text-[#111827] mb-1.5"
          >
            Topic
          </label>
          <input
            id="support-subject"
            type="text"
            placeholder="Account, privacy, or technical issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full h-11 px-3.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
          />
          <p className="text-xs text-[#6B7280] mt-1.5">
            Optional short summary of your request.
          </p>
        </div>

        <div>
          <label
            htmlFor="support-message"
            className="block text-sm font-medium text-[#111827] mb-1.5"
          >
            Message
          </label>
          <textarea
            id="support-message"
            rows={4}
            placeholder="Describe your question or feedback in detail..."
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            className="w-full min-h-[104px] px-3.5 py-2.5 text-[15px] text-[#111827] bg-white border border-[#E5E7EB] rounded-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653]"
          />
          <p className="text-xs text-[#6B7280] mt-1.5">
            Please include any details that help reproduce the issue.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!supportMessage.trim()}
            className="w-full h-11 bg-[#076653] menu-btn-primary hover:bg-[#0C342C] text-white font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2"
          >
            Send Message
          </button>
        </div>
      </form>

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
