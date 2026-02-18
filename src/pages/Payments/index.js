import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoWalletOutline, 
  IoCheckmarkCircle, 
  IoTimeOutline
} from 'react-icons/io5';
import './Payments.scss';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Table from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';

const Payments = () => {
  const navigate = useNavigate();
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
        <Loader message="Loading payments..." />
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
                  <Button variant="primary" className="btn-small" onClick={() => navigate(`/payments/process/${payment._id}`)}>Pay Now</Button>
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
    </div>
  );
};

export default Payments;

