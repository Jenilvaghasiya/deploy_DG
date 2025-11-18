import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Pages
import LoginPage from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import VerifyOtp from "./pages/VerifyOtp";
import InviteUser from "./pages/InviteUser";
import AcceptInvite from "./pages/AcceptInvite";
import VerifyEmail from "./pages/VerifyEmail";
import UserList from "./pages/users/UserList";

// Layout & Auth
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import UnprotectedRoute from "./components/UnprotectedRoute"; // Import the new component
import DashboardLayout from "./layouts/DashboardLayout";
import NewDashboard from "./layouts/NewDashboardDesign";
import RoleList from "./pages/roles/RoleList";
import ProjectList from "./pages/projects/ProjectList";
import { Toaster } from "react-hot-toast";
import RolePermissionsPage from "./pages/roles/RolePermissionPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TenantList from "./pages/tenants/TenantList";
import BroadcastMessages from "./pages/messages/BroadcastMessages";
import DirectMessages from "./pages/messages/DirectMessages";
import CommunityRoleList from "./pages/community_roles/CommunityRoleList";
import CommunityRolePermissionPage from "./pages/community_roles/CommunityRolePermissionPage";
import UserManagement from "./pages/users/UserManagement";
import NotFound from "./pages/NotFound";
import MoodboardPage from "./pages/moodboards/MoodboardPage";
import GalleryPage from "./pages/gallery/GalleryPage";
import UserProjectPage from "./pages/user_projects/UserProjectPage";
import BillingSubscription from "./pages/billing_subscription/BillingSubscription";
import TextToImage from "./pages/text-to-image/TextToImage";
import ImageEditorPage from "./pages/image_editor/ImageEditorPage";
import HomeGalleryPage from "./pages/GalleryPage";
import FAQPage from "./pages/FAQPage";
import AboutUs from "./pages/AboutUsPage";
import AboutUsNew from "./pages/AboutUsNew";
import Pricing from "./pages/PricingPage";
import ContactUs from "./pages/ContactUsPage";
import Blogs from "./pages/BlogPage";
import BlogDetail from './pages/BlogDetails';
import { LandingPagelayout } from "./layouts/LandingPagelayout";
import DressVariationsGenerator from "./pages/DressVariationsGenerator";
import AnnouncementManagement from "./pages/announcement/AnnouncementManagement";
import SketchToImage from "./pages/image_generator/SketchToImage"; //TODO:HIDE-SKETCH-TO-IMAGE
import CombineImage from "./pages/image_generator/CombineImage";
import SizeChart from "./pages/image_generator/SizeChart";
import ColorVariation from "./pages/image_generator/ColorVariation";
import UserSetting from "./pages/settings/UserSetting";
import PublicRoute from "./components/PublicRoute";
import { TabsDemo } from "./pages/SizeChartPage";
import StrapiPostForm from "./pages/dg-social/CreatePost";
import StrapiPostList from "./pages/dg-social/ViewPost";
import PublicPostList from "./pages/dg-social/PublicPostList";
import MySubmissions from "./pages/dg-social/MySubmissions";
import SubscriptionPage from "./pages/subscriptions/SubscriptionPage"
import CancelPage from "./pages/subscriptions/CancelPage"
import SuccessPage from "./pages/subscriptions/SuccsessPage";
import TenantSubscriptionPlans from "./pages/subscriptions/TenantSubscriptionPlans";
import { TourProvider } from  "./contexts/TourContext"
import SharedContentView from "./components/Shared_with_me/SharedContentView";
import SharedWithOthers from "./components/Shared_with_others/SharedWithOthers";
import useSessionTimeout from "./hooks/useSessionTimeout";
import PatterCutoutPage from "./pages/image_generator/pattern_cutouts/PatterCutoutPage";
import PatternCutoutPage from "./pages/image_generator/pattern_cutouts/PatterCutoutPage";
import ColorDetectionGenerator from "./pages/image_generator/color_detection/ColorDetectionGenerator";
import ColorDetectionPage from "./pages/image_generator/color_detection/ColorDetectionPage";
import TechPackGenerator from "./pages/image_generator/TechPackGenerator";
import TechPacksPage from "./pages/image_generator/take_packs/TechPackPage";
import DashboardNew from "./pages/DashboardNew";
import TermsAndConditions from "./pages/terms_and_conditions/TermsAndConditions";
import PrivacyAndDataPolicy from "./pages/terms_and_conditions/PrivacyAndDataPolicy";
import PrivacyPolicyNotification from "./pages/terms_and_conditions/PrivacyPolicyNotification";
import HowItWorksSection from "./pages/HowItWorks";
import ReviewListing from "./pages/ReviewListing";
import RefundPolicy from "./pages/terms_and_conditions/RefundPolicy";
import NSFWTestComponent from "./pages/NSFWTest";
import ImageAdd from "./pages/image_editor/ImageAdd";

function App() {
  useSessionTimeout();
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <TourProvider>
      <Router>
        <Routes>
          {/* Redirect to dashboard by default */}
          {/* <Route path="/" element={<Navigate to="/usage-stats" />} /> */}

          {/* Public/Unprotected Routes */}
          <Route
            path="/login"
            element={
              <UnprotectedRoute>
                <LoginPage />
              </UnprotectedRoute>
            }
          />
          <Route path="/privacy-and-data-policy" element={<PrivacyAndDataPolicy isFooterLink={true} />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions isFooterLink={true} />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          {/* <Route
            path="/home-gallery"
            element={
              <PublicRoute>
                <MainLayout>
                <HomeGalleryPage />
                </MainLayout>
              </PublicRoute>
            }
          /> */}
          <Route
            path="/faqs"
            element={
              <PublicRoute>
                <MainLayout>
                <FAQPage />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/test"
            element={
              <PublicRoute>
                <MainLayout>
                <NSFWTestComponent />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/about-us"
            element={
              <PublicRoute>
                <MainLayout>
                <AboutUs />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/about"
            element={
              <PublicRoute>
                <MainLayout>
                <AboutUsNew />
                </MainLayout>
              </PublicRoute>
            }
          />
          {/* <Route
            path="/pricing"
            element={
              <PublicRoute>
                <MainLayout>
                <Pricing />
                </MainLayout>
              </PublicRoute>
            }
          /> */}
        <Route
            path="/contact-us"
            element={
              <PublicRoute>
                <MainLayout>
                <ContactUs />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/blogs"
            element={
              <PublicRoute>
                <MainLayout>
                <Blogs />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/gallery-posts"
            element={
              <PublicRoute>
                <MainLayout>
                 <PublicPostList />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <PublicRoute>
                <MainLayout>
                 <ReviewListing />
                 {/* <h1>Review</h1> */}
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <PublicRoute>
                <MainLayout>
                 <HowItWorksSection isReview={true} />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <PublicRoute>
                <MainLayout>
                <BlogDetail />
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <UnprotectedRoute>
                <Onboarding />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <UnprotectedRoute>
                <VerifyOtp />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/invite/:token"
            element={
              <UnprotectedRoute>
                <AcceptInvite />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/verify-email"
            element={
              <UnprotectedRoute>
                <VerifyEmail />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <UnprotectedRoute>
                <ForgotPasswordPage />
              </UnprotectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <UnprotectedRoute>
                <ResetPasswordPage />
              </UnprotectedRoute>
            }
          />

          <Route
            path="/newDashboard"
            element={
              <ProtectedRoute>
                <NewDashboard />
              </ProtectedRoute>
            }
          />
          <Route
              path="/"
            element={
              // <UnprotectedRoute>
                <LandingPagelayout />
              // </UnprotectedRoute>
            }
          />
		 
          {/* Protected Routes with Dashboard Layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
            path="/PostForm"
            element={
              <ProtectedRoute>
                <StrapiPostForm />
              </ProtectedRoute>
            }
          />
              <Route
            path="/PostList"
            element={
              <ProtectedRoute>
                <StrapiPostList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/MySubmissions"
            element={
              <ProtectedRoute>
                <MySubmissions />
              </ProtectedRoute>
            }
          />
             <Route
            path="/variation-generation"
            element={
              <ProtectedRoute>
                <DressVariationsGenerator />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/announcement"
            element={
              <ProtectedRoute>
                <AnnouncementManagement />
              </ProtectedRoute>
            }
          /> */}
            <Route path="/newDashboard" element={<NewDashboard />} />
            <Route path="/usage-stats" element={<Dashboard />} />
            <Route path="/usage-stats-new" element={<DashboardNew />} />
            <Route path="/" element={<LandingPagelayout />} />
			      <Route path="/variation-generation" element={<DressVariationsGenerator />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/roles" element={<RoleList />} />
            <Route
              path="/roles/:id/permissions"
              element={<RolePermissionsPage />}
            />
            <Route path="/community-roles" element={<CommunityRoleList />} />
            <Route
              path="/community-roles/:id/permissions"
              element={<CommunityRolePermissionPage />}
            />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/tenants" element={<TenantList />} />
            <Route path="/invite-user" element={<InviteUser />} />
            <Route path="/messages/broadcast" element={<BroadcastMessages />} />
            <Route path="/messages/direct" element={<DirectMessages />} />
            <Route path="/moodboards" element={<MoodboardPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/user-projects" element={<UserProjectPage />} />
            <Route path="/shared-with-me" element={<SharedContentView />} />
            <Route path="/shared-with-others" element={<SharedWithOthers />} />
            <Route path="/user-setting" element={<UserSetting />} />
            <Route path="/text-to-sketch" element={<TextToImage />} />
            <Route path="/sketch-to-image" element={<SketchToImage />} /> 
            <Route path="/combine-image" element={<CombineImage />} />
            <Route path="/size-chart-image" element={<TabsDemo />} />
            <Route path="/color-variations" element={<ColorVariation />} />
            <Route path="/tech-packs" element={<TechPacksPage />} />
            <Route path="/pattern-cutout" element={<PatternCutoutPage/>} />
            <Route path="/color_analysis" element={<ColorDetectionPage/>} />
            <Route
              path="/billing-subscription"
              element={<BillingSubscription />}
            />
            <Route path="/image-editor" element={<ImageEditorPage />} />
            <Route path="/image-editor-new" element={<ImageAdd />} />
          </Route>
          <Route path="/onboarding/subscriptions" element={<SubscriptionPage />} />
          <Route path="/subscriptions/cancel" element={<CancelPage />} />
          <Route path="/subscriptions/success" element={<SuccessPage />} />       
          <Route path="/subscriptions" element={<ProtectedRoute><TenantSubscriptionPlans /></ProtectedRoute>} />       
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </TourProvider>
    </>
  );
}

export default App;
