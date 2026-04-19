// ============================================================
// GLOBAL TYPES
// ============================================================

export type UserRole =
  | 'Emperor'
  | 'GreatChancellor'
  | 'SupremeMinister'
  | 'Minister'
  | 'ViceMinister'
  | 'Governor'
  | 'Official'
  | 'Citizen';

export const ROLE_LABELS: Record<UserRole, string> = {
  Emperor: 'Император',
  GreatChancellor: 'Великий Канцлер',
  SupremeMinister: 'Верховный Министр',
  Minister: 'Министр',
  ViceMinister: 'Зам-министр',
  Governor: 'Наместник (Губернатор)',
  Official: 'Чиновник',
  Citizen: 'Гражданин',
};

export const ROLE_RANK: Record<UserRole, number> = {
  Emperor: 7,
  GreatChancellor: 6,
  SupremeMinister: 5,
  Minister: 4,
  ViceMinister: 3,
  Governor: 2,
  Official: 1,
  Citizen: 0,
};

export const GOV_ROLES: UserRole[] = [
  'Emperor', 'GreatChancellor', 'SupremeMinister',
  'Minister', 'ViceMinister', 'Governor', 'Official'
];

export interface UserProfile {
  uid: string;
  nickname: string;
  email?: string;
  role: UserRole;
  cityId?: number;
  registrationDate: string;
  passport?: Passport | null;
  properties?: Property[];
  businesses?: Business[];
}

export interface Passport {
  primaryId: string;   // XX00000
  secondaryId: string; // XX-0000-00000
  firstName: string;
  lastName: string;
  issuedAt: string;
  cityId: number;
}

export interface Property {
  id: string;
  type: 'house' | 'commerce' | 'land';
  coordinates: string;
  description: string;
  approvedAt: string;
}

export interface Business {
  id: string;
  name: string;
  officePropertyId: string;
  description: string;
  registeredAt: string;
}

export type ApplicationType =
  | 'passport'
  | 'property'
  | 'business_license'
  | 'building_permit'
  | 'organization';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'review';

export interface Application {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  userId: string;
  userNickname: string;
  cityId: number;
  cityName?: string;
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  reviewNote?: string;
  history: ApplicationHistoryEntry[];
}

export interface ApplicationHistoryEntry {
  action: string;
  byUid: string;
  byNickname: string;
  at: string;
  note?: string;
}

export interface City {
  id: number;
  name: string;
  governorId?: string;
  coordinates?: { x: number; z: number };
  region?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  date: string;
  authorId: string;
  authorNickname: string;
}

export interface PortalStats {
  citizens: number;
  cities: number;
  regions: number;
  applications: number;
}
