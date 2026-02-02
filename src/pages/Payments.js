import React, { useState, useEffect } from 'react';
import { 
  IoWalletOutline, 
  IoCheckmarkCircle, 
  IoTimeOutline,
  IoBusiness,
  IoPhonePortrait,
  IoCash,
  IoClipboard
} from 'react-icons/io5';
import './Payments.css';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    pendingAmount: 0,
    completedAmount: 0
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer'); // 'bank_transfer', 'upi', 'cash'
  const [processing, setProcessing] = useState(false);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  
  // Connect to socket for real-time updates
  const { on, off } = useSocket(user._id, 'owner');

  useEffect(() => {
    loadPayments();
    
    // Real-time listeners
    const handlePaymentCompleted = (data) => {
      console.log('Real-time: Payment completed', data);
      loadPayments();
    };

    on('payment:completed', handlePaymentCompleted);

    return () => {
      off('payment:completed', handlePaymentCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      // Get all payments for this employer
      const response = await api.get('/api/payments/employer/pending', { auth: true });
      
      if (response.success) {
        const allPayments = response.payments;
        
        // Filter based on selection
        let filteredPayments = allPayments;
        if (filter === 'pending') {
          filteredPayments = allPayments.filter(p => p.status === 'pending');
        } else if (filter === 'completed') {
          filteredPayments = allPayments.filter(p => p.status === 'completed');
        }
        
        setPayments(filteredPayments);
        
        // Calculate stats
        const pending = allPayments.filter(p => p.status === 'pending');
        const completed = allPayments.filter(p => p.status === 'completed');
        
        setStats({
          totalPending: pending.length,
          totalCompleted: completed.length,
          pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
          completedAmount: completed.reduce((sum, p) => sum + p.amount, 0)
        });
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
    setTransactionId('');
    setPaymentMethod('bank_transfer');
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setTransactionId('');
    setPaymentMethod('bank_transfer');
  };

  const generateUPILink = () => {
    if (!selectedPayment || !selectedPayment.workerBankAccount?.upiId) return '';
    
    const upiId = selectedPayment.workerBankAccount.upiId;
    const amount = selectedPayment.amount;
    const name = selectedPayment.worker?.name || 'Worker';
    const note = `Payment for ${selectedPayment.jobDetails?.title || selectedPayment.job?.title || 'work'}`;
    
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const handlePayWithUPI = () => {
    const upiLink = generateUPILink();
    if (!upiLink) {
      alert('Worker has not added UPI ID');
      return;
    }
    
    // Open UPI link
    window.location.href = upiLink;
    
    // Show message
    setTimeout(() => {
      const shouldContinue = window.confirm(
        'Have you completed the UPI payment?\n\n' +
        'Click OK to enter transaction ID, or Cancel to try again.'
      );
      
      if (shouldContinue) {
        // Keep modal open for transaction ID entry
      }
    }, 3000);
  };

  const handleConfirmPayment = async () => {
    if (!transactionId.trim() && paymentMethod !== 'cash') {
      alert('Please enter transaction ID/reference number');
      return;
    }

    if (!window.confirm(`Confirm ${paymentMethod === 'cash' ? 'cash' : paymentMethod === 'upi' ? 'UPI' : 'bank transfer'} payment of ₹${selectedPayment.amount.toLocaleString('en-IN')} to ${selectedPayment.worker?.name}?`)) {
      return;
    }

    setProcessing(true);
    try {
      const response = await api.put(`/api/payments/${selectedPayment._id}/mark-paid`, {
        paymentMethod: paymentMethod,
        transactionId: transactionId.trim() || null,
        paidAt: new Date()
      }, { auth: true });

      if (response.success) {
        alert(`Payment marked as completed successfully! ${selectedPayment.worker?.name} has been notified.`);
        handleCloseModal();
        loadPayments();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="payments-page">
      <div className="page-header">
        <div>
          <h1>Payments</h1>
          <p>Manage payments to workers for completed jobs</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B' }}>
            <IoTimeOutline />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalPending}</span>
            <span className="stat-label">Pending Payments</span>
            <span className="stat-amount">₹{stats.pendingAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
            <IoCheckmarkCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalCompleted}</span>
            <span className="stat-label">Completed Payments</span>
            <span className="stat-amount">₹{stats.completedAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3B82F620', color: '#3B82F6' }}>
            <IoWalletOutline />
          </div>
          <div className="stat-content">
            <span className="stat-value">₹0</span>
            <span className="stat-label">Transaction Fees</span>
            <span className="stat-amount">100% FREE</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="card empty-state">
          <IoWalletOutline size={80} color="#D1D5DB" />
          <h3>No {filter !== 'all' ? filter : ''} payments</h3>
          <p>
            {filter === 'pending' 
              ? 'All payments are up to date!'
              : filter === 'completed'
              ? 'No completed payments yet'
              : 'No payments yet. Payments appear when you complete jobs.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Job</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <div className="worker-info">
                        <div className="worker-name">{payment.worker?.name}</div>
                        <div className="worker-phone">{payment.worker?.phone}</div>
                      </div>
                    </td>
                    <td>
                      <div className="job-info">
                        <div className="job-title">{payment.jobDetails?.title || payment.job?.title}</div>
                        <div className="job-category">{payment.jobDetails?.category || payment.job?.category}</div>
                      </div>
                    </td>
                    <td>
                      <span className="payment-amount">₹{payment.amount.toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${payment.status.toLowerCase()}`}>
                        {payment.status === 'completed' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className="payment-date">
                        {payment.status === 'completed' && payment.paidAt
                          ? formatDate(payment.paidAt)
                          : formatDate(payment.createdAt)}
                      </span>
                    </td>
                    <td>
                      {payment.status === 'pending' ? (
                        <button
                          className="btn-pay-now"
                          onClick={() => handlePayNow(payment)}
                        >
                          Pay Now
                        </button>
                      ) : (
                        <div className="payment-details">
                          <span className="payment-method">
                            {payment.paymentMethod?.toUpperCase()}
                          </span>
                          {payment.transactionId && (
                            <span className="transaction-id" title={payment.transactionId}>
                              ID: {payment.transactionId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Free Payment Notice */}
      <div className="info-banner">
        <IoCheckmarkCircle size={24} color="#10B981" />
        <div className="info-content">
          <h4>100% FREE Payment System</h4>
          <p>
            Use UPI, Cash, or Bank Transfer - all payment methods are completely FREE with ZERO transaction charges!
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Make Payment</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Payment Details */}
              <div className="payment-details-section">
                <h3>Payment Details</h3>
                <div className="detail-row">
                  <span className="detail-label">Worker Name:</span>
                  <span className="detail-value">{selectedPayment.worker?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Worker Phone:</span>
                  <span className="detail-value">{selectedPayment.worker?.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Job:</span>
                  <span className="detail-value">{selectedPayment.jobDetails?.title || selectedPayment.job?.title}</span>
                </div>
                <div className="detail-row amount-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value amount">₹{selectedPayment.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="payment-method-section">
                <h3>Select Payment Method</h3>
                <div className="payment-methods">
                  <label className={`payment-method-option ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="method-content">
                      <div className="method-icon">
                        <IoBusiness size={24} />
                      </div>
                      <div>
                        <div className="method-name">Bank Transfer</div>
                        <div className="method-desc">Direct bank transfer (NEFT/RTGS/IMPS)</div>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-method-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="method-content">
                      <div className="method-icon">
                        <IoPhonePortrait size={24} />
                      </div>
                      <div>
                        <div className="method-name">UPI Payment</div>
                        <div className="method-desc">PhonePe, GPay, Paytm, BHIM</div>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="method-content">
                      <div className="method-icon">
                        <IoCash size={24} />
                      </div>
                      <div>
                        <div className="method-name">Cash Payment</div>
                        <div className="method-desc">Paid directly to worker</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bank Account Details */}
              {(paymentMethod === 'bank_transfer' || paymentMethod === 'upi') && selectedPayment.workerBankAccount && (
                <div className="bank-details-section">
                  <h3>Worker's Bank Details</h3>
                  {paymentMethod === 'bank_transfer' && (
                    <>
                      <div className="bank-info">
                        <div className="bank-detail">
                          <span className="label">Account Holder:</span>
                          <span className="value">
                            {selectedPayment.workerBankAccount.accountHolderName}
                            <button 
                              className="copy-btn" 
                              onClick={() => copyToClipboard(selectedPayment.workerBankAccount.accountHolderName, 'Account holder name')}
                              title="Copy"
                            >
                              <IoClipboard size={16} />
                            </button>
                          </span>
                        </div>
                        <div className="bank-detail">
                          <span className="label">Account Number:</span>
                          <span className="value">
                            {selectedPayment.workerBankAccount.accountNumber}
                            <button 
                              className="copy-btn" 
                              onClick={() => copyToClipboard(selectedPayment.workerBankAccount.accountNumber, 'Account number')}
                              title="Copy"
                            >
                              <IoClipboard size={16} />
                            </button>
                          </span>
                        </div>
                        <div className="bank-detail">
                          <span className="label">IFSC Code:</span>
                          <span className="value">
                            {selectedPayment.workerBankAccount.ifscCode}
                            <button 
                              className="copy-btn" 
                              onClick={() => copyToClipboard(selectedPayment.workerBankAccount.ifscCode, 'IFSC code')}
                              title="Copy"
                            >
                              <IoClipboard size={16} />
                            </button>
                          </span>
                        </div>
                        <div className="bank-detail">
                          <span className="label">Bank Name:</span>
                          <span className="value">{selectedPayment.workerBankAccount.bankName}</span>
                        </div>
                        {selectedPayment.workerBankAccount.branchName && (
                          <div className="bank-detail">
                            <span className="label">Branch:</span>
                            <span className="value">{selectedPayment.workerBankAccount.branchName}</span>
                          </div>
                        )}
                        <div className="bank-detail">
                          <span className="label">Account Type:</span>
                          <span className="value">{selectedPayment.workerBankAccount.accountType?.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="payment-instruction">
                        <p><IoPhonePortrait size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Use the copy buttons above to copy bank details, then use your banking app or website to make the transfer.</p>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'upi' && selectedPayment.workerBankAccount.upiId && (
                    <>
                      <div className="bank-info">
                        <div className="bank-detail">
                          <span className="label">UPI ID:</span>
                          <span className="value">
                            {selectedPayment.workerBankAccount.upiId}
                            <button 
                              className="copy-btn" 
                              onClick={() => copyToClipboard(selectedPayment.workerBankAccount.upiId, 'UPI ID')}
                              title="Copy"
                            >
                              <IoClipboard size={16} />
                            </button>
                          </span>
                        </div>
                      </div>
                      
                      {/* UPI Payment Options */}
                      <div className="upi-payment-section">
                        <div className="upi-options-header">
                          <h4>How would you like to pay?</h4>
                        </div>
                        
                        {/* Option 1: Direct UPI */}
                        <div className="upi-option-card">
                          <div className="option-header">
                            <span className="option-number">1</span>
                            <div>
                              <h5>Pay with UPI App</h5>
                              <p>Opens your UPI app directly with pre-filled details</p>
                            </div>
                          </div>
                          <button className="btn-upi-pay" onClick={handlePayWithUPI}>
                            <IoPhonePortrait size={20} /> Open UPI App & Pay
                          </button>
                        </div>

                        {/* Option 2: Copy UPI ID */}
                        <div className="upi-option-card">
                          <div className="option-header">
                            <span className="option-number">2</span>
                            <div>
                              <h5>Copy UPI ID</h5>
                              <p>Manually enter in your UPI app</p>
                            </div>
                          </div>
                          <div className="copy-upi-section">
                            <span className="upi-id-display">{selectedPayment.workerBankAccount.upiId}</span>
                            <button 
                              className="btn-copy-upi"
                              onClick={() => copyToClipboard(selectedPayment.workerBankAccount.upiId, 'UPI ID')}
                            >
                              <IoClipboard size={18} /> Copy
                            </button>
                          </div>
                        </div>

                        {/* UPI Link Display */}
                        <div className="upi-link-info">
                          <p>💡 <strong>Tip:</strong> Click "Open UPI App" to automatically fill payment details, or copy the UPI ID to enter manually.</p>
                        </div>
                      </div>
                    </>
                  )}
                  {paymentMethod === 'upi' && !selectedPayment.workerBankAccount.upiId && (
                    <div className="no-upi-message">
                      Worker hasn't added UPI ID. Please use Bank Transfer or Cash.
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID Input */}
              {paymentMethod !== 'cash' && (
                <div className="transaction-section">
                  <h3>Transaction Reference</h3>
                  <input
                    type="text"
                    className="transaction-input"
                    placeholder={`Enter ${paymentMethod === 'upi' ? 'UPI Transaction ID' : 'Bank Transfer Reference Number'}`}
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <p className="transaction-hint">
                    {paymentMethod === 'upi' 
                      ? 'Enter the 12-digit UPI Transaction ID (e.g., 123456789012)'
                      : 'Enter the bank transfer reference/UTR number'}
                  </p>
                </div>
              )}

              {/* Cash Confirmation */}
              {paymentMethod === 'cash' && (
                <div className="cash-confirmation">
                  <div className="confirmation-box">
                    <IoCheckmarkCircle size={48} color="#10B981" />
                    <p>
                      Please confirm that you have paid ₹{selectedPayment.amount.toLocaleString('en-IN')} in cash to {selectedPayment.worker?.name}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handleConfirmPayment}
                disabled={processing || (paymentMethod !== 'cash' && !transactionId.trim())}
              >
                {processing ? 'Processing...' : `Confirm ${paymentMethod === 'cash' ? 'Cash Payment' : 'Payment'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Bank Account Warning */}
      {showPaymentModal && selectedPayment && !selectedPayment.workerBankAccount && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ No Bank Account</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">
                {selectedPayment.worker?.name} hasn't added bank account details yet. 
                Please ask the worker to add their bank account in the mobile app or pay in cash.
              </p>
              <div className="worker-contact">
                <p><strong>Worker Phone:</strong> {selectedPayment.worker?.phone}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
