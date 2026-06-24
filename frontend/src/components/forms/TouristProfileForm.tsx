import React, { useState, useEffect, useRef } from 'react';
import { User, Globe, Heart, Save, Loader2, Plus, X, ShieldCheck, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
    COUNTRIES,
    COMMON_LANGUAGES,
    COMMON_INTERESTS
} from '../../types/tourist-profile';
import type {
    TouristProfileRequest,
    TouristProfileResponse
} from '../../types/tourist-profile';

interface TouristProfileFormProps {
    initialData?: TouristProfileResponse;
    onSubmit: (data: TouristProfileRequest) => Promise<void>;
    isLoading?: boolean;
    submitButtonText?: string;
}

const TouristProfileForm: React.FC<TouristProfileFormProps> = ({
    initialData,
    onSubmit,
    isLoading = false,
    submitButtonText = 'Save Profile'
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState<TouristProfileRequest>({
        nationality: '',
        bio: '',
        languages: [],
        interests: [],
        eVisaNumber: '',
        eVisaCountry: '',
        eVisaExpiryDate: '',
        eVisaEvidence: ''
    });

    const [customLanguage, setCustomLanguage] = useState('');
    const [customInterest, setCustomInterest] = useState('');
    const [showCustomLanguageInput, setShowCustomLanguageInput] = useState(false);
    const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const evidenceInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                nationality: initialData.nationality || '',
                bio: initialData.bio || '',
                languages: initialData.languages || [],
                interests: initialData.interests || [],
                eVisaNumber: initialData.eVisaNumber || '',
                eVisaCountry: initialData.eVisaCountry || '',
                eVisaExpiryDate: initialData.eVisaExpiryDate || '',
                eVisaEvidence: initialData.eVisaEvidence || ''
            });
        }
    }, [initialData]);

    const handleInputChange = (field: keyof TouristProfileRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleArrayToggle = (field: 'languages' | 'interests', value: string) => {
        const currentArray = formData[field] || [];

        if (value === 'Other') {
            if (field === 'languages') {
                setShowCustomLanguageInput(true);
            } else {
                setShowCustomInterestInput(true);
            }
            return;
        }

        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];

        handleInputChange(field, newArray);
    };

    const addCustomLanguage = () => {
        if (customLanguage.trim() && !formData.languages?.includes(customLanguage.trim())) {
            const newLanguages = [...(formData.languages || []), customLanguage.trim()];
            handleInputChange('languages', newLanguages);
            setCustomLanguage('');
            setShowCustomLanguageInput(false);
        }
    };

    const addCustomInterest = () => {
        if (customInterest.trim() && !formData.interests?.includes(customInterest.trim())) {
            const newInterests = [...(formData.interests || []), customInterest.trim()];
            handleInputChange('interests', newInterests);
            setCustomInterest('');
            setShowCustomInterestInput(false);
        }
    };

    const removeCustomItem = (field: 'languages' | 'interests', value: string) => {
        const currentArray = formData[field] || [];
        const newArray = currentArray.filter(item => item !== value);
        handleInputChange(field, newArray);
    };

    const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, eVisaEvidence: 'Evidence must be an image file' }));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            handleInputChange('eVisaEvidence', String(reader.result || ''));
        };
        reader.readAsDataURL(file);
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.nationality?.trim()) {
            newErrors.nationality = 'Nationality is required';
        }

        if (!formData.bio?.trim()) {
            newErrors.bio = 'Bio is required';
        } else if (formData.bio.length < 50) {
            newErrors.bio = 'Bio must be at least 50 characters';
        }

        if (!formData.languages?.length) {
            newErrors.languages = 'Please select at least one language';
        }

        if (!formData.interests?.length) {
            newErrors.interests = 'Please select at least one interest';
        }

        const hasAnyEVisaDetail = Boolean(
            formData.eVisaNumber?.trim() ||
            formData.eVisaCountry?.trim() ||
            formData.eVisaExpiryDate?.trim() ||
            formData.eVisaEvidence?.trim()
        );

        if (hasAnyEVisaDetail && !formData.eVisaNumber?.trim()) {
            newErrors.eVisaNumber = 'E-visa number is required when adding E-visa details';
        }

        if (hasAnyEVisaDetail && !formData.eVisaEvidence?.trim()) {
            newErrors.eVisaEvidence = 'Evidence image is required when adding E-visa details';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!');
        console.log('Form data:', formData);

        if (!validateForm()) {
            console.log('Form validation failed');
            return;
        }

        console.log('Form validation passed, calling onSubmit...');
        try {
            await onSubmit(formData);
            console.log('onSubmit completed successfully');
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Profile Picture Display (Read-only) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <User className="text-primary" size={24} />
                    <h3 className="text-lg font-semibold text-secondary">Profile Picture</h3>
                </div>

                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <User size={32} className="text-gray-400" />
                        )}
                    </div>

                    <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">
                            {user?.avatar ? 'Your profile picture from Google account' : 'No profile picture available'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Profile pictures are managed through your Google account
                        </p>
                    </div>
                </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <Globe className="text-primary" size={24} />
                    <h3 className="text-lg font-semibold text-secondary">Basic Information</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Nationality *
                        </label>
                        <select
                            value={formData.nationality || ''}
                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.nationality ? 'border-red-300' : 'border-gray-200'
                                }`}
                        >
                            <option value="">Select your nationality</option>
                            {COUNTRIES.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                        {errors.nationality && (
                            <p className="text-red-500 text-sm mt-1">{errors.nationality}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            About Me *
                        </label>
                        <textarea
                            placeholder="Tell us about yourself, your travel experiences, and what you're looking for in a local buddy..."
                            value={formData.bio || ''}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            rows={4}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none ${errors.bio ? 'border-red-300' : 'border-gray-200'
                                }`}
                        />
                        <div className="flex justify-between items-center mt-1">
                            {errors.bio && (
                                <p className="text-red-500 text-sm">{errors.bio}</p>
                            )}
                            <p className="text-sm text-gray-500 ml-auto">
                                {formData.bio?.length || 0} characters (minimum 50)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* E-visa Evidence */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <ShieldCheck className="text-primary" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-secondary">E-visa Evidence</h3>
                        <p className="text-xs text-secondary/45 font-medium mt-1">Passport upload is not required for traveler onboarding.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            E-visa Number
                        </label>
                        <input
                            type="text"
                            placeholder="EV-2026-001234"
                            value={formData.eVisaNumber || ''}
                            onChange={(e) => handleInputChange('eVisaNumber', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary ${errors.eVisaNumber ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {errors.eVisaNumber && (
                            <p className="text-red-500 text-sm mt-1">{errors.eVisaNumber}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Issuing Country
                        </label>
                        <select
                            value={formData.eVisaCountry || ''}
                            onChange={(e) => handleInputChange('eVisaCountry', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">Select country</option>
                            {COUNTRIES.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                            Expiry Date
                        </label>
                        <input
                            type="date"
                            value={formData.eVisaExpiryDate || ''}
                            onChange={(e) => handleInputChange('eVisaExpiryDate', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-secondary mb-2">
                        Evidence Image
                    </label>
                    <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className={`w-full min-h-[220px] rounded-2xl border border-dashed transition-all overflow-hidden bg-surface hover:bg-gray-50 ${errors.eVisaEvidence ? 'border-red-300' : 'border-gray-200'}`}
                    >
                        {formData.eVisaEvidence ? (
                            <img
                                src={formData.eVisaEvidence}
                                alt="E-visa evidence"
                                className="h-full max-h-[280px] w-full object-cover"
                            />
                        ) : (
                            <span className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-secondary/35">
                                <Upload size={26} />
                                <span className="text-xs font-black uppercase tracking-widest">Add evidence image</span>
                            </span>
                        )}
                    </button>
                    <input
                        ref={evidenceInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleEvidenceUpload}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-secondary/45 flex items-center gap-1.5">
                            <FileText size={13} />
                            Screenshot or photo of the E-visa approval page.
                        </p>
                        {formData.eVisaEvidence && (
                            <button
                                type="button"
                                onClick={() => handleInputChange('eVisaEvidence', '')}
                                className="text-xs font-black uppercase tracking-wider text-primary hover:underline"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    {errors.eVisaEvidence && (
                        <p className="text-red-500 text-sm mt-1">{errors.eVisaEvidence}</p>
                    )}
                </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <Globe className="text-primary" size={24} />
                    <h3 className="text-lg font-semibold text-secondary">Languages *</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {COMMON_LANGUAGES.map(language => (
                        <label
                            key={language}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.languages?.includes(language)
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={formData.languages?.includes(language) || false}
                                onChange={() => handleArrayToggle('languages', language)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${formData.languages?.includes(language)
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300'
                                }`}>
                                {formData.languages?.includes(language) && (
                                    <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                            </div>
                            <span className="text-sm font-medium">{language}</span>
                        </label>
                    ))}
                </div>

                {/* Custom Language Input */}
                {showCustomLanguageInput && (
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Enter custom language"
                            value={customLanguage}
                            onChange={(e) => setCustomLanguage(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomLanguage())}
                        />
                        <button
                            type="button"
                            onClick={addCustomLanguage}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCustomLanguageInput(false);
                                setCustomLanguage('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Selected Custom Languages */}
                {(formData.languages || []).filter(lang => !COMMON_LANGUAGES.includes(lang as any)).length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-secondary mb-2">Custom Languages:</p>
                        <div className="flex flex-wrap gap-2">
                            {(formData.languages || [])
                                .filter(lang => !COMMON_LANGUAGES.includes(lang as any))
                                .map(lang => (
                                    <span
                                        key={lang}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        {lang}
                                        <button
                                            type="button"
                                            onClick={() => removeCustomItem('languages', lang)}
                                            className="hover:bg-primary/20 rounded-full p-1"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                        </div>
                    </div>
                )}

                {errors.languages && (
                    <p className="text-red-500 text-sm mt-3">{errors.languages}</p>
                )}
            </div>

            {/* Interests */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                    <Heart className="text-primary" size={24} />
                    <h3 className="text-lg font-semibold text-secondary">Interests *</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                    {COMMON_INTERESTS.map(interest => (
                        <label
                            key={interest}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${formData.interests?.includes(interest)
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <input
                                type="checkbox"
                                checked={formData.interests?.includes(interest) || false}
                                onChange={() => handleArrayToggle('interests', interest)}
                                className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${formData.interests?.includes(interest)
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300'
                                }`}>
                                {formData.interests?.includes(interest) && (
                                    <div className="w-2 h-2 bg-white rounded-sm" />
                                )}
                            </div>
                            <span className="text-sm font-medium">{interest}</span>
                        </label>
                    ))}
                </div>

                {/* Custom Interest Input */}
                {showCustomInterestInput && (
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Enter custom interest"
                            value={customInterest}
                            onChange={(e) => setCustomInterest(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
                        />
                        <button
                            type="button"
                            onClick={addCustomInterest}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCustomInterestInput(false);
                                setCustomInterest('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Selected Custom Interests */}
                {(formData.interests || []).filter(interest => !COMMON_INTERESTS.includes(interest as any)).length > 0 && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-secondary mb-2">Custom Interests:</p>
                        <div className="flex flex-wrap gap-2">
                            {(formData.interests || [])
                                .filter(interest => !COMMON_INTERESTS.includes(interest as any))
                                .map(interest => (
                                    <span
                                        key={interest}
                                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                    >
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => removeCustomItem('interests', interest)}
                                            className="hover:bg-primary/20 rounded-full p-1"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                        </div>
                    </div>
                )}

                {errors.interests && (
                    <p className="text-red-500 text-sm mt-3">{errors.interests}</p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Save size={20} />
                    )}
                    {isLoading ? 'Saving...' : submitButtonText}
                </button>
            </div>
        </form>
    );
};

export default TouristProfileForm;
