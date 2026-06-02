import { Routes, Route } from 'react-router-dom';
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
import AdminSOSMonitoring from './pages/admin/AdminSOSMonitoring';
import AdminLogin from './pages/admin/AdminLogin';
import LiveExperience from './pages/shared/LiveExperience';
import BuddyPreview from './pages/buddy/BuddyPreview';
import BuddyLiveExperience from './pages/buddy/BuddyLiveExperience';
import BuddyOnboarding from './pages/buddy/BuddyOnboarding';
import CreateTouristProfile from './pages/traveler/CreateTouristProfile';
import ShareExperience from './pages/traveler/ShareExperience';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/traveller/buddies" element={<ExploreBuddies />} />
      <Route path="/traveller/experiences" element={<ExploreExperiences />} />
      <Route path="/traveller/experience/:id" element={<ExperienceDetail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/success" element={<OAuth2RedirectHandler />} />
      <Route path="/traveller/home" element={<HomePage />} />
      <Route path="/traveller/profile" element={<TravelerProfile />} />
      <Route path="/traveller/create-profile" element={<CreateTouristProfile />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register/buddy" element={<BuddyRegistration />} />
      <Route path="/traveller/profile/edit" element={<EditProfile />} />
      <Route path="/traveller/buddy/:id" element={<BuddyProfile />} />
      <Route path="/traveller/messages" element={<Messaging />} />
      <Route path="/traveller/plan/:id" element={<PlanExperience />} />
      <Route path="/traveller/checkout" element={<Checkout />} />
      <Route path="/traveller/booking/:id" element={<BookingDetails />} />
      <Route path="/traveller/booking/:id/cancel" element={<CancelBooking />} />
      <Route path="/traveller/safety" element={<SafetyDashboard />} />
      <Route path="/traveller/review/:id" element={<ReviewExperience />} />
      <Route path="/traveller/booking" element={<TravelerBookings />} />
      <Route path="/buddy/dashboard/*" element={<BuddyDashboard />} />
      <Route path="/buddy/welcome" element={<BuddyOnboarding />} />
      <Route path="/buddy/preview" element={<BuddyPreview />} />
      <Route path="/buddy/live/:id" element={<BuddyLiveExperience />} />
      <Route path="/traveller/experience/live/:id" element={<LiveExperience />} />
      <Route path="/traveller/experience/share/:bookingId" element={<ShareExperience />} />
      <Route path="/traveller/report/:id" element={<ReportUser />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/verification" element={<AdminVerification />} />
      <Route path="/admin/payouts" element={<AdminPayoutsTaxes />} />
      <Route path="/admin/sos" element={<AdminSOSMonitoring />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
