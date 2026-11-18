import React, { useEffect, useState } from 'react'
import { DeleteCalendarEntry, GetCalendarEntries, SaveCalendarEntry, SendCalendarNotification, UpdateCalendarEntry } from '../../Server'

const initialForm = { name: '', date: '', googleFormLink: '' }

const EventsOrHolidays = ({ type = 'holiday' }) => {
    const [entries, setEntries] = useState([])
    const [form, setForm] = useState(initialForm)
    const [editingId, setEditingId] = useState(null)
    const [sendWhatsApp, setSendWhatsApp] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const isHolidayPage = type === 'holiday'

    const loadEntries = async () => {
        setIsLoading(true)
        const result = await GetCalendarEntries(isHolidayPage ? 'Holiday' : 'Event')
        setEntries(Array.isArray(result) ? result : [])
        setIsLoading(false)
    }

    useEffect(() => {
        loadEntries()
    }, [type])

    const sendWhatsAppToTeachers = async (title, date) => {
        const payload = {
            type: isHolidayPage ? 'Holiday' : 'Event',
            title,
            date
        }

        const response = await SendCalendarNotification(payload)
        const links = Array.isArray(response?.links) ? response.links : []

        if (links.length > 0) {
            links.forEach((link) => {
                if (typeof window !== 'undefined') {
                    window.open(link, '_blank', 'noopener,noreferrer')
                }
            })
        }

        return response
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!form.name.trim() || !form.date) {
            return
        }

        const payload = {
            type: isHolidayPage ? 'Holiday' : 'Event',
            title: form.name.trim(),
            date: form.date,
            googleFormLink: isHolidayPage ? null : form.googleFormLink?.trim() || null
        }

        console.log('Submitting calendar entry:', payload)

        try {
            let response
            if (editingId) {
                response = await UpdateCalendarEntry(editingId, payload)
            } else {
                response = await SaveCalendarEntry(payload)
            }

            console.log('Calendar save response:', response)

            if (sendWhatsApp) {
                const notificationResponse = await sendWhatsAppToTeachers(payload.title, payload.date)
                console.log('WhatsApp notification response:', notificationResponse)
            }

            setForm(initialForm)
            setEditingId(null)
            setSendWhatsApp(false)
            await loadEntries()
        } catch (error) {
            console.error('Calendar save failed:', error)
        }
    }

    const handleEdit = (item) => {
        setEditingId(item.id)
        setForm({
            name: item.title || '',
            date: item.date || '',
            googleFormLink: item.googleFormLink || ''
        })
    }

    const handleDelete = async (id) => {
        await DeleteCalendarEntry(id)
        await loadEntries()
    }

    return (
        <div className='page-shell'>
            <div className='page-card'>
                <div className='section-head'>
                    <div>
                        <p className='section-kicker'>Calendar</p>
                        <h2 className='section-title'>{isHolidayPage ? 'Holiday Management' : 'Event Management'}</h2>
                    </div>
                </div>

                <div className='space-y-8'>
                    <div className='rounded-2xl border border-slate-200 bg-slate-50 p-5'>
                        <p className='text-[1.25rem] font-semibold text-slate-800 mb-4'>
                            {editingId ? `Edit ${isHolidayPage ? 'Holiday' : 'Event'}` : isHolidayPage ? 'Create Holiday' : 'Create Event'}
                        </p>
                        <form onSubmit={handleSubmit} className='grid gap-3'>
                            <input
                                type='text'
                                value={form.name}
                                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                                placeholder={isHolidayPage ? 'Holiday Name' : 'Event Name'}
                                className='w-full'
                            />
                            <input
                                type='date'
                                value={form.date}
                                onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
                                className='w-full'
                            />
                            {!isHolidayPage && (
                                <input
                                    type='url'
                                    value={form.googleFormLink}
                                    onChange={(e) => setForm((current) => ({ ...current, googleFormLink: e.target.value }))}
                                    placeholder='Google Form Link (optional)'
                                    className='w-full'
                                />
                            )}
                            <label className='flex items-center gap-3 text-sm font-medium text-slate-700'>
                                <input
                                    type='checkbox'
                                    checked={sendWhatsApp}
                                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                                />
                                Send WhatsApp message to all teachers
                            </label>
                            <div className='flex items-center gap-3'>
                                <button type='submit' className='primary-action w-fit'>
                                    {editingId ? (isHolidayPage ? 'Update Holiday' : 'Update Event') : (isHolidayPage ? 'Add Holiday' : 'Add Event')}
                                </button>
                                {editingId && (
                                    <button
                                        type='button'
                                        className='secondary-action'
                                        onClick={() => {
                                            setEditingId(null)
                                            setForm(initialForm)
                                            setSendWhatsApp(false)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className='space-y-3'>
                        <p className='text-[1.25rem] font-semibold text-slate-800'>
                            {isHolidayPage ? 'Holidays' : 'Events'}
                        </p>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : entries.length > 0 ? (
                            entries.map((item) => (
                                <div key={item.id} className='list-item'>
                                    <div>
                                        <p className='font-semibold'>{item.title}</p>
                                        <p className='text-slate-600'>{item.date}</p>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        {!isHolidayPage && item.googleFormLink ? (
                                            <a href={item.googleFormLink} target='_blank' rel='noreferrer' className='text-blue-600 underline'>Register</a>
                                        ) : (
                                            <span className='panel-chip'>{isHolidayPage ? 'Holiday' : 'Event'}</span>
                                        )}
                                        <button type='button' className='secondary-action' onClick={() => handleEdit(item)}>Edit</button>
                                        <button type='button' className='secondary-action' onClick={() => handleDelete(item.id)}>Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>{isHolidayPage ? 'No holiday details found' : 'No Event details found'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EventsOrHolidays