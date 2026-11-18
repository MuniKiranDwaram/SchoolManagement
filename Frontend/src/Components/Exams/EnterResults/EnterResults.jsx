import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './EnterResults.css'
import { SearchStudentDetails } from '../../../Server'

const defaultSubjects = [
  { id: 'first-language', name: 'First language', marks: '', selected: false },
  { id: 'second-language', name: 'Second language', marks: '', selected: false },
  { id: 'third-language', name: 'Third language', marks: '', selected: false },
  { id: 'maths', name: 'Maths', marks: '', selected: false },
  { id: 'physics', name: 'Physics', marks: '', selected: false },
  { id: 'natural-science', name: 'Natural science', marks: '', selected: false },
  { id: 'social-studies', name: 'Social studies', marks: '', selected: false }
]

const createSubjectRow = (name = '') => ({
  id: `subject-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  marks: '',
  selected: false
})

const RESULT_STORAGE_KEY = 'schoolExamResults'

const readSavedResults = () => {
  try {
    const rawValue = localStorage.getItem(RESULT_STORAGE_KEY)
    return rawValue ? JSON.parse(rawValue) : []
  } catch (error) {
    return []
  }
}

const saveResultsToStorage = (results) => {
  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(results))
  window.dispatchEvent(new Event('examResultsUpdated'))
}

const EnterResults = () => {
  const location = useLocation()
  const resultToEdit = location.state?.resultToEdit

  const [form, setForm] = useState({
    examType: 'Unit Test 1',
    studentName: '',
    rollNo: '',
    className: ''
  })
  const [subjects, setSubjects] = useState(defaultSubjects)
  const [searchResults, setSearchResults] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [studentSearchLocked, setStudentSearchLocked] = useState(false)

  useEffect(() => {
    if (resultToEdit) {
      setForm({
        examType: resultToEdit.examType || 'Unit Test 1',
        studentName: resultToEdit.studentName || '',
        rollNo: resultToEdit.rollNo || '',
        className: resultToEdit.className || resultToEdit.class || ''
      })

      const editSubjects = (resultToEdit.subjects || defaultSubjects).map((subject, index) => ({
        id: subject.id || `edit-subject-${index}`,
        name: subject.name || '',
        marks: subject.marks ?? '',
        selected: false
      }))

      setSubjects(editSubjects.length ? editSubjects : defaultSubjects)
      setStudentSearchLocked(true)
      setSubmitted(false)
    }
  }, [resultToEdit])

  useEffect(() => {
    const trimmedName = form.studentName.trim()

    if (studentSearchLocked) {
      setSearchResults([])
      return undefined
    }

    if (!trimmedName) {
      setSearchResults([])
      return undefined
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      const result = await SearchStudentDetails(trimmedName)

      if (!isMounted) {
        return
      }

      if (Array.isArray(result)) {
        setSearchResults(result)
      } else {
        setSearchResults([])
      }
    }, 250)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [form.studentName, studentSearchLocked])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'studentName') {
      setStudentSearchLocked(false)
    }

    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleStudentSelect = (student) => {
    setForm((current) => ({
      ...current,
      studentName: student?.name || '',
      rollNo: student?.rollNo ?? '',
      className: student?.class ?? ''
    }))
    setSearchResults([])
    setStudentSearchLocked(true)
  }

  const handleSubjectChange = (subjectId, field, value) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId ? { ...subject, [field]: value } : subject
      )
    )
  }

  const toggleSubjectSelection = (subjectId) => {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId ? { ...subject, selected: !subject.selected } : subject
      )
    )
  }

  const addSubject = () => {
    setSubjects((current) => [...current, createSubjectRow()])
  }

  const deleteSelectedSubjects = () => {
    setSubjects((current) => current.filter((subject) => !subject.selected))
  }

  const isDeleteDisabled = !subjects.some((subject) => subject.selected)

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.studentName.trim() || !form.rollNo || !form.className) {
      alert('Please search and select a student before saving the result.')
      return
    }

    const validSubjects = subjects.filter((subject) => subject.name.trim() || subject.marks !== '')

    if (!validSubjects.length) {
      alert('Please add at least one subject and enter marks.')
      return
    }

    const invalidSubject = validSubjects.some((subject) => {
      const marks = Number(subject.marks)
      return !subject.name.trim() || subject.marks === '' || Number.isNaN(marks) || marks < 0 || marks > 100
    })

    if (invalidSubject) {
      alert('Every subject must have a name and a valid mark between 0 and 100.')
      return
    }

    const payload = {
      examType: form.examType,
      studentName: form.studentName,
      rollNo: form.rollNo,
      className: form.className,
      subjects: validSubjects.map((subject) => ({
        name: subject.name.trim(),
        marks: Number(subject.marks)
      })),
      total: validSubjects.reduce((sum, subject) => sum + Number(subject.marks || 0), 0),
      grade: validSubjects.reduce((sum, subject) => sum + Number(subject.marks || 0), 0) >= 450 ? 'A' : 'B+'
    }

    const existingResults = readSavedResults()
    const resultIndex = existingResults.findIndex(
      (result) =>
        result.studentName?.toLowerCase() === payload.studentName.toLowerCase() &&
        String(result.rollNo) === String(payload.rollNo) &&
        result.examType === payload.examType
    )

    if (resultIndex >= 0) {
      existingResults[resultIndex] = payload
    } else {
      existingResults.push(payload)
    }

    saveResultsToStorage(existingResults)
    setSubmitted(true)
    setForm((current) => ({ ...current, studentName: '', rollNo: '', className: '' }))
    setSubjects(defaultSubjects)
  }

  return (
    <div className='enter-results-page'>
      <div className='enter-results-panel'>
        <h2 className='enter-results-title'>Enter Results</h2>

        <form id='marks-form' onSubmit={handleSubmit} className='enter-results-form'>
          <div className='exam-type-box'>
            <label htmlFor='examType'>Exam Type</label>
            <select name='examType' id='examType' value={form.examType} onChange={handleChange}>
              <option value='Unit Test 1'>Unit Test 1</option>
              <option value='Unit Test 2'>Unit Test 2</option>
              <option value='Unit Test 3'>Unit Test 3</option>
              <option value='Quarterly Exams'>Quarterly Exams</option>
              <option value='Half Yearly Exams'>Half Yearly Exams</option>
              <option value='Final Exams'>Final Exams</option>
            </select>
          </div>

          <div className='student-search-box'>
            <label htmlFor='studentName'>Student Name</label>
            <div className='student-search-wrap'>
              <input
                type='text'
                id='studentName'
                name='studentName'
                value={form.studentName}
                onChange={handleChange}
                placeholder='Search student name'
              />

              {!studentSearchLocked && searchResults.length > 0 && (
                <div className='search-results-list'>
                  {searchResults.map((student) => (
                    <button
                      type='button'
                      key={student.rollNo || student.email || student.name}
                      className='search-result-item'
                      onClick={() => handleStudentSelect(student)}
                    >
                      <span>{student.name}</span>
                      <small>
                        Roll No: {student.rollNo} • Class: {student.class}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='student-detail-grid'>
            <label>
              <span>Roll No</span>
              <input type='text' value={form.rollNo} readOnly placeholder='Roll Number' />
            </label>
            <label>
              <span>Class</span>
              <input type='text' value={form.className} readOnly placeholder='Class' />
            </label>
          </div>

          <div className='results-table-wrapper'>
            <table className='results-table'>
              <thead>
                <tr>
                  <th className='checkbox-col'>Select</th>
                  <th>Subject Name</th>
                  <th className='marks-col'>Marks</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className={subject.selected ? 'selected-row' : ''}>
                    <td>
                      <input
                        type='checkbox'
                        checked={!!subject.selected}
                        onChange={() => toggleSubjectSelection(subject.id)}
                        aria-label={`Select ${subject.name || 'subject'}`}
                      />
                    </td>
                    <td>
                      <input
                        type='text'
                        value={subject.name}
                        onChange={(event) => handleSubjectChange(subject.id, 'name', event.target.value)}
                        placeholder='Subject name'
                      />
                    </td>
                    <td>
                      <input
                        type='number'
                        min='0'
                        max='100'
                        value={subject.marks}
                        onChange={(event) => handleSubjectChange(subject.id, 'marks', event.target.value)}
                        placeholder='Marks'
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='results-actions'>
            <button type='button' className='secondary-button' onClick={addSubject}>Add Subject</button>
            <button type='button' className='danger-button' onClick={deleteSelectedSubjects} disabled={isDeleteDisabled}>
              Delete Selected
            </button>
          </div>

          <button type='submit' className='save-button'>Save</button>
          {submitted && <p className='success-message'>Results saved successfully.</p>}
        </form>
      </div>
    </div>
  )
}

export default EnterResults