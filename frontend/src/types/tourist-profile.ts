export interface TouristProfileRequest {
    nationality?: string;
    bio?: string;
    languages?: string[];
    interests?: string[];
    eVisaNumber?: string;
    eVisaCountry?: string;
    eVisaExpiryDate?: string;
    eVisaEvidence?: string;
}

export interface TouristProfileExistsResponse {
    exists: boolean;
}

export interface TouristProfileResponse {
    id: string;
    userId: string;
    nationality?: string;
    bio?: string;
    languages?: string[];
    interests?: string[];
    eVisaNumber?: string;
    eVisaCountry?: string;
    eVisaExpiryDate?: string;
    eVisaEvidence?: string;
    verificationStatus?: 'verified' | 'pending' | 'unverified' | 'rejected';
    createdAt: string;
    updatedAt: string;

    // User basic info
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
}

// Countries list
export const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia',
    'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium',
    'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cambodia',
    'Canada', 'Chile', 'China', 'Colombia', 'Croatia', 'Czech Republic',
    'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Finland', 'France',
    'Georgia', 'Germany', 'Ghana', 'Greece', 'Hungary', 'Iceland',
    'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
    'Italy', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
    'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia', 'Mexico',
    'Morocco', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
    'Saudi Arabia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa',
    'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
    'Taiwan', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam'
] as const;

// Predefined options for form
export const COMMON_LANGUAGES = [
    'English',
    'Vietnamese',
    'Chinese (Mandarin)',
    'Japanese',
    'Korean',
    'French',
    'German',
    'Spanish',
    'Italian',
    'Russian',
    'Thai',
    'Indonesian',
    'Malay',
    'Hindi',
    'Arabic',
    'Other'
] as const;

export const COMMON_INTERESTS = [
    'Food & Cuisine',
    'History & Culture',
    'Art & Museums',
    'Nature & Outdoors',
    'Photography',
    'Shopping',
    'Nightlife',
    'Sports',
    'Music',
    'Architecture',
    'Local Markets',
    'Festivals',
    'Adventure Sports',
    'Beaches',
    'Mountains',
    'City Tours',
    'Street Food',
    'Traditional Crafts',
    'Other'
] as const;

export type Country = typeof COUNTRIES[number];
export type Language = typeof COMMON_LANGUAGES[number];
export type Interest = typeof COMMON_INTERESTS[number];
