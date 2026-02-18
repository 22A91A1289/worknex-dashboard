import React, { useState, useEffect, useCallback } from 'react';
import { 
  IoWalletOutline, 
  IoCheckmarkCircle, 
  IoTimeOutline,
  IoBusiness,
  IoPhonePortrait,
  IoCash,
  IoClipboard,
  IoCloseOutline
} from 'react-icons/io5';
import './Payments.scss';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Table from '../../components/ui/Table';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [stats, setStats] = useState({
    totalPending: 0,
    totalCompleted: 0,
    pendingAmount: 0,
    completedAmount: 0
  });
  const [notification, setNotification] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer'); 
  const [processing, setProcessing] = useState(false);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userId = user?.id || user?._id;
  const { on, off } = useSocket(userId, 'owner');

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payments/employer/pending', { auth: true });
      
      if (response.success) {
        const allPayments = response.payments;
        
        let filteredPayments = allPayments;
        if (filter === 'pending') {
          filteredPayments = allPayments.filter(p => p.status === 'pending');
        } else if (filter === 'completed') {
          filteredPayments = allPayments.filter(p => p.status === 'completed');
        }
        
        setPayments(filteredPayments);
        
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
      showNotification('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showNotification]);

  useEffect(() => {
    loadPayments();
    
    const handlePaymentCompleted = (data) => {
      showNotification('Payment processed successfully!', 'success');
      loadPayments();
    };

    on('payment:completed', handlePaymentCompleted);

    return () => {
      off('payment:completed', handlePaymentCompleted);
    };
  }, [loadPayments, on, off, showNotification]);

  const handlePayNow = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setTransactionId('');
    setPaymentMethod('bank_transfer');
  };

  const handlePayWithUPI = () => {
    if (!selectedPayment?.workerBankAccount?.upiId) {
      showNotification('Worker has not added UPI ID', 'error');
      return;
    }
    
    const upiId = selectedPayment.workerBankAccount.upiId;
    const amount = selectedPayment.amount;
    const name = selectedPayment.worker?.name || 'Worker';
    const note = `Payment for ${selectedPayment.jobDetails?.title || selectedPayment.job?.title || 'work'}`;
    
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href = upiLink;
    showNotification('Opening UPI app...', 'info');
  };

  const handleConfirmPayment = async () => {
    if (!transactionId.trim() && paymentMethod !== 'cash') {
      showNotification('Please enter transaction ID', 'error');
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
        showNotification('Payment marked as completed!', 'success');
        handleCloseModal();
        loadPayments();
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      showNotification('Failed to confirm payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showNotification(`${label} copied!`, 'success');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const tableHeaders = ['Worker', 'Job', 'Amount', 'Status', 'Date', 'Actions'];

  return (
    <div className="payments-page page-container">
      {notification && (
        <div className="toast-container">
          <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage payments to workers for completed jobs.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-wrapper warning">
            <IoTimeOutline size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <h2 className="stat-value">₹{stats.pendingAmount.toLocaleString('en-IN')}</h2>
            <span className="stat-count">{stats.totalPending} payments</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper success">
            <IoCheckmarkCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <h2 className="stat-value">₹{stats.completedAmount.toLocaleString('en-IN')}</h2>
            <span className="stat-count">{stats.totalCompleted} payments</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper info">
            <IoWalletOutline size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Charges</span>
            <h2 className="stat-value">₹0</h2>
            <span className="stat-count">100% Free</span>
          </div>
        </div>
      </div>

      <div className="filter-actions card">
        <div className="tabs">
          {['all', 'pending', 'completed'].map(t => (
            <button 
              key={t}
              className={`tab ${filter === t ? 'active' : ''}`}
              onClick={() => setFilter(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card loading-state">
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="card empty-state">
          <IoWalletOutline size={48} />
          <p>No {filter !== 'all' ? filter : ''} payments found.</p>
        </div>
      ) : (
        <Table 
          headers={tableHeaders} 
          data={payments} 
          renderRow={(payment) => (
            <tr key={payment._id}>
              <td>
                <div className="worker-cell">
                  <div className="name">{payment.worker?.name}</div>
                  <div className="phone">{payment.worker?.phone}</div>
                </div>
              </td>
              <td>
                <div className="job-cell">
                  <div className="title">{payment.jobDetails?.title || payment.job?.title}</div>
                  <div className="category">{payment.jobDetails?.category || payment.job?.category}</div>
                </div>
              </td>
              <td className="amount-cell">₹{payment.amount.toLocaleString('en-IN')}</td>
              <td>
                <span className={`badge badge-${payment.status === 'completed' ? 'success' : 'warning'}`}>
                  {payment.status === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </td>
              <td>{formatDate(payment.status === 'completed' ? payment.paidAt : payment.createdAt)}</td>
              <td>
                {payment.status === 'pending' ? (
                  <Button variant="primary" className="btn-small" onClick={() => handlePayNow(payment)}>Pay Now</Button>
                ) : (
                  <div className="paid-method">
                    <span className="method">{payment.paymentMethod?.toUpperCase()}</span>
                    {payment.transactionId && <span className="tid">ID: {payment.transactionId.substring(0, 6)}...</span>}
                  </div>
                )}
              </td>
            </tr>
          )}
        />
      )}

      {showPaymentModal && selectedPayment && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Payment</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}><IoCloseOutline size={24} /></button>
            </div>
            
            <div className="modal-body">
              {!selectedPayment.workerBankAccount ? (
                <div className="error-state">
                  <p>Worker hasn't added bank details yet. Please pay in cash or ask them to update their profile.</p>
                  <p className="contact">Phone: {selectedPayment.worker?.phone}</p>
                </div>
              ) : (
                <div className="payment-form">
                  <div className="payment-summary card">
                    <div className="summary-item">
                      <label>Amount to Pay:</label>
                      <span className="amount">₹{selectedPayment.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="summary-item">
                      <label>Recipient:</label>
                      <span>{selectedPayment.worker?.name}</span>
                    </div>
                  </div>

                  <div className="method-selector">
                    <label className="form-label">Payment Method</label>
                    <div className="method-grid">
                      <button className={`method-btn ${paymentMethod === 'bank_transfer' ? 'active' : ''}`} onClick={() => setPaymentMethod('bank_transfer')}>
                        <IoBusiness size={20} /> Bank
                      </button>
                      <button className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                        <IoPhonePortrait size={20} /> UPI
                      </button>
                      <button className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>
                        <IoCash size={20} /> Cash
                      </button>
                    </div>
                  </div>

                  {paymentMethod !== 'cash' && (
                    <div className="bank-details card">
                      {paymentMethod === 'bank_transfer' ? (
                        <div className="details-list">
                          <div className="detail-item">
                            <label>Account Holder</label>
                            <div className="value-row">
                              <span>{selectedPayment.workerBankAccount.accountHolderName}</span>
                              <button onClick={() => copyToClipboard(selectedPayment.workerBankAccount.accountHolderName, 'Name')}><IoClipboard /></button>
                            </div>
                          </div>
                          <div className="detail-item">
                            <label>Account Number</label>
                            <div className="value-row">
                              <span>{selectedPayment.workerBankAccount.accountNumber}</span>
                              <button onClick={() => copyToClipboard(selectedPayment.workerBankAccount.accountNumber, 'Account Number')}><IoClipboard /></button>
                            </div>
                          </div>
                          <div className="detail-item">
                            <label>IFSC Code</label>
                            <div className="value-row">
                              <span>{selectedPayment.workerBankAccount.ifscCode}</span>
                              <button onClick={() => copyToClipboard(selectedPayment.workerBankAccount.ifscCode, 'IFSC')}><IoClipboard /></button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="upi-details">
                          <div className="detail-item">
                            <label>Worker's UPI ID</label>
                            <div className="value-row">
                              <span>{selectedPayment.workerBankAccount.upiId}</span>
                              <button onClick={() => copyToClipboard(selectedPayment.workerBankAccount.upiId, 'UPI ID')}><IoClipboard /></button>
                            </div>
                          </div>
                          <Button variant="primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePayWithUPI}>Open UPI App</Button>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod !== 'cash' && (
                    <div className="transaction-input-group">
                      <label className="form-label">Transaction ID / Reference Number</label>
                      <input 
                        className="input-field"
                        placeholder="e.g. 123456789012"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmPayment}
                disabled={processing || (!selectedPayment.workerBankAccount && paymentMethod !== 'cash') || (paymentMethod !== 'cash' && !transactionId.trim())}
              >
                {processing ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;

