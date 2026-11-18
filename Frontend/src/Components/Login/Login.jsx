import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { VerifyLogin } from '../../Server.js'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('Email and password are required.')
      return
    }

    const loginRes = await VerifyLogin({ email, password })
    const status = loginRes?.status ?? loginRes?.response?.status

    if (status >= 200 && status < 300) {
      navigate('/mainpage/dashboard')
      return
    }

    const apiMessage = loginRes?.data?.message || loginRes?.response?.data?.message || loginRes?.message || 'Login failed.'
    setMessage(apiMessage)
  }

  return (
    <div className='flex flex-col items-center justify-center w-screen h-screen bg-gray-100'>
      <p className='text-[36px] pb-2'>Welcome, Log into your account</p>
      <div className='w-full grid place-items-center bg-white md:w-[40vw] shadow-xl rounded-2xl'>
        <div id='signup-details' className='w-[45%] flex flex-col items-center justify- gap-2 p-5 text-center'>
          <p className='text-[20px]/4 text-center pb-2 self-center'>User Login</p>
          <input type='text' value={email} placeholder='Enter your email' onChange={(e) => setEmail(e.target.value)} />
          <input type='password' value={password} placeholder='Enter your password' onChange={(e) => setPassword(e.target.value)} />
          <p className='text-[10px] self-start'>*password must be at least 8 characters</p>
          {message && <p className='text-xs text-red-500 self-start'>{message}</p>}
          <button onClick={handleLogin} className='bg-blue-400 px-5 w-full mt-3 rounded-[3px] py-1 text-white cursor-pointer transition-all ease-in-out active:scale-102'>Login</button>
          <p>Don't have an account? <Link className='text-blue-400 mt-1 underline active:text-blue-400' to='/signup'>Signup</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Login