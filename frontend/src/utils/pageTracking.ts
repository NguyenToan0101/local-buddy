type PageTrackingMeta = {
  pageName: string;
  pageTitle: string;
  pageGroup: 'public' | 'auth' | 'traveler' | 'buddy' | 'admin' | 'unknown';
  routePattern: string;
};

const pageRules: Array<PageTrackingMeta & { pattern: RegExp }> = [
  { pattern: /^\/$/, pageName: 'landing', pageTitle: 'Landing Page', pageGroup: 'public', routePattern: '/' },
  { pattern: /^\/login$/, pageName: 'login', pageTitle: 'Login', pageGroup: 'auth', routePattern: '/login' },
  { pattern: /^\/signup$/, pageName: 'sign_up', pageTitle: 'Sign Up', pageGroup: 'auth', routePattern: '/signup' },
  { pattern: /^\/forgot-password$/, pageName: 'forgot_password', pageTitle: 'Forgot Password', pageGroup: 'auth', routePattern: '/forgot-password' },
  { pattern: /^\/reset-password$/, pageName: 'reset_password', pageTitle: 'Reset Password', pageGroup: 'auth', routePattern: '/reset-password' },
  { pattern: /^\/oauth2\/success$/, pageName: 'oauth_success', pageTitle: 'OAuth Success', pageGroup: 'auth', routePattern: '/oauth2/success' },
  { pattern: /^\/register\/buddy$/, pageName: 'buddy_registration', pageTitle: 'Buddy Registration', pageGroup: 'auth', routePattern: '/register/buddy' },

  { pattern: /^\/traveller\/home$/, pageName: 'traveler_home', pageTitle: 'Traveler Home', pageGroup: 'traveler', routePattern: '/traveller/home' },
  { pattern: /^\/traveller\/buddies$/, pageName: 'traveler_buddy_search', pageTitle: 'Traveler Buddy Search', pageGroup: 'traveler', routePattern: '/traveller/buddies' },
  { pattern: /^\/traveller\/experiences$/, pageName: 'traveler_experiences', pageTitle: 'Traveler Experiences', pageGroup: 'traveler', routePattern: '/traveller/experiences' },
  { pattern: /^\/traveller\/experience\/[^/]+$/, pageName: 'traveler_experience_detail', pageTitle: 'Traveler Experience Detail', pageGroup: 'traveler', routePattern: '/traveller/experience/:id' },
  { pattern: /^\/traveller\/experience\/live\/[^/]+$/, pageName: 'traveler_live_experience', pageTitle: 'Traveler Live Experience', pageGroup: 'traveler', routePattern: '/traveller/experience/live/:id' },
  { pattern: /^\/traveller\/experience\/share\/[^/]+$/, pageName: 'traveler_share_experience', pageTitle: 'Traveler Share Experience', pageGroup: 'traveler', routePattern: '/traveller/experience/share/:bookingId' },
  { pattern: /^\/traveller\/profile$/, pageName: 'traveler_profile', pageTitle: 'Traveler Profile', pageGroup: 'traveler', routePattern: '/traveller/profile' },
  { pattern: /^\/traveller\/profile\/edit$/, pageName: 'traveler_edit_profile', pageTitle: 'Traveler Edit Profile', pageGroup: 'traveler', routePattern: '/traveller/profile/edit' },
  { pattern: /^\/traveller\/create-profile$/, pageName: 'traveler_create_profile', pageTitle: 'Traveler Create Profile', pageGroup: 'traveler', routePattern: '/traveller/create-profile' },
  { pattern: /^\/traveller\/buddy\/[^/]+$/, pageName: 'traveler_buddy_profile', pageTitle: 'Traveler Buddy Profile', pageGroup: 'traveler', routePattern: '/traveller/buddy/:id' },
  { pattern: /^\/traveller\/messages$/, pageName: 'traveler_messages', pageTitle: 'Traveler Messages', pageGroup: 'traveler', routePattern: '/traveller/messages' },
  { pattern: /^\/traveller\/plan\/[^/]+$/, pageName: 'traveler_plan_experience', pageTitle: 'Traveler Plan Experience', pageGroup: 'traveler', routePattern: '/traveller/plan/:id' },
  { pattern: /^\/traveller\/checkout$/, pageName: 'traveler_checkout', pageTitle: 'Traveler Checkout', pageGroup: 'traveler', routePattern: '/traveller/checkout' },
  { pattern: /^\/traveller\/booking$/, pageName: 'traveler_bookings', pageTitle: 'Traveler Bookings', pageGroup: 'traveler', routePattern: '/traveller/booking' },
  { pattern: /^\/traveller\/booking\/[^/]+$/, pageName: 'traveler_booking_detail', pageTitle: 'Traveler Booking Detail', pageGroup: 'traveler', routePattern: '/traveller/booking/:id' },
  { pattern: /^\/traveller\/booking\/[^/]+\/cancel$/, pageName: 'traveler_cancel_booking', pageTitle: 'Traveler Cancel Booking', pageGroup: 'traveler', routePattern: '/traveller/booking/:id/cancel' },
  { pattern: /^\/traveller\/review\/[^/]+$/, pageName: 'traveler_review_experience', pageTitle: 'Traveler Review Experience', pageGroup: 'traveler', routePattern: '/traveller/review/:id' },
  { pattern: /^\/traveller\/report\/[^/]+$/, pageName: 'traveler_report_user', pageTitle: 'Traveler Report User', pageGroup: 'traveler', routePattern: '/traveller/report/:id' },

  { pattern: /^\/buddy\/dashboard\/?$/, pageName: 'buddy_dashboard', pageTitle: 'Buddy Dashboard', pageGroup: 'buddy', routePattern: '/buddy/dashboard' },
  { pattern: /^\/buddy\/dashboard\/trips$/, pageName: 'buddy_trips', pageTitle: 'Buddy Trips', pageGroup: 'buddy', routePattern: '/buddy/dashboard/trips' },
  { pattern: /^\/buddy\/dashboard\/trips\/[^/]+$/, pageName: 'buddy_trip_detail', pageTitle: 'Buddy Trip Detail', pageGroup: 'buddy', routePattern: '/buddy/dashboard/trips/:id' },
  { pattern: /^\/buddy\/dashboard\/schedule$/, pageName: 'buddy_schedule', pageTitle: 'Buddy Schedule', pageGroup: 'buddy', routePattern: '/buddy/dashboard/schedule' },
  { pattern: /^\/buddy\/dashboard\/messages$/, pageName: 'buddy_messages', pageTitle: 'Buddy Messages', pageGroup: 'buddy', routePattern: '/buddy/dashboard/messages' },
  { pattern: /^\/buddy\/dashboard\/earnings$/, pageName: 'buddy_earnings', pageTitle: 'Buddy Earnings', pageGroup: 'buddy', routePattern: '/buddy/dashboard/earnings' },
  { pattern: /^\/buddy\/dashboard\/settings$/, pageName: 'buddy_settings', pageTitle: 'Buddy Settings', pageGroup: 'buddy', routePattern: '/buddy/dashboard/settings' },
  { pattern: /^\/buddy\/welcome$/, pageName: 'buddy_onboarding', pageTitle: 'Buddy Onboarding', pageGroup: 'buddy', routePattern: '/buddy/welcome' },
  { pattern: /^\/buddy\/preview$/, pageName: 'buddy_preview', pageTitle: 'Buddy Preview', pageGroup: 'buddy', routePattern: '/buddy/preview' },
  { pattern: /^\/buddy\/live\/[^/]+$/, pageName: 'buddy_live_experience', pageTitle: 'Buddy Live Experience', pageGroup: 'buddy', routePattern: '/buddy/live/:id' },
];

const humanizePath = (pathname: string) => {
  const label = pathname.replace(/^\/+|\/+$/g, '').replace(/[-/]+/g, ' ');
  return label ? label.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Landing Page';
};

export function getPageTrackingMeta(pathname: string): PageTrackingMeta {
  const matched = pageRules.find((rule) => rule.pattern.test(pathname));
  if (matched) {
    const { pattern: _pattern, ...meta } = matched;
    return meta;
  }

  if (pathname.startsWith('/admin')) {
    return {
      pageName: 'admin',
      pageTitle: 'Admin',
      pageGroup: 'admin',
      routePattern: '/admin/*',
    };
  }

  return {
    pageName: 'unknown_page',
    pageTitle: humanizePath(pathname),
    pageGroup: 'unknown',
    routePattern: pathname || '/',
  };
}
