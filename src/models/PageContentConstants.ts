import { Blocks, ClipboardList, FileCheck2, Laptop, Layers3, LayoutTemplate, PackageCheck, Rocket, ShoppingBag, Smartphone, Zap } from 'lucide-react';
import type { IncludedItemModel, ServiceModel } from './PageContentModel';
import { ContactMethod } from './PageKind';
import { PageText } from './PageText';

export const services: ServiceModel[] = [
  {
    name: PageText.ServiceBusinessCard,
    audience: PageText.ServiceBusinessCardDescription,
    goal: PageText.ServiceBusinessCardGoal,
    time: PageText.ServiceBusinessCardTime,
    icon: LayoutTemplate,
    features: [
      PageText.ServiceBusinessCardFeatureOne,
      PageText.ServiceBusinessCardFeatureTwo,
      PageText.ServiceBusinessCardFeatureThree,
      PageText.ServiceBusinessCardFeatureFour,
      PageText.ServiceBusinessCardFeatureFive,
      PageText.ServiceBusinessCardFeatureSix,
      PageText.ServiceBusinessCardFeatureSeven,
      PageText.ServiceBusinessCardFeatureEight,
    ],
    price: PageText.PackageBusinessCardPrice,
    unit: PageText.CurrencyUAH,
  },
  {
    name: PageText.ServiceLanding,
    audience: PageText.ServiceLandingDescription,
    goal: PageText.ServiceLandingGoal,
    time: PageText.ServiceLandingTime,
    icon: Zap,
    features: [
      PageText.ServiceLandingFeatureOne,
      PageText.ServiceLandingFeatureTwo,
      PageText.ServiceLandingFeatureThree,
      PageText.ServiceLandingFeatureFour,
      PageText.ServiceLandingFeatureFive,
      PageText.ServiceLandingFeatureSix,
      PageText.ServiceLandingFeatureSeven,
    ],
    price: PageText.PackageLandingPrice,
    unit: PageText.CurrencyUAH,
    featured: true,
  },
  {
    name: PageText.ServiceMultipage,
    audience: PageText.ServiceMultipageDescription,
    goal: PageText.ServiceMultipageGoal,
    time: PageText.ServiceMultipageTime,
    icon: Layers3,
    features: [
      PageText.ServiceMultipageFeatureOne,
      PageText.ServiceMultipageFeatureTwo,
      PageText.ServiceMultipageFeatureThree,
      PageText.ServiceMultipageFeatureFour,
      PageText.ServiceMultipageFeatureFive,
      PageText.ServiceMultipageFeatureSix,
    ],
    price: PageText.PackageMultipagePrice,
    unit: PageText.CurrencyUAH,
  },
  {
    name: PageText.PackageAdvanced,
    audience: PageText.ServiceAdvancedDescription,
    goal: PageText.ServiceAdvancedGoal,
    time: PageText.ServiceAdvancedTime,
    icon: Blocks,
    features: [
      PageText.ServiceAdvancedFeatureOne,
      PageText.ServiceAdvancedFeatureTwo,
      PageText.ServiceAdvancedFeatureThree,
      PageText.ServiceAdvancedFeatureFour,
    ],
    price: PageText.PackageAdvancedPrice,
    unit: PageText.CurrencyUAH,
  },
  {
    name: PageText.ServiceStore,
    audience: PageText.ServiceStoreDescription,
    goal: PageText.ServiceStoreGoal,
    time: PageText.ServiceStoreTime,
    icon: ShoppingBag,
    features: [
      PageText.ServiceStoreFeatureOne,
      PageText.ServiceStoreFeatureTwo,
      PageText.ServiceStoreFeatureThree,
      PageText.ServiceStoreFeatureFour,
      PageText.ServiceStoreFeatureFive,
      PageText.ServiceStoreFeatureSix,
    ],
    price: PageText.PackageCustomPrice,
    unit: PageText.CurrencyUAH,
  },
];

export const includedItems: IncludedItemModel[] = [
  {
    title: PageText.IncludedTurnkey,
    description: PageText.IncludedTurnkeyDescription,
    icon: ClipboardList,
  },
  {
    title: PageText.IncludedDomain,
    description: PageText.IncludedDomainDescription,
    icon: LayoutTemplate,
  },
  {
    title: PageText.IncludedHosting,
    description: PageText.IncludedHostingDescription,
    icon: Laptop,
  },
  {
    title: PageText.IncludedContent,
    description: PageText.IncludedContentDescription,
    icon: FileCheck2,
  },
];

export const homeHighlights = [
  { value: PageText.HomeHighlightDays, label: PageText.HomeHighlightDaysLabel, icon: Rocket },
  { value: PageText.HomeHighlightResponsive, label: PageText.HomeHighlightResponsiveLabel, icon: Smartphone },
  { value: PageText.HomeHighlightTurnkey, label: PageText.HomeHighlightTurnkeyLabel, icon: PackageCheck },
];

export const pageNavigationIndices = {
  home: 0,
  services: 1,
  included: 2,
  contact: 3,
} as const;

export const contactMethods = [
  { value: ContactMethod.Phone, label: PageText.ContactMethodPhone },
  { value: ContactMethod.Telegram, label: PageText.ContactMethodTelegram },
  { value: ContactMethod.Instagram, label: PageText.ContactMethodInstagram },
];
