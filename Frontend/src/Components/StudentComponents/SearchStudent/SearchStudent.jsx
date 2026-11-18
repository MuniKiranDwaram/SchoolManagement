import React, { useEffect, useState } from 'react'
import './SearchStudent.css'
import { SearchStudentDetails } from '../../../Server'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { updateStudentData } from '../../../Redux/Slices/AddStudentSlice'
import edit from '../../../assets/Images/edit.png'

const SearchStudent = () => {
    const [students, setStudents] = useState([])
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [searchValue, setSearchValue] = useState('')
    const [statusMessage, setStatusMessage] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleSearch = async (name) => {
        const trimmedName = name.trim()
        setSearchValue(name)

        if (!trimmedName) {
            setStudents([])
            setSelectedStudent(null)
            setStatusMessage('')
            return
        }

        const result = await SearchStudentDetails(trimmedName)
        if (Array.isArray(result)) {
            setStudents(result)
            setSelectedStudent(null)
            setStatusMessage('')
        } else {
            setStudents([])
            setSelectedStudent(null)
            setStatusMessage(result?.message || 'No students matched the search.')
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue.trim()) {
                handleSearch(searchValue)
            } else {
                setStudents([])
                setStatusMessage('')
            }
        }, 250)

        return () => clearTimeout(timer)
    }, [searchValue])

    const updateStudentDetails = (item) => {
        dispatch(updateStudentData(item))
        navigate('/mainpage/student/addStudent')
    }

    const handleStudentSelect = (item) => {
        setSelectedStudent(item)
        setStudents([])
        setSearchValue('')
        setStatusMessage('')
    }

    const renderDetailRows = (selectedItem) => {
        if (!selectedItem) return null

        return [
            ['Roll No', selectedItem.rollNo],
            ['Name', selectedItem.name],
            ['Class', selectedItem.class],
            ['Email', selectedItem.email],
            ['Phone', selectedItem.parentPhoneNumber],
            ['Fee', selectedItem.totalFee],
            ['Address', selectedItem.address],
            ['Father Name', selectedItem.fatherName || '—'],
            ['Mother Name', selectedItem.motherName || '—'],
            ['DOB', selectedItem.dob ? new Date(selectedItem.dob).toLocaleDateString('en-IN') : '—'],
            ['DOJ', selectedItem.doj ? new Date(selectedItem.doj).toLocaleDateString('en-IN') : '—']
        ].filter(([, value]) => value !== undefined && value !== null && value !== '')
    }

    return (
        <div className='w-full h-full'>
            <div className='w-full h-full'>
                <p className='text-[36px] mb-5 text-amber-600'>Students Details</p>
                <div className='relative w-full h-[3rem] shadow-xs rounded-md'>
                    <input
                        className='bg-[#FCFAFA] focus:outline-none rounded-md w-full h-full'
                        type="text"
                        value={searchValue}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder='Search Student by name'
                    />
                </div>
                <div className='h-[80%] w-full flex flex-col items-center justify-start bg-gray-100 shadow-xs rounded-md mt-5 overflow-y-auto'>
                    {selectedStudent ? (
                        <div className='student-detail-card w-full'>
                            <div className='detail-header'>
                                <h3>{selectedStudent.name}</h3>
                                <button type='button' className='edit-btn' onClick={() => updateStudentDetails(selectedStudent)}>Edit</button>
                            </div>
                            <div className='detail-grid'>
                                {renderDetailRows(selectedStudent).map(([label, value]) => (
                                    <div key={label} className='detail-row'>
                                        <span className='detail-label'>{label}</span>
                                        <span className='detail-value'>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !students || students.length === 0 ? (
                        <div className='flex flex-col items-center justify-center h-full'>
                            <p className='text-[28px] text-gray-400'>No Students at this time</p>
                            <p className='text-[15px] text-gray-400'>Students will appear here after they enroll in your school.</p>
                        </div>
                    ) : (
                        <>
                            <div className='w-full grid grid-cols-[15%_20%_10%_18%_18%_10%_9%] place-items-center py-2 border-b border-gray-300 bg-gray-200 font-semibold text-gray-700'>
                                <p>Roll No</p>
                                <p>Name</p>
                                <p>Class</p>
                                <p>Email</p>
                                <p>Phone</p>
                                <p>Fee</p>
                                <p>Action</p>
                            </div>
                            {students.map((student) => (
                                <div key={student.rollNo || student.email} className='w-full grid grid-cols-[15%_20%_10%_18%_18%_10%_9%] place-items-center py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50' onClick={() => handleStudentSelect(student)}>
                                    <p>{student.rollNo}</p>
                                    <p>{student.name}</p>
                                    <p>{student.class}</p>
                                    <p>{student.email}</p>
                                    <p>{student.parentPhoneNumber}</p>
                                    <p>{student.totalFee}</p>
                                    <img src={edit} alt="Edit" className='cursor-pointer w-5 h-5' onClick={(e) => {
                                        e.stopPropagation()
                                        updateStudentDetails(student)
                                    }} />
                                </div>
                            ))}
                        </>
                    )}
                </div>
                {statusMessage && <p className='mt-3 text-[var(--color-btn-warning)]'>{statusMessage}</p>}
            </div>
        </div>
    )
}

export default SearchStudent