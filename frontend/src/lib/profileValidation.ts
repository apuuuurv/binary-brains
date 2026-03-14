// profileValidation.ts
// Pure validation utilities for ProfileWizard form fields.
// Each validator returns a non-empty error string on failure, or "" on success.

export type ProfileErrors = Record<string, string>;

// ─── Individual Field Validators ────────────────────────────────────────────

export const validators = {
  full_name: (v: string): string => {
    if (!v || !v.trim()) return "Full name is required.";
    if (v.trim().length < 3) return "Full name must be at least 3 characters.";
    if (!/[a-zA-Z]/.test(v)) return "Full name must contain letters.";
    return "";
  },

  email: (v: string): string => {
    if (!v || !v.trim()) return "Email address is required.";
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRe.test(v.trim())) return "Enter a valid email address.";
    return "";
  },

  phone_number: (v: string): string => {
    if (!v || !v.trim()) return "Phone number is required.";
    // Strip optional +91 or 0 prefix, then must be 10 digits
    const digits = v.replace(/^\+91/, "").replace(/^0/, "").replace(/\s|-/g, "");
    if (!/^\d{10}$/.test(digits)) return "Enter a valid 10-digit mobile number.";
    return "";
  },

  age: (v: string): string => {
    if (!v || v.trim() === "") return "Age is required.";
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 18 || n > 120) return "Age must be between 18 and 120.";
    return "";
  },

  annual_income: (v: string): string => {
    if (!v || v.trim() === "") return "Annual income is required.";
    const n = parseFloat(v);
    if (isNaN(n) || n < 0) return "Enter a valid income (₹ 0 or more).";
    return "";
  },

  state: (v: string): string => {
    if (!v || !v.trim()) return "State is required.";
    return "";
  },

  district: (v: string): string => {
    if (!v || !v.trim()) return "District is required.";
    return "";
  },

  gender: (v: string): string => {
    if (!v) return "Please select a gender.";
    return "";
  },

  land_size_hectares: (v: string): string => {
    if (!v || v.trim() === "") return "Land size is required.";
    const n = parseFloat(v);
    if (isNaN(n) || n <= 0) return "Enter a valid land size (in hectares).";
    return "";
  },

  soil_type: (v: string): string => {
    if (!v) return "Please select a soil type.";
    return "";
  },

  crop_season: (v: string): string => {
    if (!v) return "Please select a crop season.";
    return "";
  },

  water_source: (v: string): string => {
    if (!v) return "Please select a water source.";
    return "";
  },

  primary_crops: (v: string): string => {
    if (!v || !v.trim()) return "Enter at least one crop (e.g. Wheat, Rice).";
    return "";
  },
};

// ─── Step-level Validators ───────────────────────────────────────────────────

type Profile = Record<string, string>;

export function validateStep1(profile: Profile): ProfileErrors {
  const fields: (keyof typeof validators)[] = [
    "full_name",
    "email",
    "phone_number",
    "age",
    "annual_income",
    "state",
    "district",
    "gender",
  ];
  const errors: ProfileErrors = {};
  for (const f of fields) {
    const msg = validators[f]((profile[f] as string) ?? "");
    if (msg) errors[f] = msg;
  }
  return errors;
}

export function validateStep2(profile: Profile): ProfileErrors {
  const fields: (keyof typeof validators)[] = [
    "land_size_hectares",
    "soil_type",
    "crop_season",
    "water_source",
    "primary_crops",
  ];
  const errors: ProfileErrors = {};
  for (const f of fields) {
    const msg = validators[f]((profile[f] as string) ?? "");
    if (msg) errors[f] = msg;
  }
  return errors;
}

/** Returns true if the errors object has at least one non-empty error. */
export function hasErrors(errors: ProfileErrors): boolean {
  return Object.values(errors).some((e) => e !== "");
}
