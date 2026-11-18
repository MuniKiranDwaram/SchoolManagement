import React, { useEffect, useRef, useState } from 'react'
import { DeleteEntry, SearchTeacherDetails } from '../../../Server';
import edit from '../../../assets/Images/edit.png'

import './SearchTeacher.css'
import { updateTeacherData } from '../../../Redux/Slices/AddTeacherSlice';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
const SearchTeacher = () => {
     const[TeachersList,setTeachersList] = useState([]);
     const[selectedTeacher,setSelectedTeacher] = useState(null);
     const [teacherName,SetTeacherName] = useState("");
     const [statusMessage,SetStatusMessage] = useState("");

     const userInputref = useRef(null);

     const nav = useNavigate("");

     const dispatch = useDispatch();

     const GetTeacherDetails = async (name) =>{
        const trimmedName = name.trim();
        SetTeacherName(trimmedName);

        if (!trimmedName) {
            setTeachersList([]);
            setSelectedTeacher(null);
            SetStatusMessage('');
            return;
        }

        const list = await SearchTeacherDetails(trimmedName);
        if (Array.isArray(list) && list.length > 0) {
            setTeachersList(list);
            setSelectedTeacher(null);
            SetStatusMessage('');
        } else {
            setTeachersList([]);
            setSelectedTeacher(null);
            SetStatusMessage(list?.message || 'No teacher records found.');
        }
     };

     useEffect(() => {
        const timer = setTimeout(() => {
            if (teacherName) {
                GetTeacherDetails(teacherName);
            } else {
                setTeachersList([]);
                SetStatusMessage('');
            }
        }, 250);

        return () => clearTimeout(timer);
     }, [teacherName]);

     const DeleteTeacher = async (name, id) =>{
        var entryType = "Teacher";
        var deleteResponse = await DeleteEntry(entryType,name,id);
        userInputref.current.value = "";
        SetStatusMessage(deleteResponse.message);
        GetTeacherDetails(teacherName);
     };

     const updateTeacherDetails = (item) =>{
        dispatch(updateTeacherData(item));
        nav("/mainpage/teacher/addTeacher");
     }

     const handleTeacherSelect = (teacher) => {
        setSelectedTeacher(teacher);
        setTeachersList([]);
        SetTeacherName('');
        if (userInputref.current) {
            userInputref.current.value = '';
        }
        SetStatusMessage('');
     }

     const renderTeacherDetails = (teacher) => {
        if (!teacher) return null

        return [
            ['Teacher ID', teacher.teacherID],
            ['Name', teacher.name],
            ['Designation', teacher.designation],
            ['Subject', teacher.subject],
            ['Class', teacher.class],
            ['Email', teacher.email],
            ['Phone', teacher.phone],
            ['Salary', teacher.salary],
            ['Address', teacher.address],
            ['DOB', teacher.dob ? new Date(teacher.dob).toLocaleDateString('en-IN') : '—'],
            ['DOJ', teacher.doj ? new Date(teacher.doj).toLocaleDateString('en-IN') : '—']
        ].filter(([, value]) => value !== undefined && value !== null && value !== '')
     }

      return (
        <div className='w-full h-full'>            
            <div className='w-full h-full'>
                <p className='text-[36px] mb-5 text-amber-600'>Teachers Details</p>
                <div className='relative w-full h-[3rem] shadow-xs rounded-md'>
                    <input ref={userInputref} className='bg-[#FCFAFA] focus:outline-none rounded-md w-full h-full' type="text" placeholder='Search teacher by name' onChange={(e)=>{GetTeacherDetails(e.target.value)}}/>
                </div>
                <div className='h-[60%] w-full flex flex-col items-center justify-start bg-gray-100 shadow-xs rounded-md mt-5 overflow-y-auto'>
                    {selectedTeacher ? (
                        <div className='teacher-detail-card w-full'>
                            <div className='detail-header'>
                                <h3>{selectedTeacher.name}</h3>
                                <button type='button' className='edit-btn' onClick={()=>updateTeacherDetails(selectedTeacher)}>Edit</button>
                            </div>
                            <div className='detail-grid'>
                                {renderTeacherDetails(selectedTeacher).map(([label, value]) => (
                                    <div key={label} className='detail-row'>
                                        <span className='detail-label'>{label}</span>
                                        <span className='detail-value'>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (!TeachersList || TeachersList.length===0) ? (
                    <div className='flex flex-col items-center justify-center'>
                        <p className='text-[28px] text-gray-400'>No Teachers at this time</p>
                        <p className='text-[15px] text-gray-400'>Teachers will appear here after they enroll in your school.</p>
                    </div>) : 
                    (<>
                        <div className='w-full grid grid-cols-[15%_25%_15%_15%_15%_7.5%_7.5%] place-items-center py-2 font-semibold text-gray-700 border-b border-gray-200 bg-white sticky top-0 z-10'>
                            <p>ID</p>
                            <p>Name</p>
                            <p>Designation</p>
                            <p>Class</p>
                            <p>Subject</p>
                            <p>Delete</p>
                            <p>Edit</p>
                        </div>
                        {TeachersList.map((teacher)=>{
                            return(
                                <div key={teacher.teacherID || teacher.email} className='w-full grid grid-cols-[15%_25%_15%_15%_15%_7.5%_7.5%] place-items-center py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50' onClick={()=>handleTeacherSelect(teacher)}>
                                    <p>{teacher.teacherID}</p>
                                    <p>{teacher.name}</p>
                                    <p>{teacher.designation}</p>
                                    <p>{teacher.class}</p>
                                    <p>{teacher.subject}</p>
                                    <i className="material-icons cursor-pointer" onClick={(e)=>{e.stopPropagation(); DeleteTeacher(teacher.name, teacher.teacherID);}}>delete</i>
                                    <img src={edit} alt="" className='cursor-pointer' onClick={(e)=>{e.stopPropagation(); updateTeacherDetails(teacher);}}/>
                                </div>
                            )
                        })}
                    </>) }
                </div>
            </div>
        </div>
      )
}

export default SearchTeacher