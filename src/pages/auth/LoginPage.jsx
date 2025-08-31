// src/pages/auth/LoginPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Logo from "../../assets/globaledge.png";
import { auth as AuthAPI, setUserToken, getUserToken } from "../../utils/api";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const token = getUserToken();

  // Only auto-forward if BOTH user and token exist
  if (user && token) return <Navigate to="/dashboard" replace state={{ from: location }} />;

  const [step, setStep] = useState("login"); // "login" | "otp"
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // otp state
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);

  const isLoginDisabled = useMemo(
    () => !identifier.trim() || !password.trim() || loading,
    [identifier, password, loading]
  );
  const isOtpComplete = otp.every((d) => d && d.length === 1);

  // -------- Start login: call backend --------
  async function handleContinue() {
    setErr("");
    if (isLoginDisabled) return;
    setLoading(true);
    try {
      const res = await AuthAPI.login({ email: identifier.trim(), password: password.trim() });

      // If backend returns token immediately -> done
      if (res?.token) {
        setUserToken(res.token);
        const u = res.user || { id: res.id || "me", name: res.name || "User", email: identifier.trim() };
        login(u);
        navigate(from, { replace: true });
        return;
      }

      // Otherwise assume OTP required
      if (res?.otpRequired || res?.next === "otp" || res?.status === "OTP_REQUIRED" || res?.message) {
        setStep("otp");
        setTimeout(() => inputsRef.current[0]?.focus(), 0);
        return;
      }

      throw new Error(res?.error || res?.message || "Unexpected response");
    } catch (e) {
      setErr(e?.data?.message || e?.message || "Could not start login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // -------- Verify OTP with backend --------
  async function handleVerifyOtp() {
    setErr("");
    if (!isOtpComplete || loading) return;
    setLoading(true);
    try {
      const code = otp.join("");
      const res = await AuthAPI.verifyOtp({ email: identifier.trim(), otp: code });

      if (!res?.token) throw new Error(res?.error || res?.message || "Invalid code");

      setUserToken(res.token);
      const u = res.user || { id: res.id || "me", name: res.name || "User", email: identifier.trim() };
      login(u);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e?.data?.message || e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  }

  async function handleResend() {
    if (loading) return;
    setErr("");
    setLoading(true);
    try {
      await AuthAPI.resendOtp({ email: identifier.trim() });
    } catch (e) {
      setErr(e?.data?.message || e?.message || "Could not resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (err) setErr("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, password, step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="GlobalEdge" className="h-12 w-auto" />
        </div>

        {/* --- Login Step --- */}
        {step === "login" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
            <p className="mt-1 text-sm text-gray-500">Enter your details to continue.</p>
            {err && <div className="mt-4 text-sm text-red-700 bg-red-50 border px-3 py-2">{err}</div>}

            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-600 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoginDisabled}
                className={`w-full mt-2 text-white font-semibold py-2.5 rounded-lg transition ${
                  isLoginDisabled ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Please wait…" : "Continue"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              <Link to="/auth/forgot" className="underline">Forgot password?</Link>
            </p>
          </>
        )}

        {/* --- OTP Step --- */}
        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
            <p className="mt-1 text-sm text-gray-500">
              We sent a 6-digit code to <span className="font-medium">{identifier}</span>.
            </p>
            {err && <div className="mt-4 text-sm text-red-700 bg-red-50 border px-3 py-2">{err}</div>}

            <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="flex justify-between gap-2">
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={!isOtpComplete || loading}
                className={`w-full text-white font-semibold py-2.5 rounded-lg transition ${
                  !isOtpComplete || loading ? "bg-red-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Verifying…" : "Verify OTP"}
              </button>
              <p className="text-sm text-gray-500 text-center">
                Didn’t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-red-600 font-medium hover:underline disabled:text-red-300"
                >
                  Resend
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
