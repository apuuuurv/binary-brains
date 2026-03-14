import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Leaf, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { useTranslationText } from '@/hooks/useTranslationText';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function Navbar() {
    const { theme, setTheme } = useTheme();
    const { t } = useTranslationText();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');
            setIsLoggedIn(!!token);

            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    setUserRole(payload.role || 'farmer');
                } catch (e) {
                    console.error("Token decoding failed", e);
                    setUserRole(null);
                }
            } else {
                setUserRole(null);
            }
        };
        checkAuth(); // Initial check on mount/location change

        // Listen for storage changes (works across tabs)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [location]);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 pointer-events-none ${isScrolled
                ? 'bg-white/80 dark:bg-[#060a0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-transparent border-b border-transparent'
                }`}
        >
            <motion.div
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-7xl mx-auto flex items-center justify-between px-5 h-20 pointer-events-auto"
            >
                <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-1.5 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
                        <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-[-0.04em] text-emerald-900 dark:text-white">
                        AGRISENSE
                    </span>
                </Link>

                <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Link to="/#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {t('nav.features') || 'Features'}
                    </Link>
                    <Link to="/#crops" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        Crops
                    </Link>
                    <Link to="/#process" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {t('nav.process') || 'Process'}
                    </Link>
                    <Link to="/#testimonials" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {t('nav.testimonials') || 'Testimonials'}
                    </Link>
                    <Link to="/community" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        Community
                    </Link>
                    <Link to="/#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {t('nav.faq') || 'FAQ'}
                    </Link>
                    {userRole === 'admin' && (
                        <Link to="/admin" className="text-rose-600 dark:text-rose-400 font-bold hover:scale-110 transition-transform">
                            Admin
                        </Link>
                    )}
                    <Link to="/watch-demo" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        Demo
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="h-9 w-9 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl"
                        >
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <LanguageSwitcher />
                    </div>

                    {isLoggedIn ? (
                        <Link to="/dashboard">
                            <Button className="h-9 px-5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40">
                                {t('Dashboard')}
                            </Button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/watch-demo" className="hidden sm:block">
                                <Button variant="ghost" className="h-9 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl">
                                    Watch Demo
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button variant="ghost" className="h-9 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-white hover:bg-emerald-50 dark:hover:bg-white/5 rounded-xl">
                                    {t('nav.login') || 'Login'}
                                </Button>
                            </Link>
                            <Link to="/auth">
                                <Button className="h-9 px-5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-emerald-500/40">
                                    {t('nav.get_started') || 'Get Started'}
                                </Button>
                            </Link>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-10 w-10 text-slate-600 dark:text-slate-400"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </motion.div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-white dark:bg-[#060a0f] border-b border-slate-200 dark:border-slate-800 overflow-hidden pointer-events-auto"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            <div className="flex flex-col gap-4 text-base font-semibold text-slate-700 dark:text-slate-300">
                                <Link to="/#features" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
                                <Link to="/#crops" onClick={() => setIsMobileMenuOpen(false)}>Crops</Link>
                                <Link to="/#process" onClick={() => setIsMobileMenuOpen(false)}>Process</Link>
                                <Link to="/#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Testimonials</Link>
                                <Link to="/community" onClick={() => setIsMobileMenuOpen(false)}>Community</Link>
                                <Link to="/watch-demo" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-600 dark:text-emerald-400">Watch Demo</Link>
                                {userRole === 'admin' && (
                                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-rose-600 dark:text-rose-400 font-bold">Admin Panel</Link>
                                )}
                                <Link to="/#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</Link>
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Theme</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="gap-2"
                                >
                                    {theme === "dark" ? <><Sun className="h-4 w-4" /> Light</> : <><Moon className="h-4 w-4" /> Dark</>}
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Language</span>
                                <LanguageSwitcher />
                            </div>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                            <div className="flex flex-col gap-3">
                                {isLoggedIn ? (
                                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button className="w-full bg-emerald-600">Dashboard</Button>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button variant="outline" className="w-full">Login</Button>
                                        </Link>
                                        <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Button className="w-full bg-emerald-600">Get Started</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

