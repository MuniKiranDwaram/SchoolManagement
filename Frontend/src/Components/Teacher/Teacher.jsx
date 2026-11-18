import React, { useEffect, useState } from 'react'
import './Teacher.css'
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const Teacher = () => {
    const[TeachersList,setTeachersList] = useState({});
    const[openFilters,setOpenFilters] = useState(false);
    const[footerButtonContent,setFooterButtonContent] = useState("");
    const nav = useNavigate("");
    const path = useLocation();
    const segments = path.pathname.split("/");
    const lastSegment = segments[segments.length -1];

    useEffect(()=>{
      if(lastSegment == "addTeacher")
      {
        setFooterButtonContent("Search For Teacher Details");
      }
      else{
        setFooterButtonContent("Add Teacher Details");
      }
    },[segments])

    const handleFooterButtonClick = () =>{
      if(lastSegment == "addTeacher")
      {
        nav("searchTeacher");
      }
      else
      {
        nav("addTeacher");
      }
    }
  return (
    <div className='page-shell'>
      <div className='page-card'>
        <div className='section-head'>
          <div>
            <p className='section-kicker'>Staff management</p>
            <h2 className='section-title'>Teachers</h2>
          </div>
          <button className='secondary-action' onClick={handleFooterButtonClick}>{footerButtonContent}</button>
        </div>

        <div className='w-full'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Teacher