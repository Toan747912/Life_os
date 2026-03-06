import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2,
  X, DollarSign, Tag, Calendar, ChevronLeft, ChevronRight,
  Loader2, ArrowUpCircle, ArrowDownCircle, BarChart2
} from 'lucide-react';

// ===== HELPERS =====
const formatVND = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MONTH_NAMES = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', icon: '🍜', color: '#f97316', type: 'EXPENSE' },
  { name: 'Di chuyển', icon: '🚗', color: '#8b5cf6', type: 'EXPENSE' },
  { name: 'Mua sắm', icon: '🛒', color: '#ec4899', type: 'EXPENSE' },
  { name: 'Giải trí', icon: '🎮', color: '#06b6d4', type: 'EXPENSE' },
  { name: 'Lương', icon: '💼', color: '#22c55e', type: 'INCOME' },
  { name: 'Đầu tư', icon: '📈', color: '#3b82f6', type: 'INCOME' },
];

// ===== ADD TRANSACTION MODAL =====
const AddTransactionModal = ({ categories, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    type: 'EXPENSE', amount: '', categoryId: '', note: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);

  const filteredCats = categories.filter(c => c.type === form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }
    setLoading(true);
    try {
      await financeApi.createTransaction({
        ...form,
        amount: parseFloat(form.amount),
        categoryId: form.categoryId || null,
      });
      toast.success('Đã thêm giao dịch!');
      onSuccess();
      onClose();
    } catch {
      toast.error('Không thể thêm giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Thêm Giao Dịch</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-2xl p-1">
            {['EXPENSE', 'INCOME'].map(t => (
              <button
                key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, categoryId: '' }))}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === t
                    ? t === 'EXPENSE'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-emerald-500 text-white shadow-md'
                    : 'text-slate-500'
                  }`}
              >
                {t === 'EXPENSE' ? '💸 Chi tiêu' : '💰 Thu nhập'}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền (VNĐ)</label>
            <input
              type="number" min="0" step="1000" required
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-bold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">-- Không có danh mục --</option>
              {filteredCats.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Note & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</label>
              <input
                type="text" value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Mô tả..."
                className="mt-1 block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày</label>
              <input
                type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1 block w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Thêm giao dịch
          </button>
        </form>
      </div>
    </div>
  );
};

// ===== STAT CARD =====
const StatCard = ({ icon: Icon, label, amount, color, trend }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className="text-xl font-black text-slate-800 mt-1 truncate">{formatVND(amount)}</p>
  </div>
);

// ===== CUSTOM TOOLTIP =====
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-slate-600 mb-1">Ngày {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'income' ? '💰 Thu' : '💸 Chi'}: {formatVND(p.value)}
        </p>
      ))}
    </div>
  );
};

// ===== MAIN FINANCE PAGE =====
const Finance = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview | transactions | categories

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, catsRes, txRes] = await Promise.all([
        financeApi.getSummary({ month, year }),
        financeApi.getCategories(),
        financeApi.getTransactions({ month, year }),
      ]);
      setSummary(summaryRes.data.data);
      setCategories(catsRes.data.data);
      setTransactions(txRes.data.data);
    } catch (err) {
      if (err.response?.status !== 401) {
        toast.error('Không thể tải dữ liệu tài chính.');
      }
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tạo danh mục mặc định ngay lần đầu
  useEffect(() => {
    if (categories.length === 0 && !loading) {
      const createDefaults = async () => {
        try {
          for (const cat of DEFAULT_CATEGORIES) {
            await financeApi.createCategory(cat);
          }
          const res = await financeApi.getCategories();
          setCategories(res.data.data);
        } catch { }
      };
      createDefaults();
    }
  }, [loading, categories.length]);

  const handleDeleteTransaction = async (id) => {
    try {
      await financeApi.deleteTransaction(id);
      toast.success('Đã xóa giao dịch.');
      fetchData();
    } catch {
      toast.error('Không thể xóa giao dịch.');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await financeApi.deleteCategory(id);
      toast.success('Đã xóa danh mục.');
      fetchData();
    } catch {
      toast.error('Không thể xóa (có thể đang có giao dịch liên quan).');
    }
  };

  const navigateMonth = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  // Chuẩn bị data cho chart
  const chartData = summary ? Object.entries(summary.byDay).map(([day, vals]) => ({
    day: parseInt(day), income: vals.income, expense: vals.expense,
  })).sort((a, b) => a.day - b.day) : [];

  const pieData = summary?.byCategory?.map(cat => ({
    name: cat.name, value: cat.total, color: cat.color, icon: cat.icon,
  })) || [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Wallet className="text-indigo-500" /> Tài Chính
          </h1>
          <p className="text-slate-500 mt-1">Theo dõi thu chi, quản lý ngân sách của bạn.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={18} /> Thêm giao dịch
        </button>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
        <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-lg font-black text-slate-800">{MONTH_NAMES[month - 1]}, {year}</p>
          <p className="text-xs text-slate-400">Tháng hiển thị</p>
        </div>
        <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ArrowUpCircle} label="Tổng thu nhập" amount={summary?.totalIncome || 0} color="bg-gradient-to-br from-emerald-400 to-teal-500" />
        <StatCard icon={ArrowDownCircle} label="Tổng chi tiêu" amount={summary?.totalExpense || 0} color="bg-gradient-to-br from-rose-400 to-pink-500" />
        <StatCard
          icon={DollarSign}
          label="Số dư"
          amount={(summary?.balance) || 0}
          color={(summary?.balance || 0) >= 0 ? "bg-gradient-to-br from-indigo-500 to-violet-600" : "bg-gradient-to-br from-amber-400 to-orange-500"}
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Tổng quan', icon: BarChart2 },
          { id: 'transactions', label: 'Giao dịch', icon: DollarSign },
          { id: 'categories', label: 'Danh mục', icon: Tag },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 mb-4">Thu Chi Theo Ngày</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" />
                  <Area type="monotone" dataKey="expense" name="expense" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu trong tháng này
              </div>
            )}
          </div>

          {/* Pie chart chi tiêu theo danh mục */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 mb-4">Chi Tiêu Theo Danh Mục</h3>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatVND(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-slate-600 truncate max-w-[100px]">{d.icon} {d.name}</span>
                      </div>
                      <span className="font-bold text-slate-700">{formatVND(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm text-center">
                Chưa có chi tiêu trong tháng này
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">Giao Dịch Tháng {month}/{year}</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Wallet size={40} className="mx-auto mb-3 opacity-30" />
              <p>Chưa có giao dịch nào. Thêm giao dịch đầu tiên của bạn!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: tx.category?.color ? `${tx.category.color}20` : '#f1f5f9' }}>
                      {tx.category?.icon || (tx.type === 'INCOME' ? '💰' : '💸')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {tx.note || tx.category?.name || (tx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.date).toLocaleDateString('vi-VN')}
                        {tx.category && ` · ${tx.category.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatVND(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">{cat.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.type === 'INCOME'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-500'
                      }`}>
                      {cat.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            Danh mục mặc định được tạo tự động. Sẽ thêm tuỳ chỉnh danh mục trong tương lai.
          </p>
        </div>
      )}

      {showAddModal && (
        <AddTransactionModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Finance;