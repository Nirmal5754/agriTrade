import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../Redux/Slices/authSlice";

const Fnavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [open, setOpen] = useState(false);

  const initials = useMemo(() => {
    const name = `${user?.fname || ""} ${user?.lname || ""}`.trim();
    if (!name) return "U";
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
  }, [user?.fname, user?.lname]);



  const goToLogin = () => {
    dispatch(logoutUser());
    setOpen(false);
    navigate("/login");
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // If the user resizes from mobile -> desktop while the drawer is open,
  // close it so they don't see both desktop nav + drawer at the same time.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => {
      if (e.matches) setOpen(false);
    };

    if (mq.matches) setOpen(false);

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-green-900 text-white">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <div className="font-bold pt-3 ml-10">
            <i><img src="/src/assets/finalallu.png" className="h-40 w-70" alt="" /></i>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-15 ml-40 justify-between  font-semibold">
            <NavLink to="/fhome" >
              Home
            </NavLink>
            <NavLink to="/addcrop" >
              Add Crop
            </NavLink>
            <NavLink to="/myaddedcrops" >
              My Added Crops
            </NavLink>
            <NavLink to="/bidderslist" >
              Bidders List
            </NavLink>
            <NavLink to="/fchats" >
              Chats
            </NavLink>
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-7 ml-30">
            <div
              className="grid h-[34px] w-[34px] place-items-center rounded-full bg-yellow-400 text-amber-950 font-extrabold"
              title={`${user?.fname || ""} ${user?.lname || ""}`.trim() || "User"}
            >
              {initials}
            </div>
            <button
              type="button"
              onClick={goToLogin}
              className="rounded-md bg-white px-3 py-1.5 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-100 active:scale-[0.99]"
            >
              Go to Login
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden ml-auto rounded-md border border-white/70 px-3 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/10 active:scale-[0.99]"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
         <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-green-800 text-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
              <div className="font-bold">Farmer Menu</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 font-bold hover:bg-white/10"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
              </button>
            </div>

            <nav className="flex flex-col gap-1 p-3 font-semibold">
              <NavLink to="/fhome" onClick={() => setOpen(false)} className="mt-3  " >
                Home
              </NavLink>
              <NavLink to="/addcrop" onClick={() => setOpen(false)} className="mt-3 ">
                Add Crop
              </NavLink>
              <NavLink to="/myaddedcrops" onClick={() => setOpen(false)} className="mt-3 ">
                My Added Crops
              </NavLink>
              <NavLink to="/bidderslist" onClick={() => setOpen(false)} className="mt-3 ">
                Bidders List
              </NavLink>
              <NavLink to="/fchats" onClick={() => setOpen(false)} className="mt-3 ">
                Chats
              </NavLink>
            </nav>

            <div className="mt-auto p-4 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-[38px] w-[38px] place-items-center rounded-full bg-yellow-400 text-amber-950 font-extrabold"
                  title={`${user?.fname || ""} ${user?.lname || ""}`.trim() || "User"}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {`${user?.fname || ""} ${user?.lname || ""}`.trim() || "User"}
                  </div>
                  <div className="text-white/75 text-xs font-semibold">Farmer</div>
                </div>
              </div>

              <button
                type="button"
                onClick={goToLogin}
                className="mt-4 w-full rounded-md bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-100 active:scale-[0.99]"
              >
                Go to Login
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Fnavbar;
