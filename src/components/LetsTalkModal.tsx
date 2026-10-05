import React, { useState } from 'react';
import { X, Send, MapPin, Mail, Phone, MessageCircle, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LetsTalkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LetsTalkModal: React.FC<LetsTalkModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Custom Tool Development');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#FFFDF8] rounded-3xl border border-[#E9DCC8] shadow-[0_20px_50px_rgba(16,42,67,0.25)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#FAF5EC] border-b border-[#E9DCC8] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#D98218] border border-[#E9DCC8]">
              GET IN TOUCH
            </span>
            <h2 className="text-xl font-extrabold text-[#102A43] mt-1">
              Let's Talk — Codemaniac Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] hover:border-[#D98218] text-[#102A43] hover:text-[#D98218] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-[#102A43]">
                Message Sent Successfully!
              </h3>
              <p className="text-sm text-[#61758A] max-w-sm mx-auto">
                Thank you for reaching out to Codemaniac Studio. Our Surat team will review your inquiry and get back to you within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-full bg-[#D98218] text-white text-xs font-bold hover:bg-[#C66A08] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1">Inquiry Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                >
                  <option>Custom Tool Development</option>
                  <option>API & Enterprise Licensing</option>
                  <option>Bulk File Processing Setup</option>
                  <option>Partnership & Education Inquiry</option>
                  <option>General Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can Codemaniac Studio help you today?"
                  className="w-full p-3 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </a>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Send Message</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Contact bar */}
        <div className="px-6 py-3 bg-[#FAF5EC] border-t border-[#E9DCC8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#61758A]">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D98218]" /> Surat, Gujarat, India
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-[#D98218]" /> hello@codemaniacstudio.com
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#D98218]" /> +91 98765 43210
          </span>
        </div>
      </div>
    </div>
  );
};
