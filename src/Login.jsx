import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [section, setSection] = useState("login");
  const navigate = useNavigate();

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

  // REGEX
  const emailReg = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneReg = /^[6-9]\d{9}$/;

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
      alert("Fix errors first!");
      return;
    }

    const id = Date.now();

    const user = {
      id,
      fname: fnameRef.current.value.trim(),
      lname: lnameRef.current.value.trim(),
      emailOrPhone: emailorphoneRef.current.value.trim().toLowerCase(),
      password: passRef.current.value.trim(),
    };

    const storageKey = type === "farmer" ? "farmers" : "buyers";
    const users = JSON.parse(localStorage.getItem(storageKey)) || [];
    users.push(user);
    localStorage.setItem(storageKey, JSON.stringify(users));

    // ✅ Create separated storage for this user
    if (type === "farmer") {
      localStorage.setItem(`farmerCrops_${id}`, JSON.stringify([]));
    } else {
      localStorage.setItem(`buyerData_${id}`, JSON.stringify([]));
    }

    // ✅ Automatically log in user
    localStorage.setItem(
      "loggedInUser",
      JSON.stringify({
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        role: type,
        emailOrPhone: user.emailOrPhone,
      })
    );

    alert(`${type === "farmer" ? "Farmer" : "Buyer"} Registered Successfully!`);

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
  }

  // -------------------- Login --------------------
  function handleLogin() {
    if (!checkEmailOrPhone() || !checkPassword()) {
      alert("Fix errors first!");
      return;
    }

    const value = emailorphoneRef.current.value.trim().toLowerCase();
    const password = passRef.current.value.trim();

    const farmers = JSON.parse(localStorage.getItem("farmers")) || [];
    const buyers = JSON.parse(localStorage.getItem("buyers")) || [];

    const foundFarmer = farmers.find(
      (u) => u.emailOrPhone === value && u.password === password
    );
    const foundBuyer = buyers.find(
      (u) => u.emailOrPhone === value && u.password === password
    );

    if (foundFarmer) {
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          id: foundFarmer.id,
          fname: foundFarmer.fname,
          lname: foundFarmer.lname,
          role: "farmer",
          emailOrPhone: foundFarmer.emailOrPhone,
        })
      );
      alert("Farmer Login Successful");
      navigate("/fhome"); // navigate to addcrop
    } else if (foundBuyer) {
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({
          id: foundBuyer.id,
          fname: foundBuyer.fname,
          lname: foundBuyer.lname,
          role: "buyer",
          emailOrPhone: foundBuyer.emailOrPhone,
        })
      );
      alert("Buyer Login Successful");
      navigate("/bhome");
    } else {
      alert("Invalid Credentials!");
    }
  }

  // -------------------- JSX --------------------
  return (
    <div className="loginpage">
      <div className="header">
        <div
          className={section === "farmer" ? "indicator" : ""}
          onClick={() => setSection("farmer")}
        >
          Farmer Registration
        </div>
        <div
          className={section === "buyer" ? "indicator" : ""}
          onClick={() => setSection("buyer")}
        >
          Buyer Registration
        </div>
        <div
          className={section === "login" ? "indicator" : ""}
          onClick={() => setSection("login")}
        >
          Login
        </div>
      </div>

      <div className="main">
        {section === "login" && (
          <>
            <div className="emailphoneW">
              <label>Email / Phone :</label>
              <input ref={emailorphoneRef} type="text" onKeyUp={checkEmailOrPhone} />
              <p ref={emailorphoneErr}></p>
            </div>
            <div className="passwordW">
              <label>Password :</label>
              <input ref={passRef} type="password" onKeyUp={checkPassword} />
              <p ref={passErr}></p>
            </div>
            <button onClick={handleLogin} className="loginbutton">
              Login
            </button>
          </>
        )}

        {section === "farmer" && (
          <>
            <div className="firstnameW">
              <label>First Name :</label>
              <input ref={fnameRef} type="text" onKeyUp={() => checkName(fnameRef, fnameErr)} />
              <p ref={fnameErr}></p>
            </div>
            <div className="lastnameW">
              <label>Last Name :</label>
              <input ref={lnameRef} type="text" onKeyUp={() => checkName(lnameRef, lnameErr)} />
              <p ref={lnameErr}></p>
            </div>
            <div className="emailphoneW">
              <label>Email / Phone :</label>
              <input ref={emailorphoneRef} type="text" onKeyUp={checkEmailOrPhone} />
              <p ref={emailorphoneErr}></p>
            </div>
            <div className="passwordW">
              <label>Password :</label>
              <input ref={passRef} type="password" onKeyUp={checkPassword} />
              <p ref={passErr}></p>
            </div>
            <div className="confirmpasswordW">
              <label>Confirm Password :</label>
              <input ref={confPassRef} type="password" onKeyUp={checkConfirmPassword} />
              <p ref={confPassErr}></p>
            </div>
            <button onClick={() => handleRegister("farmer")} className="regfarmer">
              Register Farmer
            </button>
          </>
        )}

        {section === "buyer" && (
          <>
            <div className="firstnameW">
              <label>First Name :</label>
              <input ref={fnameRef} type="text" onKeyUp={() => checkName(fnameRef, fnameErr)} />
              <p ref={fnameErr}></p>
            </div>
            <div className="lastnameW">
              <label>Last Name :</label>
              <input ref={lnameRef} type="text" onKeyUp={() => checkName(lnameRef, lnameErr)} />
              <p ref={lnameErr}></p>
            </div>
            <div className="emailphoneW">
              <label>Email / Phone :</label>
              <input ref={emailorphoneRef} type="text" onKeyUp={checkEmailOrPhone} />
              <p ref={emailorphoneErr}></p>
            </div>
            <div className="passwordW">
              <label>Password :</label>
              <input ref={passRef} type="password" onKeyUp={checkPassword} />
              <p ref={passErr}></p>
            </div>
            <div className="confirmpasswordW">
              <label>Confirm Password :</label>
              <input ref={confPassRef} type="password" onKeyUp={checkConfirmPassword} />
              <p ref={confPassErr}></p>
            </div>
            <button onClick={() => handleRegister("buyer")} className="regbuyer">
              Register Buyer
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
