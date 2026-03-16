import React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
} from "react-router-dom";

import Login from "./Login";
import ScrollToTop from "./ScrollToTop";
import ProtectedRoute from "./ProtectedRoute";

/* FARMER */
import FHome from "./Farmer/FHome/FHome";
import Addcrop from "./Farmer/Addcrops/Addcrop";
import Addcropform from "./Farmer/Addcrops/Addcropform";
import Myaddedcrops from "./Farmer/MyAddedCrops/Myaddedcrops";
import Editcropcard from "./Farmer/Addcrops/Editcropcard";
import Bidderslist from "./Farmer/BiddersList/Bidderslist";
import FChats from "./Farmer/Chat/FChats";
import FMessage from "./Farmer/Chat/FMessage";
import Fnavbar from "./Farmer/Fnavbar/Fnavbar";

/* BUYER */
import BHome from "./Buyer/Bhome/Bhome";
import Mybidlist from "./Buyer/Mybidlist/Mybidlist";
import BChats from "./Buyer/Chats/BChats";
import Bidportal from "./Buyer/Bhome/Bidportal";
import Cropdetails from "./Buyer/Bhome/Cropdetails";
import BLeaderboard from "./Buyer/Leaderboard/BLeaderboard";
import BMessage from "./Buyer/Chats/BMessage";
import Bnavbar from "./Buyer/Bnavbar/Bnavbar";

import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { hydrateDeleted, hydrateUserBids } from "./Redux/Slices/bidSlice";

const RootShell = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

const AppLayout = () => {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return;
    dispatch(hydrateUserBids({ userId: user.id }));
    dispatch(hydrateDeleted({ userId: user.id }));
  }, [dispatch, user?.id]);

  return (
    <>
      {user?.role === "farmer" ? <Fnavbar /> : <Bnavbar />}
      {/* Force remount on navigation to avoid "URL changes but page doesn't" issues. */}
      <Outlet key={location.key || location.pathname} />
    </>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootShell />}>
      {/* Public */}
      <Route index element={<Login />} />
      <Route path="login" element={<Login />} />

      {/* Protected area */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Farmer */}
        <Route
          path="fhome"
          element={
            <ProtectedRoute role="farmer">
              <FHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="addcrop"
          element={
            <ProtectedRoute role="farmer">
              <Addcrop />
            </ProtectedRoute>
          }
        />
        <Route
          path="addcropform"
          element={
            <ProtectedRoute role="farmer">
              <Addcropform />
            </ProtectedRoute>
          }
        />
        <Route
          path="myaddedcrops"
          element={
            <ProtectedRoute role="farmer">
              <Myaddedcrops />
            </ProtectedRoute>
          }
        />
        <Route
          path="editcropcard/:cropId"
          element={
            <ProtectedRoute role="farmer">
              <Editcropcard />
            </ProtectedRoute>
          }
        />
        <Route
          path="bidderslist"
          element={
            <ProtectedRoute role="farmer">
              <Bidderslist />
            </ProtectedRoute>
          }
        />
        <Route
          path="fchats"
          element={
            <ProtectedRoute role="farmer">
              <FChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="fmessage/:cropId"
          element={
            <ProtectedRoute role="farmer">
              <FMessage />
            </ProtectedRoute>
          }
        />

        {/* Buyer */}
        <Route
          path="bhome"
          element={
            <ProtectedRoute role="buyer">
              <BHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="mybidlist"
          element={
            <ProtectedRoute role="buyer">
              <Mybidlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="bchats"
          element={
            <ProtectedRoute role="buyer">
              <BChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="bleaderboard"
          element={
            <ProtectedRoute role="buyer">
              <BLeaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="bidportal/:cropId"
          element={
            <ProtectedRoute role="buyer">
              <Bidportal />
            </ProtectedRoute>
          }
        />
        <Route
          path="cropdetails"
          element={
            <ProtectedRoute role="buyer">
              <Cropdetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="bmessage/:cropId"
          element={
            <ProtectedRoute role="buyer">
              <BMessage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Route>
  )
);

const Project = () => <RouterProvider router={router} />;

export default Project;
