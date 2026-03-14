import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslationText } from '@/hooks/useTranslationText';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface VoiceMicProps {
  fieldKey: string;
  onResult: (value: string) => void;
  className?: string;
}

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
};

export function VoiceMic({ fieldKey, onResult, className }: VoiceMicProps) {
  const { isSupported, listen } = useVoiceInput();
  const { i18n } = useTranslationText();
  const [isListening, setIsListening] = useState(false);

  if (!isSupported) return null;

  const currentLang = LANG_MAP[i18n.language] || 'en-IN';

  const handleToggleVoice = () => {
    if (isListening) return; // SpeechRecognition usually stops automatically, but we guard

    listen(
      fieldKey,
      currentLang,
      (val) => {
        onResult(val);
        setIsListening(false);
      },
      (err) => {
        toast.error(err);
        setIsListening(false);
      },
      (listening) => setIsListening(listening)
    );
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggleVoice}
      className={`h-8 w-8 rounded-full transition-all flex items-center justify-center shrink-0 ${
        isListening 
          ? 'text-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse' 
          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
      } ${className}`}
      title="Voice Input"
    >
      {isListening ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
