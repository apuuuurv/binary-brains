import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence, cubicBezier } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight, ArrowLeft, Play, ChevronDown, Leaf,
  UserCheck, FileSearch, ScanFace, Sparkles, MessageSquare, Bell,
  Clock, Eye, FileX, Star, ShieldCheck, Upload, Bot,
  Building2, MapPin, Wheat, Coins, Droplets, IndianRupee, CreditCard, LandPlot,
  CheckCircle2,
} from 'lucide-react';

// ── Shared animation variants (mirror LandingPage style) ─────────────────────

const easeCustom = cubicBezier(0.22, 1, 0.36, 1);

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeCustom } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ── Section Label ─────────────────────────────────────────────────────────────

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="mb-4 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-semibold rounded-full">
      {children}
    </Badge>
  );
}

// ── Reusable Section Heading ──────────────────────────────────────────────────

function SectionHeading({ badge, title, subtitle }: { badge: string; title: string; subtitle?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className="text-center mb-14"
    >
      <motion.div variants={fadeUp}><SectionBadge>{badge}</SectionBadge></motion.div>
      <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-slate-900 dark:text-white mb-4">
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}

// ── FAQ Item (same pattern as LandingPage) ────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${open ? '' : 'hover:border-emerald-300 dark:hover:border-emerald-700'}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────

const schemes = [
  { icon: <Building2 className="h-6 w-6" />, accent: 'emerald', title: 'Central Government Schemes', desc: 'Access national programs like PM-Kisan, PMFBY, and soil health cards that provide direct income support and crop protection to all registered farmers.' },
  { icon: <MapPin className="h-6 w-6" />, accent: 'blue', title: 'State Government Schemes', desc: 'State-specific agricultural subsidies, bonus schemes, and welfare programs tailored to the crops, soil, and economic conditions of each region.' },
  { icon: <Wheat className="h-6 w-6" />, accent: 'amber', title: 'Crop Insurance Schemes', desc: 'Pradhan Mantri Fasal Bima Yojana and weather-based insurance plans that protect your investment against natural calamities, pests, and diseases.' },
  { icon: <Coins className="h-6 w-6" />, accent: 'violet', title: 'Subsidy Programs', desc: 'Input subsidies on seeds, fertilisers, pesticides, and farm machinery help reduce production costs and improve net income for small farmers.' },
  { icon: <Droplets className="h-6 w-6" />, accent: 'teal', title: 'Irrigation Schemes', desc: 'PMKSY and state irrigation grants fund drip/sprinkler systems, check dams, and water conservation structures to ensure year-round water access.' },
  { icon: <IndianRupee className="h-6 w-6" />, accent: 'rose', title: 'PM-Kisan Benefits', desc: 'Receive ₹6,000 per year in three instalments under PM-Kisan directly into your bank account. Our platform verifies eligibility automatically.' },
  { icon: <CreditCard className="h-6 w-6" />, accent: 'emerald', title: 'Loan Assistance Programs', desc: 'Kisan Credit Card (KCC), interest subvention schemes, and emergency credit funds to support short-term and long-term agricultural financing needs.' },
  { icon: <LandPlot className="h-6 w-6" />, accent: 'blue', title: 'Land-Related Benefits', desc: 'Soil health missions, land levelling grants, and digitised land record integrations help secure land ownership and improve soil productivity.' },
];

const accentMap: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'group-hover:border-emerald-500/40' },
  blue:    { bg: 'bg-blue-500/10 dark:bg-blue-500/15',       text: 'text-blue-600 dark:text-blue-400',       border: 'group-hover:border-blue-500/40' },
  amber:   { bg: 'bg-amber-500/10 dark:bg-amber-500/15',     text: 'text-amber-600 dark:text-amber-400',     border: 'group-hover:border-amber-500/40' },
  violet:  { bg: 'bg-violet-500/10 dark:bg-violet-500/15',   text: 'text-violet-600 dark:text-violet-400',   border: 'group-hover:border-violet-500/40' },
  teal:    { bg: 'bg-teal-500/10 dark:bg-teal-500/15',       text: 'text-teal-600 dark:text-teal-400',       border: 'group-hover:border-teal-500/40' },
  rose:    { bg: 'bg-rose-500/10 dark:bg-rose-500/15',       text: 'text-rose-600 dark:text-rose-400',       border: 'group-hover:border-rose-500/40' },
};

const steps = [
  {
    icon: <UserCheck className="h-6 w-6" />,
    title: 'Registration & Profile Setup',
    desc: 'Create your account with basic personal details. Set up your farmer profile including crop type, land size, and state to unlock personalised recommendations.',
  },
  {
    icon: <FileSearch className="h-6 w-6" />,
    title: 'Aadhaar, PAN & Land Document Verification',
    desc: 'Securely upload your Aadhaar, PAN card, and land ownership documents. Our system validates them instantly to establish your verified farmer identity.',
  },
  {
    icon: <ScanFace className="h-6 w-6" />,
    title: 'Face Recognition for Secure Identity',
    desc: 'A quick in-app selfie captures your biometric signature. Face recognition ensures only the registered farmer can access and apply for schemes.',
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'AI-Based Scheme Recommendation',
    desc: 'Our AI engine cross-references your profile with 1,200+ government schemes to surface only the ones you are genuinely eligible for — ranked by benefit value.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Chatbot Assistance for Queries',
    desc: 'Our multilingual AI chatbot answers questions about schemes, document requirements, application deadlines, and eligibility criteria in your language.',
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: 'Real-Time Updates & Tracking',
    desc: 'Track your scheme applications in real time. Get instant notifications on approvals, disbursements, and new schemes that match your farmer profile.',
  },
];

const benefits = [
  { icon: <Clock className="h-6 w-6" />,       title: 'Saves Significant Time',              desc: 'No more standing in queues or visiting multiple offices. Find, verify, and apply for schemes from anywhere on your phone within minutes.' },
  { icon: <Eye className="h-6 w-6" />,          title: 'Full Eligibility Transparency',       desc: 'See exactly why you qualify or don\'t qualify for each scheme. Every recommendation is backed by a clear eligibility breakdown.' },
  { icon: <FileX className="h-6 w-6" />,        title: 'Reduced Paperwork Confusion',         desc: 'Our guided document checklist tells you exactly what to upload. No more rejected applications due to missing or incorrect documents.' },
  { icon: <Star className="h-6 w-6" />,         title: 'Personalised Recommendations',        desc: 'Schemes are matched to your specific land size, crop, state, income, and family details — not generic lists that waste your time.' },
  { icon: <ShieldCheck className="h-6 w-6" />,  title: 'Secure Digital Identity',             desc: 'Biometric face recognition and government-grade document verification ensure your identity and benefits are protected from fraud.' },
  { icon: <Upload className="h-6 w-6" />,       title: 'Easy Document Upload & Validation',   desc: 'Upload once, use everywhere. Your verified documents are stored securely and auto-attached to scheme applications you choose to submit.' },
  { icon: <Bot className="h-6 w-6" />,          title: 'AI Assistance in Simple Language',    desc: 'Complex scheme rules are translated into simple, clear language by our AI. Get answers in Hindi, English, or your regional language.' },
];

const faqs = [
  {
    q: 'Is my personal data safe on this platform?',
    a: 'Yes. All data is encrypted end-to-end. Aadhaar and PAN details are validated through government APIs and never stored in plain text. Face biometrics are hashed and stored only on our secure servers.',
  },
  {
    q: 'Do I need a smartphone to use Agrisense?',
    a: 'You need a device with a front-facing camera for face verification, but the web app is fully responsive and works on any modern smartphone browser — no separate app download required.',
  },
  {
    q: 'How accurate are the AI scheme recommendations?',
    a: 'Our AI is trained on the latest official government databases and achieves over 95% eligibility prediction accuracy. Recommendations are updated daily as new schemes are announced.',
  },
  {
    q: 'Can I apply for schemes directly from the platform?',
    a: 'Yes. For integrated schemes you can submit your application directly. For others, we provide a direct link to the official portal pre-filled with your verified details to speed up the process.',
  },
  {
    q: 'Which languages does the platform support?',
    a: 'Currently Hindi, English, Marathi, Telugu, Tamil, Kannada, and Bengali are supported. More regional languages are being added based on farmer community feedback.',
  },
];

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function WatchDemo() {
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a0f] font-sans text-slate-900 dark:text-slate-50 overflow-x-hidden transition-colors duration-300">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 z-0 bg-white dark:bg-[#060a0f]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-emerald-50/30 to-slate-50 dark:from-transparent dark:via-[#060a0f]/30 dark:to-[#060a0f]" />
        </div>
        {/* Grid texture */}
        <div
          className="absolute inset-0 z-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#10b981 1px,transparent 1px),linear-gradient(90deg,#10b981 1px,transparent 1px)', backgroundSize: '60px 60px' }}
        />
        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/8 dark:bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none z-0" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <Badge className="px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-500/30 text-xs font-semibold">
              <Leaf className="h-3.5 w-3.5 mr-1.5 inline-block" />
              Platform Walkthrough
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-slate-900 dark:text-white mb-6 leading-[1.05]"
          >
            See How Our Platform{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 italic">
              Empowers
            </span>{' '}
            Farmers
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            A complete, AI-driven platform that connects Indian farmers to the government schemes they deserve — with zero paperwork confusion and full eligibility transparency.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link to="/auth">
              <Button className="h-12 px-8 text-base bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl group transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-105">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="h-12 px-8 text-base font-semibold border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 dark:hover:border-emerald-600 rounded-xl bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </motion.div>

          {/* Video placeholder */}
          <motion.div
            variants={fadeUp}
            className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/60 dark:shadow-black/60 bg-gradient-to-br from-slate-900 to-emerald-950 aspect-video flex items-center justify-center"
          >
            {/* Decorative glows inside video */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 blur-3xl rounded-full pointer-events-none" />

            {!videoPlaying ? (
              <div className="relative z-10 flex flex-col items-center gap-5">
                {/* Animated ring */}
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full bg-emerald-400/30 blur-sm"
                  />
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="relative h-20 w-20 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110 group"
                    aria-label="Play demo video"
                  >
                    <Play className="h-8 w-8 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">Watch the Full Demo</p>
                  <p className="text-emerald-300/70 text-sm mt-1">3 minutes · See the complete farmer journey</p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-4 w-full h-full p-8">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                <p className="text-white font-bold text-xl">Demo Video Coming Soon!</p>
                <p className="text-emerald-300/70 text-sm text-center max-w-xs">
                  Full video demo will be embedded here. In the meantime, scroll through the sections below to explore every feature.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVideoPlaying(false)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
              </div>
            )}

            {/* Progress-style bottom bar for aesthetic */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5">
              <motion.div
                animate={{ width: ['0%', '65%'] }}
                transition={{ duration: 3, ease: 'easeOut', repeat: Infinity, repeatDelay: 4 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── SCHEMES SUPPORTED ───────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            badge="Scheme Coverage"
            title="Every Type of Scheme, in One Place"
            subtitle="We aggregate 1,200+ active government schemes across 8 major categories — so no eligible farmer misses out."
          />

          <SchemeGrid />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-slate-50 dark:bg-[#060a0f]">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="How It Works"
            title="Your Complete Farmer Journey"
            subtitle="From sign-up to scheme disbursement — 6 simple steps that take less than 10 minutes."
          />

          <StepsSection />
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            badge="Why Agrisense"
            title="Built to Truly Benefit Farmers"
            subtitle="Every feature is designed with one goal: making access to government support simple, fair, and fast."
          />

          <BenefitsGrid />
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-slate-50 dark:bg-[#060a0f]">
        <div className="max-w-2xl mx-auto">
          <SectionHeading
            badge="Common Questions"
            title="Farmer FAQs"
          />

          <FAQList />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: easeCustom }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-12 md:p-20 text-center shadow-2xl"
          >
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-400/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <Badge className="mb-6 px-3 py-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-semibold rounded-full">
                Start For Free
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-[-0.03em] text-white mb-5 leading-tight">
                Ready to Claim What{' '}
                <span className="text-emerald-400">You Deserve?</span>
              </h2>
              <p className="text-emerald-200/70 mb-10 max-w-lg mx-auto leading-relaxed">
                Join over 10,000 farmers who are already using Agrisense to find schemes, verify eligibility, and receive direct government benefits.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/auth">
                  <Button className="h-14 px-10 text-base bg-white hover:bg-emerald-50 text-emerald-900 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all group">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="h-14 px-10 text-base font-semibold border-white/20 text-white hover:bg-white/10 rounded-2xl">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#060a0f]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-base tracking-[-0.04em] text-emerald-900 dark:text-white">AGRISENSE</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © 2025 Agrisense. Empowering farmers with AI-driven scheme access.
          </p>
          <Link to="/" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            ← Return to Landing Page
          </Link>
        </div>
      </footer>
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function SchemeGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {schemes.map((scheme, idx) => {
        const accent = accentMap[scheme.accent];
        return (
          <motion.div key={idx} variants={fadeUp}>
            <Card className={`group h-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-none hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/40 hover:-translate-y-1.5 transition-all duration-400 rounded-2xl ${accent.border}`}>
              <CardHeader className="pb-3">
                <div className={`${accent.bg} w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${accent.text} group-hover:scale-110 transition-transform duration-300`}>
                  {scheme.icon}
                </div>
                <CardTitle className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                  {scheme.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{scheme.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function StepsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className="relative">
      {/* Vertical connector on desktop */}
      <div className="hidden lg:block absolute left-[39px] top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-emerald-300/50 dark:via-emerald-700/40 to-transparent" />

      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={stagger}
        className="flex flex-col gap-8"
      >
        {steps.map((step, i) => (
          <motion.div key={i} variants={fadeUp} className="flex gap-6 lg:gap-10 items-start">
            {/* Number + icon bubble */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border border-emerald-200/60 dark:border-emerald-700/30 flex items-center justify-center shadow-sm text-emerald-600 dark:text-emerald-400">
                {step.icon}
              </div>
              <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-black">{i + 1}</span>
              </div>
            </div>
            {/* Content */}
            <div className="pt-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-2">{step.title}</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-xl">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function BenefitsGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      {benefits.map((b, i) => (
        <motion.div key={i} variants={fadeUp}>
          <div className="h-full p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100/80 dark:hover:shadow-black/30 transition-all duration-300 group">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              {b.icon}
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-sm leading-snug">{b.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{b.desc}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function FAQList() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className="divide-y divide-slate-200 dark:divide-slate-800"
    >
      {faqs.map((faq, i) => (
        <FAQItem key={i} q={faq.q} a={faq.a} />
      ))}
    </motion.div>
  );
}
