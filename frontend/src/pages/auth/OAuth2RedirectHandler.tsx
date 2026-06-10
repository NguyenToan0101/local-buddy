import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_ROUTE_BY_ROLE } from '../../utils/authRoutes';

const OAuth2RedirectHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      loginWithToken(token)
        .then((user) => {
          navigate(DEFAULT_ROUTE_BY_ROLE[user.role], { replace: true });
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to log in with Google account. Please try again.');
        });
    } else {
      setError('No authentication token found in URL.');
    }
  }, [searchParams, loginWithToken, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[30px] p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-black text-red-500 mb-4">Authentication Error</h2>
          <p className="text-gray-500 font-semibold mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#FF7E4B] hover:bg-[#FF6B35] text-white py-3 font-bold rounded-xl transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#FF7E4B] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-bold text-[#1A1A1A]">Logging in with Google...</p>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;
