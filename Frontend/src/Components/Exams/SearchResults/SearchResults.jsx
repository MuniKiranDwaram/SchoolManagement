import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchStudentDetails } from '../../../Server'
import edit from '../../../assets/Images/edit.png'
import './SearchResults.css'

const RESULT_STORAGE_KEY = 'schoolExamResults'

const readSavedResults = () => {
    try {
        const rawValue = localStorage.getItem(RESULT_STORAGE_KEY)
        return rawValue ? JSON.parse(rawValue) : []
    } catch (error) {
        return []
    }
}

const SearchResults = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [selectedExamType, setSelectedExamType] = useState('Unit Test 1')
    const [matchingStudents, setMatchingStudents] = useState([])
    const [savedResults, setSavedResults] = useState(() => readSavedResults())
    const navigate = useNavigate()

    useEffect(() => {
        const refreshSavedResults = () => setSavedResults(readSavedResults())
        refreshSavedResults()
        window.addEventListener('examResultsUpdated', refreshSavedResults)
        window.addEventListener('storage', refreshSavedResults)

        return () => {
            window.removeEventListener('examResultsUpdated', refreshSavedResults)
            window.removeEventListener('storage', refreshSavedResults)
        }
    }, [])

    useEffect(() => {
        const trimmedTerm = searchTerm.trim()

        if (!trimmedTerm) {
            setMatchingStudents([])
            return undefined
        }

        let isMounted = true
        const timer = setTimeout(async () => {
            const result = await SearchStudentDetails(trimmedTerm)

            if (!isMounted) {
                return
            }

            if (Array.isArray(result)) {
                setMatchingStudents(
                    result.map((student) => ({
                        studentName: student.name,
                        rollNo: student.rollNo,
                        className: student.class
                    }))
                )
            } else {
                setMatchingStudents([])
            }
        }, 200)

        return () => {
            isMounted = false
            clearTimeout(timer)
        }
    }, [searchTerm])

    const studentExamResults = useMemo(() => {
        if (!selectedStudent) {
            return []
        }

        return savedResults.filter(
            (result) =>
                result.studentName?.toLowerCase() === selectedStudent.studentName.toLowerCase() &&
                String(result.rollNo) === String(selectedStudent.rollNo)
        )
    }, [selectedStudent, savedResults])

    const availableExamTypes = useMemo(
        () => [...new Set(studentExamResults.map((result) => result.examType))],
        [studentExamResults]
    )

    const selectedResult = useMemo(() => {
        if (!selectedStudent) {
            return null
        }

        return (
            studentExamResults.find((result) => result.examType === selectedExamType) ||
            studentExamResults[0] ||
            null
        )
    }, [selectedStudent, selectedExamType, studentExamResults])

    const handleStudentSelect = (student) => {
        setSelectedStudent(student)
        setSelectedExamType('Unit Test 1')
    }

    const handleEdit = (result) => {
        navigate('/mainpage/exams/enterResults', { state: { resultToEdit: result } })
    }

    const clearSelection = () => {
        setSelectedStudent(null)
        setSelectedExamType('Unit Test 1')
    }

    return (
        <div className='page-shell result-search-page'>
            <div className='page-card result-search-card'>
                <div className='section-head'>
                    <div>
                        <p className='section-kicker'>Exams</p>
                        <h2 className='section-title'>Search Results</h2>
                    </div>
                </div>

                <div className='search-results-input'>
                    <input
                        type='text'
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value)
                            if (!event.target.value.trim()) {
                                setSelectedStudent(null)
                            }
                        }}
                        placeholder='Search by student name or roll number'
                    />
                </div>

                {!selectedStudent && (
                    <div className={`result-search-list ${selectedStudent ? 'result-search-list-disabled' : ''}`}>
                        {matchingStudents.length === 0 ? (
                            <div className='result-empty-state'>
                                <p className='result-empty-title'>No matching results</p>
                                <p>Type a student name or roll number to find the student.</p>
                            </div>
                        ) : (
                            matchingStudents.map((student) => (
                                <button
                                    type='button'
                                    key={`${student.studentName}-${student.rollNo}`}
                                    className='result-match-item'
                                    onClick={() => handleStudentSelect(student)}
                                >
                                    <span className='result-name'>{student.studentName}</span>
                                    <span className='result-meta-row'>
                                        <span>Roll No: {student.rollNo}</span>
                                        <span>Class: {student.className}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {selectedStudent && (
                    <div className='selected-result-panel'>
                        <div className='selected-result-header'>
                            <div>
                                <p className='result-name'>{selectedStudent.studentName}</p>
                                <div className='result-meta'>
                                    <span>Roll No: {selectedStudent.rollNo}</span>
                                    <span>Class: {selectedStudent.className}</span>
                                </div>
                            </div>
                            <div className='selected-result-actions'>
                                <button type='button' className='secondary-action' onClick={clearSelection}>Back</button>
                                {selectedResult && (
                                    <button type='button' className='result-edit-btn' onClick={() => handleEdit(selectedResult)}>
                                        <img src={edit} alt='Edit results' />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {!selectedResult ? (
                            <div className='result-empty-state'>
                                <p className='result-empty-title'>No result found for this student</p>
                                <p>Save marks for this student in the Enter Results page to see the exam details here.</p>
                            </div>
                        ) : (
                            <>
                                <div className='selected-result-controls'>
                                    <label htmlFor='examTypeSelect'>Exam Type</label>
                                    <select
                                        id='examTypeSelect'
                                        value={selectedExamType}
                                        onChange={(event) => setSelectedExamType(event.target.value)}
                                    >
                                        {availableExamTypes.map((examType) => (
                                            <option key={examType} value={examType}>{examType}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className='result-summary'>
                                    <span>Total: {selectedResult.total}</span>
                                    <span>Grade: {selectedResult.grade}</span>
                                </div>

                                <div className='result-subjects-table'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Marks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedResult.subjects || []).map((subject) => (
                                                <tr key={`${selectedResult.studentName}-${selectedResult.examType}-${subject.name}`}>
                                                    <td>{subject.name}</td>
                                                    <td>{subject.marks}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchResults