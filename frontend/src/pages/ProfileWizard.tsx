import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { Loader2, CheckCircle, Upload, Tractor, User, ShieldCheck, XCircle, AlertCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslationText } from '@/hooks/useTranslationText';
import { Badge } from '@/components/ui/badge';
import { VoiceMic } from '@/components/VoiceMic';
import { getLandDocName } from '@/lib/stateDocs';
import {
  type ProfileErrors,
  validators,
  validateStep1,
  validateStep2,
  hasErrors,
} from '@/lib/profileValidation';

// ─── Inline error message component ─────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {msg}
    </p>
  );
}

// ─── Input class helper (adds red border on error) ───────────────────────────

function inputCls(field: string, errors: ProfileErrors, base = ""): string {
  const hasErr = !!errors[field];
  return [
    "h-12 bg-slate-50 dark:bg-slate-800/50",
    hasErr
      ? "border-red-400 dark:border-red-600 focus:ring-red-400"
      : "border-slate-200 dark:border-slate-800 focus:ring-emerald-500",
    base,
  ]
    .filter(Boolean)
    .join(" ");
}

function selectTriggerCls(field: string, errors: ProfileErrors): string {
  return errors[field]
    ? "h-12 bg-slate-50 dark:bg-slate-800/50 border-red-400 dark:border-red-600"
    : "h-12 bg-slate-50 dark:bg-slate-800/50";
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProfileWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState({ aadhar: false, pan: false, landownership: false, profile_picture: false });
  const [verified, setVerified] = useState({ aadhar: false, pan: false, landownership: false, profile_picture: false });
  const [extractedDocs, setExtractedDocs] = useState<any>({});
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { t } = useTranslationText();

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    age: '',
    gender: '',
    category: '',
    state: '',
    district: '',
    annual_income: '',
    irrigation_type: '',
    land_size_hectares: '',
    farmer_type: '',
    soil_type: '',
    crop_season: '',
    water_source: '',
    land_ownership: '',
    primary_crops: '',
    is_aadhar_verified: false,
    is_pan_verified: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('farmers/me');
        setProfile((prev: any) => ({
          ...prev,
          ...res.data,
          age: res.data.age?.toString() || '',
          annual_income: res.data.annual_income?.toString() || '',
          land_size_hectares: res.data.land_size_hectares?.toString() || '',
          primary_crops: res.data.primary_crops?.join(', ') || '',
        }));
        setVerified({
          aadhar: res.data.is_aadhar_verified || false,
          pan: res.data.is_pan_verified || false,
          landownership: res.data.documents_uploaded?.some((d: string) => d.toLowerCase().includes('land')) || false,
          profile_picture: res.data.face_embedding ? true : false,
        });
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // ── Field change helpers ───────────────────────────────────────────────────

  const handleChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (validators[field as keyof typeof validators]) {
      const msg = validators[field as keyof typeof validators](value);
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    handleChange(field, value);
  };

  // ── Step transitions ───────────────────────────────────────────────────────

  const goToStep2 = () => {
    const errs = validateStep1(profile as Record<string, string>);
    setErrors(errs);
    // Mark all step-1 fields as touched so errors show
    setTouched((prev) => ({
      ...prev,
      full_name: true, email: true, phone_number: true,
      age: true, annual_income: true, state: true, district: true, gender: true,
    }));
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }
    setStep(2);
  };

  // ── Save & Continue (Step 2 → 3) ──────────────────────────────────────────

  const saveDetails = async () => {
    const errs = validateStep2(profile as Record<string, string>);
    setErrors(errs);
    setTouched((prev) => ({
      ...prev,
      land_size_hectares: true, soil_type: true,
      crop_season: true, water_source: true, primary_crops: true,
    }));
    if (hasErrors(errs)) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...profile,
        age: parseInt(profile.age) || null,
        annual_income: parseFloat(profile.annual_income) || 0,
        land_size_hectares: parseFloat(profile.land_size_hectares) || null,
        primary_crops: profile.primary_crops.split(',').map((c: string) => c.trim()).filter((c: string) => c !== ""),
      };
      await api.put('farmers/me', payload);
      toast.success(t('wizard.toast_success'));
      setStep(step + 1);
    } catch (err: any) {
      toast.error(t('wizard.toast_fail'));
    } finally {
      setLoading(false);
    }
  };

  // ── Document upload (unchanged logic) ─────────────────────────────────────

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'aadhar' | 'pan' | 'landownership' | 'profile_picture',
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    if (docType === 'profile_picture') formData.append('doc_type', docType);

    setVerifying((prev) => ({ ...prev, [docType]: true }));
    try {
      toast.info(t('wizard.verifying'));
      let res: any;
      if (docType === 'profile_picture') {
        res = await api.post('upload', formData);
      } else if (docType === 'aadhar') {
        res = await api.post('verify/aadhaar', formData);
      } else if (docType === 'pan') {
        res = await api.post('verify/pan', formData);
      } else if (docType === 'landownership') {
        res = await api.post('verify/land-document', formData);
      }

      const isSuccess = docType === 'profile_picture' ? res.data.status === 'success' : res.data.message;
      if (isSuccess) {
        if (docType === 'profile_picture') {
          toast.success("Profile picture verified.");
        } else {
          toast.success(t('wizard.verified_success'));
        }
        if (res.data.data !== undefined || res.data.extracted_id) {
          const docData = {
            ...(res.data.extracted_id ? { masked_id: res.data.extracted_id } : {}),
            ...(res.data.data || {}),
          };
          if (Object.keys(docData).length > 0) {
            setExtractedDocs((prev: any) => ({ ...prev, [docType]: docData }));
          }
        }
        setVerified((prev) => ({ ...prev, [docType]: true }));
        setProfile((prev: any) => ({
          ...prev,
          [`is_${docType}_verified`]: true,
          [`${docType}_number`]: res.data.extracted_id || prev[`${docType}_number`],
        }));
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        toast.error(err.response.data.detail);
      } else {
        toast.error(t('wizard.toast_upload_fail', { type: docType }));
      }
    } finally {
      setVerifying((prev) => ({ ...prev, [docType]: false }));
    }
  };

  const isKYCComplete = verified.aadhar && verified.pan && verified.landownership && verified.profile_picture;

  // ── Step 1 validity (live) ─────────────────────────────────────────────────
  const step1Valid = !hasErrors(validateStep1(profile as Record<string, string>));
  const step2Valid = !hasErrors(validateStep2(profile as Record<string, string>));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <span>{t('wizard.step_x_of_y', { current: step, total: 4 })}</span>
            <span>
              {step === 1 && t('wizard.step_personal')}
              {step === 2 && t('wizard.step_farm')}
              {step === 3 && t('wizard.step_verification')}
              {step === 4 && t('wizard.step_4')}
            </span>
          </div>
          <Progress value={(step / 4) * 100} className="h-3 bg-emerald-100 dark:bg-emerald-900/30 overflow-hidden rounded-full border border-emerald-200/50 dark:border-emerald-800/50" />
        </div>

        <Card className="shadow-2xl border-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="bg-emerald-600 dark:bg-emerald-700 text-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-500/20">
            <div>
              <CardTitle className="text-3xl font-black flex items-center gap-3">
                {step === 1 && <User className="h-8 w-8" />}
                {step === 2 && <Tractor className="h-8 w-8" />}
                {step === 3 && <ShieldCheck className="h-8 w-8" />}
                {step === 4 && <CheckCircle className="h-8 w-8" />}
                {step === 4 ? t('common.success') : t('wizard.title')}
              </CardTitle>
              <CardDescription className="text-emerald-50 mt-2 text-lg font-medium opacity-90">
                {step === 3 ? t('wizard.kyc_gate_desc') : t('wizard.subtitle')}
              </CardDescription>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
              <LanguageSwitcher />
            </div>
          </CardHeader>

          <CardContent className="p-8">

            {/* ── STEP 1: PERSONAL & CONTACT ─────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Validation status banner */}
                {!step1Valid && Object.keys(touched).length > 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Please complete all required fields to continue.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Full Name */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('full_name', errors)}
                        placeholder="e.g. Ramesh Kumar Sharma"
                        value={profile.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, full_name: true }))}
                      />
                      <VoiceMic fieldKey="full_name" onResult={(val) => handleChange('full_name', val)} className="h-12 w-12" />
                    </div>
                    {touched.full_name && <FieldError msg={errors.full_name} />}
                  </div>

                  {/* Email */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      className={inputCls('email', errors)}
                      placeholder="e.g. ramesh@example.com"
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                    />
                    {touched.email && <FieldError msg={errors.email} />}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.phone')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('phone_number', errors)}
                        placeholder="+91 9876543210"
                        value={profile.phone_number}
                        onChange={(e) => handleChange('phone_number', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, phone_number: true }))}
                      />
                      <VoiceMic fieldKey="phone_number" onResult={(val) => handleChange('phone_number', val)} className="h-12 w-12" />
                    </div>
                    {touched.phone_number && <FieldError msg={errors.phone_number} />}
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.age')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('age', errors)}
                        type="number"
                        min={18}
                        max={120}
                        value={profile.age}
                        onChange={(e) => handleChange('age', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, age: true }))}
                      />
                      <VoiceMic fieldKey="age" onResult={(val) => handleChange('age', val)} className="h-12 w-12" />
                    </div>
                    {touched.age && <FieldError msg={errors.age} />}
                  </div>

                  {/* Annual Income */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.income')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('annual_income', errors)}
                        type="number"
                        placeholder="e.g. 150000"
                        value={profile.annual_income}
                        onChange={(e) => handleChange('annual_income', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, annual_income: true }))}
                      />
                      <VoiceMic fieldKey="annual_income" onResult={(val) => handleChange('annual_income', val)} className="h-12 w-12" />
                    </div>
                    {touched.annual_income && <FieldError msg={errors.annual_income} />}
                  </div>

                  {/* State */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.state')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('state', errors)}
                        placeholder={t('form.state_placeholder')}
                        value={profile.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, state: true }))}
                      />
                      <VoiceMic fieldKey="state" onResult={(val) => handleChange('state', val)} className="h-12 w-12" />
                    </div>
                    {touched.state && <FieldError msg={errors.state} />}
                  </div>

                  {/* District */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.district')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('district', errors)}
                        placeholder={t('form.district_placeholder')}
                        value={profile.district}
                        onChange={(e) => handleChange('district', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, district: true }))}
                      />
                      <VoiceMic fieldKey="district" onResult={(val) => handleChange('district', val)} className="h-12 w-12" />
                    </div>
                    {touched.district && <FieldError msg={errors.district} />}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.gender')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={profile.gender}
                      onValueChange={(v) => handleSelectChange('gender', v)}
                    >
                      <SelectTrigger className={selectTriggerCls('gender', errors)}>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{t('form.male')}</SelectItem>
                        <SelectItem value="Female">{t('form.female')}</SelectItem>
                        <SelectItem value="Other">{t('form.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.gender && <FieldError msg={errors.gender} />}
                  </div>

                </div>

                {/* Next Button */}
                <Button
                  className={`w-full h-14 text-white text-lg font-bold rounded-xl shadow-lg transition-all ${
                    step1Valid
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:scale-[1.01]'
                      : 'bg-emerald-600/50 cursor-not-allowed opacity-60'
                  }`}
                  onClick={goToStep2}
                >
                  {t('wizard.next_farm')}
                </Button>

                {!step1Valid && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    All fields marked <span className="text-red-500 font-bold mx-0.5">*</span> are required.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 2: AGRICULTURAL DATA ──────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Validation banner */}
                {!step2Valid && Object.values(touched).filter(Boolean).length > 0 && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Please complete all required fields to continue.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Land Size */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.land_size')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className={inputCls('land_size_hectares', errors)}
                      type="number"
                      step="0.1"
                      placeholder="e.g. 2.5"
                      value={profile.land_size_hectares}
                      onChange={(e) => handleChange('land_size_hectares', e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, land_size_hectares: true }))}
                    />
                    {touched.land_size_hectares && <FieldError msg={errors.land_size_hectares} />}
                  </div>

                  {/* Soil Type */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.soil_type')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={profile.soil_type}
                      onValueChange={(v) => handleSelectChange('soil_type', v)}
                    >
                      <SelectTrigger className={selectTriggerCls('soil_type', errors)}>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alluvial">{t('form.soil_alluvial')}</SelectItem>
                        <SelectItem value="Black">{t('form.soil_black')}</SelectItem>
                        <SelectItem value="Red">{t('form.soil_red')}</SelectItem>
                        <SelectItem value="Laterite">{t('form.soil_laterite')}</SelectItem>
                        <SelectItem value="Desert">{t('form.soil_desert')}</SelectItem>
                        <SelectItem value="Mountain">{t('form.soil_mountain')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.soil_type && <FieldError msg={errors.soil_type} />}
                  </div>

                  {/* Crop Season */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.crop_season')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={profile.crop_season}
                      onValueChange={(v) => handleSelectChange('crop_season', v)}
                    >
                      <SelectTrigger className={selectTriggerCls('crop_season', errors)}>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kharif">{t('form.season_kharif')}</SelectItem>
                        <SelectItem value="Rabi">{t('form.season_rabi')}</SelectItem>
                        <SelectItem value="Zaid">{t('form.season_zaid')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.crop_season && <FieldError msg={errors.crop_season} />}
                  </div>

                  {/* Water Source */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.water_source')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={profile.water_source}
                      onValueChange={(v) => handleSelectChange('water_source', v)}
                    >
                      <SelectTrigger className={selectTriggerCls('water_source', errors)}>
                        <SelectValue placeholder={t('common.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Well">{t('form.water_well')}</SelectItem>
                        <SelectItem value="Canal">{t('form.water_canal')}</SelectItem>
                        <SelectItem value="Rain">{t('form.water_rain')}</SelectItem>
                        <SelectItem value="River">{t('form.water_river')}</SelectItem>
                        <SelectItem value="Borewell">{t('form.water_borewell')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.water_source && <FieldError msg={errors.water_source} />}
                  </div>

                  {/* Primary Crops */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold">
                      {t('form.crops')} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className={inputCls('primary_crops', errors)}
                        placeholder={t('form.crops_placeholder') || "Wheat, Rice"}
                        value={profile.primary_crops}
                        onChange={(e) => handleChange('primary_crops', e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, primary_crops: true }))}
                      />
                      <VoiceMic fieldKey="primary_crops" onResult={(val) => handleChange('primary_crops', val)} className="h-12 w-12" />
                    </div>
                    {touched.primary_crops && <FieldError msg={errors.primary_crops} />}
                    <p className="text-xs text-slate-400 dark:text-slate-500">Separate multiple crops with commas.</p>
                  </div>

                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 font-bold border-2 rounded-xl" onClick={() => setStep(1)}>
                    {t('wizard.back')}
                  </Button>
                  <Button
                    className={`flex-1 h-14 text-lg font-bold rounded-xl shadow-lg transition-all ${
                      step2Valid
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.01]'
                        : 'bg-emerald-600/50 text-white cursor-not-allowed opacity-60'
                    }`}
                    onClick={saveDetails}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : t('wizard.save_continue')}
                  </Button>
                </div>

                {!step2Valid && (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    All fields marked <span className="text-red-500 font-bold mx-0.5">*</span> are required.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 3: KYC GATE ───────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* KYC checklist summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'aadhar', label: 'Aadhaar' },
                    { key: 'pan', label: 'PAN' },
                    { key: 'landownership', label: 'Land Doc' },
                    { key: 'profile_picture', label: 'Face ID' },
                  ].map(({ key, label }) => {
                    const done = verified[key as keyof typeof verified];
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                          done
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {done
                          ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                          : <XCircle className="h-4 w-4 shrink-0 text-slate-400" />
                        }
                        {label}
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-6">
                  {/* Aadhaar Upload */}
                  <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${verified.aadhar ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${verified.aadhar ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{t('form.doc_aadhar')}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">12-digit Government ID</p>
                        </div>
                      </div>
                      {verified.aadhar ? (
                        <Badge className="bg-emerald-500 text-white h-8 px-4 text-sm rounded-lg flex gap-1 items-center">
                          <CheckCircle className="h-4 w-4" /> {t('common.verified')}
                        </Badge>
                      ) : verifying.aadhar ? (
                        <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                      ) : null}
                    </div>
                    {!verified.aadhar && (
                      <div className="relative group">
                        <Input type="file" accept="image/*,application/pdf" className="cursor-pointer h-12 opacity-0 absolute inset-0 z-10" onChange={(e) => handleFileUpload(e, 'aadhar')} />
                        <Button variant="outline" className="w-full h-12 border-dashed border-2 bg-white dark:bg-slate-900 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all font-bold">
                          {t('form.select_file')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* PAN Upload */}
                  <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${verified.pan ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${verified.pan ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{t('form.doc_pan')}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Income Tax Department ID</p>
                        </div>
                      </div>
                      {verified.pan ? (
                        <Badge className="bg-emerald-500 text-white h-8 px-4 text-sm rounded-lg flex gap-1 items-center">
                          <CheckCircle className="h-4 w-4" /> {t('common.verified')}
                        </Badge>
                      ) : verifying.pan ? (
                        <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                      ) : null}
                    </div>
                    {!verified.pan && (
                      <div className="relative group">
                        <Input type="file" accept="image/*,application/pdf" className="cursor-pointer h-12 opacity-0 absolute inset-0 z-10" onChange={(e) => handleFileUpload(e, 'pan')} />
                        <Button variant="outline" className="w-full h-12 border-dashed border-2 bg-white dark:bg-slate-900 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all font-bold">
                          {t('form.select_file')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Land Ownership Upload */}
                  <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${verified.landownership ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${verified.landownership ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <Tractor className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">{getLandDocName(profile.state)}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Land Ownership Record for {profile.state || 'your state'}</p>
                        </div>
                      </div>
                      {verified.landownership ? (
                        <Badge className="bg-emerald-500 text-white h-8 px-4 text-sm rounded-lg flex gap-1 items-center">
                          <CheckCircle className="h-4 w-4" /> {t('common.verified')}
                        </Badge>
                      ) : verifying.landownership ? (
                        <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                      ) : null}
                    </div>
                    {!verified.landownership && (
                      <div className="relative group">
                        <Input type="file" accept="image/*,application/pdf" className="cursor-pointer h-12 opacity-0 absolute inset-0 z-10" onChange={(e) => handleFileUpload(e, 'landownership')} />
                        <Button variant="outline" className="w-full h-12 border-dashed border-2 bg-white dark:bg-slate-900 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all font-bold">
                          {t('form.select_file')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Profile Picture / Face Recognition */}
                  <div className={`p-6 border-2 rounded-2xl transition-all duration-300 ${verified.profile_picture ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${verified.profile_picture ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                          <User className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">Profile Picture (Face Verification)</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Upload a clear selfie to secure your identity.</p>
                        </div>
                      </div>
                      {verified.profile_picture ? (
                        <Badge className="bg-emerald-500 text-white h-8 px-4 text-sm rounded-lg flex gap-1 items-center">
                          <CheckCircle className="h-4 w-4" /> {t('common.verified')}
                        </Badge>
                      ) : verifying.profile_picture ? (
                        <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
                      ) : null}
                    </div>
                    {!verified.profile_picture && (
                      <div className="relative group">
                        <Input type="file" accept="image/*" className="cursor-pointer h-12 opacity-0 absolute inset-0 z-10" onChange={(e) => handleFileUpload(e, 'profile_picture')} />
                        <Button variant="outline" className="w-full h-12 border-dashed border-2 bg-white dark:bg-slate-900 group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all font-bold">
                          {t('form.select_file')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extracted doc previews */}
                {Object.keys(extractedDocs).length > 0 && (
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Verified Document Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(extractedDocs).map(([docRef, data]: any) => (
                        <div key={docRef} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <h5 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 capitalize mb-2">{docRef.replace('_', ' ')}</h5>
                          <div className="space-y-1">
                            {Object.entries(data).map(([k, v]: any) => (
                              <div key={k} className="flex justify-between text-sm">
                                <span className="text-slate-500 capitalize">{k.replace('_', ' ')}:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-200">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button variant="outline" className="h-14 font-bold border-2 rounded-xl" onClick={() => setStep(2)}>
                    {t('wizard.back')}
                  </Button>
                  <Button
                    className={`flex-1 h-14 text-lg font-bold rounded-xl shadow-lg transition-all ${
                      isKYCComplete
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.01]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                    disabled={!isKYCComplete || loading}
                    onClick={() => setStep(4)}
                  >
                    {t('wizard.finish_setup')}
                  </Button>
                </div>
                {!isKYCComplete && (
                  <p className="text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 font-medium">
                    <XCircle className="h-4 w-4" />
                    Complete all 4 verifications above to continue.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 4: SUCCESS + SUMMARY ──────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-10 animate-in zoom-in-95 duration-700">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-3xl scale-125" />
                    <CheckCircle className="h-28 w-28 text-emerald-500 mx-auto relative drop-shadow-xl" />
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Setup Complete!</h3>
                  <p className="text-xl text-slate-600 dark:text-slate-400 font-medium max-w-md mx-auto">
                    Your farmer profile is now verified. Our AI is currently scanning 1,200+ schemes tailored for you.
                  </p>
                </div>

                {/* Profile Summary */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-500" />
                    Profile Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Full Name', value: profile.full_name },
                      { label: 'State', value: profile.state },
                      { label: 'District', value: profile.district },
                      { label: 'Gender', value: profile.gender },
                      { label: 'Age', value: profile.age ? `${profile.age} years` : '—' },
                      { label: 'Annual Income', value: profile.annual_income ? `₹${Number(profile.annual_income).toLocaleString('en-IN')}` : '—' },
                      { label: 'Land Size', value: profile.land_size_hectares ? `${profile.land_size_hectares} ha` : '—' },
                      { label: 'Soil Type', value: profile.soil_type || '—' },
                      { label: 'Crop Season', value: profile.crop_season || '—' },
                      { label: 'Water Source', value: profile.water_source || '—' },
                      { label: 'Primary Crops', value: profile.primary_crops || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Aadhaar', done: verified.aadhar },
                      { label: 'PAN', done: verified.pan },
                      { label: 'Land Doc', done: verified.landownership },
                      { label: 'Face ID', done: verified.profile_picture },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {label} {done ? 'Verified' : '—'}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white text-xl font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02]"
                  onClick={() => navigate('/dashboard')}
                >
                  {t('wizard.go_dashboard')} <CheckCircle className="ml-3 h-6 w-6" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}