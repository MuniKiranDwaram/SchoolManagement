import React from 'react'
import Dashboard from '../Dashboard/Dashboard'
import Sidebar from '../Sidebar/Sidebar'
import Teacher from '../Teacher/Teacher'
import { Outlet } from 'react-router-dom'

const Mainpage = () => {
  return (
    <div className='grid grid-cols-[280px_minmax(0,1fr)] h-[100vh] grid-rows-1 overflow-hidden min-h-0'>
        <Sidebar></Sidebar>
        <div className='min-h-0 overflow-y-auto overflow-x-hidden'>
          <Outlet></Outlet>
        </div>
    </div>
  )
}

export default Mainpage