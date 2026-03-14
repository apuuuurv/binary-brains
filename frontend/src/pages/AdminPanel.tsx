import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  ArrowLeft, 
  ShieldCheck, 
  BookOpen, 
  Globe, 
  UserPlus, 
  Database,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [schemeData, setSchemeData] = useState({
    scheme_name: '',
    department: '',
    description: '',
    financial_benefit_amount: '',
    eligibility: {
      min_age: 18,
      max_land_size_hectares: '',
      allowed_states: '',
      target_farmer_types: ''
    }
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get('/admin/check-admin');
        if (res.data.is_admin) {
          setIsAdmin(true);
        } else {
          toast.error("Access denied. Admin privileges required.");
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error("Auth verification failed or unauthorized.");
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Format data for backend
      const payload = {
        ...schemeData,
        financial_benefit_amount: parseFloat(schemeData.financial_benefit_amount) || 0,
        eligibility: {
          ...schemeData.eligibility,
          min_age: parseInt(schemeData.eligibility.min_age.toString()) || 18,
          max_land_size_hectares: schemeData.eligibility.max_land_size_hectares ? parseFloat(schemeData.eligibility.max_land_size_hectares.toString()) : null,
          allowed_states: schemeData.eligibility.allowed_states ? schemeData.eligibility.allowed_states.split(',').map(s => s.trim()) : null,
          target_farmer_types: schemeData.eligibility.target_farmer_types ? schemeData.eligibility.target_farmer_types.split(',').map(t => t.trim()) : null
        }
      };

      await api.post('/admin/schemes/add', payload);
      toast.success("Scheme integrated successfully!");
      
      // Reset form
      setSchemeData({
        scheme_name: '',
        department: '',
        description: '',
        financial_benefit_amount: '',
        eligibility: {
          min_age: 18,
          max_land_size_hectares: '',
          allowed_states: '',
          target_farmer_types: ''
        }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add scheme");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060a0f] pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500 h-8 w-8" />
                    ADMIN DASHBOARD
                </h1>
                <p className="text-slate-500 text-sm">Integrate new agricultural policies manually</p>
            </div>
          </div>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Card className="border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500 w-full" />
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <PlusCircle className="h-5 w-5 text-emerald-600" />
                        Manual Scheme Integration
                    </CardTitle>
                    <CardDescription>
                        Fill in text extracted from official gazettes or policy documents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-emerald-500" /> Scheme Name
                                </Label>
                                <Input 
                                    required
                                    placeholder="e.g. PM-Kisan Samman Nidhi" 
                                    value={schemeData.scheme_name}
                                    onChange={e => setSchemeData({...schemeData, scheme_name: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-emerald-500" /> Department
                                </Label>
                                <Input 
                                    required
                                    placeholder="e.g. Ministry of Agriculture" 
                                    value={schemeData.department}
                                    onChange={e => setSchemeData({...schemeData, department: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea 
                                required
                                rows={4}
                                placeholder="Summary of the scheme and its primary objectives..."
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                value={schemeData.description}
                                onChange={e => setSchemeData({...schemeData, description: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Financial Benefit (₹)</Label>
                                <Input 
                                    type="number"
                                    placeholder="e.g. 6000" 
                                    value={schemeData.financial_benefit_amount}
                                    onChange={e => setSchemeData({...schemeData, financial_benefit_amount: e.target.value})}
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Minimum Age</Label>
                                <Input 
                                    type="number"
                                    value={schemeData.eligibility.min_age}
                                    onChange={e => setSchemeData({
                                        ...schemeData, 
                                        eligibility: {...schemeData.eligibility, min_age: parseInt(e.target.value)}
                                    })}
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Section 2: Eligibility Rules */}
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                Eligibility Controls
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Max Land Size (Hectares)</Label>
                                    <Input 
                                        type="number"
                                        step="0.01"
                                        placeholder="Leave empty for no limit" 
                                        value={schemeData.eligibility.max_land_size_hectares}
                                        onChange={e => setSchemeData({
                                            ...schemeData, 
                                            eligibility: {...schemeData.eligibility, max_land_size_hectares: e.target.value}
                                        })}
                                        className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-emerald-500" /> Allowed States
                                    </Label>
                                    <Input 
                                        placeholder="Maharashtra, Punjab (Comma separated)" 
                                        value={schemeData.eligibility.allowed_states}
                                        onChange={e => setSchemeData({
                                            ...schemeData, 
                                            eligibility: {...schemeData.eligibility, allowed_states: e.target.value}
                                        })}
                                        className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 mt-6">
                                <Label className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-emerald-500" /> Target Farmer Types
                                </Label>
                                <Input 
                                    placeholder="Small Farmer, Marginal Farmer (Comma separated)" 
                                    value={schemeData.eligibility.target_farmer_types}
                                    onChange={e => setSchemeData({
                                        ...schemeData, 
                                        eligibility: {...schemeData.eligibility, target_farmer_types: e.target.value}
                                    })}
                                    className="bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            disabled={submitting}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-12 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                        >
                            {submitting ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing Integration...</>
                            ) : (
                                <><PlusCircle className="mr-2 h-5 w-5" /> Integrate into System</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  );
}
