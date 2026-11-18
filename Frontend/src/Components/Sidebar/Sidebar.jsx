import React, { useEffect, useState } from 'react'
import './Sidebar.css'
import img from '../../assets/Images/SidebarProfile.png'
import student from '../../assets/Images/Students.png'
import dashboard from '../../assets/Images/Dashboard.png'
import event from '../../assets/Images/Event.png'
import exam from '../../assets/Images/Exam.png'
import billing from '../../assets/Images/Billing.png'
import teacher from '../../assets/Images/teacher.png'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import downArrow from '../../assets/Images/downArrow.png'
import upArrow from '../../assets/Images/UpArrow.png'
import { Logout } from '../../Server'

const Sidebar = () => {
    const [activeItem, setActiveItem] = useState('Home page');
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [submenuOpen, setSubmenuOpen] = useState({
        teacher: false,
        student: false,
        billing: false,
        exams: false,
        events: false
    });
    const nav = useNavigate();

    const location = useLocation();

    useEffect(() => {
        const pathname = location.pathname;

        if (pathname.startsWith('/mainpage/dashboard')) {
            setActiveItem('Home page');
            setActiveSubmenu(null);
            setSubmenuOpen({ teacher: false, student: false, billing: false, exams: false, events: false });
            return;
        }

        if (pathname.startsWith('/mainpage/teacher')) {
            setActiveItem('Teachers');
            setActiveSubmenu(pathname.includes('/addTeacher') ? 'Add Teacher' : 'Search Teacher');
            setSubmenuOpen((prev) => ({ ...prev, teacher: true, student: false, billing: false, exams: false, events: false }));
            return;
        }

        if (pathname.startsWith('/mainpage/student')) {
            setActiveItem('Students/Classes');
            setActiveSubmenu(pathname.includes('/addStudent') ? 'Add Student' : pathname.includes('/classDetails') ? 'Class Details' : 'Search Student');
            setSubmenuOpen((prev) => ({ ...prev, teacher: false, student: true, billing: false, exams: false, events: false }));
            return;
        }

        if (pathname.startsWith('/mainpage/billing')) {
            setActiveItem('Billing');
            setActiveSubmenu(pathname.includes('/payment-details') ? 'Payment Records' : 'Fee Summary');
            setSubmenuOpen((prev) => ({ ...prev, teacher: false, student: false, billing: true, exams: false, events: false }));
            return;
        }

        if (pathname.startsWith('/mainpage/exams')) {
            setActiveItem('Exams');
            setActiveSubmenu(pathname.includes('/enterResults') ? 'Enter Results' : 'Search Results');
            setSubmenuOpen((prev) => ({ ...prev, teacher: false, student: false, billing: false, exams: true, events: false }));
            return;
        }

        if (pathname.startsWith('/mainpage/holidays') || pathname.startsWith('/mainpage/events')) {
            setActiveItem('Events/Holidays');
            setActiveSubmenu(pathname.startsWith('/mainpage/holidays') ? 'Create Holiday' : 'Create Event');
            setSubmenuOpen((prev) => ({ ...prev, teacher: false, student: false, billing: false, exams: false, events: true }));
            return;
        }

        setActiveItem('Home page');
        setActiveSubmenu(null);
        setSubmenuOpen({ teacher: false, student: false, billing: false, exams: false, events: false });
    }, [location.pathname]);

    const toggleMenu = (key) => {
        setSubmenuOpen((prev) => {
            const nextState = Object.keys(prev).reduce((acc, item) => ({
                ...acc,
                [item]: false
            }), {});

            return {
                ...nextState,
                [key]: !prev[key]
            };
        });
    };

    const closeSubmenu = () => {
        setSubmenuOpen({
            teacher: false,
            student: false,
            billing: false,
            exams: false,
            events: false
        });
    };

    const menuItemClass = (item) => `${activeItem === item ? 'menu-item-parent active' : 'menu-item-parent'} rounded-sm`;
    const submenuItemClass = (label) => `${activeSubmenu === label ? 'submenu-item active-submenu' : 'submenu-item'}`;

    const goTo = (route, parentItem, childLabel, submenuKey) => {
        setActiveItem(parentItem);
        setActiveSubmenu(childLabel);
        setSubmenuOpen((prev) => ({
            teacher: false,
            student: false,
            billing: false,
            exams: false,
            events: false,
            [submenuKey]: true
        }));
        nav(route);
    };

    return (
        <div className='sidebar-shell'>
            <div className='sidebar-panel'>
                <div className='sidebar-header'>
                    <img src={img} alt='' className='w-20' />
                    <h2>Welcome</h2>
                </div>

                <div className='sidebar-divider'></div>

                <div className='sidebar-menu-wrap'>
                    <ul id='sidebar-items'>
                        <li className={menuItemClass('Home page')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Home page');
                                setActiveSubmenu(null);
                                closeSubmenu();
                                nav('/mainpage/dashboard');
                            }}>
                                <div className='menu-item-main'>
                                    <img src={dashboard} alt='' />
                                    <p>Home page</p>
                                </div>
                            </div>
                        </li>

                        <li className={menuItemClass('Teachers')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Teachers');
                                toggleMenu('teacher');
                            }} aria-expanded={submenuOpen.teacher}>
                                <div className='menu-item-main'>
                                    <img src={teacher} className='w-5' alt='' />
                                    <p>Teachers</p>
                                </div>
                                <img src={submenuOpen.teacher ? upArrow : downArrow} alt='' className='w-3 h-3' />
                            </div>
                            <ul className={`${submenuOpen.teacher ? 'submenu open' : 'submenu'} submenu`}>
                                <li className={submenuItemClass('Add Teacher')} onClick={() => goTo('/mainpage/teacher/addTeacher', 'Teachers', 'Add Teacher', 'teacher')}>Add Teacher</li>
                                <li className={submenuItemClass('Search Teacher')} onClick={() => goTo('/mainpage/teacher/searchTeacher', 'Teachers', 'Search Teacher', 'teacher')}>Search Teacher</li>
                            </ul>
                        </li>

                        <li className={menuItemClass('Students/Classes')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Students/Classes');
                                toggleMenu('student');
                            }} aria-expanded={submenuOpen.student}>
                                <div className='menu-item-main'>
                                    <img src={student} alt='' />
                                    <p>Students/Classes</p>
                                </div>
                                <img src={submenuOpen.student ? upArrow : downArrow} alt='' className='w-3 h-3' />
                            </div>
                            <ul className={`${submenuOpen.student ? 'submenu open' : 'submenu'} submenu`}>
                                <li className={submenuItemClass('Add Student')} onClick={() => goTo('/mainpage/student/addStudent', 'Students/Classes', 'Add Student', 'student')}>Add Student</li>
                                <li className={submenuItemClass('Search Student')} onClick={() => goTo('/mainpage/student/searchStudent', 'Students/Classes', 'Search Student', 'student')}>Search Student</li>
                                <li className={submenuItemClass('Class Details')} onClick={() => goTo('/mainpage/student/classDetails', 'Students/Classes', 'Class Details', 'student')}>Class Details</li>
                            </ul>
                        </li>

                        <li className={menuItemClass('Billing')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Billing');
                                toggleMenu('billing');
                            }} aria-expanded={submenuOpen.billing}>
                                <div className='menu-item-main'>
                                    <img src={billing} alt='' />
                                    <p>Billing</p>
                                </div>
                                <img src={submenuOpen.billing ? upArrow : downArrow} alt='' className='w-3 h-3' />
                            </div>
                            <ul className={`${submenuOpen.billing ? 'submenu open' : 'submenu'} submenu`}>
                                <li className={submenuItemClass('Fee Summary')} onClick={() => goTo('/mainpage/billing', 'Billing', 'Fee Summary', 'billing')}>Fee Summary</li>
                                <li className={submenuItemClass('Payment Records')} onClick={() => goTo('/mainpage/billing/payment-details', 'Billing', 'Payment Records', 'billing')}>Payment Records</li>
                            </ul>
                        </li>

                        <li className={menuItemClass('Exams')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Exams');
                                toggleMenu('exams');
                            }} aria-expanded={submenuOpen.exams}>
                                <div className='menu-item-main'>
                                    <img src={exam} alt='' />
                                    <p>Exams</p>
                                </div>
                                <img src={submenuOpen.exams ? upArrow : downArrow} alt='' className='w-3 h-3' />
                            </div>
                            <ul className={`${submenuOpen.exams ? 'submenu open' : 'submenu'} submenu`}>
                                <li className={submenuItemClass('Enter Results')} onClick={() => goTo('/mainpage/exams/enterResults', 'Exams', 'Enter Results', 'exams')}>Enter Results</li>
                                <li className={submenuItemClass('Search Results')} onClick={() => goTo('/mainpage/exams/searchResults', 'Exams', 'Search Results', 'exams')}>Search Results</li>
                            </ul>
                        </li>

                        <li className={menuItemClass('Events/Holidays')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('Events/Holidays');
                                toggleMenu('events');
                            }} aria-expanded={submenuOpen.events}>
                                <div className='menu-item-main'>
                                    <img src={event} alt='' />
                                    <p>Events/Holidays</p>
                                </div>
                                <img src={submenuOpen.events ? upArrow : downArrow} alt='' className='w-3 h-3' />
                            </div>
                            <ul className={`${submenuOpen.events ? 'submenu open' : 'submenu'} submenu`}>
                                <li className={submenuItemClass('Create Holiday')} onClick={() => goTo('/mainpage/holidays', 'Events/Holidays', 'Create Holiday', 'events')}>Create Holiday</li>
                                <li className={submenuItemClass('Create Event')} onClick={() => goTo('/mainpage/events', 'Events/Holidays', 'Create Event', 'events')}>Create Event</li>
                            </ul>
                        </li>

                        <li className={menuItemClass('School Tenants')}>
                            <div className='menu-item' onClick={() => {
                                setActiveItem('School Tenants');
                                setActiveSubmenu(null);
                                closeSubmenu();
                                nav('/mainpage/tenants');
                            }}>
                                <div className='menu-item-main'>
                                    <img src={dashboard} alt='' />
                                    <p>School Tenants</p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>

                <button className='sidebar-logout' onClick={Logout}>Log out</button>
            </div>
        </div>
    )
}

export default Sidebar