import React, { useEffect, useMemo, useState } from 'react'

const CLASS_STORAGE_KEY = 'schoolClasses'
const TEACHER_STORAGE_KEY = 'schoolTeachers'
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const periods = ['1', '2', '3', '4', '5', '6', '7', '8']

const initialClassForm = {
  standard: '',
  section: '',
  classTeacher: '',
  teacherId: '',
  roomNumber: '',
  studentCapacity: '',
  notes: ''
}

const normalizeValue = (value) => String(value ?? '').trim()

const getSavedClasses = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CLASS_STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const knownDummyTeacherNames = ['Ananya Sharma', 'Meera Iyer', 'Rahul Verma', 'Karan Singh', 'Dummy Teacher', 'Test Teacher']

const sanitizeTeacherList = (teachers = []) => {
  const cleanedTeachers = teachers.filter((teacher) => {
    const name = normalizeValue(teacher?.name)
    const lowerName = name.toLowerCase()
    const isKnownDummy = knownDummyTeacherNames.includes(name) || lowerName.includes('dummy') || lowerName.includes('test')
    const hasRealData = name || normalizeValue(teacher?.email) || normalizeValue(teacher?.teacherID)

    return hasRealData && !isKnownDummy
  })

  if (cleanedTeachers.length !== teachers.length) {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(cleanedTeachers))
  }

  return cleanedTeachers
}

const getSavedTeachers = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(TEACHER_STORAGE_KEY) || '[]')
    const teachers = Array.isArray(saved) ? saved : []
    return sanitizeTeacherList(teachers)
  } catch {
    return []
  }
}

const buildClassLabel = (standard, section) => {
  const classNumber = normalizeValue(standard)
  const classSection = normalizeValue(section)

  if (!classNumber && !classSection) {
    return 'New Class'
  }

  return `Class ${classNumber}${classSection ? ` ${classSection}` : ''}`
}

const createClassId = () => `class-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const ClassDetails = () => {
  const [classes, setClasses] = useState(() => getSavedClasses())
  const [teacherOptions, setTeacherOptions] = useState(() => getSavedTeachers())
  const [form, setForm] = useState(initialClassForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [showTimetable, setShowTimetable] = useState(false)
  const [timetableEditing, setTimetableEditing] = useState(false)
  const [customWeek, setCustomWeek] = useState(false)
  const [timetableDraft, setTimetableDraft] = useState({})
  const [timetableForm, setTimetableForm] = useState({
    day: 'Monday',
    period: '1',
    subject: '',
    teacher: ''
  })

  useEffect(() => {
    localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classes))
  }, [classes])

  useEffect(() => {
    const allTeachers = getSavedTeachers()
    const selectedClass = normalizeValue(form.standard)

    const filteredTeachers = selectedClass
      ? allTeachers.filter((teacher) => normalizeValue(teacher.class) === selectedClass)
      : allTeachers

    setTeacherOptions(filteredTeachers.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
  }, [form.standard])

  const filteredClasses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return classes.filter((item) => {
      const haystack = [
        buildClassLabel(item.standard, item.section),
        item.classTeacher,
        item.roomNumber,
        item.studentCapacity,
        item.notes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return !query || haystack.includes(query)
    })
  }, [classes, searchTerm])

  const hasSearchQuery = searchTerm.trim().length > 0
  const selectedClass = classes.find((item) => item.id === selectedClassId) || null

  useEffect(() => {
    if (!hasSearchQuery) {
      setSelectedClassId(null)
      setShowTimetable(false)
      return
    }

    if (selectedClassId && !filteredClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(null)
    }
  }, [filteredClasses, hasSearchQuery, selectedClassId])

  useEffect(() => {
    if (!selectedClass) {
      return
    }

    setTimetableForm((current) => ({
      ...current,
      teacher: current.teacher || selectedClass.classTeacher || ''
    }))
  }, [selectedClass])

  const handleFormChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'standard' ? { classTeacher: '', teacherId: '' } : {})
    }))
  }

  const handleClassTeacherChange = (value) => {
    const teacher = teacherOptions.find(
      (option) => (option.teacherID || option.name) === value
    )

    setForm((current) => ({
      ...current,
      classTeacher: teacher?.name || '',
      teacherId: teacher?.teacherID || ''
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.standard || !form.section || !form.classTeacher) {
      return
    }

    const classRecord = {
      id: editingId || createClassId(),
      standard: normalizeValue(form.standard),
      section: normalizeValue(form.section),
      classTeacher: normalizeValue(form.classTeacher),
      teacherId: normalizeValue(form.teacherId),
      roomNumber: normalizeValue(form.roomNumber),
      studentCapacity: normalizeValue(form.studentCapacity),
      notes: normalizeValue(form.notes),
      timetable: editingId
        ? classes.find((item) => item.id === editingId)?.timetable || []
        : []
    }

    setClasses((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? classRecord : item))
      }

      return [classRecord, ...current]
    })

    setForm(initialClassForm)
    setSelectedClassId(null)
    setEditingId(null)
    setShowTimetable(false)
    setTimetableEditing(false)
  }

  const beginEditing = (item) => {
    const teacherMatch = getSavedTeachers().find((teacher) => teacher.name === item.classTeacher)

    setForm({
      standard: item.standard,
      section: item.section,
      classTeacher: item.classTeacher,
      teacherId: item.teacherId || teacherMatch?.teacherID || '',
      roomNumber: item.roomNumber || '',
      studentCapacity: item.studentCapacity || '',
      notes: item.notes || ''
    })
    setEditingId(item.id)
    setSelectedClassId(item.id)
    setShowTimetable(false)
  }

  const renderDetailRows = (item) => [
    ['Class', buildClassLabel(item.standard, item.section)],
    ['Section', item.section || '—'],
    ['Class Teacher', item.classTeacher || 'Not assigned'],
    ['Teacher ID', item.teacherId || 'Not assigned'],
    ['Room Number', item.roomNumber || ''],
    ['Student Capacity', item.studentCapacity || ''],
    ['Notes / Stream', item.notes || '']
  ]

  const buildTimetableDraft = (entries = [], useCustomWeek = false) => {
    if (!useCustomWeek) {
      return periods.reduce((acc, period) => {
        const match = entries.find((entry) => Number(entry.period) === Number(period))
        acc[period] = {
          day: 'All Days',
          period,
          subject: match?.subject || '',
          teacher: match?.teacher || ''
        }
        return acc
      }, {})
    }

    return days.reduce((acc, day) => {
      periods.forEach((period) => {
        const match = entries.find(
          (entry) => entry.day === day && Number(entry.period) === Number(period)
        )

        acc[`${day}|${period}`] = {
          day,
          period,
          subject: match?.subject || '',
          teacher: match?.teacher || ''
        }
      })

      return acc
    }, {})
  }

  const hasTimetableEntries = (selectedClass?.timetable || []).length > 0

  const handleTimetableCellChange = (day, period, field, value) => {
    const key = customWeek ? `${day}|${period}` : period

    setTimetableDraft((current) => ({
      ...current,
      [key]: {
        day: customWeek ? day : 'All Days',
        period,
        subject: field === 'subject' ? value : current[key]?.subject || '',
        teacher: field === 'teacher' ? value : current[key]?.teacher || ''
      }
    }))
  }

  const handleSaveTimetable = () => {
    if (!selectedClass) {
      return
    }

    const nextTimetable = Object.values(timetableDraft)
      .filter((slot) => slot && (slot.subject.trim() || slot.teacher.trim()))
      .map((slot) => ({
        id: customWeek ? `slot-${slot.day}-${slot.period}` : `slot-all-${slot.period}`,
        day: customWeek ? slot.day : 'All Days',
        period: slot.period,
        subject: slot.subject.trim(),
        teacher: slot.teacher.trim()
      }))

    setClasses((current) =>
      current.map((item) =>
        item.id === selectedClass.id
          ? { ...item, timetable: nextTimetable, customWeek }
          : item
      )
    )

    setTimetableEditing(false)
    setShowTimetable(true)
  }

  const openTimetableEditor = () => {
    if (!selectedClass) {
      return
    }

    const useCustomWeek = Boolean(selectedClass.customWeek)
    setCustomWeek(useCustomWeek)
    setTimetableDraft(buildTimetableDraft(selectedClass.timetable || [], useCustomWeek))
    setTimetableEditing(true)
    setShowTimetable(true)
  }

  const activeTimetableRows = selectedClass?.timetable || []
  const teacherRecords = getSavedTeachers()
  const timetableSubjectSuggestions = [...new Set(
    teacherRecords
      .map((teacher) => normalizeValue(teacher.subject))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))

  const getTeacherSuggestions = (subjectValue) => {
    const searchValue = normalizeValue(subjectValue).toLowerCase()

    return teacherRecords
      .filter((teacher) => {
        const matchSubject = normalizeValue(teacher.subject).toLowerCase()
        const teacherName = normalizeValue(teacher.name).toLowerCase()
        return !searchValue || matchSubject.includes(searchValue) || teacherName.includes(searchValue)
      })
      .map((teacher) => normalizeValue(teacher.name))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
  }

  const renderSuggestionList = (items, onSelect) => {
    if (!items.length) {
      return null
    }

    return (
      <div className='timetable-suggestions'>
        {items.map((item) => (
          <button key={item} type='button' className='timetable-suggestion-item' onClick={() => onSelect(item)}>
            {item}
          </button>
        ))}
      </div>
    )
  }

  const renderTimetableCell = (slot, day, period) => {
    const slotKey = customWeek ? `${day}|${period}` : period
    const currentSlot = slot || { subject: '', teacher: '' }
    const subjectMatches = timetableSubjectSuggestions.filter((value) =>
      value.toLowerCase().includes(normalizeValue(currentSlot.subject).toLowerCase())
    )
    const teacherMatches = getTeacherSuggestions(currentSlot.subject).filter((value) =>
      value.toLowerCase().includes(normalizeValue(currentSlot.teacher).toLowerCase())
    )

    return (
      <td key={`${day}-${period}`} className='timetable-cell'>
        <input
          type='text'
          value={currentSlot.subject || ''}
          placeholder='Subject'
          onChange={(e) => handleTimetableCellChange(day, period, 'subject', e.target.value)}
        />
        {currentSlot.subject && renderSuggestionList(subjectMatches.slice(0, 5), (value) => {
          handleTimetableCellChange(day, period, 'subject', value)
          setTimetableDraft((current) => ({
            ...current,
            [slotKey]: {
              ...current[slotKey],
              subject: value,
              day: customWeek ? day : 'All Days',
              period
            }
          }))
        })}

        <input
          type='text'
          value={currentSlot.teacher || ''}
          placeholder='Teacher'
          onChange={(e) => handleTimetableCellChange(day, period, 'teacher', e.target.value)}
        />
        {currentSlot.teacher && renderSuggestionList(teacherMatches.slice(0, 5), (value) => {
          handleTimetableCellChange(day, period, 'teacher', value)
          setTimetableDraft((current) => ({
            ...current,
            [slotKey]: {
              ...current[slotKey],
              teacher: value,
              day: customWeek ? day : 'All Days',
              period
            }
          }))
        })}
      </td>
    )
  }

  const handleDeleteClass = (classId) => {
    setClasses((current) => current.filter((item) => item.id !== classId))
    setSelectedClassId(null)
    setShowTimetable(false)
    setTimetableEditing(false)
    setSearchTerm('')
  }

  return (
    <div className='page-shell'>
      <div className='page-card'>
        <div className='section-head'>
          <div>
            <p className='section-kicker'>Academic setup</p>
            <h2 className='section-title'>Class Details</h2>
          </div>
        </div>

        <div className='class-layout'>
          <div className='class-form-panel'>
            <p className='class-panel-title'>{editingId ? 'Update Class' : 'Create Class'}</p>
            <form onSubmit={handleSubmit} className='form-grid'>
              <div className='field-wrapper'>
                <label>Standard / Class <span className='required-mark'>*</span></label>
                <input
                  type='text'
                  value={form.standard}
                  onChange={(e) => handleFormChange('standard', e.target.value)}
                  placeholder='Standard / Class'
                />
              </div>

              <div className='field-wrapper'>
                <label>Section <span className='required-mark'>*</span></label>
                <input
                  type='text'
                  value={form.section}
                  onChange={(e) => handleFormChange('section', e.target.value)}
                  placeholder='Section'
                />
              </div>

              <div className='field-wrapper span-3'>
                <label>Link Teacher <span className='required-mark'>*</span></label>
                <select
                  value={form.teacherId || form.classTeacher || ''}
                  onChange={(e) => handleClassTeacherChange(e.target.value)}
                  disabled={teacherOptions.length === 0}
                >
                  <option value=''>
                    {teacherOptions.length > 0 ? 'Select teacher for this class' : 'No teacher linked for this class'}
                  </option>
                  {teacherOptions.map((teacher) => (
                    <option key={teacher.teacherID || teacher.email || teacher.name} value={teacher.teacherID || teacher.name}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='field-wrapper'>
                <label>Room Number</label>
                <input
                  type='text'
                  value={form.roomNumber}
                  onChange={(e) => handleFormChange('roomNumber', e.target.value)}
                  placeholder='Room Number'
                />
              </div>

              <div className='field-wrapper'>
                <label>Student Capacity</label>
                <input
                  type='number'
                  value={form.studentCapacity}
                  onChange={(e) => handleFormChange('studentCapacity', e.target.value)}
                  placeholder='Student Capacity'
                />
              </div>

              <div className='field-wrapper span-3'>
                <label>Notes / Stream</label>
                <input
                  type='text'
                  value={form.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder='Notes / stream / remarks'
                />
              </div>

              <div className='span-3 class-helper-row'>
                <span>
                  {form.standard
                    ? `Only teachers assigned to Class ${form.standard} are shown.`
                    : 'Select a class to filter eligible teachers.'}
                </span>
                <button type='submit' className='primary-action'>
                  {editingId ? 'Update Class' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>

          <div className='class-list-panel'>
            <div className='class-search-bar'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search class or teacher'
              />
            </div>

            {hasSearchQuery && selectedClass && (
              <div className='class-detail-card'>
                <div className='class-detail-head'>
                  <div>
                    <p className='section-kicker'>Class overview</p>
                    <h3>{buildClassLabel(selectedClass.standard, selectedClass.section)}</h3>
                  </div>
                </div>

                <div className='detail-grid'>
                  {renderDetailRows(selectedClass).map(([label, value]) => (
                    <div key={label} className='detail-row'>
                      <span className='detail-label'>{label}</span>
                      <span className='detail-value'>{value || ''}</span>
                    </div>
                  ))}
                </div>

                <div className='class-detail-actions'>
                  <button type='button' className='secondary-action' onClick={() => beginEditing(selectedClass)}>
                    Edit
                  </button>
                  <button
                    type='button'
                    className='secondary-action danger-action'
                    onClick={() => handleDeleteClass(selectedClass.id)}
                  >
                    Delete
                  </button>
                  <button
                    type='button'
                    className='primary-action'
                    onClick={() => {
                      if (showTimetable && timetableEditing) {
                        handleSaveTimetable()
                        return
                      }

                      if (showTimetable) {
                        setShowTimetable(false)
                        return
                      }

                      openTimetableEditor()
                    }}
                  >
                    {showTimetable && timetableEditing
                      ? 'Save Time Table'
                      : showTimetable
                        ? 'Hide Time Table'
                        : hasTimetableEntries
                          ? 'View Time Table'
                          : 'Create Time Table'}
                  </button>
                </div>

                {showTimetable && (
                  <div className='timetable-panel'>
                    <div className='timetable-panel-header'>
                      <div className='timetable-toggle'>
                        <label>
                          <input
                            type='checkbox'
                            checked={customWeek}
                            onChange={(e) => {
                              const nextValue = e.target.checked
                              setCustomWeek(nextValue)
                              if (selectedClass) {
                                setTimetableDraft(buildTimetableDraft(selectedClass.timetable || [], nextValue))
                              }
                            }}
                          />
                          <span>Different timetable for different days in a week</span>
                        </label>
                      </div>
                      {hasTimetableEntries && !timetableEditing && (
                        <button type='button' className='secondary-action' onClick={openTimetableEditor}>
                          Edit Time Table
                        </button>
                      )}
                    </div>

                    {!timetableEditing ? (
                      customWeek ? (
                        <div className='timetable-wrap'>
                          <table className='timetable-table'>
                            <thead>
                              <tr>
                                <th>Day</th>
                                {periods.map((period) => (
                                  <th key={period}>P{period}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {days.map((day) => (
                                <tr key={day}>
                                  <td>{day}</td>
                                  {periods.map((period) => {
                                    const match = activeTimetableRows.find(
                                      (slot) => slot.day === day && Number(slot.period) === Number(period)
                                    )
                                    return (
                                      <td key={`${day}-${period}`}>
                                        {match ? `${match.subject || ''}${match.subject && match.teacher ? ' / ' : ''}${match.teacher || ''}` : '—'}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className='timetable-wrap'>
                          <table className='timetable-table'>
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th>Subject</th>
                                <th>Teacher</th>
                              </tr>
                            </thead>
                            <tbody>
                              {periods.map((period) => {
                                const match = activeTimetableRows.find(
                                  (slot) => slot.day === 'All Days' && Number(slot.period) === Number(period)
                                )

                                return (
                                  <tr key={period}>
                                    <td>P{period}</td>
                                    <td>{match?.subject || ''}</td>
                                    <td>{match?.teacher || ''}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    ) : customWeek ? (
                      <div className='timetable-editor-grid'>
                        <table className='timetable-editor-table'>
                          <thead>
                            <tr>
                              <th>Day</th>
                              {periods.map((period) => (
                                <th key={period}>P{period}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {days.map((day) => (
                              <tr key={day}>
                                <td className='day-label'>{day}</td>
                                {periods.map((period) => {
                                  const slotKey = `${day}|${period}`
                                  const slot = timetableDraft[slotKey] || { subject: '', teacher: '' }

                                  return renderTimetableCell(slot, day, period)
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className='timetable-editor-actions'>
                          <button type='button' className='secondary-action' onClick={() => setTimetableEditing(false)}>
                            Cancel
                          </button>
                          <button type='button' className='primary-action' onClick={handleSaveTimetable}>
                            Save Time Table
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='timetable-editor-grid'>
                        <table className='timetable-editor-table'>
                          <thead>
                            <tr>
                              <th>Period</th>
                              <th>Subject</th>
                              <th>Teacher</th>
                            </tr>
                          </thead>
                          <tbody>
                            {periods.map((period) => {
                              const slot = timetableDraft[period] || { subject: '', teacher: '' }

                              return (
                                <tr key={period}>
                                  <td className='day-label'>P{period}</td>
                                  <td className='timetable-cell'>
                                    <input
                                      type='text'
                                      value={slot.subject || ''}
                                      placeholder='Subject'
                                      onChange={(e) => handleTimetableCellChange('All Days', period, 'subject', e.target.value)}
                                    />
                                    {slot.subject && renderSuggestionList(
                                      timetableSubjectSuggestions.filter((value) =>
                                        value.toLowerCase().includes(normalizeValue(slot.subject).toLowerCase())
                                      ).slice(0, 5),
                                      (value) => {
                                        handleTimetableCellChange('All Days', period, 'subject', value)
                                        setTimetableDraft((current) => ({
                                          ...current,
                                          [period]: {
                                            ...current[period],
                                            subject: value,
                                            day: 'All Days',
                                            period
                                          }
                                        }))
                                      }
                                    )}
                                  </td>
                                  <td className='timetable-cell'>
                                    <input
                                      type='text'
                                      value={slot.teacher || ''}
                                      placeholder='Teacher'
                                      onChange={(e) => handleTimetableCellChange('All Days', period, 'teacher', e.target.value)}
                                    />
                                    {slot.teacher && renderSuggestionList(
                                      getTeacherSuggestions(slot.subject).filter((value) =>
                                        value.toLowerCase().includes(normalizeValue(slot.teacher).toLowerCase())
                                      ).slice(0, 5),
                                      (value) => {
                                        handleTimetableCellChange('All Days', period, 'teacher', value)
                                        setTimetableDraft((current) => ({
                                          ...current,
                                          [period]: {
                                            ...current[period],
                                            teacher: value,
                                            day: 'All Days',
                                            period
                                          }
                                        }))
                                      }
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        <div className='timetable-editor-actions'>
                          <button type='button' className='secondary-action' onClick={() => setTimetableEditing(false)}>
                            Cancel
                          </button>
                          <button type='button' className='primary-action' onClick={handleSaveTimetable}>
                            Save Time Table
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {hasSearchQuery && !selectedClassId && (
              <div className='class-list'>
                {filteredClasses.length === 0 ? (
                  <div className='empty-state'>
                    <p>No classes found.</p>
                    <span>Create a class above to begin.</span>
                  </div>
                ) : (
                  filteredClasses.map((item) => (
                    <div
                      key={item.id}
                      className={`class-card ${selectedClass?.id === item.id ? 'active-class-card' : ''}`}
                      onClick={() => setSelectedClassId(item.id)}
                    >
                      <div className='class-card-header'>
                        <p className='class-name'>{buildClassLabel(item.standard, item.section)}</p>
                        <span className='section-badge'>Section {item.section || '—'}</span>
                      </div>
                      <div className='mini-meta'>
                        <span>{item.classTeacher || 'No teacher linked'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClassDetails
