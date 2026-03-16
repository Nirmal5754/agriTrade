import React from 'react'
import { NavLink } from 'react-router-dom';





const FHome = () => {

  return (
    <div className='flex flex-col items-center justify-center bg-green-50 min-h-screen w-full'>


{/* header  */}

<h1> this is Farmers Home page</h1>

    {/* hero */}
    <div className="hero">
      <div className="slider">
    <div className="sliderscreen">
      {/* <img className='sliderimages' src="" alt="" />
      <img className='sliderimages' src="" alt="" />
      <img className='sliderimages' src="" alt="" />
      <img className='sliderimages' src="" alt="" /> */}
      <div className="indicators">
        <div className="ind"></div>
        <div className="ind"></div>
        <div className="ind"></div>
      </div>
    </div>
      </div>
    </div>

{/* main  */}
<div className='main'>
  <div className="mhead">

  </div>
</div>


{/* footer  */}
<footer>

</footer>


    </div>
  )
}

export default FHome;


