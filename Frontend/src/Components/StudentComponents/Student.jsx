import React from 'react'
import { Outlet } from 'react-router-dom'

const Student = () => {
  return (
    <div className='page-shell'>
      <div className='page-card'>
        <div className='section-head'>
          <div>
            <p className='section-kicker'>Student management</p>
            <h2 className='section-title'>Students / Classes</h2>
          </div>
        </div>

        <div className='w-full'>
          <Outlet></Outlet>
        </div>
      </div>
    </div>
  )
}

export default Student