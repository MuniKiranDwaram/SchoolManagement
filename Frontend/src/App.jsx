import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Signup from './Components/Signup/Signup'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './Components/Login/login'
import Sidebar from './Components/Sidebar/Sidebar'
import Dashboard from './Components/Dashboard/Dashboard'
import Mainpage from './Components/MainPage/Mainpage'
import Teacher from './Components/Teacher/Teacher'
import Student from './Components/StudentComponents/Student'
import AddTeacher from './Components/Teacher/AddTeacher/AddTeacher'
import SearchTeacher from './Components/Teacher/SearchTeacherDetails/SearchTeacher'
import TeacherView from './Components/Teacher/TeacherView/TeacherView'
import SearchStudent from './Components/StudentComponents/SearchStudent/SearchStudent'
import AddStudent from './Components/StudentComponents/AddStudent/AddStudent'
import StudentView from './Components/StudentComponents/StudentView/StudentView'
import ClassDetails from './Components/ClassDetails/ClassDetails'
import Billing from './Components/Billing/Billing'
import PaymentDetails from './Components/Billing/PaymentDetails'
import SearchResults from './Components/Exams/SearchResults/SearchResults'
import EnterResults from './Components/Exams/EnterResults/EnterResults'
import EventsOrHolidays from './Components/EventsOrHolidays/EventsOrHolidays'
import TenantAdmin from './Components/Tenants/TenantAdmin'
import { Provider } from 'react-redux'
import { store } from './Redux/store'
import { isAuthenticated } from './Server'

const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to='/login' replace />;
};

const PublicRoute = ({ children }) => {
  return !isAuthenticated() ? children : <Navigate to='/mainpage/dashboard' replace />;
};

function App() {
  const [count, setCount] = useState(0)

  return (
    <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to={isAuthenticated() ? '/mainpage/dashboard' : '/login'} replace />} />
        <Route path='/login' element={<PublicRoute><Login /></PublicRoute>} />
        <Route path='/signup' element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path='/mainpage' element={<ProtectedRoute><Mainpage /></ProtectedRoute>}>

          <Route index element={<Navigate to='dashboard' replace />} />
          <Route path='dashboard' element={<Dashboard></Dashboard>}></Route>
          <Route path='teacher' element={<Teacher />}>
            <Route index element={<Navigate to='searchTeacher' replace />} />
            <Route path='addTeacher' element={<AddTeacher />} />
            <Route path='searchTeacher' element={<SearchTeacher />} />
            <Route path='viewTeacher' element={<TeacherView />} />
          </Route>
          <Route path='student' element={<Student />}>
            <Route index element={<Navigate to='searchStudent' replace />} />
            <Route path='searchStudent' element={<SearchStudent></SearchStudent>}></Route>
            <Route path='addStudent' element={<AddStudent></AddStudent>}></Route>
            <Route path='classDetails' element={<ClassDetails></ClassDetails>}></Route>
            <Route path='viewStudent' element={<StudentView></StudentView>}></Route>
          </Route>
          <Route path='billing' element={<Billing></Billing>}></Route>
          <Route path='billing/payment-details' element={<PaymentDetails></PaymentDetails>}></Route>
          <Route path='exams'>
            <Route index element={<Navigate to='searchResults' replace />} />
            <Route path='searchResults' element={<SearchResults></SearchResults>}></Route>
            <Route path='enterResults' element={<EnterResults></EnterResults>}></Route>
          </Route>
          <Route path='holidays' element={<EventsOrHolidays type='holiday' />}></Route>
          <Route path='events' element={<EventsOrHolidays type='event' />}></Route>
          <Route path='tenants' element={<TenantAdmin />}></Route>
        </Route>
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </BrowserRouter>
    </Provider>
  )
}

export default App
