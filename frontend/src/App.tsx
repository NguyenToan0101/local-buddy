import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/shared/LandingPage';
import HomePage from './pages/shared/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuth2RedirectHandler from './pages/auth/OAuth2RedirectHandler';
import BuddyRegistration from './pages/auth/BuddyRegistration';
import EditProfile from './pages/shared/EditProfile';
import ExploreBuddies from './pages/traveler/ExploreBuddies';
import ExploreExperiences from './pages/traveler/ExploreExperiences';
import ExperienceDetail from './pages/traveler/ExperienceDetail';
import TravelerProfile from './pages/traveler/TravelerProfile';
import BuddyProfile from './pages/buddy/BuddyProfile';
import Messaging from './pages/shared/Messaging';
import PlanExperience from './pages/traveler/PlanExperience';
import Checkout from './pages/traveler/Checkout';
import BookingDetails from './pages/shared/BookingDetails';
import CancelBooking from './pages/shared/CancelBooking';
import SafetyDashboard from './pages/shared/SafetyDashboard';
import ReviewExperience from './pages/traveler/ReviewExperience';
import TravelerBookings from './pages/traveler/TravelerBookings';
import BuddyDashboard from './pages/buddy/BuddyDashboard';
import ReportUser from './pages/shared/ReportUser';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerification from './pages/admin/AdminVerification';
import AdminPayoutsTaxes from './pages/admin/AdminPayoutsTaxes';
import AdminLogin from './pages/admin/AdminLogin';
import LiveExperience from './pages/shared/LiveExperience';
import BuddyPreview from './pages/buddy/BuddyPreview';
import BuddyLiveExperience from './pages/buddy/BuddyLiveExperience';
import BuddyOnboarding from './pages/buddy/BuddyOnboarding';
import CreateTouristProfile from './pages/traveler/CreateTouristProfile';
import ShareExperience from './pages/traveler/ShareExperience';
import { useAuth } from './context/AuthContext';
import type { UserRole } from './services/auth';

const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  TRAVELER: '/traveller/home',
  BUDDY: '/buddy/dashboard',
  ADMIN: '/admin/dashboard',
};

function RequireRole({ roles, children }: { roles: UserRole[]; children: React.ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[user.role] ?? '/'} replace />;
  }

  return children;
}

function TravelerOnly({ children }: { children: React.ReactElement }) {
  return <RequireRole roles={['TRAVELER']}>{children}</RequireRole>;
}

function BuddyOnly({ children }: { children: React.ReactElement }) {
  return <RequireRole roles={['BUDDY']}>{children}</RequireRole>;
}

function AdminOnly({ children }: { children: React.ReactElement }) {
  return <RequireRole roles={['ADMIN']}>{children}</RequireRole>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/success" element={<OAuth2RedirectHandler />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register/buddy" element={<BuddyRegistration />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/traveller/buddies" element={<TravelerOnly><ExploreBuddies /></TravelerOnly>} />
      <Route path="/traveller/experiences" element={<TravelerOnly><ExploreExperiences /></TravelerOnly>} />
      <Route path="/traveller/experience/:id" element={<TravelerOnly><ExperienceDetail /></TravelerOnly>} />
      <Route path="/traveller/home" element={<TravelerOnly><HomePage /></TravelerOnly>} />
      <Route path="/traveller/profile" element={<TravelerOnly><TravelerProfile /></TravelerOnly>} />
      <Route path="/traveller/create-profile" element={<TravelerOnly><CreateTouristProfile /></TravelerOnly>} />
      <Route path="/traveller/profile/edit" element={<TravelerOnly><EditProfile /></TravelerOnly>} />
      <Route path="/traveller/buddy/:id" element={<TravelerOnly><BuddyProfile /></TravelerOnly>} />
      <Route path="/traveller/messages" element={<TravelerOnly><Messaging /></TravelerOnly>} />
      <Route path="/traveller/plan/:id" element={<TravelerOnly><PlanExperience /></TravelerOnly>} />
      <Route path="/traveller/checkout" element={<TravelerOnly><Checkout /></TravelerOnly>} />
      <Route path="/traveller/booking/:id" element={<TravelerOnly><BookingDetails /></TravelerOnly>} />
      <Route path="/traveller/booking/:id/cancel" element={<TravelerOnly><CancelBooking /></TravelerOnly>} />
      <Route path="/traveller/safety" element={<TravelerOnly><SafetyDashboard /></TravelerOnly>} />
      <Route path="/traveller/review/:id" element={<TravelerOnly><ReviewExperience /></TravelerOnly>} />
      <Route path="/traveller/booking" element={<TravelerOnly><TravelerBookings /></TravelerOnly>} />
      <Route path="/traveller/experience/live/:id" element={<TravelerOnly><LiveExperience /></TravelerOnly>} />
      <Route path="/traveller/experience/share/:bookingId" element={<TravelerOnly><ShareExperience /></TravelerOnly>} />
      <Route path="/traveller/report/:id" element={<TravelerOnly><ReportUser /></TravelerOnly>} />
      <Route path="/buddy/dashboard/*" element={<BuddyOnly><BuddyDashboard /></BuddyOnly>} />
      <Route path="/buddy/welcome" element={<BuddyOnly><BuddyOnboarding /></BuddyOnly>} />
      <Route path="/buddy/preview" element={<BuddyOnly><BuddyPreview /></BuddyOnly>} />
      <Route path="/buddy/live/:id" element={<BuddyOnly><BuddyLiveExperience /></BuddyOnly>} />
      <Route path="/admin/dashboard" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
      <Route path="/admin/verification" element={<AdminOnly><AdminVerification /></AdminOnly>} />
      <Route path="/admin/payouts" element={<AdminOnly><AdminPayoutsTaxes /></AdminOnly>} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
