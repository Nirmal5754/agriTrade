import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Bnavbar = () => {
  const navigate = useNavigate();

  return (
   
      <div className='z-100 grid fixed grid-flow-col bg-green-800 items-center min-w-screen left-0 py-5 top-0 text-white font-semibold'>
       
        <div className='grid-cols-2 justify-center text-center'> <i>Logo</i></div>
          <nav className="bnavbar grid-cols-10 justify-center text-center">
        <ul className="bmenus flex gap-15">
          <li><NavLink to="/bhome">Home</NavLink></li>
          <li><NavLink to="/mybidlist">My Bids</NavLink></li>
          <li><NavLink to="/bleaderboard">Leaderboard</NavLink></li>
          <li><NavLink to="/bchats">Chats</NavLink></li>
          <li>
            <button onClick={() => navigate("/login")} className='ml-35'>Go to Login</button>
          </li>
        </ul>
      </nav>
      </div>

    
   
  );
};

export default Bnavbar;
