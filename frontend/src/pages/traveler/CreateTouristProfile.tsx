import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TouristProfileForm from '../../components/forms/TouristProfileForm';
import { touristProfileService } from '../../services/tourist-profile';
import type { TouristProfileRequest } from '../../types/tourist-profile';

const CreateTouristProfile: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [checkingExisting, setCheckingExisting] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Check if profile already exists
        const checkExistingProfile = async () => {
            try {
                const exists = await touristProfileService.checkProfileExists();
                if (exists) {
                    navigate('/traveller/profile');
                    return;
                }
            } catch (error) {
                console.error('Error checking profile:', error);
            } finally {
                setCheckingExisting(false);
            }
        };

        checkExistingProfile();
    }, [user, navigate]);

    const handleSubmit = async (profileData: TouristProfileRequest) => {
        console.log('CreateTouristProfile handleSubmit called with:', profileData);
        setIsLoading(true);
        setMessage(null);

        try {
            console.log('Calling touristProfileService.createProfile...');
            await touristProfileService.createProfile(profileData);
            console.log('Profile created successfully!');
            setMessage({ type: 'success', text: 'Profile created successfully!' });

            // Redirect to profile page after a short delay
            setTimeout(() => {
                navigate('/traveller/profile');
            }, 2000);
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
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

    if (checkingExisting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-secondary">Checking your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBFBFC]">

            <main className="pt-6 pb-20 px-4 sm:px-6 lg:px-16 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        to="/traveller/home"
                        className="group flex items-center gap-2 text-secondary/40 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] mb-6"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-primary/20 transition-all">
                            <ChevronLeft size={16} />
                        </div>
                        Back to Home
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                            Create Your Tourist Profile
                        </h1>
                        <p className="text-lg text-secondary/70 max-w-2xl mx-auto">
                            Tell us about yourself to help local buddies understand your travel preferences and provide personalized experiences.
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
                <TouristProfileForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    submitButtonText="Create Profile"
                />
            </main>
        </div>
    );
};

export default CreateTouristProfile;