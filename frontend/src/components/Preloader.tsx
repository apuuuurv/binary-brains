import { useState, useEffect } from 'react';
import { motion, AnimatePresence, cubicBezier, type Variants } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useTheme } from './theme-provider';

// ─── Minimum visible duration (ms) ───────────────────────────────────────────
const MIN_DISPLAY_MS = 2600;

// ─── CSS keyframes injected once via a style tag ──────────────────────────────
const KEYFRAMES_CSS = `
@keyframes ag-streak {
  0%   { transform: translateX(-160%) rotate(-15deg); opacity: 0; }
  15%  { opacity: 0.9; }
  85%  { opacity: 0.6; }
  100% { transform: translateX(260%) rotate(-15deg); opacity: 0; }
}
@keyframes ag-streak2 {
  0%   { transform: translateX(-160%) rotate(-8deg); opacity: 0; }
  20%  { opacity: 0.6; }
  80%  { opacity: 0.4; }
  100% { transform: translateX(260%) rotate(-8deg); opacity: 0; }
}
@keyframes ag-ring {
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes ag-glow-pulse {
  0%, 100% { box-shadow: 0 0 28px 6px rgba(16,185,129,0.35), 0 0 60px 20px rgba(16,185,129,0.12); }
  50%       { box-shadow: 0 0 48px 16px rgba(16,185,129,0.55), 0 0 100px 40px rgba(16,185,129,0.18); }
}
@keyframes ag-float {
  0%, 100% { transform: translate(0px, 0px); }
  33%      { transform: translate(40px, -30px); }
  66%      { transform: translate(-30px, 20px); }
}
@keyframes ag-logo-glow {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(16,185,129,0.6)); }
  50%       { filter: drop-shadow(0 0 22px rgba(52,211,153,0.9)); }
}
@keyframes ag-shimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
`;

// ─── Word-stagger text reveal ─────────────────────────────────────────────────
const TEAM_WORDS = ['Developed', 'by', 'Team', 'Binary', 'Brains'];

const easeOut = cubicBezier(0.22, 1, 0.36, 1);

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 1.1 + i * 0.13, duration: 0.45, ease: easeOut },
  }),
};

// ─── Preloader Component ──────────────────────────────────────────────────────

interface PreloaderProps {
  onDone: () => void;
}

export function Preloader({ onDone }: PreloaderProps) {
  const [visible, setVisible] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById('ag-preloader-styles')) return;
    const style = document.createElement('style');
    style.id = 'ag-preloader-styles';
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
    return () => {
      // Leave the style tag — it's tiny and harmless after unmount
    };
  }, []);

  // Prevent scroll while preloader is visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Start exit after minimum display time
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), MIN_DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="ag-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
          style={{ willChange: 'opacity, transform' }}
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none
            ${isDark ? 'bg-[#060a0f]' : 'bg-slate-50'}`}
        >
          {/* ── Animated background orbs ───────────────────────────────── */}
          <div
            className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
              animation: 'ag-float 7s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
              animation: 'ag-float 9s ease-in-out infinite reverse',
              animationDelay: '2s',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 65%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)',
            }}
          />

          {/* ── light grid texture ──────────────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(rgba(16,185,129,1) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,1) 1px,transparent 1px)'
                : 'linear-gradient(rgba(16,185,129,1) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,1) 1px,transparent 1px)',
              backgroundSize: '60px 60px',
              opacity: isDark ? 0.025 : 0.03,
            }}
          />

          {/* ── Light streaks ───────────────────────────────────────────── */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
          >
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: 0,
                width: '60%',
                height: '1.5px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), rgba(16,185,129,0.9), rgba(52,211,153,0.6), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(16,185,129,0.55), rgba(16,185,129,0.3), transparent)',
                animation: 'ag-streak 2.8s ease-in-out 0.3s both',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '62%',
                left: 0,
                width: '45%',
                height: '1px',
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(52,211,153,0.4), rgba(16,185,129,0.7), rgba(52,211,153,0.4), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), rgba(16,185,129,0.4), rgba(16,185,129,0.2), transparent)',
                animation: 'ag-streak2 3.2s ease-in-out 0.6s both',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '45%',
                right: 0,
                width: '50%',
                height: '1px',
                background: isDark
                  ? 'linear-gradient(270deg, transparent, rgba(52,211,153,0.5), rgba(16,185,129,0.8), rgba(52,211,153,0.5), transparent)'
                  : 'linear-gradient(270deg, transparent, rgba(16,185,129,0.25), rgba(16,185,129,0.45), rgba(16,185,129,0.25), transparent)',
                animation: 'ag-streak 3.5s ease-in-out 1.0s both',
              }}
            />
          </div>

          {/* ── Logo + rings container ──────────────────────────────────── */}
          <div className="relative flex flex-col items-center gap-8 z-10">

            {/* Concentric glow rings */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-0 m-auto rounded-full pointer-events-none"
                style={{
                  width: 100,
                  height: 100,
                  border: `1px solid ${isDark ? 'rgba(52,211,153,0.4)' : 'rgba(16,185,129,0.3)'}`,
                  animation: `ag-ring 2.4s ease-out ${i * 0.7}s infinite`,
                }}
              />
            ))}

            {/* Logo card */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, filter: 'blur(12px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <div
                className={`relative flex items-center justify-center w-24 h-24 rounded-3xl
                  ${isDark ? 'bg-emerald-950/80' : 'bg-white'}
                  border ${isDark ? 'border-emerald-700/40' : 'border-emerald-200'}`}
                style={{
                  animation: 'ag-glow-pulse 2.2s ease-in-out infinite',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {/* Shimmer sweep across logo */}
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(52,211,153,0.18) 50%, transparent 60%)',
                    backgroundSize: '300% 100%',
                    animation: 'ag-shimmer 2.5s linear 0.5s infinite',
                  }}
                />
                <div
                  style={{ animation: 'ag-logo-glow 2.2s ease-in-out infinite' }}
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-3 rounded-2xl shadow-xl shadow-emerald-500/30">
                    <Leaf className="h-9 w-9 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AGRISENSE wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {/* Product name shimmer text */}
              <div
                className={`text-4xl md:text-5xl font-black tracking-[-0.05em] leading-none
                  ${isDark ? 'text-white' : 'text-slate-900'}`}
                style={{
                  background: isDark
                    ? 'linear-gradient(105deg, #fff 30%, #6ee7b7 50%, #fff 70%)'
                    : 'linear-gradient(105deg, #0f172a 30%, #10b981 50%, #0f172a 70%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '250% 100%',
                  animation: 'ag-shimmer 3s linear 0.8s infinite',
                }}
              >
                AGRISENSE
              </div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className={`mt-2 text-sm font-medium tracking-widest uppercase
                  ${isDark ? 'text-emerald-400/70' : 'text-emerald-600/70'}`}
              >
                Farmer Assistance Platform
              </motion.p>
            </motion.div>

            {/* "Developed by Team Binary Brains" word-stagger */}
            <motion.div
              className="flex flex-wrap justify-center gap-x-[0.4em] gap-y-1"
              aria-label="Developed by Team Binary Brains"
            >
              {TEAM_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className={`text-sm font-semibold ${
                    word === 'Binary' || word === 'Brains'
                      ? isDark
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.div>

          </div>

          {/* ── Progress bar ────────────────────────────────────────────── */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-[3px]
              ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
          >
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: MIN_DISPLAY_MS / 1000 - 0.3, ease: [0.34, 1, 0.64, 1], delay: 0.2 }}
              style={{ willChange: 'transform' }}
              className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-500 origin-left"
            />
          </div>

          {/* ── Bottom corner dots for aesthetics ──────────────────────── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.4, 1] }}
                transition={{ duration: 1.2, delay: 1.4 + delay, repeat: Infinity, repeatDelay: 0.4 }}
                className={`w-1.5 h-1.5 rounded-full ${
                  isDark ? 'bg-emerald-500/60' : 'bg-emerald-500/50'
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
