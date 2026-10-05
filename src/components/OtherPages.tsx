import React, { useState } from 'react';
import {
  Code,
  Sparkles,
  Shield,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Lock,
  Calendar,
  User,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PageView, ToolCategory } from '../types';

interface OtherPageProps {
  page: PageView;
  onNavigate: (page: PageView, category?: ToolCategory) => void;
  onOpenLetsTalk: () => void;
}

export const OtherPages: React.FC<OtherPageProps> = ({
  page,
  onNavigate: _onNavigate,
  onOpenLetsTalk,
}) => {
  // Service Page
  if (page === 'service') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
            OUR SERVICES
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43] tracking-tight">
            Tailored Engineering & <span className="text-[#D98218]">Digital Innovation</span>
          </h1>
          <p className="text-base sm:text-lg text-[#61758A] leading-relaxed">
            From custom document processing microservices to full-scale SaaS platforms,
            Codemaniac Studio engineers robust software solutions for modern enterprises.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Custom Tool & SDK Development',
              desc: 'High-performance WebAssembly and Cloud document engines customized for your specific workflow requirements.',
              icon: <Code className="w-6 h-6 text-[#D98218]" />,
              deliverables: ['Custom API connectors', 'Local on-premise runner', 'High-throughput batch queues'],
            },
            {
              title: 'AI & Machine Learning Integration',
              desc: 'Integrate OCR, document classification, background removal and natural language summaries directly into your existing apps.',
              icon: <Sparkles className="w-6 h-6 text-[#D98218]" />,
              deliverables: ['Fine-tuned vision models', 'Low-latency inference', 'Data sovereignty compliance'],
            },
            {
              title: 'Secure Cloud & Architecture',
              desc: 'Zero-retention infrastructure designed with military-grade encryption for enterprise security and regulatory peace of mind.',
              icon: <Shield className="w-6 h-6 text-[#D98218]" />,
              deliverables: ['End-to-end encryption', 'SOC2 readiness', 'Automated horizontal scaling'],
            },
          ].map((srv, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-8 border border-[#E9DCC8] shadow-[0_4px_20px_rgba(217,130,24,0.06)] flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF3DF] flex items-center justify-center mb-6">
                  {srv.icon}
                </div>
                <h3 className="text-xl font-bold text-[#102A43] mb-3">{srv.title}</h3>
                <p className="text-sm text-[#61758A] leading-relaxed mb-6">{srv.desc}</p>
                <div className="space-y-2 border-t border-[#E9DCC8] pt-4">
                  <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider block mb-2">
                    Key Deliverables
                  </span>
                  {srv.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#61758A]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={onOpenLetsTalk}
                  className="w-full py-2.5 rounded-full border border-[#E9DCC8] hover:border-[#D98218] text-xs font-bold text-[#102A43] hover:text-[#D98218] hover:bg-[#FFF3DF]/50 transition-all cursor-pointer"
                >
                  Request Consultation →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Education Hub Page
  if (page === 'education') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
            EDUCATION HUB
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43] tracking-tight">
            Guides, Tutorials & <span className="text-[#D98218]">File Best Practices</span>
          </h1>
          <p className="text-base sm:text-lg text-[#61758A] leading-relaxed">
            Master file workflows, optimize media compression ratios, and explore developer tutorials curated by Codemaniac Studio engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'How to Compress Large PDFs Without Quality Loss',
              category: 'PDF Guide',
              time: '4 min read',
              desc: 'Learn the difference between vector font subsetting, image downsampling, and stream compression.',
            },
            {
              title: 'Next-Gen Image Formats: WEBP vs AVIF vs PNG',
              category: 'Media Optimization',
              time: '6 min read',
              desc: 'A benchmark comparison of image codecs across mobile web browsers and desktop platforms.',
            },
            {
              title: 'Understanding File Hashes: MD5, SHA-1 and SHA-256',
              category: 'Security & Integrity',
              time: '5 min read',
              desc: 'How checksums verify file integrity and prevent corruption during bulk file transmissions.',
            },
            {
              title: 'Converting Video for Web: The Ultimate Bitrate Formula',
              category: 'Video Encoding',
              time: '8 min read',
              desc: 'Calculate optimal H.264 / VP9 bitrates for fast web loading and crystal-clear visual clarity.',
            },
            {
              title: 'Safe Password Practices for Modern Developers',
              category: 'Security Best Practices',
              time: '3 min read',
              desc: 'Entropy calculation, salt generation, and why length always outperforms complexity.',
            },
            {
              title: 'JSON Formatting: Linting, Schemas and Pretty-Print',
              category: 'Developer Utilities',
              time: '4 min read',
              desc: 'Automating schema validation and catching subtle formatting syntax mistakes before runtime.',
            },
          ].map((guide, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-[#E9DCC8] shadow-[0_4px_20px_rgba(217,130,24,0.06)] hover:border-[#D98218] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#61758A] mb-3">
                  <span className="font-bold text-[#D98218]">{guide.category}</span>
                  <span>{guide.time}</span>
                </div>
                <h3 className="text-lg font-bold text-[#102A43] mb-2 hover:text-[#D98218] transition-colors cursor-pointer">
                  {guide.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#61758A] leading-relaxed">
                  {guide.desc}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E9DCC8]">
                <button
                  onClick={onOpenLetsTalk}
                  className="text-xs font-bold text-[#D98218] flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Full Tutorial →</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // About Us Page
  if (page === 'about') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
            ABOUT US
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43] tracking-tight">
            Ideas. Innovation. <span className="text-[#D98218]">Impact.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#61758A] leading-relaxed">
            Codemaniac Studio is a technology craft house based in Surat, Gujarat, India.
            We build high-speed, beautiful, and secure online tools that make digital life effortless.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { val: '72+', label: 'Online Tools Created' },
            { val: '10K+', label: 'Active Monthly Users' },
            { val: '100%', label: 'Zero-Log Privacy' },
            { val: 'Surat', label: 'Crafted in Gujarat, India' },
          ].map((st, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-[#E9DCC8] text-center shadow-sm"
            >
              <div className="text-3xl sm:text-4xl font-black text-[#D98218]">{st.val}</div>
              <div className="text-xs sm:text-sm font-bold text-[#102A43] mt-2">{st.label}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-[#E9DCC8] shadow-sm space-y-4">
            <h3 className="text-2xl font-bold text-[#102A43]">Our Mission</h3>
            <p className="text-sm text-[#61758A] leading-relaxed">
              Every day, millions of creators, developers, students, and professionals struggle
              with slow, clunky, ad-infested file conversion tools. Our mission is simple: provide
              lightning-fast, clean, beautiful, and private tools that work instantly without installations
              or arbitrary paywalls.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-[#E9DCC8] shadow-sm space-y-4">
            <h3 className="text-2xl font-bold text-[#102A43]">Our Core Values</h3>
            <p className="text-sm text-[#61758A] leading-relaxed">
              Security by default. We never retain your private files or sell data to third parties.
              All operations execute either directly inside your browser sandbox or through ephemeral,
              encrypted RAM workers that destroy payloads immediately upon completion.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Blog Page
  if (page === 'blog') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
            OUR BLOG
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43] tracking-tight">
            Stories, Engineering & <span className="text-[#D98218]">Product Updates</span>
          </h1>
          <p className="text-base sm:text-lg text-[#61758A] leading-relaxed">
            Read the latest technical write-ups and product announcements from the Codemaniac Studio team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Announcing 72 Powerful Tools: The 2026 Codemaniac Release',
              author: 'Codemaniac Team',
              date: 'October 2026',
              desc: 'Today marks our largest expansion: 15 PDF tools, 14 Image tools, 12 Video tools, 7 Audio tools, 14 Utility tools, and 10 upcoming AI tools.',
            },
            {
              title: 'Why We Designed Codemaniac Studio with Cream and Warm Amber',
              author: 'Design Systems',
              date: 'September 2026',
              desc: 'Ditching sterile dark neon tropes in favor of an inviting, human, and professional productivity workspace.',
            },
            {
              title: 'Sneak Peek: What Our Upcoming AI Tools Will Enable',
              author: 'AI Research Group',
              date: 'August 2026',
              desc: 'From one-click document analysis to intelligent background extraction without artifact haloes.',
            },
          ].map((post, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-7 border border-[#E9DCC8] shadow-sm hover:border-[#D98218] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 text-xs text-[#61758A] mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {post.date}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {post.author}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#102A43] mb-3 hover:text-[#D98218] transition-colors cursor-pointer">
                  {post.title}
                </h3>
                <p className="text-sm text-[#61758A] leading-relaxed">{post.desc}</p>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E9DCC8]">
                <button
                  onClick={onOpenLetsTalk}
                  className="text-xs font-bold text-[#D98218] flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Contact Page
  if (page === 'contact') {
    return <ContactPageContent />;
  }

  // Privacy Policy Page
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="text-center space-y-3">
        <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
          LEGAL & TRUST
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#61758A]">Last Updated: October 2026 · Codemaniac Studio</p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E9DCC8] shadow-sm space-y-8 text-sm text-[#61758A] leading-relaxed">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold text-[#102A43]">
            <Lock className="w-5 h-5 text-[#D98218]" />
            <h2>1. Zero-Retention File Processing</h2>
          </div>
          <p>
            At Codemaniac Studio, we believe your documents, photos, audio, and video files belong
            strictly to you. Our utility tools (such as QR generators, password generators, word counters,
            and JSON formatters) run 100% locally in your browser memory without uploading any data to any server.
          </p>
          <p>
            When utilizing cloud-assisted media conversion, files are streamed directly into ephemeral memory,
            processed instantaneously, and wiped automatically within 60 minutes or immediately upon download.
            We never store, inspect, copy, or index your private content.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold text-[#102A43]">
            <Shield className="w-5 h-5 text-[#D98218]" />
            <h2>2. Information We Collect</h2>
          </div>
          <p>
            We do not require user accounts for standard tool usage. We collect minimal aggregate telemetry
            strictly to ensure server availability, monitor bandwidth performance, and prevent automated abuse.
            No personally identifiable information (PII) is sold, traded, or shared with third-party advertisers.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-bold text-[#102A43]">
            <Mail className="w-5 h-5 text-[#D98218]" />
            <h2>3. Contacting Our Data Protection Officer</h2>
          </div>
          <p>
            If you have questions regarding data privacy or security invariants at Codemaniac Studio, please reach out to:
          </p>
          <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E9DCC8] text-xs font-mono text-[#102A43]">
            Codemaniac Studio Security Team <br />
            Surat, Gujarat, India <br />
            Email: privacy@codemaniacstudio.com
          </div>
        </section>
      </div>
    </div>
  );
};

const ContactPageContent: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FFF3DF] text-[#D98218] border border-[#E9DCC8]">
          CONTACT US
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#102A43] tracking-tight">
          We'd Love to <span className="text-[#D98218]">Hear From You</span>
        </h1>
        <p className="text-base sm:text-lg text-[#61758A] leading-relaxed">
          Have an idea for a new tool, need API access, or want custom software built? Our team in Surat is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-7 border border-[#E9DCC8] shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-[#102A43]">Headquarters</h3>

            <div className="space-y-4 text-sm text-[#61758A]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D98218] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#102A43]">Codemaniac Studio</div>
                  <span>Surat, Gujarat, India</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D98218] shrink-0" />
                <a href="mailto:hello@codemaniacstudio.com" className="hover:text-[#D98218]">
                  hello@codemaniacstudio.com
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#D98218] shrink-0" />
                <a href="tel:+919876543210" className="hover:text-[#D98218]">
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#FFF3DF] to-[#FAF5EC] rounded-3xl p-7 border border-[#E9DCC8] space-y-2">
            <h4 className="text-base font-bold text-[#102A43]">Operating Hours</h4>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Monday – Saturday: 9:00 AM – 7:00 PM IST <br />
              Online Tools & Cloud Workers: 24/7/365 Available
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 sm:p-10 border border-[#E9DCC8] shadow-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#102A43]">
                Thank You for Getting in Touch!
              </h3>
              <p className="text-sm text-[#61758A] max-w-md mx-auto">
                Your message has been dispatched to our engineering desk. Expect a response within 1 business day.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-full bg-[#D98218] text-white text-xs font-bold hover:bg-[#C66A08] transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
                try {
                  confetti({ particleCount: 40, spread: 60 });
                } catch {
                  // ignore
                }
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hardik Kabra"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#102A43] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="hdkabra96@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Inquiry regarding Codemaniac Studio tools"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what you are looking to achieve..."
                  className="w-full p-4 rounded-xl border border-[#E9DCC8] text-sm text-[#102A43] bg-white focus:outline-none focus:border-[#D98218]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#D98218] to-[#C66A08] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Send Inquiry</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
