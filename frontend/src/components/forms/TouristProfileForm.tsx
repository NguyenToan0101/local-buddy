import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Globe, Heart, Save, Loader2, Plus, X, ShieldCheck, Upload, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth';
import {
    COUNTRIES,
    COMMON_LANGUAGES,
    COMMON_INTERESTS
} from '../../types/tourist-profile';
import type {
    TouristProfileRequest,
    TouristProfileResponse
} from '../../types/tourist-profile';
import {
    EVISA_EVIDENCE_ACCEPT,
    EVISA_EVIDENCE_MAX_BYTES,
    isAllowedEVisaEvidenceFile,
    isPdfEvidence
} from '../../utils/evisaEvidence';

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
    const { user, updateUser } = useAuth();
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
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const avatarInputRef = useRef<HTMLInputElement>(null);
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

    useEffect(() => {
        setAvatarPreview(user?.avatar || '');
    }, [user?.avatar]);

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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrors(prev => ({ ...prev, avatar: 'Profile picture must be an image file' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, avatar: 'Profile picture must be smaller than 5MB' }));
            return;
        }

        const previousPreview = avatarPreview;
        const localPreview = URL.createObjectURL(file);
        setAvatarPreview(localPreview);
        setAvatarUploading(true);
        setErrors(prev => ({ ...prev, avatar: '' }));

        try {
            const uploadedUser = await authService.uploadAvatar(file);
            if (uploadedUser.avatar) {
                setAvatarPreview(uploadedUser.avatar);
                await updateUser({ avatar: uploadedUser.avatar });
            }
        } catch (error) {
            setAvatarPreview(previousPreview);
            const message = error instanceof Error ? error.message : 'Failed to upload profile picture';
            setErrors(prev => ({ ...prev, avatar: message }));
        } finally {
            URL.revokeObjectURL(localPreview);
            setAvatarUploading(false);
        }
    };

    const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!isAllowedEVisaEvidenceFile(file)) {
            setErrors(prev => ({ ...prev, eVisaEvidence: 'Evidence must be a PDF, JPG, PNG, or WebP file' }));
            return;
        }

        if (file.size > EVISA_EVIDENCE_MAX_BYTES) {
            setErrors(prev => ({ ...prev, eVisaEvidence: 'Evidence file must be smaller than 10MB' }));
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
            newErrors.eVisaEvidence = 'Evidence file is required when adding E-visa details';
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
            {/* Profile Picture */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <User className="text-primary" size={24} />
                    <h3 className="text-lg font-semibold text-secondary">Profile Picture</h3>
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-gray-100 shadow-sm ring-1 ring-gray-100 disabled:cursor-wait"
                    >
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center">
                                <User size={34} className="text-gray-400" />
                            </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {avatarUploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                        </span>
                    </button>

                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                    />

                    <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">
                            {avatarUploading ? 'Uploading profile picture...' : 'Upload a traveler profile picture'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            JPG, PNG, or WebP. Maximum 5MB.
                        </p>
                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={avatarUploading}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-secondary transition-all hover:border-primary hover:text-primary disabled:opacity-60"
                        >
                            {avatarUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            {avatarPreview ? 'Change Photo' : 'Add Photo'}
                        </button>
                        {errors.avatar && (
                            <p className="text-red-500 text-sm mt-2">{errors.avatar}</p>
                        )}
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
                        Evidence File
                    </label>
                    <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className={`w-full min-h-[220px] rounded-2xl border border-dashed transition-all overflow-hidden bg-surface hover:bg-gray-50 ${errors.eVisaEvidence ? 'border-red-300' : 'border-gray-200'}`}
                    >
                        {formData.eVisaEvidence && isPdfEvidence(formData.eVisaEvidence) ? (
                            <span className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-secondary/60">
                                <FileText size={34} />
                                <span className="text-xs font-black uppercase tracking-widest">PDF evidence selected</span>
                                <span className="text-[10px] font-bold text-secondary/35">Click to replace</span>
                            </span>
                        ) : formData.eVisaEvidence ? (
                            <img
                                src={formData.eVisaEvidence}
                                alt="E-visa evidence"
                                className="h-full max-h-[280px] w-full object-cover"
                            />
                        ) : (
                            <span className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-secondary/35">
                                <Upload size={26} />
                                <span className="text-xs font-black uppercase tracking-widest">Add evidence file</span>
                            </span>
                        )}
                    </button>
                    <input
                        ref={evidenceInputRef}
                        type="file"
                        accept={EVISA_EVIDENCE_ACCEPT}
                        className="hidden"
                        onChange={handleEvidenceUpload}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-secondary/45 flex items-center gap-1.5">
                            <FileText size={13} />
                            PDF, screenshot, or photo of the E-visa approval page. Maximum 10MB.
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
