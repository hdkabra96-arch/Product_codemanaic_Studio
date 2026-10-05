import React from 'react';
import {
  Youtube,
  Instagram,
  Linkedin,
  Twitter,
  MessageCircle,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  ArrowUp,
} from 'lucide-react';
import { CodemaniacLogo } from './CodemaniacLogo';
import { PageView, ToolCategory } from '../types';

interface FooterProps {
  onNavigate: (page: PageView, category?: ToolCategory) => void;
  onOpenLetsTalk: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLetsTalk }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#FAF5EB] border-t border-[#E9DCC8] pt-16 pb-12 overflow-hidden text-[#102A43]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-14 border-b border-[#E9DCC8]">
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-5">
            <button
              onClick={() => {
                onNavigate('home');
                scrollToTop();
              }}
              className="text-left cursor-pointer focus:outline-none"
            >
              <CodemaniacLogo />
            </button>

            <p className="text-sm font-semibold text-[#61758A] tracking-wide">
              Ideas. Innovation. Impact.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:shadow-sm transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:shadow-sm transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:shadow-sm transition-all"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:shadow-sm transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <button
                onClick={onOpenLetsTalk}
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-white border border-[#E9DCC8] flex items-center justify-center text-[#102A43] hover:text-[#D98218] hover:border-[#D98218] hover:shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-[#102A43]">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-[#61758A]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('product', 'all');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Product
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('service');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('education');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Education Hub
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('about');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('blog');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Blog
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('contact');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('privacy');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Our Products */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-[#102A43]">Our Products</h4>
            <ul className="space-y-2.5 text-sm text-[#61758A]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'pdf');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  PDF Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'image');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Image Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'video');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Video Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'audio');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Audio Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'utility');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Utility Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('category', 'ai');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  AI Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('product', 'all');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors font-medium cursor-pointer"
                >
                  All Products
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-[#102A43]">Support</h4>
            <ul className="space-y-2.5 text-sm text-[#61758A]">
              <li>
                <button
                  onClick={() => {
                    onNavigate('education');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('education');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  User Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('privacy');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('privacy');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenLetsTalk}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('contact');
                    scrollToTop();
                  }}
                  className="hover:text-[#D98218] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-[#102A43]">Contact Info</h4>
            <ul className="space-y-3.5 text-sm text-[#61758A]">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D98218] shrink-0 mt-0.5" />
                <span>Surat, Gujarat, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D98218] shrink-0" />
                <a
                  href="mailto:hello@codemaniacstudio.com"
                  className="hover:text-[#D98218] transition-colors"
                >
                  hello@codemaniacstudio.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#D98218] shrink-0" />
                <a href="tel:+919876543210" className="hover:text-[#D98218] transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-[#D98218] shrink-0" />
                <button
                  onClick={onOpenLetsTalk}
                  className="hover:text-[#D98218] transition-colors cursor-pointer font-medium"
                >
                  Let's Chat
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#61758A]">
          <p>© 2026 Codemaniac Studio. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                onNavigate('privacy');
                scrollToTop();
              }}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span>|</span>
            <button
              onClick={() => {
                onNavigate('privacy');
                scrollToTop();
              }}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>|</span>
            <button
              onClick={() => {
                onNavigate('product', 'all');
                scrollToTop();
              }}
              className="hover:text-[#D98218] transition-colors cursor-pointer"
            >
              Sitemap
            </button>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button matching screenshots */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(217,130,24,0.4)] hover:shadow-[0_6px_22px_rgba(217,130,24,0.55)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>
    </footer>
  );
};
