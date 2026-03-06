import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Fnavbar = () => {
  const navigate = useNavigate();

  return (
    <div className='w-full z-100  fixed top-0 left-0 flex gap-4 min-w-screen font-semibold  bg-green-800 p-5 items-center text-white text-decoration-color'>
      <div className="brand ml-30">
        <i>Logo</i>
      </div>

      <nav className='navbar ml-90 pt-2'>
        <ul className='menus  list-style-none gap-10 flex'>
          <li><NavLink to="/fhome" className="navoptions">Home</NavLink></li>
          <li><NavLink to="/addcrop" className="navoptions">Add Crop</NavLink></li>
          <li><NavLink to="/myaddedcrops" className="navoptions">My Added Crops</NavLink></li>
          <li><NavLink to="/bidderslist" className="navoptions">Bidders List</NavLink></li>
          <li><NavLink to="/fchats" className="navoptions">Chats</NavLink></li>
          <li>
            <button onClick={() => navigate("/login")}>Go to Login</button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Fnavbar;
