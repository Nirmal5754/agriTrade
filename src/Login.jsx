import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import "./Login.css";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, selectBuyers, selectFarmers } from "./Redux/Slices/authSlice";
import { toast } from "./ui/toast";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import bg from '../src/assets/new page.jpg'

const Login = () => {
  const [section, setSection] = useState("login");
  const navigate = useNavigate();
const dispatch = useDispatch();
const farmers = useSelector(selectFarmers);
const buyers = useSelector(selectBuyers);
const currentUser = useSelector((state) => state.auth.user);
const cooldownTimerRef = useRef(null);
  const [emailOrPhoneValue, setEmailOrPhoneValue] = useState("");

  // OTP state (used only for registration screens)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpErrorMsg, setOtpErrorMsg] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpConfirmation, setOtpConfirmation] = useState(null);
  const [otpPhone, setOtpPhone] = useState("");
const [cooldown, setCooldown] = useState(0);
  // Google sign-in: if email doesn't exist in buyers/farmers yet, user chooses role
  const [googlePending, setGooglePending] = useState(null);

useEffect(() => {
  if (!currentUser) return;
  navigate(currentUser.role === "farmer" ? "/fhome" : "/bhome");
}, [currentUser, navigate]);

  const resetOtpState = () => {
    setOtpSent(false);
    setOtpCode("");
    setOtpVerified(false);
    setOtpErrorMsg("");
    setOtpExpiresAt(0);
    setOtpSecondsLeft(0);
    setOtpLoading(false);
    setOtpConfirmation(null);
    setOtpPhone("");
  };

  const getNameParts = (displayName) => {
    const raw = String(displayName || "").trim();
    if (!raw) return { fname: "User", lname: "" };
    const parts = raw.split(/\s+/).filter(Boolean);
    return { fname: parts[0] || "User", lname: parts.slice(1).join(" ") || "" };
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(firebaseAuth, provider);
      const gUser = result?.user;

      const email = String(gUser?.email || "").trim().toLowerCase();
      if (!email) {
        toast.error("Google account has no email. Please try another account.");
        return;
      }

      // If this email already exists in our local DB, log in with that role.
      const foundFarmer = farmers.find((u) => u.emailOrPhone === email);
      const foundBuyer = buyers.find((u) => u.emailOrPhone === email);

      if (foundFarmer) {
        dispatch(
          loginUser({
            id: foundFarmer.id,
            fname: foundFarmer.fname,
            lname: foundFarmer.lname,
            role: "farmer",
            emailOrPhone: foundFarmer.emailOrPhone,
          })
        );
        toast.success("Logged in with Google");
        return;
      }

      if (foundBuyer) {
        dispatch(
          loginUser({
            id: foundBuyer.id,
            fname: foundBuyer.fname,
            lname: foundBuyer.lname,
            role: "buyer",
            emailOrPhone: foundBuyer.emailOrPhone,
          })
        );
        toast.success("Logged in with Google");
        return;
      }

      // New Google user: ask role (Buyer/Farmer) before creating in localStorage.
      setGooglePending({
        uid: gUser?.uid || "",
        email,
        displayName: gUser?.displayName || "",
      });
      toast.success("Google verified. Choose Buyer/Farmer to continue.");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      toast.error(String(err?.code || err?.message || "Google sign-in failed"));
    } finally {
      // We only use Firebase to verify identity; keep Firebase session clean.
      signOut(firebaseAuth).catch(() => {});
    }
  };

  const finalizeGoogleRole = (role) => {
    if (!googlePending?.email) {
      toast.error("Please click Continue with Google again.");
      return;
    }

    const { fname, lname } = getNameParts(googlePending.displayName);

    const id = Date.now();
    const user = {
      id,
      fname,
      lname,
      emailOrPhone: googlePending.email,
      // Not used for Google login, but we keep schema unchanged.
      password: `google_${String(googlePending.uid || "user").slice(0, 8)}_${id}`,
      firebaseUid: googlePending.uid,
    };

    dispatch(registerUser({ role, user }));
    dispatch(
      loginUser({
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        role,
        emailOrPhone: user.emailOrPhone,
      })
    );

    setGooglePending(null);
    toast.success(`Welcome ${role === "farmer" ? "Farmer" : "Buyer"}!`);
  };


  // COMMON INPUT REFS
  const fnameRef = useRef();
  const lnameRef = useRef();
  const emailorphoneRef = useRef();
  const passRef = useRef();
  const confPassRef = useRef();

  // ERROR REFS
  const fnameErr = useRef();
  const lnameErr = useRef();
  const emailorphoneErr = useRef();
  const passErr = useRef();
  const confPassErr = useRef();

  // OTP helpers (no JSX element needed; we create a hidden container programmatically)
  useEffect(() => {
    resetOtpState();
    setGooglePending(null);
  }, [section]);

  useEffect(() => {
    if (!otpSent || !otpExpiresAt) return;

    const tick = () => {
      const left = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
      setOtpSecondsLeft(left);
      if (left <= 0) {
        setOtpErrorMsg("OTP expired. Please click Resend OTP.");
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [otpSent, otpExpiresAt]);

  const resetRecaptcha = () => {
    if (typeof window === "undefined") return;

    try {
      window.recaptchaVerifier?.clear?.();
    } catch {}

    window.recaptchaVerifier = null;

    const existing = document.getElementById("recaptcha-container");
    if (existing) {
      try {
        existing.remove();
      } catch {
        existing.innerHTML = "";
      }
    }
  };

  const ensureRecaptcha = () => {
    if (typeof window === "undefined") return null;

    if (!window.recaptchaVerifier) {
      // If a previous verifier rendered into the same element, Firebase throws:
      // "captcha has already rendered in this element". Removing the container
      // guarantees a clean mount for retries/resends.
      resetRecaptcha();

      const el = document.createElement("div");
      el.id = "recaptcha-container";
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "-9999px";
      document.body.appendChild(el);

      // Firebase v12+ uses signature: new RecaptchaVerifier(auth, container, params)
      window.recaptchaVerifier = new RecaptchaVerifier(
        firebaseAuth,
        el,
        { size: "invisible" }
      );
    }

    return window.recaptchaVerifier;
  };

  const requestOtp = async () => {
    if (cooldown > 0) {
  toast.error("Wait before requesting OTP again");
  return;
}
    const raw = (emailorphoneRef.current?.value || "").trim();
    if (!isIndianMobile(raw)) {
      toast.error("Enter a valid Indian mobile number first");
      return;
    }

    setOtpErrorMsg("");
    setOtpLoading(true);

    try {
      const verifier = ensureRecaptcha();
      if (!verifier) throw new Error("reCAPTCHA init failed");

      const phoneE164 = `+91${raw}`;
      const confirmation = await signInWithPhoneNumber(
        firebaseAuth,
        phoneE164,
        verifier
      );

      setOtpConfirmation(confirmation);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpPhone(raw);

      const expiresAt = Date.now() + 3 * 60 * 1000;
      setOtpExpiresAt(expiresAt);
      setOtpSecondsLeft(180);

      toast.success("OTP sent to your mobile number");
setCooldown(60);

if (cooldownTimerRef.current) {
  clearInterval(cooldownTimerRef.current);
}

cooldownTimerRef.current = setInterval(() => {
  setCooldown((prev) => {
    if (prev <= 1) {
      clearInterval(cooldownTimerRef.current);
      return 0;
    }
    return prev - 1;
  });
}, 1000);

    } catch (err) {
      resetOtpState();
      console.error("requestOtp failed:", err);
      const code = err?.code || err?.message || "Failed to send OTP";
      setOtpErrorMsg(String(code));
      toast.error(String(code));

      // Reset verifier so next attempt can re-init
      resetRecaptcha();
    } finally {
      setOtpLoading(false);
    }
  };

useEffect(() => {
  return () => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
  };
}, []);

  const verifyOtp = async () => {
    if (!otpConfirmation) {
      toast.error("Please request OTP first");
      return;
    }

    if (otpExpired) {
      setOtpErrorMsg("OTP expired. Please click Resend OTP.");
      toast.error("OTP expired");
      return;
    }

    const code = String(otpCode || "").trim();
    if (!otpReg.test(code)) {
      setOtpErrorMsg("Enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    setOtpErrorMsg("");

    try {
      await otpConfirmation.confirm(code);
      setOtpVerified(true);
      setOtpErrorMsg("");
      toast.success("OTP verified");

      // We only need the verification; keep Firebase auth session clean for this app.
      signOut(firebaseAuth).catch(() => {});
    } catch (err) {
      setOtpVerified(false);
      console.error("verifyOtp failed:", err);
      const code = err?.code || "Invalid OTP. Please try again.";
      setOtpErrorMsg(String(code));
      toast.error(String(code));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleEmailOrPhoneChange = (e) => {
    const v = e.target.value;
    setEmailOrPhoneValue(v);

    // If user changes number after requesting OTP, invalidate OTP state
    if (otpSent && otpPhone && String(v || "").trim() !== String(otpPhone)) {
      resetOtpState();
    }
  };

  // REGEX
  const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneReg = /^[6-9]\d{9}$/;
  const otpReg = /^\d{6}$/;

  const isIndianMobile = (v) => phoneReg.test(String(v || "").trim());
  const isEmail = (v) => emailReg.test(String(v || "").trim().toLowerCase());

  const otpExpired = otpSent && otpSecondsLeft <= 0;

  const formatMmSs = (totalSeconds) => {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(Math.floor(s % 60)).padStart(2, "0");
    return `${mm}:${ss}`;
  };




  // -------------------- Validation Functions --------------------
  function checkName(ref, errRef) {
    const value = (ref.current?.value || "").trim();
    if (!value) {
      errRef.current.innerHTML = "This field is required!";
      errRef.current.classList.add("change");
      ref.current.classList.remove("change2");
      ref.current.classList.add("change");
      return false;
    }
    if (value.length < 2) {
      errRef.current.innerHTML = "Minimum 2 characters required!";
      errRef.current.classList.add("change");
      ref.current.classList.remove("change2");
      ref.current.classList.add("change");
      return false;
    }
    if (value.length > 20) {
      errRef.current.innerHTML = "Maximum 20 characters allowed!";
      errRef.current.classList.add("change");
      ref.current.classList.remove("change2");
      ref.current.classList.add("change");
      return false;
    }
    errRef.current.innerHTML = "";
    ref.current.classList.remove("change");
    ref.current.classList.add("change2");
    return true;
  }

  function checkEmailOrPhone() {
    const value = (emailorphoneRef.current?.value || "").trim();
    if (!value) {
      emailorphoneErr.current.innerHTML = "Email or Phone is required!";
      emailorphoneErr.current.classList.add("change");
      emailorphoneRef.current.classList.remove("change2");
      emailorphoneRef.current.classList.add("change");
      return false;
    }

    if (/[a-zA-Z]/.test(value)) {
      if (!emailReg.test(value)) {
        emailorphoneErr.current.innerHTML = "Enter valid email!";
        emailorphoneErr.current.classList.add("change");
        emailorphoneRef.current.classList.remove("change2");
        emailorphoneRef.current.classList.add("change");
        return false;
      }
    } else {
      if (!phoneReg.test(value)) {
        emailorphoneErr.current.innerHTML = "Enter valid phone number!";
        emailorphoneErr.current.classList.add("change");
        emailorphoneRef.current.classList.remove("change2");
        emailorphoneRef.current.classList.add("change");
        return false;
      }
    }

    emailorphoneErr.current.innerHTML = "";
    emailorphoneRef.current.classList.remove("change");
    emailorphoneRef.current.classList.add("change2");
    return true;
  }

  function checkPassword() {
    const value = (passRef.current?.value || "").trim();
    const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    if (!value) {
      passErr.current.innerHTML = "Password is required!";
      passErr.current.classList.add("change");
      passRef.current.classList.remove("change2");
      passRef.current.classList.add("change");
      return false;
    }
    if (!passwordReg.test(value)) {
      passErr.current.innerHTML =
        "Password must be 8-20 chars, include uppercase, lowercase, number & special char!";
      passErr.current.classList.add("change");
      passRef.current.classList.remove("change2");
      passRef.current.classList.add("change");
      return false;
    }

    passErr.current.innerHTML = "";
    passRef.current.classList.remove("change");
    passRef.current.classList.add("change2");
    return true;
  }

  function checkConfirmPassword() {
    const value = (confPassRef.current?.value || "").trim();
    if (!value) {
      confPassErr.current.innerHTML = "Confirm your password!";
      confPassErr.current.classList.add("change");
      confPassRef.current.classList.remove("change2");
      confPassRef.current.classList.add("change");
      return false;
    }
    if (value !== passRef.current.value.trim()) {
      confPassErr.current.innerHTML = "Passwords do not match!";
      confPassErr.current.classList.add("change");
      confPassRef.current.classList.remove("change2");
      confPassRef.current.classList.add("change");
      return false;
    }
    confPassErr.current.innerHTML = "";
    confPassRef.current.classList.remove("change");
    confPassRef.current.classList.add("change2");
    return true;
  }

  // -------------------- Register --------------------
  function handleRegister(type) {
    if (
      !checkName(fnameRef, fnameErr) ||
      !checkName(lnameRef, lnameErr) ||
      !checkEmailOrPhone() ||
      !checkPassword() ||
      !checkConfirmPassword()
    ) {
      toast.error("Fix errors first!");
      return;
    }

    const entered = (emailorphoneRef.current?.value || "").trim().toLowerCase();
    const enteredIsPhone = isIndianMobile(entered);
    const enteredIsEmail = isEmail(entered);

    if (!enteredIsPhone && !enteredIsEmail) {
      toast.error("Enter a valid email or Indian mobile number");
      return;
    }

    // If registering with phone, OTP verification is mandatory
    if (enteredIsPhone) {
      if (!otpSent || otpPhone !== entered) {
        toast.error("Please request OTP for this mobile number");
        return;
      }
      if (otpExpired) {
        toast.error("OTP expired. Please resend OTP.");
        return;
      }
      if (!otpVerified) {
        toast.error("Please verify OTP before registering");
        return;
      }
    }

    const id = Date.now();

    const user = {
      id,
      fname: fnameRef.current.value.trim(),
      lname: lnameRef.current.value.trim(),
      emailOrPhone: emailorphoneRef.current.value.trim().toLowerCase(),
      password: passRef.current.value.trim(),
    };


    // Users registry is stored in Redux and persisted in localStorage by authSlice
    dispatch(registerUser({ role: type, user }));

    // Automatically log in user
 dispatch(
  loginUser({
    id: user.id,
    fname: user.fname,
    lname: user.lname,
    role: type,
    emailOrPhone: user.emailOrPhone,
  })
);

    toast.success(`${type === "farmer" ? "Farmer" : "Buyer"} Registered Successfully!`);

    // clear inputs
    fnameRef.current.value = "";
    lnameRef.current.value = "";
    emailorphoneRef.current.value = "";
    passRef.current.value = "";
    confPassRef.current.value = "";

    // switch to login section with prefilled credentials
    setSection("login");
    emailorphoneRef.current.value = user.emailOrPhone;
    passRef.current.value = user.password;
    resetOtpState();
  }

  // -------------------- Login --------------------
  function handleLogin() {
    if (!checkEmailOrPhone() || !checkPassword()) {
      toast.error("Fix errors first!");
      return;
    }

    const value = emailorphoneRef.current.value.trim().toLowerCase();
    const password = passRef.current.value.trim();


    const foundFarmer = farmers.find(
      (u) => u.emailOrPhone === value && u.password === password
    );
    const foundBuyer = buyers.find(
      (u) => u.emailOrPhone === value && u.password === password
    );

    if (foundFarmer) {
     dispatch(
  loginUser({
    id: foundFarmer.id,
    fname: foundFarmer.fname,
    lname: foundFarmer.lname,
    role: "farmer",
    emailOrPhone: foundFarmer.emailOrPhone,
  })
);
      toast.success("Farmer Login Successful");
      navigate("/fhome"); // navigate to addcrop
    } else if (foundBuyer) {
     dispatch(
  loginUser({
    id: foundBuyer.id,
    fname: foundBuyer.fname,
    lname: foundBuyer.lname,
    role: "buyer",
    emailOrPhone: foundBuyer.emailOrPhone,
  })
);
      toast.success("Buyer Login Successful");
      navigate("/bhome");
    } else {
      toast.error("Invalid Credentials!");
    }
  }

  // -------------------- JSX --------------------
  return (
<div
  className="loginpage relative min-h-screen w-full flex flex-col items-center justify-center px-4 bg-cover bg-center"
  style={{ backgroundImage: `url(${bg})` }}
>

  {/* Dark overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">


      <div className="header w-full max-w-[520px] rounded-t-xl overflow-hidden border border-black bg-black">
        <div className="select-none text-center py-3 text-sm font-semibold tracking-wide text-white">
          {section === "login"
            ? "Login"
            : section === "buyer"
            ? "Buyer Registration"
            : "Farmer Registration"}
        </div>
      </div>

   <div className="main relative z-10 w-full max-w-[520px] border border-t-0 border-black rounded-b-xl bg-white/90 backdrop-blur-md p-6 shadow-xl">
        {section === "login" && (
          <>
            <div className="emailphoneW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="login-email"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={emailorphoneRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={checkEmailOrPhone}
                />
                <label
                  htmlFor="login-email"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Email / Phone
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={emailorphoneErr}></p>
            </div>
            <div className="passwordW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="login-pass"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={passRef}
                  type="password"
                  placeholder=" "
                  onKeyUp={checkPassword}
                />
                <label
                  htmlFor="login-pass"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Password
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={passErr}></p>
            </div>
            <button onClick={handleLogin} className="loginbutton w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]">
              Login
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200"></div>
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full rounded-md flex items-center gap-3 justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
            >
        <img src="/src/assets/pngh.png" alt="Google" className="h-6 w-6"/><span>Continue with Google </span>  
            </button>

            {googlePending?.email && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">
                  Choose account type for {googlePending.email}
                </p>
                <div className="mt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => finalizeGoogleRole("buyer")}
                    className="flex-1 rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    Continue as Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeGoogleRole("farmer")}
                    className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-neutral-800"
                  >
                    Continue as Farmer
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
              <span className="text-neutral-700">No account?</span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSection("buyer")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Register as Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setSection("farmer")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Register as Farmer
                </button>
              </div>
            </div>
          </>
        )}

        {section === "farmer" && (
          <>
            <div className="firstnameW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="farmer-fname"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={fnameRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={() => checkName(fnameRef, fnameErr)}
                />
                <label
                  htmlFor="farmer-fname"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  First Name
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={fnameErr}></p>
            </div>
            <div className="lastnameW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="farmer-lname"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={lnameRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={() => checkName(lnameRef, lnameErr)}
                />
                <label
                  htmlFor="farmer-lname"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Last Name
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={lnameErr}></p>
            </div>
            <div className="emailphoneW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="farmer-email"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 pr-28 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={emailorphoneRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={checkEmailOrPhone}
                  onChange={handleEmailOrPhoneChange}
                />
                <label
                  htmlFor="farmer-email"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Email / Phone
                </label>

                {isIndianMobile(emailOrPhoneValue) && (
                  <button
                    type="button"
                    onClick={requestOtp}
                  disabled={
  otpLoading || otpVerified || (otpSent && !otpExpired) || cooldown > 0
}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {otpVerified
  ? "Verified"
  : cooldown > 0
  ? `Wait ${cooldown}s`
  : otpSent && !otpExpired
  ? formatMmSs(otpSecondsLeft)
  : otpExpired
  ? "Resend OTP"
  : "Request OTP"}
                  </button>
                )}
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={emailorphoneErr}></p>

              {isIndianMobile(emailOrPhoneValue) && otpSent && !otpVerified && (
                <div className="mt-2 rounded-lg border border-neutral-200 bg-white/60 p-3">
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ""));
                        setOtpErrorMsg("");
                      }}
                      placeholder="Enter 6-digit OTP"
                      className="w-full flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otpLoading || otpExpired}
                      className="rounded-md bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify OTP
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-neutral-700">
                    Time left: {formatMmSs(otpSecondsLeft)} / 03:00
                  </div>
                  {otpErrorMsg && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {otpErrorMsg}
                    </p>
                  )}
                </div>
              )}

              {isIndianMobile(emailOrPhoneValue) && otpVerified && (
                <p className="mt-2 text-xs font-bold text-emerald-700">
                  Phone verified
                </p>
              )}
            </div>
            <div className="passwordW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="farmer-pass"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={passRef}
                  type="password"
                  placeholder=" "
                  onKeyUp={checkPassword}
                />
                <label
                  htmlFor="farmer-pass"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Password
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={passErr}></p>
            </div>
            <div className="confirmpasswordW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="farmer-conf"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={confPassRef}
                  type="password"
                  placeholder=" "
                  onKeyUp={checkConfirmPassword}
                />
                <label
                  htmlFor="farmer-conf"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Confirm Password
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={confPassErr}></p>
            </div>
            <button onClick={() => handleRegister("farmer")} className="regfarmer w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]">
              Register Farmer
            </button>

            <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm text-neutral-700">
              <div>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setSection("login")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Login
                </button>
              </div>
              <div>
                Register as{" "}
                <button
                  type="button"
                  onClick={() => setSection("buyer")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Buyer
                </button>
              </div>
            </div>
          </>
        )}

        {section === "buyer" && (
          <>
            <div className="firstnameW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="buyer-fname"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={fnameRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={() => checkName(fnameRef, fnameErr)}
                />
                <label
                  htmlFor="buyer-fname"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  First Name
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={fnameErr}></p>
            </div>
            <div className="lastnameW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="buyer-lname"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={lnameRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={() => checkName(lnameRef, lnameErr)}
                />
                <label
                  htmlFor="buyer-lname"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Last Name
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={lnameErr}></p>
            </div>
            <div className="emailphoneW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="buyer-email"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 pr-28 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={emailorphoneRef}
                  type="text"
                  placeholder=" "
                  onKeyUp={checkEmailOrPhone}
                  onChange={handleEmailOrPhoneChange}
                />
                <label
                  htmlFor="buyer-email"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Email / Phone
                </label>

                {isIndianMobile(emailOrPhoneValue) && (
                  <button
                    type="button"
                    onClick={requestOtp}
                    disabled={
  otpLoading || otpVerified || (otpSent && !otpExpired) || cooldown > 0
}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-emerald-700 px-3 py-1 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                  {otpVerified
  ? "Verified"
  : cooldown > 0
  ? `Wait ${cooldown}s`
  : otpSent && !otpExpired
  ? formatMmSs(otpSecondsLeft)
  : otpExpired
  ? "Resend OTP"
  : "Request OTP"}
                  </button>
                )}
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={emailorphoneErr}></p>

              {isIndianMobile(emailOrPhoneValue) && otpSent && !otpVerified && (
                <div className="mt-2 rounded-lg border border-neutral-200 bg-white/60 p-3">
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ""));
                        setOtpErrorMsg("");
                      }}
                      placeholder="Enter 6-digit OTP"
                      className="w-full flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otpLoading || otpExpired}
                      className="rounded-md bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Verify OTP
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-neutral-700">
                    Time left: {formatMmSs(otpSecondsLeft)} / 03:00
                  </div>
                  {otpErrorMsg && (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {otpErrorMsg}
                    </p>
                  )}
                </div>
              )}

              {isIndianMobile(emailOrPhoneValue) && otpVerified && (
                <p className="mt-2 text-xs font-bold text-emerald-700">
                  Phone verified
                </p>
              )}
            </div>
            <div className="passwordW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="buyer-pass"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={passRef}
                  type="password"
                  placeholder=" "
                  onKeyUp={checkPassword}
                />
                <label
                  htmlFor="buyer-pass"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Password
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={passErr}></p>
            </div>
            <div className="confirmpasswordW flex flex-col gap-1">
              <div className="relative">
                <input
                  id="buyer-conf"
                  className="peer w-full rounded-md border border-neutral-300 bg-white px-3 pb-2 pt-5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 [&.change]:border-red-500 [&.change]:ring-2 [&.change]:ring-red-200 [&.change2]:border-green-600 [&.change2]:ring-2 [&.change2]:ring-green-200"
                  ref={confPassRef}
                  type="password"
                  placeholder=" "
                  onKeyUp={checkConfirmPassword}
                />
                <label
                  htmlFor="buyer-conf"
                  className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-neutral-600 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs"
                >
                  Confirm Password
                </label>
              </div>
              <p className="mt-1 min-h-[1rem] text-xs text-neutral-500 [&.change]:text-red-600 [&.change]:font-semibold" ref={confPassErr}></p>
            </div>
            <button onClick={() => handleRegister("buyer")} className="regbuyer w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]">
              Register Buyer
            </button>

            <div className="mt-4 flex flex-col items-center gap-2 text-center text-sm text-neutral-700">
              <div>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setSection("login")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Login
                </button>
              </div>
              <div>
                Register as{" "}
                <button
                  type="button"
                  onClick={() => setSection("farmer")}
                  className="font-bold text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Farmer
                </button>
              </div>
            </div>
          </>
        )}
      </div>
       
   
    </div>
    </div>
  );
};

export default Login;
