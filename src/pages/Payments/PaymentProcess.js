import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  IoArrowBackOutline, 
  IoBusiness, 
  IoPhonePortrait, 
  IoCash, 
  IoClipboard,
  IoCheckmarkCircle
} from 'react-icons/io5';
import '../Payments/Payments.scss';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Loader from '../../components/ui/Loader';

const PaymentProcess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setLoading(true);
        // We'll use the employer pending endpoint and find the specific one, 
        // or a specific get endpoint if available
        const response = await api.get('/api/payments/employer/pending', { auth: true });
        if (response.success) {
          const found = response.payments.find(p => p._id === id);
          if (found) {
            setPayment(found);
          } else {
            showNotification('Payment not found', 'error');
            setTimeout(() => navigate('/payments'), 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        showNotification('Failed to load payment details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id, navigate, showNotification]);

  const handleConfirmPayment = async () => {
    if (!transactionId.trim() && paymentMethod !== 'cash') {
      showNotification('Please enter transaction ID', 'error');
      return;
    }

    setProcessing(true);
    try {
      const response = await api.put(`/api/payments/${id}/mark-paid`, {
        paymentMethod: paymentMethod,
        transactionId: transactionId.trim() || null,
        paidAt: new Date()
      }, { auth: true });

      if (response.success) {
        showNotification('Payment marked as completed!', 'success');
        setTimeout(() => navigate('/payments'), 1500);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      showNotification('Failed to confirm payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayWithUPI = () => {
    if (!payment?.workerBankAccount?.upiId) {
      showNotification('Worker has not added UPI ID', 'error');
      return;
    }
    
    const upiId = payment.workerBankAccount.upiId;
    const amount = payment.amount;
    const name = payment.worker?.name || 'Worker';
    const note = `Payment for ${payment.jobDetails?.title || payment.job?.title || 'work'}`;
    
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.location.href = upiLink;
    showNotification('Opening UPI app...', 'info');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showNotification(`${label} copied!`, 'success');
  };

  if (loading) {
    return (
      <div className="payment-process-page page-container">
        <Loader message="Loading payment details..." />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="payment-process-page page-container">
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
          <div className="back-link" onClick={() => navigate('/payments')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', cursor: 'pointer', marginBottom: '8px' }}>
            <IoArrowBackOutline /> Back to Payments
          </div>
          <h1 className="page-title">Process Payment</h1>
          <p className="page-subtitle">Complete the payment for {payment.worker?.name}.</p>
        </div>
      </div>

      <div className="payment-content-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div className="payment-summary-column">
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Payment Summary</h3>
            <div className="summary-details">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ color: '#6B7280' }}>Worker</span>
                <span style={{ fontWeight: '600' }}>{payment.worker?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ color: '#6B7280' }}>Job</span>
                <span style={{ fontWeight: '600' }}>{payment.jobDetails?.title || payment.job?.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ color: '#6B7280' }}>Date</span>
                <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: '700' }}>Total Amount</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#4F46E5' }}>₹{payment.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10B981', marginBottom: '12px' }}>
              <IoCheckmarkCircle size={24} />
              <h3 style={{ margin: 0 }}>Secure Payment</h3>
            </div>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              We don't hold your money. You pay the worker directly via Bank, UPI, or Cash, and simply confirm the transaction here.
            </p>
          </div>
        </div>

        <div className="payment-action-column">
          <div className="card">
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem' }}>Choose Payment Method</h3>
            
            <div className="method-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <button 
                className={`method-btn ${paymentMethod === 'bank_transfer' ? 'active' : ''}`} 
                onClick={() => setPaymentMethod('bank_transfer')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px',
                  borderRadius: '12px', border: paymentMethod === 'bank_transfer' ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                  background: paymentMethod === 'bank_transfer' ? 'rgba(79, 70, 229, 0.05)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', color: paymentMethod === 'bank_transfer' ? '#4F46E5' : '#6B7280'
                }}
              >
                <IoBusiness size={24} /> <span>Bank</span>
              </button>
              <button 
                className={`method-btn ${paymentMethod === 'upi' ? 'active' : ''}`} 
                onClick={() => setPaymentMethod('upi')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px',
                  borderRadius: '12px', border: paymentMethod === 'upi' ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                  background: paymentMethod === 'upi' ? 'rgba(79, 70, 229, 0.05)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', color: paymentMethod === 'upi' ? '#4F46E5' : '#6B7280'
                }}
              >
                <IoPhonePortrait size={24} /> <span>UPI</span>
              </button>
              <button 
                className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`} 
                onClick={() => setPaymentMethod('cash')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px',
                  borderRadius: '12px', border: paymentMethod === 'cash' ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                  background: paymentMethod === 'cash' ? 'rgba(79, 70, 229, 0.05)' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s', color: paymentMethod === 'cash' ? '#4F46E5' : '#6B7280'
                }}
              >
                <IoCash size={24} /> <span>Cash</span>
              </button>
            </div>

            {paymentMethod !== 'cash' && !payment.workerBankAccount && (
              <div className="alert-box" style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', marginBottom: '24px', color: '#B91C1C' }}>
                Worker hasn't added bank details. Please use Cash or contact them.
              </div>
            )}

            {paymentMethod === 'bank_transfer' && payment.workerBankAccount && (
              <div className="bank-details-box" style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600' }}>
                    <span>{payment.workerBankAccount.accountHolderName}</span>
                    <IoClipboard style={{ color: '#4F46E5', cursor: 'pointer' }} onClick={() => copyToClipboard(payment.workerBankAccount.accountHolderName, 'Name')} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Number</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600' }}>
                    <span>{payment.workerBankAccount.accountNumber}</span>
                    <IoClipboard style={{ color: '#4F46E5', cursor: 'pointer' }} onClick={() => copyToClipboard(payment.workerBankAccount.accountNumber, 'Account Number')} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IFSC Code</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600' }}>
                    <span>{payment.workerBankAccount.ifscCode}</span>
                    <IoClipboard style={{ color: '#4F46E5', cursor: 'pointer' }} onClick={() => copyToClipboard(payment.workerBankAccount.ifscCode, 'IFSC Code')} />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && payment.workerBankAccount && (
              <div className="upi-details-box" style={{ background: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center' }}>
                <label style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>UPI ID</label>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '16px' }}>
                  {payment.workerBankAccount.upiId}
                </div>
                <Button variant="primary" style={{ width: '100%' }} onClick={handlePayWithUPI}>Open UPI App</Button>
              </div>
            )}

            <div className="transaction-input" style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                {paymentMethod === 'cash' ? 'Notes (Optional)' : 'Transaction ID / Reference Number *'}
              </label>
              <input 
                className="input-field"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
                placeholder={paymentMethod === 'cash' ? 'e.g. Paid in person' : 'Enter 12-digit transaction ID'}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </div>

            <Button 
              variant="primary" 
              style={{ width: '100%', height: '48px' }} 
              onClick={handleConfirmPayment}
              disabled={processing || (paymentMethod !== 'cash' && !transactionId.trim())}
            >
              {processing ? 'Processing...' : 'Confirm & Complete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcess;
