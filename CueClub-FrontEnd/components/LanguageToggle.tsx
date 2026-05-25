'use client';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import '@/lib/i18n';

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('cueclub_language');
    if (savedLang) {
      i18n.changeLanguage(savedLang);
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const langs = ['en', 'fr', 'ar'];
    const currentIndex = langs.indexOf(i18n.language) !== -1 ? langs.indexOf(i18n.language) : 0;
    const newLang = langs[(currentIndex + 1) % langs.length];
    
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('cueclub_language', newLang);
  };

  if (!mounted) return null;

  return (
    <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-full hover:bg-white/5 transition-colors" title="Toggle Language">
      <div className="flex flex-col items-center justify-center">
        <Globe size={16} />
        <span className="text-[8px] font-black uppercase mt-0.5">{i18n.language}</span>
      </div>
    </Button>
  );
}
