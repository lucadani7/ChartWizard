export type Gender = "M" | "F" | "T"; // T = Total
export type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Pre-obese" | "Obese";

export type BmiRecord = {
  countryCode: string;
  countryName: string;
  year: number;
  gender: Gender;
  ageGroup: string; // e.g. "18-24"
  bmiCategory: BmiCategory;
  value: number; // percentage or rate
};

export type BmiFilters = {
  countries?: string[];
  years?: { from: number; to: number };
  genders?: Gender[];
  ageGroups?: string[];
  categories?: BmiCategory[];
};

export type ComparisonKey = keyof Pick<
  BmiRecord,
  "countryCode" | "gender" | "ageGroup" | "bmiCategory" | "year"
>;
