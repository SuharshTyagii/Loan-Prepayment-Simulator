import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Plus, Minus, Info, Sun, Moon, Star } from 'lucide-react';
import { CustomTooltip } from './components/CustomTooltip';
import { currencies } from './common/currencies';
import { Table } from './components/Table';

function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { } }, [key, value]);
  return [value, setValue];
}

export default function LoanCalculator() {
  const [original, setOriginal] = useLocalStorage('original', 3200000);
  const [remaining, setRemaining] = useLocalStorage('remaining', 2945000);
  const [emi, setEmi] = useLocalStorage('emi', 33600);
  const [annualRate, setAnnualRate] = useLocalStorage('annualRate', 8.2);
  const [prepayment, setPrepayment] = useLocalStorage('prepayment', 0);
  const [oneTime, setOneTime] = useLocalStorage('oneTime', 0);
  const [freq, setFreq] = useLocalStorage('freq', 'monthly');
  const [currency, setCurrency] = useLocalStorage('currency', 'INR');
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [showTable, setShowTable] = useLocalStorage('showTable', true);
  const [emiModalOpen, setEmiModalOpen] = useState(false);
  const [modalTenure, setModalTenure] = useState(1);

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => {
    if (!localStorage.getItem('darkMode')) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mq.matches);
      mq.addEventListener('change', e => setDarkMode(e.matches));
    }
  }, []);

  const freqMap = { weekly: 52, biweekly: 26, monthly: 12, '6-months': 2, yearly: 1 };
  const periodsPerYear = freqMap[freq];

  const currencyInfo = useMemo(
    () => currencies.find(c => c.code === currency) || { code: currency, locale: 'en-US' },
    [currency]
  );

  const scheduleData = useMemo(() => {
    let balance = Math.max(0, parseFloat(remaining) - parseFloat(oneTime));
    const ratePerPeriod = annualRate / 100 / periodsPerYear;
    const data = [];
    let period = 0;
    let cumInterest = 0;
    const emiNum = parseFloat(emi) || 0;
    const prepaymentPerPeriod = parseFloat(prepayment) || 0;
    const paymentBase = emiNum * 12 / periodsPerYear;
    const periodCap = 500;

    while (balance > 0 && period < periodCap) {
      period++;
      const interest = balance * ratePerPeriod;
      let payment = paymentBase + prepaymentPerPeriod;
      if (payment > balance + interest) payment = balance + interest;
      const principalPaid = payment - interest;
      balance -= principalPaid;
      cumInterest += interest;
      data.push({ period, interest: +interest.toFixed(2), cumInterest: +cumInterest.toFixed(2), balance: +Math.max(0, balance).toFixed(2) });
      if (balance <= 0) break;
    }
    return data;
  }, [remaining, oneTime, emi, annualRate, prepayment, freq, periodsPerYear]);

  const payoffPeriods = scheduleData.length;
  const totalInterest = scheduleData.reduce((sum, r) => sum + r.interest, 0).toFixed(2);

  const calculateEmi = (principal, rate, years) => {
    const P = principal;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (n === 0) return 0;
    if (monthlyRate === 0) return +(P / n).toFixed(2);
    const factor = Math.pow(1 + monthlyRate, n);
    return +((P * monthlyRate * factor) / (factor - 1)).toFixed(2);
  };

  const initialBalance = Math.max(0, parseFloat(remaining) - parseFloat(oneTime));
  const interestMonthly = initialBalance * (annualRate / 100 / 12);
  const emiTooLow = parseFloat(emi) < interestMonthly;

  const fmt = val => new Intl.NumberFormat(currencyInfo.locale, { style: 'currency', currency, maximumFractionDigits: ['JPY', 'KRW', 'VND'].includes(currency) ? 0 : 2 }).format(val);
  const fmtNum = val => new Intl.NumberFormat(currencyInfo.locale, { maximumFractionDigits: 2 }).format(val);

  const exportCSV = () => {
    const header = ['Period', 'Interest', 'CumulativeInterest', 'Balance'];
    const rows = scheduleData.map(r => [r.period, r.interest, r.cumInterest, r.balance]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'amortization.csv'; link.click();
  };

  const getPayoffTimeText = () => {
    if (payoffPeriods === 0) return '0';
    switch (freq) {
      case 'weekly': return `${payoffPeriods} weeks (${(payoffPeriods / 52).toFixed(1)} years)`;
      case 'biweekly': return `${payoffPeriods} bi-weekly periods (${(payoffPeriods / 26).toFixed(1)} years)`;
      case 'monthly': return `${payoffPeriods} months (${(payoffPeriods / 12).toFixed(1)} years)`;
      case '6-months': return `${payoffPeriods} half-year periods (${(payoffPeriods / 2).toFixed(1)} years)`;
      case 'yearly': return `${payoffPeriods} years`;
      default: return fmtNum(payoffPeriods);
    }
  };

  const handleNumericInput = (value, setter, min = 0, max = Infinity) => {
    if (value === '') { setter(''); return; }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) setter(Math.max(min, Math.min(max, parsed)));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <a href="https://github.com/SuharshTyagii/Loan-Prepayment-Simulater/" target="_blank" rel="noopener" className="flex items-center text-yellow-500 hover:text-yellow-400"><Star className="w-5 h-5 mr-1" /> Star on GitHub</a>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-auto relative">
              <label className="block text-sm mb-1">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={`p-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} aria-label={darkMode ? 'Light mode' : 'Dark mode'}>{darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}</button>
          </div>
        </div>

        <div className={`p-6 shadow-lg rounded-2xl transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-2xl font-bold mb-6 text-center">Loan Payoff Simulator</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-1 flex items-center">Original Loan Amount<CustomTooltip content="The initial principal borrowed"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <input type="number" className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={original} onChange={e => handleNumericInput(e.target.value, setOriginal)} />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(original)}</div>
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center">Remaining Principal<CustomTooltip content="Outstanding principal before any one-time payment"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <input type="number" className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={remaining} onChange={e => handleNumericInput(e.target.value, setRemaining)} />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(remaining)}</div>
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1 flex items-center">One‑Time Prepayment<CustomTooltip content="Lump-sum reduce principal"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <input type="number" className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={oneTime} onChange={e => handleNumericInput(e.target.value, setOneTime, 0, remaining)} />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Will reduce balance by {fmt(Math.min(oneTime, remaining))}</div>
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center">Monthly EMI<CustomTooltip content="Equated Monthly Installment"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <input type="number" className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={emi} onChange={e => handleNumericInput(e.target.value, setEmi)} />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(emi)}</div>{emiTooLow && <div className="text-red-500 mt-2">EMI too low; balance grows</div>}
              <button onClick={() => setEmiModalOpen(true)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Calculate Monthly EMI</button>
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center">Interest Rate (% p.a.)<CustomTooltip content="Annual interest rate"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <div className="flex items-center gap-4 mt-1">
                <input type="range" min="0" max="20" step="0.1" value={annualRate} onChange={e => setAnnualRate(+e.target.value)} className="flex-1" />
                <input type="number" step="0.01" min="0" max="100" value={annualRate} onChange={e => setAnnualRate(+e.target.value)} className={`w-20 p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center">Recurring Pre-Payment<CustomTooltip content="Additional payment each period"><Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} /></CustomTooltip></label>
              <div className="flex mt-1">
                <button onClick={() => setPrepayment(p => Math.max(0, p - 2000))} className={`p-2 rounded-l-lg ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}><Minus className="w-4 h-4" /></button>
                <input type="number" step="1000" className={`w-full text-center p-3 border-t border-b ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} value={prepayment} onChange={e => handleNumericInput(e.target.value, setPrepayment, 0, remaining)} />
                <button onClick={() => setPrepayment(p => Math.min(remaining, p + 2000))} className={`p-2 rounded-r-lg ${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}><Plus className="w-4 h-4" /></button>
              </div>
              <select value={freq} onChange={e => setFreq(e.target.value)} className={`w-full mt-2 p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>{['weekly', 'biweekly', 'monthly', '6-months', 'yearly'].map(v => <option key={v} value={v}>{v}</option>)}</select>
              <div className="text-sm mt-1">{fmt(prepayment)} every {freq}</div>
            </div>
          </div>
          <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>Payoff time: <strong>{getPayoffTimeText()}</strong><br />Total interest: <strong>{fmt(totalInterest)}</strong></div>
          <div className="mt-6 mb-4" style={{ height: 300 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={scheduleData}><CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} /><XAxis dataKey="period" label={{ value: `Period (${freq})`, position: 'insideBottom', offset: -5 }} stroke={darkMode ? '#aaa' : '#666'} /><YAxis label={{ value: `Balance (${currency})`, angle: -90, position: 'insideLeft' }} stroke={darkMode ? '#aaa' : '#666'} tickFormatter={val => { const a = Math.abs(val); if (a >= 1e6) return (val / 1e6).toFixed(1) + 'M'; if (a >= 1e3) return (val / 1e3).toFixed(0) + 'K'; return val }} /><RechartsTooltip formatter={val => fmt(val)} contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderColor: darkMode ? '#555' : '#ccc', color: darkMode ? '#eee' : '#333' }} /><Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
          <div className="flex justify-center mb-4"><button onClick={() => setShowTable(s => !s)} className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700">{showTable ? 'Hide' : 'Show'} Table</button></div>
          {showTable && <Table darkMode={darkMode} scheduleData={scheduleData} fmt={fmt} />}
          <div className="flex mt-4"><button onClick={exportCSV} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">Export to CSV</button></div>
        </div>
        {emiModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md`}><h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Calculate EMI</h3><div className="mb-4"><label className="block mb-1">Original Amount</label><input type="number" value={original} readOnly className="w-full p-3 border rounded-lg" /></div><div className="mb-4"><label className="block mb-1">Interest Rate</label><input type="number" value={annualRate} readOnly className="w-full p-3 border rounded-lg" /></div><div className="mb-4"><label className="block mb-1">Tenure: {modalTenure} yrs</label><input type="range" min="1" max="35" value={modalTenure} onChange={e => setModalTenure(+e.target.value)} className="w-full" /></div><div className="flex justify-end gap-4"><button onClick={() => setEmiModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button><button onClick={() => { setEmi(calculateEmi(original, annualRate, modalTenure)); setEmiModalOpen(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg">Calculate</button></div></div></div>}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">Made with <span className="text-red-500">&hearts;</span> by <a href="https://github.com/SuharshTyagii">Suharsh Tyagi</a></footer>
      </div>
    </div>
  );
}
