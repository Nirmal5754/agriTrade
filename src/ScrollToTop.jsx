import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Fixes "navigation works only after refresh" feel by resetting scroll on route change.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
