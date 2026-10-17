import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleTriggerInstall = () => {
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    const timer = setTimeout(() => {
      if (!isInstalled && !localStorage.getItem('pwa_banner_dismissed') && !localStorage.getItem('pwa_installed')) {
        setShowBanner(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
      clearTimeout(timer);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa_installed', 'true');
      }
      setDeferredPrompt(null);
    } else {
      alert(
        "To install StaffPulse on your device:\n\n• On Mobile (iOS/Android): Tap your browser menu (3 dots or Share icon) and select 'Add to Home Screen' or 'Install App'.\n• On Desktop (Chrome/Edge): Click the install icon in the right side of the address bar."
      );
    }
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shrink-0 shadow-inner">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>App Install Available</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Install StaffPulse App
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Install StaffPulse for instant offline access, home screen shortcut, and a full-screen native app experience.
          </p>

          <div className="flex items-center gap-2.5 mt-3">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Install Now</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
