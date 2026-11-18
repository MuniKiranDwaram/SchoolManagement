import React, { useEffect, useState } from 'react'
import './AddTeacher.css'
import { AddEntries } from '../../../Server.js'
import { useDispatch, useSelector } from 'react-redux'
import { clearTeacherData } from '../../../Redux/Slices/AddTeacherSlice.js'

const initialFormState = {
  designation: '',
  name: '',
  class: '',
  subject: '',
  dob: '',
  doj: '',
  email: '',
  phone: '',
  salary: '',
  address: ''
};

const AddTeacher = () => {
  const DataToUpdate = useSelector((state) => state.UpdateTeacher);
  const [statusMessage, SetStatusMessage] = useState('');
  const dispatch = useDispatch();
  const [formdata, setFormdata] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({ ...prev, [name]: value }));
    setValidationError('');
  }

  const [validationError, setValidationError] = useState('');

  const requiredFields = [
    { key: 'designation', label: 'Designation' },
    { key: 'name', label: 'Full Name' },
    { key: 'class', label: 'Class' },
    { key: 'subject', label: 'Subject' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'doj', label: 'Date of Join' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'salary', label: 'Salary' },
    { key: 'address', label: 'Address' }
  ];

  const validateRequiredFields = () => {
    const missing = requiredFields.filter(({ key }) => !String(formdata[key] ?? '').trim());

    if (missing.length > 0) {
      setValidationError(`Please fill in the required fields: ${missing.map((field) => field.label).join(', ')}`);
      return false;
    }

    setValidationError('');
    return true;
  }

  const AddTeacherDetails = async (e) => {
    e.preventDefault();

    if (!validateRequiredFields()) {
      return;
    }

    const isEditing = Boolean(DataToUpdate?.isEditing);
    const payload = {
      ...formdata,
      class: Number(formdata.class) || 0
    };

    const res = isEditing
      ? await AddEntries(payload, 'Update', 'Teacher')
      : await AddEntries(payload, 'Add', 'Teacher');

    if (res && res.data && res.data.message) {
      SetStatusMessage(res.data.message);
    }

    const teacherRecord = {
      ...payload,
      teacherID: payload.teacherID || `T-${Date.now()}`,
      class: String(payload.class || ''),
      name: payload.name || ''
    };

    const storedTeachers = JSON.parse(localStorage.getItem('schoolTeachers') || '[]');
    const nextTeachers = Array.isArray(storedTeachers) ? storedTeachers : [];
    const filteredTeachers = nextTeachers.filter((teacher) => !(teacher.name === teacherRecord.name && teacher.email === teacherRecord.email));
    filteredTeachers.push(teacherRecord);
    localStorage.setItem('schoolTeachers', JSON.stringify(filteredTeachers));

    if (isEditing) {
      dispatch(clearTeacherData());
    }

    setFormdata(initialFormState);
  }

  useEffect(() => {
    if (DataToUpdate?.isEditing) {
      setFormdata({
        designation: DataToUpdate.designation || '',
        name: DataToUpdate.name || '',
        class: DataToUpdate.class || '',
        subject: DataToUpdate.subject || '',
        dob: DataToUpdate.dob || '',
        doj: DataToUpdate.doj || '',
        email: DataToUpdate.email || '',
        phone: DataToUpdate.phone || '',
        salary: DataToUpdate.salary || '',
        address: DataToUpdate.address || ''
      });
    }
  }, [DataToUpdate]);

  useEffect(() => {
    if (!statusMessage) return;

    const timer = setTimeout(() => {
      SetStatusMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [statusMessage]);

  return (
    <>
      <div className='w-full h-full flex flex-col justify-center items-center overflow-hidden'>
        <form onSubmit={AddTeacherDetails} className='form-grid w-full'>
          <p className='section-title span-3'>{DataToUpdate?.isEditing ? 'Update Teacher' : 'Add a Teacher'}</p>

          <div className='w-full span-3'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Designation <span className='text-red-500'>*</span></label>
            <input onChange={handleChange} name='designation' value={formdata.designation} type="text" placeholder='Designation' className='w-full'/>
          </div>

          <div className='w-full span-3'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Full Name <span className='text-red-500'>*</span></label>
            <input onChange={handleChange} name='name' value={formdata.name} type="text" placeholder='Full name' className='w-full'/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Class <span className='text-red-500'>*</span></label>
            <input onChange={handleChange} type="text" placeholder='Class' name='class' value={formdata.class} className='w-full'/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Subject <span className='text-red-500'>*</span></label>
            <input onChange={handleChange} type="text" placeholder='Subject' name='subject' value={formdata.subject} className='w-full'/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Date of Birth <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="date" className='w-full' name='dob' value={formdata.dob}/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Date of Join <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="date" className='w-full' name='doj' value={formdata.doj}/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Email <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="text" placeholder='Email' name='email' value={formdata.email} className='w-full'/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Phone <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="text" placeholder='Phone' name='phone' value={formdata.phone} className='w-full'/>
          </div>

          <div className='w-full'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Salary <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="text" placeholder='Salary' name='salary' value={formdata.salary} className='w-full'/>
          </div>

          <div className='w-full span-2'>
            <label className='block pl-2 text-[13px] text-blue-600 mb-2'>Address <span className='text-red-500'>*</span></label>
            <input onChange={(e)=>handleChange(e)} type="text" placeholder='Address' className='w-full' name='address' value={formdata.address}/>
          </div>

          <button type='submit' className='primary-action self-center mt-2'>{DataToUpdate?.isEditing ? 'Update Teacher' : 'Save Teacher'}</button>
        </form>
      </div>
      {validationError && <p className='mt-3 text-sm text-red-600 font-medium'>{validationError}</p>}
      {statusMessage ? <label className='absolute bottom-8 left[50%] text-[var(--color-btn-warning)] transition-all'>{statusMessage}</label> : <></>}
    </>
  )
}

export default AddTeacher