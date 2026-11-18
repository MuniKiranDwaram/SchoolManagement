import React, { useEffect, useState } from 'react'
import './TeacherView.css'
import edit from '../../../assets/Images/edit.png'

const TeacherView = () => {
  const[EditItem,setEditItem] = useState("");

  // useEffect(()=>{
  //   const mouseDown = document.addEventListener('mousedown', ()=>{
      
  //   })
  // },EditItem);
  return (
    <div id='Teacher-view' className='w-[75%]'>
        <div className='grid grid-cols-2'>
           <div>
             <p>Full Name</p>
           </div>
            <div>
              <p id='value' contentEditable={EditItem === "name"} className={`${EditItem == "name" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>D.Muni Kiran Reddy</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("name")}}/>
            </div>
            <div>
              <p>Class teacher of</p>
            </div>
            <div>
              <p id='value' contentEditable={EditItem === "class"} className={`${EditItem == "class" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>10th</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("class")}}/>
            </div>
            <div>
              <p>Subject</p>
            </div>
            <div>
              <p id='value' contentEditable={EditItem === "subject"} className={`${EditItem == "subject" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>Maths</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("subject")}}/>
            </div>
            <div><p>Salary</p></div>
            <div>
              <p id='value' contentEditable={EditItem === "salary"} className={`${EditItem == "salary" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>30000</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("salary")}}/>
            </div>
            <div><p>Date Of Birth</p></div>
            <div>
              <p id='value' contentEditable={EditItem === "dob"} className={`${EditItem == "dob" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>01/01/2021</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("dob")}}/>
            </div>
            <div><p>Date of Joining</p></div>
            <div>
              <p id='value' contentEditable={EditItem === "doj"} className={`${EditItem == "doj" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>01/01/2021</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("doj")}}/>
            </div>
            <div><p>Phone</p></div>
            <div>
              <p id='value' contentEditable={EditItem === "phone"} className={`${EditItem == "phone" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>01/01/2021</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("phone")}}/>
            </div>
            <div><p>Email</p></div>
            <div>
              <p id='value' contentEditable={EditItem === "email"} className={`${EditItem == "email" ? "border-1 w-[95%] p-[0.5rem]" : ""}`}>01/01/2021</p>
              <img src={edit} alt="" onClick={()=>{setEditItem("email")}}/>
            </div>
        </div>
    </div>
  )
}

export default TeacherView