import React from 'react'
import './StudentView.css'
const StudentView = () => {
  return (
    <div className='w-full h-full p-[2rem]'>
        <div id='student-details' className='grid grid-cols-2 auto-rows-auto'>
            <div className='col-span-2 w-full'>
                <img src="" alt="" />
            </div>
            <p>Full Name</p>
            <p></p>
            <p>Roll No</p>
            <p></p>
            <p>class</p>
            <p></p>
            <p>Fathers Name</p>
            <p></p>
            <p>Mothers Name</p>
            <p></p>
            <p>Caste</p>
            <p></p>
            <p>Fathers occupation</p>
            <p></p>
            <p>DOJ</p>
            <p></p>
            <p>DOB</p>
            <p></p>
            <p>Address</p>
            <p></p>
            <p>Phone</p>
            <p></p>
            <p>Email</p>
            <p></p>
        </div>
    </div>
  )
}

export default StudentView