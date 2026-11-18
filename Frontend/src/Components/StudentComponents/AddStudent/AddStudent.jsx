import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AddStudentRecord } from '../../../Server'
import { clearStudentData } from '../../../Redux/Slices/AddStudentSlice'

const initialFormState = {
  rollNo: '',
  name: '',
  description: '',
  fatherName: '',
  motherName: '',
  class: '',
  fatherOccupation: '',
  caste: '',
  dob: '',
  doj: '',
  email: '',
  parentPhoneNumber: '',
  address: '',
  totalFee: ''
}

const AddStudent = () => {
  const DataToUpdate = useSelector((state) => state.UpdateStudent)
  const dispatch = useDispatch()
  const [formData, setFormData] = useState(initialFormState)
  const [statusMessage, setStatusMessage] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setValidationError('')
  }

  const requiredFields = [
    { key: 'name', label: 'Full Name' },
    { key: 'fatherName', label: "Father's Name" },
    { key: 'motherName', label: "Mother's Name" },
    { key: 'class', label: 'Class' },
    { key: 'fatherOccupation', label: 'Father Occupation' },
    { key: 'caste', label: 'Caste' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'doj', label: 'Date of Join' },
    { key: 'email', label: 'Email' },
    { key: 'parentPhoneNumber', label: 'Parent Phone Number' },
    { key: 'totalFee', label: 'Total Fee' },
    { key: 'address', label: 'Address' }
  ]

  const validateRequiredFields = () => {
    const missing = requiredFields.filter(({ key }) => !String(formData[key] ?? '').trim())

    if (missing.length > 0) {
      setValidationError(`Please fill in the required fields: ${missing.map((field) => field.label).join(', ')}`)
      return false
    }

    setValidationError('')
    return true
  }

  useEffect(() => {
    if (DataToUpdate?.isEditing) {
      setFormData({
        rollNo: DataToUpdate.rollNo ?? '',
        name: DataToUpdate.name ?? '',
        description: DataToUpdate.description ?? '',
        fatherName: DataToUpdate.fatherName ?? '',
        motherName: DataToUpdate.motherName ?? '',
        class: DataToUpdate.class ?? '',
        fatherOccupation: DataToUpdate.fatherOccupation ?? '',
        caste: DataToUpdate.caste ?? '',
        dob: DataToUpdate.dob ?? '',
        doj: DataToUpdate.doj ?? '',
        email: DataToUpdate.email ?? '',
        parentPhoneNumber: DataToUpdate.parentPhoneNumber ?? '',
        address: DataToUpdate.address ?? '',
        totalFee: DataToUpdate.totalFee ?? ''
      })
    }
  }, [DataToUpdate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateRequiredFields()) {
      return
    }

    try {
      const payload = {
        rollNo: DataToUpdate?.isEditing ? Number(DataToUpdate.rollNo) || 0 : 0,
        name: formData.name,
        description: formData.description,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        class: Number(formData.class) || 0,
        fatherOccupation: formData.fatherOccupation,
        caste: formData.caste,
        dob: formData.dob,
        doj: formData.doj,
        email: formData.email,
        parentPhoneNumber: formData.parentPhoneNumber,
        address: formData.address,
        totalFee: formData.totalFee
      }

      const operationType = DataToUpdate?.isEditing ? 'Update' : 'Add'
      const response = await AddStudentRecord(payload, operationType)
      const message = response?.data?.message || response?.message || 'Student saved successfully.'
      setStatusMessage(message)

      if (DataToUpdate?.isEditing) {
        dispatch(clearStudentData())
      }

      setFormData(initialFormState)
    } catch (error) {
      setStatusMessage('Unable to save student details.')
    }
  }

  return (
    <div className='w-full h-full flex flex-col justify-center items-center'>
      <form onSubmit={handleSubmit} className='form-grid w-full'>
        <p className='section-title span-3'>{DataToUpdate?.isEditing ? 'Update Student' : 'Add a Student'}</p>

        <div className='w-full span-3'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Full Name <span className='text-red-500'>*</span></label>
          <input type="text" name='name' value={formData.name} onChange={handleChange} placeholder='Full name' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Description</label>
          <input type="text" name='description' value={formData.description} onChange={handleChange} placeholder='Description' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Father's Name <span className='text-red-500'>*</span></label>
          <input type="text" name='fatherName' value={formData.fatherName} onChange={handleChange} placeholder="Father's Name" className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Mother's Name <span className='text-red-500'>*</span></label>
          <input type="text" name='motherName' value={formData.motherName} onChange={handleChange} placeholder="Mother's Name" className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Class <span className='text-red-500'>*</span></label>
          <input type="number" name='class' value={formData.class} onChange={handleChange} placeholder='Class' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Father Occupation <span className='text-red-500'>*</span></label>
          <input type="text" name='fatherOccupation' value={formData.fatherOccupation} onChange={handleChange} placeholder='Father Occupation' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Caste <span className='text-red-500'>*</span></label>
          <input type="text" name='caste' value={formData.caste} onChange={handleChange} placeholder='Caste' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Date of Birth <span className='text-red-500'>*</span></label>
          <input type="date" name='dob' value={formData.dob} onChange={handleChange} placeholder='DOB' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Date of Join <span className='text-red-500'>*</span></label>
          <input type="date" name='doj' value={formData.doj} onChange={handleChange} placeholder='DOJ' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Email <span className='text-red-500'>*</span></label>
          <input type="email" name='email' value={formData.email} onChange={handleChange} placeholder='Email' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Parent Phone Number <span className='text-red-500'>*</span></label>
          <input type="text" name='parentPhoneNumber' value={formData.parentPhoneNumber} onChange={handleChange} placeholder='Parent Phone Number' className='w-full'/>
        </div>

        <div className='w-full'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Total Fee <span className='text-red-500'>*</span></label>
          <input type="text" name='totalFee' value={formData.totalFee} onChange={handleChange} placeholder='Total Fee' className='w-full'/>
        </div>

        <div className='w-full span-2'>
          <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Address <span className='text-red-500'>*</span></label>
          <input type="text" name='address' value={formData.address} onChange={handleChange} placeholder='Address' className='w-full'/>
        </div>

        <button type='submit' className='primary-action self-center mt-2'>{DataToUpdate?.isEditing ? 'Update Student' : 'Save Student'}</button>
      </form>
      {validationError && <p className='mt-3 text-sm text-red-600 font-medium'>{validationError}</p>}
      {statusMessage && <p className='mt-2 text-[var(--color-btn-warning)]'>{statusMessage}</p>}
    </div>
  )
}

export default AddStudent