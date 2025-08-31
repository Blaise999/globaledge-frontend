// src/router.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";

// Auth (users)
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";

// Services
import ExpressPage from "./pages/services/Expresspage.jsx"; // your file name
import FreightPage from "./pages/services/FreightPage.jsx";
import EcommercePage from "./pages/services/EcommercePage.jsx";
import CustomsPage from "./pages/services/CustomsPage.jsx";
import DomesticPage from "./pages/services/DomesticPage.jsx";
import WarehousingPage from "./pages/services/WarehousingPage.jsx";

// Tracking
import TrackPage from "./pages/track/TrackPage.jsx";

// Billing flow
import BillingPage from "./pages/billing/BillingPage.jsx";
import ReceiptPage from "./pages/billing/ReceiptPage.jsx";

// User dashboard (protected)
import CourierDashboard from "./pages/CourierDashboard.jsx";

// Admin
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

// Info & 404
import AboutPage from "./pages/info/AboutPage.jsx";
import ContactPage from "./pages/info/ContactPage.jsx";
import FAQPage from "./pages/info/FAQPage.jsx";
import NotFound from "./pages/NotFound.jsx";

/** Simple guard for admin routes */
function AdminGuard({ children }) {
  const token = localStorage.getItem("adminToken");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function Router() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<App />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FAQPage />} />

      {/* User auth */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* Create Shipment (Express page handles parcel/freight selector) */}
      <Route path="/create" element={<ExpressPage />} />
      <Route path="/services/express" element={<ExpressPage />} />

      {/* Other services */}
      <Route path="/services/freight" element={<FreightPage />} />
      <Route path="/services/ecommerce" element={<EcommercePage />} />
      <Route path="/services/customs" element={<CustomsPage />} />
      <Route path="/services/domestic" element={<DomesticPage />} />
      <Route path="/services/warehousing" element={<WarehousingPage />} />

      {/* Tracking */}
      <Route path="/track" element={<TrackPage />} />

      {/* Billing flow */}
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/receipt/:id" element={<ReceiptPage />} />

      {/* User app (protected by user token) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<CourierDashboard />} />
        {/* add more user-protected routes here */}
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
      {/* Or redirect unknown routes:
          <Route path="*" element={<Navigate to="/" replace />} /> */}
    </Routes>
  );
}
