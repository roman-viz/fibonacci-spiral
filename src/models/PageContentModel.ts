import type { LucideIcon } from 'lucide-react';

export interface ServiceModel {
  name: string;
  audience: string;
  goal: string;
  time: string;
  icon: LucideIcon;
  features: string[];
  price: string;
  unit: string;
  featured?: boolean;
}

export interface HighlightModel {
  value: string;
  label: string;
}

export interface IncludedItemModel {
  title: string;
  description: string;
  icon: LucideIcon;
}
