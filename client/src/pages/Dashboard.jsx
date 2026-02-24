import React, { useEffect, useState, useCallback, useMemo } from 'react';
import API from '../api/api';
import './Dashboard.css';

// Color palette for donut chart segments
const CHART_COLORS = [
    '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899',
    '#10b981', '#f43f5e', '#6366f1', '#14b8a6', '#e11d48',
];

function Dashboard() {
    const [accounts, setAccounts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('DEPOSIT');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Fetch all transactions whenever accounts change (for global analytics)
    useEffect(() => {
        if (accounts.length > 0) {
            fetchAllTransactions();
        }
    }, [accounts]);

    const fetchAccounts = async () => {
        try {
            const res = await API.get('/accounts');
            setAccounts(res.data);
        } catch (err) {
            showToast('error', 'Failed to load accounts. Is the server running?');
        }
    };

    const fetchTransactions = useCallback(async (id) => {
        try {
            const res = await API.get(`/accounts/transactions/${id}`);
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const fetchAllTransactions = async () => {
        // Fetch transactions for all accounts
        try {
            const promises = accounts.map((acc) =>
                API.get(`/accounts/transactions/${acc.id}`).then((res) =>
                    res.data.map((tx) => ({ ...tx, accountName: acc.name }))
                )
            );
            const results = await Promise.all(promises);
            setAllTransactions(results.flat());
        } catch (err) {
            console.error('Failed to load all transactions', err);
        }
    };

    const handleSelectAccount = (id) => {
        setSelectedAccount(id);
        fetchTransactions(id);
    };

    const handleTransaction = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            showToast('error', 'Please enter a valid amount.');
            return;
        }

        try {
            await API.post('/accounts/transaction', {
                account_id: selectedAccount,
                amount: parseFloat(amount),
                type,
            });

            showToast(
                'success',
                `${type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} of ₹${parseFloat(amount).toLocaleString('en-IN')} successful!`
            );
            setAmount('');
            fetchAccounts();
            fetchTransactions(selectedAccount);
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Transaction failed. Please try again.');
        }
    };

    const showToast = (toastType, message) => {
        setToast({ type: toastType, message });
    };

    // ─── Derived Data ───
    const selectedAccountData = accounts.find((a) => a.id === selectedAccount);
    const totalBalance = accounts.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);

    // Analytics computations
    const analytics = useMemo(() => {
        const txSource = selectedAccount
            ? transactions
            : allTransactions;

        const deposits = txSource.filter((tx) => tx.type === 'DEPOSIT');
        const withdrawals = txSource.filter((tx) => tx.type === 'WITHDRAW');
        const totalDeposits = deposits.reduce((s, tx) => s + parseFloat(tx.amount || 0), 0);
        const totalWithdrawals = withdrawals.reduce((s, tx) => s + parseFloat(tx.amount || 0), 0);
        const netFlow = totalDeposits - totalWithdrawals;
        const maxFlow = Math.max(totalDeposits, totalWithdrawals, 1);

        return {
            totalDeposits,
            totalWithdrawals,
            depositCount: deposits.length,
            withdrawCount: withdrawals.length,
            netFlow,
            depositPercent: (totalDeposits / maxFlow) * 100,
            withdrawPercent: (totalWithdrawals / maxFlow) * 100,
            totalTx: txSource.length,
        };
    }, [transactions, allTransactions, selectedAccount]);

    // Donut chart data (balance distribution across accounts)
    const donutData = useMemo(() => {
        if (accounts.length === 0 || totalBalance === 0) return [];

        const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54
        let offset = 0;

        return accounts.map((acc, i) => {
            const pct = parseFloat(acc.balance || 0) / totalBalance;
            const dashLength = pct * CIRCUMFERENCE;
            const segment = {
                name: acc.name,
                balance: parseFloat(acc.balance || 0),
                pct: (pct * 100).toFixed(1),
                color: CHART_COLORS[i % CHART_COLORS.length],
                dashArray: `${dashLength} ${CIRCUMFERENCE - dashLength}`,
                dashOffset: -offset,
            };
            offset += dashLength;
            return segment;
        });
    }, [accounts, totalBalance]);

    // ─── Helpers ───
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatCurrency = (val) => {
        return parseFloat(val || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCompact = (val) => {
        const n = parseFloat(val || 0);
        if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
        if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
        if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
        return `₹${n.toFixed(0)}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            {/* ── Page Header ── */}
            <div className="dashboard__header">
                <h1 className="dashboard__greeting">
                    Welcome to <span className="dashboard__greeting-accent">BMS</span>
                </h1>
                <p className="dashboard__tagline">
                    Manage accounts, process transactions, and view history — all in one place.
                </p>
            </div>

            {/* ── Stats Bar ── */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-card__label">Total Accounts</div>
                    <div className="stat-card__value stat-card__value--primary">{accounts.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Cumulative Balance</div>
                    <div className="stat-card__value">₹{formatCurrency(totalBalance)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Active Account</div>
                    <div className="stat-card__value stat-card__value--success">
                        {selectedAccountData ? selectedAccountData.name : '—'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__label">Total Transactions</div>
                    <div className="stat-card__value stat-card__value--primary">{allTransactions.length}</div>
                </div>
            </div>

            {/* ── Main 3-Column Grid ── */}
            <div className="dashboard__grid">
                {/* ── LEFT: Accounts ── */}
                <div>
                    <div className="section-heading">
                        <h2 className="section-heading__title">
                            <span className="section-heading__icon">🏦</span>
                            Accounts
                        </h2>
                        <span className="section-heading__badge">{accounts.length} total</span>
                    </div>

                    <div className="accounts-grid">
                        {accounts.map((acc) => (
                            <div
                                key={acc.id}
                                className={`account-card ${selectedAccount === acc.id ? 'account-card--selected' : ''}`}
                                onClick={() => handleSelectAccount(acc.id)}
                            >
                                <div className="account-card__top">
                                    <div className="account-card__avatar">{getInitials(acc.name)}</div>
                                    <div className="account-card__check">
                                        {selectedAccount === acc.id ? '✓' : ''}
                                    </div>
                                </div>
                                <div className="account-card__name">{acc.name}</div>
                                <div className="account-card__id">Account #{acc.id}</div>
                                <div className="account-card__balance-label">Available Balance</div>
                                <div className="account-card__balance">
                                    <span className="currency">₹</span>
                                    {formatCurrency(acc.balance)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── MIDDLE: Analytics Panel ── */}
                <div className="analytics-panel">
                    {/* Balance Distribution Donut */}
                    <div className="analytics-card">
                        <div className="analytics-card__title">
                            <span className="analytics-card__title-icon">🍩</span>
                            Balance Distribution
                        </div>
                        {donutData.length > 0 ? (
                            <div className="donut-chart">
                                <div className="donut-chart__svg-wrap">
                                    <svg className="donut-chart__svg" viewBox="0 0 128 128">
                                        {donutData.map((seg, i) => (
                                            <circle
                                                key={i}
                                                className="donut-chart__segment"
                                                cx="64"
                                                cy="64"
                                                r="54"
                                                stroke={seg.color}
                                                strokeDasharray={seg.dashArray}
                                                strokeDashoffset={seg.dashOffset}
                                            />
                                        ))}
                                    </svg>
                                    <div className="donut-chart__center-label">
                                        <div className="donut-chart__center-value">{accounts.length}</div>
                                        <div className="donut-chart__center-sub">Accounts</div>
                                    </div>
                                </div>
                                <div className="donut-chart__legend">
                                    {donutData.map((seg, i) => (
                                        <div key={i} className="donut-chart__legend-item">
                                            <span
                                                className="donut-chart__legend-dot"
                                                style={{ background: seg.color }}
                                            ></span>
                                            <span>{seg.name}</span>
                                            <span className="donut-chart__legend-value">{seg.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="analytics-empty">
                                <div className="analytics-empty__icon">📊</div>
                                No accounts to visualize
                            </div>
                        )}
                    </div>

                    {/* Deposits vs Withdrawals Bar Chart */}
                    <div className="analytics-card">
                        <div className="analytics-card__title">
                            <span className="analytics-card__title-icon">📊</span>
                            {selectedAccount ? 'Account Activity' : 'Overall Activity'}
                        </div>
                        {analytics.totalTx > 0 ? (
                            <div className="bar-chart">
                                <div className="bar-chart__row">
                                    <div className="bar-chart__row-header">
                                        <span className="bar-chart__row-label">↗ Deposits</span>
                                        <span className="bar-chart__row-value">₹{formatCurrency(analytics.totalDeposits)}</span>
                                    </div>
                                    <div className="bar-chart__track">
                                        <div
                                            className="bar-chart__fill bar-chart__fill--deposit"
                                            style={{ width: `${analytics.depositPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="bar-chart__row">
                                    <div className="bar-chart__row-header">
                                        <span className="bar-chart__row-label">↘ Withdrawals</span>
                                        <span className="bar-chart__row-value">₹{formatCurrency(analytics.totalWithdrawals)}</span>
                                    </div>
                                    <div className="bar-chart__track">
                                        <div
                                            className="bar-chart__fill bar-chart__fill--withdraw"
                                            style={{ width: `${analytics.withdrawPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="analytics-empty">
                                <div className="analytics-empty__icon">💤</div>
                                No transactions yet
                            </div>
                        )}
                    </div>

                    {/* Cash Flow Summary */}
                    <div className="analytics-card">
                        <div className="analytics-card__title">
                            <span className="analytics-card__title-icon">💰</span>
                            Cash Flow
                        </div>
                        <div className="flow-stats">
                            <div className="flow-stat flow-stat--deposit">
                                <div className="flow-stat__label">Inflow</div>
                                <div className="flow-stat__value">{formatCompact(analytics.totalDeposits)}</div>
                                <div className="flow-stat__count">{analytics.depositCount} txn{analytics.depositCount !== 1 ? 's' : ''}</div>
                            </div>
                            <div className="flow-stat flow-stat--withdraw">
                                <div className="flow-stat__label">Outflow</div>
                                <div className="flow-stat__value">{formatCompact(analytics.totalWithdrawals)}</div>
                                <div className="flow-stat__count">{analytics.withdrawCount} txn{analytics.withdrawCount !== 1 ? 's' : ''}</div>
                            </div>
                        </div>
                        <div className="net-flow">
                            <span className="net-flow__label">Net Flow</span>
                            <span
                                className={`net-flow__value ${analytics.netFlow > 0
                                        ? 'net-flow__value--positive'
                                        : analytics.netFlow < 0
                                            ? 'net-flow__value--negative'
                                            : 'net-flow__value--neutral'
                                    }`}
                            >
                                {analytics.netFlow >= 0 ? '+' : ''}₹{formatCurrency(analytics.netFlow)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Transaction Panel ── */}
                <div className="panel">
                    {!selectedAccount ? (
                        <div className="panel__empty">
                            <div className="panel__empty-icon">👈</div>
                            <div className="panel__empty-title">Select an account</div>
                            <div className="panel__empty-desc">
                                Click on any account card to make transactions and view history.
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Transaction Form */}
                            <div className="tx-form">
                                <div className="section-heading">
                                    <h3 className="section-heading__title">
                                        <span className="section-heading__icon">💸</span>
                                        New Transaction
                                    </h3>
                                </div>

                                {selectedAccountData && (
                                    <div className="tx-form__selected-info">
                                        <div className="tx-form__selected-avatar">
                                            {getInitials(selectedAccountData.name)}
                                        </div>
                                        <div>
                                            <div className="tx-form__selected-name">{selectedAccountData.name}</div>
                                            <div className="tx-form__selected-balance">
                                                Balance: ₹{formatCurrency(selectedAccountData.balance)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <label className="tx-form__label">Amount</label>
                                <div className="tx-form__input-group">
                                    <span className="tx-form__currency-symbol">₹</span>
                                    <input
                                        className="tx-form__input"
                                        type="number"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                <label className="tx-form__label">Transaction Type</label>
                                <div className="tx-form__type-selector">
                                    <button
                                        className={`tx-form__type-btn tx-form__type-btn--deposit ${type === 'DEPOSIT' ? 'tx-form__type-btn--active' : ''
                                            }`}
                                        onClick={() => setType('DEPOSIT')}
                                    >
                                        ↗ Deposit
                                    </button>
                                    <button
                                        className={`tx-form__type-btn tx-form__type-btn--withdraw ${type === 'WITHDRAW' ? 'tx-form__type-btn--active' : ''
                                            }`}
                                        onClick={() => setType('WITHDRAW')}
                                    >
                                        ↘ Withdraw
                                    </button>
                                </div>

                                <button
                                    className={`tx-form__submit ${type === 'DEPOSIT' ? 'tx-form__submit--deposit' : 'tx-form__submit--withdraw'
                                        }`}
                                    onClick={handleTransaction}
                                >
                                    {type === 'DEPOSIT' ? '↗ Confirm Deposit' : '↘ Confirm Withdrawal'}
                                </button>
                            </div>

                            {/* Transaction History */}
                            <div className="tx-history">
                                <div className="section-heading">
                                    <h3 className="section-heading__title">
                                        <span className="section-heading__icon">📋</span>
                                        Transaction History
                                    </h3>
                                    <span className="section-heading__badge">{transactions.length} records</span>
                                </div>

                                {transactions.length === 0 ? (
                                    <div className="tx-history__empty">No transactions yet for this account.</div>
                                ) : (
                                    <div className="tx-history__list">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="tx-history__item">
                                                <div
                                                    className={`tx-history__item-icon tx-history__item-icon--${tx.type.toLowerCase()}`}
                                                >
                                                    {tx.type === 'DEPOSIT' ? '↗' : '↘'}
                                                </div>
                                                <div className="tx-history__item-details">
                                                    <div className="tx-history__item-type">{tx.type}</div>
                                                    <div className="tx-history__item-date">
                                                        {formatDate(tx.transaction_date)}
                                                    </div>
                                                </div>
                                                <div
                                                    className={`tx-history__item-amount tx-history__item-amount--${tx.type.toLowerCase()}`}
                                                >
                                                    {tx.type === 'DEPOSIT' ? '+' : '-'}₹{formatCurrency(tx.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Toast Notifications ── */}
            {toast && toast.type === 'error' && (
                <div className="error-toast">
                    ⚠️ {toast.message}
                    <button className="error-toast__close" onClick={() => setToast(null)}>
                        ×
                    </button>
                </div>
            )}

            {toast && toast.type === 'success' && (
                <div className="success-toast">
                    ✅ {toast.message}
                </div>
            )}
        </>
    );
}

export default Dashboard;
