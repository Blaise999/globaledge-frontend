// src/pages/auth/RegisterPage.jsx
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Logo from "../../assets/globaledge.png";
import { auth, setAuthToken } from "/src/utils/api";

export default function RegisterPage() {
  const { user, login } = useAuth?.() || { user: null, login: () => {} };
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (user) return <Navigate to="/dashboard" replace state={{ from: location }} />;

  // steps: "form" | "otp"
  const [step, setStep] = useState("form");

  // form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");

  // --- Additional info (UI only; not sent yet) ---
  const [accountType, setAccountType] = useState("individual"); // 'individual' | 'business'
  const [company, setCompany]         = useState("");
  const [country, setCountry]         = useState("Belgium");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity]               = useState("");
  const [address1, setAddress1]       = useState("");
  const [address2, setAddress2]       = useState("");
  const [postalCode, setPostalCode]   = useState("");
  const [referral, setReferral]       = useState("");
  const [newsletter, setNewsletter]   = useState(true);
  const [agreeTerms, setAgreeTerms]   = useState(false);

  // otp
  const [otp, setOtp] = useState("");

  // ui state
  const [loading, setLoading]       = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying]   = useState(false);

  const [err, setErr]   = useState("");
  const [note, setNote] = useState("");

  const canSubmit =
    fullName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    confirm === password;

  async function handleRegister(e) {
    e.preventDefault();
    setErr(""); setNote("");

    if (!canSubmit) {
      setErr("Please fill all required fields and use a strong password (min 8 chars).");
      return;
    }

    try {
      setLoading(true);
      // Logic unchanged: only sending the original fields.
      await auth.register({ name: fullName, email, password, phone });

      setStep("otp");
      setNote("We sent a 6-digit code to your email. Enter it below to finish.");
    } catch (e) {
      setErr(e?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    setErr(""); setNote("");
    if (!otp.trim()) {
      setErr("Enter the 6-digit code.");
      return;
    }
    try {
      setVerifying(true);

      await auth.verifyOtp({ email, otp });

      const loginRes = await auth.login({ email, password });
      if (loginRes?.token) setAuthToken(loginRes.token);
      if (login && loginRes?.user) login({ ...loginRes.user, token: loginRes.token });

      navigate(from, { replace: true });
    } catch (e) {
      setErr(e?.message || "Invalid or expired code.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setErr(""); setNote("");
    try {
      setSendingOtp(true);
      await auth.resendOtp({ email });
      setNote("We’ve resent a new code.");
    } catch (e) {
      setErr(e?.message || "Couldn’t resend the code.");
    } finally {
      setSendingOtp(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="GlobalEdge" className="h-12 w-auto" />
        </div>

        {step === "form" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">Sign up to get started with GlobalEdge.</p>
            {err && <div className="mt-4 text-sm text-red-700 bg-red-50 border px-3 py-2">{err}</div>}
            {note && !err && <div className="mt-4 text-sm text-green-700 bg-green-50 border px-3 py-2">{note}</div>}

            <form className="mt-6 space-y-4" onSubmit={handleRegister}>
              {/* Account details */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text" value={fullName} onChange={(e)=>setFullName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="Jane Doe" autoComplete="name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account type</label>
                  <select
                    value={accountType}
                    onChange={(e)=>setAccountType(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  >
                    <option value="individual">Individual</option>
                    <option value="business">Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company (optional)</label>
                  <input
                    type="text" value={company} onChange={(e)=>setCompany(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                    placeholder="GlobalEdge Ltd."
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email" value={email} onChange={(e)=>setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="you@example.com" autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input
                  type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="	+44 20 xxxx xxxx" autoComplete="tel"
                />
              </div>

              {/* Address */}
              <div className="pt-2">
                <h2 className="text-sm font-semibold text-gray-900">Contact & Address</h2>
                <p className="text-xs text-gray-500">Used for receipts, pickups, and delivery preferences.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address line 1</label>
                <input
                  type="text" value={address1} onChange={(e)=>setAddress1(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="Street address" autoComplete="address-line1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address line 2 (optional)</label>
                <input
                  type="text" value={address2} onChange={(e)=>setAddress2(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="Apartment, suite, unit" autoComplete="address-line2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text" value={city} onChange={(e)=>setCity(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                    placeholder="Brussels" autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Region</label>
                  <input
                    type="text" value={stateRegion} onChange={(e)=>setStateRegion(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                    placeholder="Brussels" autoComplete="address-level1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal code</label>
                  <input
                    type="text" value={postalCode} onChange={(e)=>setPostalCode(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                    placeholder="100001" autoComplete="postal-code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <select
                    value={country} onChange={(e)=>setCountry(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                    autoComplete="country-name"
                  >
                    <option>Belgium</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>United Arab Emirates</option>
                    <option>Canada</option>
                  </select>
                </div>
              </div>

              {/* Security */}
              <div className="pt-2">
                <h2 className="text-sm font-semibold text-gray-900">Security</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="At least 8 characters" autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                <input
                  type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="Repeat password" autoComplete="new-password"
                />
              </div>

              {/* Preferences */}
              <div className="pt-2">
                <h2 className="text-sm font-semibold text-gray-900">Preferences</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">How did you hear about us? (optional)</label>
                <select
                  value={referral} onChange={(e)=>setReferral(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                >
                  <option value="">Select…</option>
                  <option>Friend / Family</option>
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Twitter/X</option>
                  <option>Google Search</option>
                  <option>Billboard / Flyer</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={newsletter}
                    onChange={(e)=>setNewsletter(e.target.checked)}
                  />
                  Subscribe to product updates & offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <label className="inline-flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    checked={agreeTerms}
                    onChange={(e)=>setAgreeTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/legal/terms" className="text-red-600 hover:underline">Terms</Link> and{" "}
                    <Link to="/legal/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className={`w-full mt-2 text-white font-semibold py-2.5 rounded-lg transition ${
                  loading || !canSubmit ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already registered?{" "}
              <Link to="/auth/login" className="text-red-600 font-medium hover:underline">Log in</Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Verify your account</h1>
            <p className="mt-1 text-sm text-gray-500">Enter the 6-digit code sent to <b>{email}</b>.</p>
            {err && <div className="mt-4 text-sm text-red-700 bg-red-50 border px-3 py-2">{err}</div>}
            {note && !err && <div className="mt-4 text-sm text-green-700 bg-green-50 border px-3 py-2">{note}</div>}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification code</label>
                <input
                  inputMode="numeric" value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                  placeholder="Enter 6-digit code"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleVerifyOTP}
                  disabled={verifying || otp.length !== 6}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition ${
                    verifying || otp.length !== 6 ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {verifying ? "Verifying…" : "Verify"}
                </button>
                <button
                  onClick={handleResend}
                  disabled={sendingOtp}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    sendingOtp ? "bg-gray-200 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  {sendingOtp ? "Sending…" : "Resend"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep("form")}
                className="block mx-auto text-xs text-gray-500 hover:underline mt-2"
              >
                ← Back to form
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
