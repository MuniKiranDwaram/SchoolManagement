import React, { useState } from 'react'
import './Signup.css'
import { Link } from 'react-router-dom'
import { Register, setSchoolName } from '../../Server.js'

const Signup = () => {
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolNameState] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleRegister = async () => {
    if (!fullName.trim() || !schoolName.trim() || !email.trim() || !password.trim()) {
      setMessage('Full name, school name, email, and password are required.')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    const response = await Register({ email, password, schoolName })

    if (response?.status >= 400 || response?.response?.status >= 400) {
      const apiMessage = response?.response?.data?.message || response?.message || 'Registration failed.'
      setMessage(apiMessage)
      return
    }

    setSchoolName(schoolName)
    setMessage('Registration successful. Please sign in.')
  }

  return (
    <div className='flex flex-col items-center justify-center w-screen h-screen bg-gray-100'>
      <p className='text-[36px] pb-2'>Welcome, Create your account</p>
      <div className='w-full grid place-items-center bg-white md:w-[40vw] shadow-xl rounded-2xl'>
        <div id='signup-details' className='w-[45%] flex flex-col items-center justify- gap-2 p-5 text-center'>
          <p className='text-[20px]/4 text-center pb-2 self-center'>User Registration</p>
          <input type='text' value={fullName} placeholder='Enter your full name' onChange={(e) => setFullName(e.target.value)} />
          <input type='text' value={schoolName} placeholder='Enter your school name' onChange={(e) => setSchoolNameState(e.target.value)} />
          <input type='email' value={email} placeholder='Enter your school email' onChange={(e) => setEmail(e.target.value)} />
          <input type='password' value={password} placeholder='Enter your password' onChange={(e) => setPassword(e.target.value)} />
          <input type='password' value={confirmPassword} placeholder='Confirm Password' onChange={(e) => setConfirmPassword(e.target.value)} />
          <p className='text-[10px] self-start'>*password must be at least 8 characters</p>
          {message && <p className='text-xs text-red-500 self-start'>{message}</p>}
          <button onClick={handleRegister} className='bg-blue-400 px-5 w-full mt-3 rounded-[3px] py-1 text-white cursor-pointer transition-all ease-in-out active:scale-102'>Register</button>
          <p>Already have an account? <Link className='text-blue-400 mt-1 active:text-blue-400' to='/'>SignIn</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Signup