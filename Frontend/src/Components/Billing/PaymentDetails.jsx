import React, { useEffect, useState } from 'react';
import './Billing.css';
import { GetPaymentDetails, SearchStudentDetails } from '../../Server';

const buildPaymentRecordHtml = (student, paymentList) => {
    const totalPaid = paymentList.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
    const rows = paymentList.map((payment) => `
        <tr>
            <td>${payment.installmentNumber ?? '—'}</td>
            <td>${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td>₹${Number(payment.amount ?? 0).toLocaleString('en-IN')}</td>
            <td>${payment.paymentMode || 'Cash'}</td>
            <td>${payment.referenceNumber || '—'}</td>
            <td>${payment.notes || '—'}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Payment Record</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
                    .record { max-width: 780px; margin: 0 auto; border: 1px solid #dbe3ee; border-radius: 18px; padding: 24px; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                    .brand { font-size: 28px; font-weight: 700; color: #1d4ed8; }
                    .meta { display: flex; justify-content: space-between; margin: 18px 0; gap: 12px; }
                    .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; flex: 1; }
                    .label { display: block; color: #64748b; font-size: 12px; }
                    .value { font-size: 18px; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                    th { background: #f8fafc; }
                    .total { font-size: 18px; font-weight: 700; margin-top: 18px; text-align: right; }
                </style>
            </head>
            <body>
                <div class="record">
                    <div class="header">
                        <div>
                            <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b;">Payment record</div>
                            <div class="brand">School Management</div>
                        </div>
                        <div style="font-size: 12px; color: #64748b;">Student ledger</div>
                    </div>

                    <div class="meta">
                        <div class="box">
                            <span class="label">Student</span>
                            <span class="value">${student}</span>
                        </div>
                        <div class="box">
                            <span class="label">Total installments</span>
                            <span class="value">${paymentList.length}</span>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Installment</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Mode</th>
                                <th>Reference</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>

                    <div class="total">Total paid: ₹${totalPaid.toLocaleString('en-IN')}</div>
                </div>
            </body>
        </html>
    `;
};

const PaymentDetails = () => {
    const [studentName, setStudentName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [payments, setPayments] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const trimmed = studentName.trim();

        if (!trimmed) {
            setSearchResults([]);
            setPayments([]);
            setMessage('');
            return;
        }

        const timer = setTimeout(async () => {
            const result = await SearchStudentDetails(trimmed);
            const matches = Array.isArray(result) ? result : [];
            setSearchResults(matches);

            if (matches.length === 0) {
                setPayments([]);
                setMessage('No matching student found.');
            } else {
                setMessage('');
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [studentName]);

    const handleSelectStudent = async (selectedStudent) => {
        const name = selectedStudent?.name || selectedStudent?.studentName || '';
        if (!name) {
            return;
        }

        setStudentName('');
        setSearchResults([]);

        const result = await GetPaymentDetails(name);

        if (result?.status >= 400 || result?.message?.includes('not found')) {
            setPayments([]);
            setMessage(result?.message || 'No payment history found.');
            return;
        }

        const paymentList = Array.isArray(result) ? result : result?.installments ?? [];
        setPayments(paymentList);
        setMessage(paymentList.length ? '' : 'No installments found for this student.');
    };

    const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

    const handlePrintPayments = () => {
        if (!payments.length) {
            return;
        }

        const student = payments[0]?.studentName || studentName.trim() || 'Student';
        const printWindow = window.open('', '_blank', 'width=980,height=900');

        if (!printWindow) {
            setMessage('Your browser blocked the print window. Please allow pop-ups and try again.');
            return;
        }

        printWindow.document.write(buildPaymentRecordHtml(student, payments));
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    return (
        <div className='page-shell billing-page'>
            <div className='page-card billing-card'>
                <div className='section-head'>
                    <div>
                        <p className='section-kicker'>Finance</p>
                        <h2 className='section-title'>Payment Details</h2>
                    </div>
                </div>

                <div className='billing-search-wrapper'>
                    <div className='billing-search-row'>
                        <input
                            type='text'
                            placeholder='Search by student name'
                            className='billing-search-input'
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className='billing-search-results'>
                            {searchResults.map((item) => (
                                <button
                                    key={item.rollNo || item.email || item.name}
                                    type='button'
                                    className='billing-search-result'
                                    onClick={() => handleSelectStudent(item)}
                                >
                                    <span className='billing-search-result-name'>{item.name}</span>
                                    <span className='billing-search-result-roll'>Roll No: {item.rollNo}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {message && <div className='billing-alert'>{message}</div>}

                {payments.length > 0 && (
                    <>
                        <div className='fee-summary-grid payment-summary-grid'>
                            <div className='fee-row'>
                                <span>Student</span>
                                <strong>{payments[0].studentName}</strong>
                            </div>
                            <div className='fee-row'>
                                <span>Total installments</span>
                                <strong>{payments.length}</strong>
                            </div>
                            <div className='fee-row'>
                                <span>Amount paid</span>
                                <strong>₹{totalPaid.toLocaleString('en-IN')}</strong>
                            </div>
                        </div>

                        <div className='receipt-actions'>
                            <button type='button' className='primary-action' onClick={handlePrintPayments}>Print Payment Record</button>
                        </div>

                        <div className='payment-table-wrapper'>
                            <table className='payment-table'>
                                <thead>
                                    <tr>
                                        <th>Installment</th>
                                        <th>Date</th>
                                        <th>Amount</th>
                                        <th>Mode</th>
                                        <th>Reference</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment.id ?? `${payment.studentName}-${payment.installmentNumber}`}>
                                            <td>{payment.installmentNumber}</td>
                                            <td>{new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td>₹{Number(payment.amount ?? 0).toLocaleString('en-IN')}</td>
                                            <td>{payment.paymentMode || 'Cash'}</td>
                                            <td>{payment.referenceNumber || '—'}</td>
                                            <td>{payment.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentDetails;
