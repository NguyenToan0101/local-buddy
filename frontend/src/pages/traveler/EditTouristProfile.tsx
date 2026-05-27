import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import TouristProfileForm from '../../components/forms/TouristProfileForm';
import { touristProfileService } from '../../services/tourist-profile';
import type { TouristProfileRequest, TouristProfileResponse } from '../../types/tourist-profile';

const EditTouristProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileData, setProfileData] = useState<TouristProfileResponse | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Load existing profile
        const loadProfile = async () => {
            try {
                const profile = await touristProfileService.getProfile();
                setProfileData(profile);
            } catch (error) {
                console.error('Error loading profile:', error);
                setMessage({
                    type: 'error',
                    text: 'Failed to load profile. Please try again.'
                });
                // Redirect to create profile if profile doesn't exist
                setTimeout(() => {
                    navigate('/traveller/create-profile');
                }, 2000);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, [user, navigate]);

    const handleSubmit = async (updatedData: TouristProfileRequest) => {
        setIsLoading(true);
        setMessage(null);

        try {
            const updatedProfile = await touristProfileService.updateProfile(updatedData);
            setProfileData(updatedProfile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Redirect to profile page after a short delay
            setTimeout(() => {
                navigate('/traveller/profile');
            }, 2000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <p className="text-lg font-medium text-secondary mb-4">Please log in to continue</p>
                    <Link to="/login" className="text-primary hover:underline">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoadingProfile) {
        return (
            <div className="min-h-screen bg-[#FBFBFC]">
                <Navbar />
                <div className="pt-32 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-lg font-medium text-secondary">Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBFBFC]">
            <Navbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/traveller/profile"
                        className="group flex items-center gap-2 text-secondary/40 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] mb-6"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-primary/20 transition-all">
                            <ChevronLeft size={16} />
                        </div>
                        Back to Profile
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                            Edit Your Tourist Profile
                        </h1>
                        <p className="text-lg text-secondary/70 max-w-2xl mx-auto">
                            Update your information to help local buddies provide better personalized experiences.
                        </p>
                    </div>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Form */}
                {profileData && (
                    <TouristProfileForm
                        initialData={profileData}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                        submitButtonText="Update Profile"
                    />
                )}
            </main>
        </div>
    );
};

export default EditTouristProfile;