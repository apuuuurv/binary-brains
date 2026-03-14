import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ClipboardList,
  BookOpen,
  Search,
} from 'lucide-react';

interface SchemeApplyModalProps {
  scheme: any | null;
  onClose: () => void;
}

/** Default documents for schemes that have none stored (fallback). */
const DEFAULT_DOCUMENTS = [
  'Aadhaar Card (mandatory)',
  'Land Records / 7-12 Extract',
  'Bank Passbook linked to Aadhaar',
  'Mobile Number linked to Aadhaar',
];

/** Default application process steps for fallback. */
const getDefaultSteps = (schemeName: string, applyUrl: string): string[] => {
  const portalHost = applyUrl?.startsWith('http')
    ? new URL(applyUrl).hostname
    : 'myscheme.gov.in';
  return [
    `Open the official portal: ${portalHost}`,
    `Search for "${schemeName}" in the search bar`,
    'Click on the scheme card and read the eligibility criteria',
    'Click "Apply Now" on the scheme page',
    'Login / register using your Aadhaar and complete the application form',
    'Note your Application Reference Number for future tracking',
  ];
};

export default function SchemeApplyModal({ scheme, onClose }: SchemeApplyModalProps) {
  if (!scheme) return null;

  const documents: string[] =
    Array.isArray(scheme.documents_required) && scheme.documents_required.length > 0
      ? scheme.documents_required
      : DEFAULT_DOCUMENTS;

  const steps: string[] =
    Array.isArray(scheme.application_process) && scheme.application_process.length > 0
      ? scheme.application_process
      : getDefaultSteps(scheme.scheme_name || scheme.name || '', scheme.apply_url || scheme.source_url || '');

  const applyUrl: string =
    scheme.apply_url?.startsWith('http')
      ? scheme.apply_url
      : scheme.source_url?.startsWith('http')
      ? scheme.source_url
      : `https://www.myscheme.gov.in/search?q=${encodeURIComponent(scheme.scheme_name || '')}`;

  const portalName = applyUrl.startsWith('http') ? new URL(applyUrl).hostname : 'Official Portal';
  const matchPct = scheme.success_probability != null
    ? Math.round(scheme.success_probability * 100)
    : null;

  const handleProceed = () => {
    // Note: noreferrer excluded intentionally to allow SPA route hydration
    const tab = window.open(applyUrl, '_blank', 'noopener');
    if (!tab) window.location.href = applyUrl;
    onClose();
  };

  return (
    <Dialog open={!!scheme} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-0 gap-0">

        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-950 z-10 rounded-t-3xl">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-2xl shrink-0">
              <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <DialogTitle className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {scheme.scheme_name || scheme.name}
                </DialogTitle>
                {matchPct != null && (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border-none text-[10px] font-bold shrink-0">
                    {matchPct}% Match
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Portal: <span className="font-medium text-emerald-600 dark:text-emerald-400">{portalName}</span>
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">

          {/* ── Documents Required ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl">
                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">
                Documents Required
              </h3>
              <Badge variant="secondary" className="text-[10px] bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                Keep these ready
              </Badge>
            </div>
            <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 space-y-2.5">
              {documents.map((doc, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 + idx * 0.04 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{doc}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── Application Process ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
                <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">
                Application Process
              </h3>
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                Step by step
              </Badge>
            </div>
            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + idx * 0.05 }}
                  className="flex items-start gap-3 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm"
                >
                  <div className="bg-emerald-600 text-white text-[11px] font-black rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-emerald-500/30">
                    {idx + 1}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ── Search tip for myscheme.gov.in ── */}
          {applyUrl.includes('myscheme.gov.in') && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-start gap-3"
            >
              <Search className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-bold">Tip:</span> Once on myscheme.gov.in, search for{' '}
                <span className="font-semibold">"{scheme.scheme_name || scheme.name}"</span> in the search bar
                to land directly on this scheme's application page.
              </p>
            </motion.div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className="px-6 pb-6 pt-2 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-950">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
          >
            Close
          </Button>
          <Button
            onClick={handleProceed}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:shadow-emerald-500/30 hover:scale-[1.02]"
          >
            Proceed to Apply
            <ArrowRight className="ml-2 h-4 w-4" />
            <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
