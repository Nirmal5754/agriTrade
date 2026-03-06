import React from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Login from "./Login";

/* FARMER */
import FHome from "./Farmer/FHome/FHome";
import Addcrop from "./Farmer/Addcrops/Addcrop";
import Addcropform from "./Farmer/Addcrops/addcropform";
import Myaddedcrops from "./Farmer/MyAddedCrops/Myaddedcrops";
import Editcropcard from "./Farmer/Addcrops/Editcropcard";
import Bidderslist from "./Farmer/BiddersList/BiddersList";
import Fnavbar from "./Farmer/Fnavbar/Fnavbar";
import FChats from "./Farmer/Chat/FChats";
import FMessage from "./Farmer/Chat/FMessage";

/* BUYER */
import BHome from "./Buyer/BHome/BHome";
import Mybidlist from "./Buyer/Mybidlist/Mybidlist";
import BChats from "./Buyer/Chats/BChats";
import Bidportal from "./Buyer/Bhome/Bidportal";
import Cropdetails from "./Buyer/Bhome/Cropdetails";
import Bnavbar from "./Buyer/Bnavbar/Bnavbar";
import BLeaderboard from "./Buyer/Leaderboard/BLeaderboard";
import BMessage from "./Buyer/Chats/BMessage";

/* LAYOUTS */
const FarmerLayout = () => (
  <>
    <Fnavbar/>
    <Outlet />
  </>
);

const BuyerLayout = () => (
  <>
    <Bnavbar />
    <Outlet />
  </>
);

const Project = () => (
  <BrowserRouter>
  <Routes>

    {/* No navbar */}
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />

    {/* Farmer routes */}
    <Route path="/" element={<FarmerLayout />}>
      <Route path="fhome" element={<FHome />} />
      <Route path="addcrop" element={<Addcrop />} />
      <Route path="addcropform" element={<Addcropform />} />
      <Route path="myaddedcrops" element={<Myaddedcrops />} />
      <Route path="editcropcard" element={<Editcropcard />} />
      <Route path="bidderslist" element={<Bidderslist />} />
      <Route path="fchats" element={<FChats />} />
      <Route path="fmessage/:cropId" element={<FMessage />} />
    </Route>

    {/* Buyer routes */}
    <Route path="/" element={<BuyerLayout />}>
      <Route path="bhome" element={<BHome />} />
      <Route path="mybidlist" element={<Mybidlist />} />
      <Route path="bchats" element={<BChats />} />
      <Route path="bleaderboard" element={<BLeaderboard />} />
      <Route path="bidportal" element={<Bidportal />} />
      <Route path="cropdetails" element={<Cropdetails />} />
      <Route path="bmessage/:cropId" element={<BMessage />} />
    </Route>

  </Routes>
</BrowserRouter>

);

export default Project;
