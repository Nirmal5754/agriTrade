import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Login from './Login'
import Addcropform from './Farmer/Addcrops/addcropform'
import Addcrop from './Farmer/Addcrops/Addcrop'
import Project from './Project'
import { BrowserRouter } from 'react-router-dom'

 import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
{/* <BrowserRouter> */}
{/* <Addcrop/> */}
<Project/> 
{/* </BrowserRouter> */}


  </StrictMode>,
)
