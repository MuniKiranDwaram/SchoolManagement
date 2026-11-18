import React, { useEffect, useState } from 'react'
import './Billing.css'
import { useNavigate } from 'react-router-dom'
import { GetFeeDetails, PayStudentFee, SearchStudentDetails } from '../../Server'

const buildReceiptHtml = (receipt) => {
    const paymentDate = receipt?.paymentDate ? new Date(receipt.paymentDate).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }) : '—';

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Payment Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
                    .receipt { max-width: 640px; margin: 0 auto; border: 1px solid #dbe3ee; border-radius: 18px; padding: 24px; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                    .brand { font-size: 28px; font-weight: 700; color: #1d4ed8; }
                    .subtitle { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
                    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; }
                    .row { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
                    .label { display: block; color: #64748b; font-size: 12px; margin-bottom: 4px; }
                    .value { font-weight: 700; }
                    .total { border-top: 1px dashed #cbd5e1; padding-top: 16px; margin-top: 18px; font-size: 22px; font-weight: 700; display: flex; justify-content: space-between; }
                    .footer { margin-top: 20px; font-size: 12px; color: #475569; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div>
                            <div class="subtitle">Official receipt</div>
                            <div class="brand">School Management</div>
                        </div>
                        <div class="subtitle">Receipt</div>
                    </div>

                    <div class="meta">
                        <div class="row">
                            <span class="label">Student</span>
                            <span class="value">${receipt?.studentName || 'Student'}</span>
                        </div>
                        <div class="row">
                            <span class="label">Date</span>
                            <span class="value">${paymentDate}</span>
                        </div>
                        <div class="row">
                            <span class="label">Payment mode</span>
                            <span class="value">${receipt?.paymentMode || 'Cash'}</span>
                        </div>
                        <div class="row">
                            <span class="label">Reference</span>
                            <span class="value">${receipt?.referenceNumber || '—'}</span>
                        </div>
                    </div>

                    <div class="row">
                        <span class="label">Notes</span>
                        <span class="value">${receipt?.notes || 'No additional notes'}</span>
                    </div>

                    <div class="total">
                        <span>Paid amount</span>
                        <span>₹${Number(receipt?.amount ?? 0).toLocaleString('en-IN')}</span>
                    </div>

                    <div class="footer">
                        <p>Balance remaining: ₹${Number(receipt?.remainingFee ?? 0).toLocaleString('en-IN')}</p>
                        <p>Thank you for your payment.</p>
                    </div>
                </div>
            </body>
        </html>
    `;
};

const Billing = () => {
    const navigate = useNavigate()
    const [student, setStudent] = useState({})
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [amount, setAmount] = useState('')
    const [message, setMessage] = useState('')
    const [lastReceipt, setLastReceipt] = useState(null)

    useEffect(() => {
        const trimmed = searchTerm.trim()

        if (!trimmed) {
            setSearchResults([])
            setMessage('')
            return
        }

        const timer = setTimeout(async () => {
            const result = await SearchStudentDetails(trimmed)
            const matches = Array.isArray(result) ? result : []
            setSearchResults(matches)

            if (matches.length === 0) {
                setStudent({})
                setMessage('No matching student found.')
            } else {
                setMessage('')
            }
        }, 250)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const handleStudentSelect = async (selectedStudent) => {
        const studentName = selectedStudent?.name || selectedStudent?.studentName || ''
        if (!studentName) {
            return
        }

        setSearchTerm('')
        setSearchResults([])

        const result = await GetFeeDetails(studentName)
        if (result?.status >= 400 || result?.message?.includes('not found')) {
            setStudent({})
            setMessage(result?.message || 'Student fee details not found.')
            return
        }

        setStudent(result)
        setMessage('')
    }

    const handlePayment = async () => {
        const selectedName = student?.studentName || searchTerm.trim()
        if (!selectedName) {
            setMessage('Please search for a student before paying.')
            return
        }

        const numericAmount = Number(amount)
        if (!numericAmount || numericAmount <= 0) {
            setMessage('Enter a valid amount to pay.')
            return
        }

        const result = await PayStudentFee(selectedName, numericAmount)
        if (result?.message?.includes('success') || result?.remainingFee !== undefined) {
            const receipt = {
                studentName: result?.studentName || student?.studentName || selectedName,
                amount: result?.amount ?? numericAmount,
                remainingFee: result?.remainingFee ?? 0,
                paymentDate: result?.paymentDate || new Date().toISOString(),
                paymentMode: result?.paymentMode || 'Cash',
                referenceNumber: result?.referenceNumber || '—',
                notes: result?.notes || 'No additional notes'
            }

            setStudent((prev) => ({ ...prev, ...result, balance: result.remainingFee, pendingFeeAmount: result.remainingFee }))
            setLastReceipt(receipt)
            setMessage(`${result.message} Receipt is ready to print.`)
            setAmount('')
            return
        }

        setLastReceipt(null)
        setMessage(result?.message || 'Payment failed.')
    }

    const handlePrintReceipt = () => {
        if (!lastReceipt) {
            return
        }

        const printWindow = window.open('', '_blank', 'width=900,height=900')
        if (!printWindow) {
            setMessage('Your browser blocked the print window. Please allow pop-ups and try again.')
            return
        }

        printWindow.document.write(buildReceiptHtml(lastReceipt))
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => printWindow.print(), 300)
    }

    return (
        <div className='page-shell billing-page'>
            <div className='page-card billing-card'>
                <div className='section-head'>
                    <div>
                        <p className='section-kicker'>Finance</p>
                        <h2 className='section-title'>Fee Management</h2>
                    </div>
                </div>

                <div className='billing-search-wrapper'>
                    <div className='billing-search-row'>
                        <input
                            type='text'
                            placeholder='Search student name'
                            className='billing-search-input'
                            id='search-bar'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className='billing-search-results'>
                            {searchResults.map((item) => (
                                <button
                                    key={item.rollNo || item.email || item.name}
                                    type='button'
                                    className='billing-search-result'
                                    onClick={() => handleStudentSelect(item)}
                                >
                                    <span className='billing-search-result-name'>{item.name}</span>
                                    <span className='billing-search-result-roll'>Roll No: {item.rollNo}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {message && (
                    <div className='billing-alert'>
                        {message}
                    </div>
                )}

                <div id='fee-section' className='fee-summary-panel'>
                    <div className='fee-heading'>Fee Details</div>

                    <div className='fee-summary-grid'>
                        <div className='fee-row'>
                            <span>Total fee amount</span>
                            <strong>{student.totalFeeAmount ?? '₹0'}</strong>
                        </div>
                        <div className='fee-row'>
                            <span>Balance</span>
                            <strong>{student.balance ?? student.pendingFeeAmount ?? '₹0'}</strong>
                        </div>
                    </div>

                    <div className='payment-box'>
                        <label htmlFor='amount'>Enter amount to pay</label>
                        <input
                            id='amount'
                            type='number'
                            placeholder='Amount to pay'
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={!student?.studentName && !searchTerm.trim()}
                        />

                        <div className='payment-actions'>
                            <button onClick={handlePayment} className='primary-action' disabled={!student?.studentName && !searchTerm.trim()}>Submit</button>
                            <button className='secondary-action' onClick={() => navigate('/mainpage/billing/payment-details')}>View payment details</button>
                        </div>

                        {lastReceipt && (
                            <div className='receipt-actions'>
                                <button type='button' className='primary-action' onClick={handlePrintReceipt}>Print Receipt</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Billing