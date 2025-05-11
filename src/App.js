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

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {};
  }, [key, value]);

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
  const [tenure, setTenure] = useLocalStorage('tenure', 0);

  // Sync dark mode with system
  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode); }, [darkMode]);
  useEffect(() => {
    if (!localStorage.getItem('darkMode')) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mq.matches);
      mq.addEventListener('change', e => setDarkMode(e.matches));
    }
  }, []);

  // Payment frequency mapping
  const freqMap = { weekly: 52, biweekly: 26, monthly: 12, '6-months': 2, yearly: 1 };
  const periodsPerYear = freqMap[freq];

  // Locale for currency
  const currencyInfo = useMemo(
    () => currencies.find(c => c.code === currency) || { code: currency, locale: 'en-US' },
    [currency]
  );

  // Amortization schedule data
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
      data.push({
        period,
        interest: +interest.toFixed(2),
        cumInterest: +cumInterest.toFixed(2),
        balance: +Math.max(0, balance).toFixed(2)
      });
      if (balance <= 0) break;
    }
    return data;
  }, [remaining, oneTime, emi, annualRate, prepayment, freq, periodsPerYear]);

  const payoffPeriods = scheduleData.length;
  const totalInterest = scheduleData.reduce((sum, r) => sum + r.interest, 0).toFixed(2);

  // Calculate EMI from principal, rate, and years
  const calculateEmi = (principal, rate, years) => {
    const P = principal;
    const monthlyRate = rate / 100 / 12;
    const n = years * 12;
    if (n === 0) return 0;
    if (monthlyRate === 0) return +(P / n).toFixed(2);
    const factor = Math.pow(1 + monthlyRate, n);
    return +((P * monthlyRate * factor) / (factor - 1)).toFixed(2);
  };

  // Check if EMI covers first-month interest
  const initialBalance = Math.max(0, parseFloat(remaining) - parseFloat(oneTime));
  const interestMonthly = initialBalance * (annualRate / 100 / 12);
  const emiTooLow = parseFloat(emi) < interestMonthly;

  // Formatting helpers
  const fmt = val => new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency', currency,
    maximumFractionDigits: ['JPY','KRW','VND'].includes(currency) ? 0 : 2
  }).format(val);
  const fmtNum = val => new Intl.NumberFormat(currencyInfo.locale, { maximumFractionDigits: 2 }).format(val);

  // Export amortization to CSV
  const exportCSV = () => {
    const header = ['Period','Interest','CumulativeInterest','Balance'];
    const rows = scheduleData.map(r => [r.period, r.interest, r.cumInterest, r.balance]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'amortization.csv';
    link.click();
  };

  // Text for payoff time
  const getPayoffTimeText = () => {
    if (payoffPeriods === 0) return '0';
    switch (freq) {
      case 'weekly': return `${payoffPeriods} weeks (${(payoffPeriods/52).toFixed(1)} years)`;
      case 'biweekly': return `${payoffPeriods} bi-weekly periods (${(payoffPeriods/26).toFixed(1)} years)`;
      case 'monthly': return `${payoffPeriods} months (${(payoffPeriods/12).toFixed(1)} years)`;
      case '6-months': return `${payoffPeriods} half-year periods (${(payoffPeriods/2).toFixed(1)} years)`;
      case 'yearly': return `${payoffPeriods} years`;
      default: return fmtNum(payoffPeriods);
    }
  };

  // Handle numeric input safely
  const handleNumericInput = (value, setter, min = 0, max = Infinity) => {
    if (value === '') { setter(''); return; }
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) setter(Math.max(min, Math.min(max, parsed)));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>  
      <div className="mx-auto max-w-4xl px-4 py-8 w-full">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <a href="https://github.com/SuharshTyagii/Loan-Prepayment-Simulator/" target="_blank" rel="noopener" className="flex items-center text-yellow-500 hover:text-yellow-400">
            <Star className="w-5 h-5 mr-1" /> Star on GitHub
          </a>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-auto relative">
              <label className="block text-sm mb-1">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={`p-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className={`p-6 shadow-lg rounded-2xl transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>  
          <h2 className="text-2xl font-bold mb-6 text-center">Loan Payoff Simulator</h2>

          {/* Input Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Loan */}
            <div>  
              <label className="block font-medium mb-1 flex items-center">
                Original Loan Amount
                <CustomTooltip content="The initial principal borrowed from the lender">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <input
                type="number"
                className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={original || ''} onChange={e => handleNumericInput(e.target.value, setOriginal)}
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(original)}</div>
            </div>

            {/* Remaining Principal */}
            <div>  
              <label className="block font-medium mb-1 flex items-center">
                Remaining Principal
                <CustomTooltip content="Current outstanding principal amount before any one-time payment">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <input
                type="number"
                className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={remaining || ''} onChange={e => handleNumericInput(e.target.value, setRemaining)}
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(remaining)}</div>
            </div>

            {/* One-Time Prepayment */}
            <div className="md:col-span-2">  
              <label className="block font-medium mb-1 flex items-center">
                One‑Time Prepayment
                <CustomTooltip content="Lump-sum payment applied immediately to reduce the principal">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <input
                type="number"
                className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={oneTime || ''} onChange={e => handleNumericInput(e.target.value, setOneTime, 0, remaining)}
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Will reduce balance by {fmt(Math.min(oneTime, remaining))}
              </div>
            </div>

            {/* EMI */}
            <div>  
              <label className="block font-medium mb-1 flex items-center">
                Monthly EMI
                <CustomTooltip content="Equated Monthly Installment - your fixed monthly payment amount">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <input
                type="number"
                className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                value={emi || ''} onChange={e => handleNumericInput(e.target.value, setEmi)}
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(emi)}</div>
              {emiTooLow && (
                <div className="text-red-500 mt-2">
                  EMI is too low to cover the monthly interest; balance will grow.
                </div>
              )}
            </div>

            {/* Interest Rate with Input */}
            <div>  
              <label className="block font-medium mb-1 flex items-center">
                Interest Rate (% p.a.)
                <CustomTooltip content="Annual interest rate applied to your loan">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <div className="flex items-center gap-4 mt-1">
                <input
                  type="range" min="0" max="20" step="0.1"
                  value={annualRate} onChange={e => setAnnualRate(+e.target.value)}
                  className="flex-1"
                />
                <input
                  type="number" step="0.01" min="0" max="100"
                  value={annualRate} onChange={e => setAnnualRate(+e.target.value)}
                  className={`w-20 p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            {/* Recurring Prepayment & Frequency */}
            <div>  
              <label className="block font-medium mb-1 flex items-center">
                Recurring Pre-Payment
                <CustomTooltip content="Additional payment made each period on top of your regular EMI">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <div className="flex mt-1">
                <button onClick={() => setPrepayment(p => Math.max(0, p - 2000))}
                  className={`p-2 rounded-l-lg transition-colors ${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}>
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number" step="1000"
                  className={`w-full text-center p-3 border-t border-b transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={prepayment || ''} onChange={e => handleNumericInput(e.target.value, setPrepayment, 0, remaining)}
                />
                <button onClick={() => setPrepayment(p => Math.min(remaining, p + 2000))}
                  className={`p-2 rounded-r-lg transition-colors ${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <select
                  className={`w-full p-3 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  value={freq} onChange={e => setFreq(e.target.value)}
                >
                  {['weekly', 'biweekly', 'monthly', '6-months', 'yearly'].map(v =>
                    <option key={v} value={v}>{v}</option>
                  )}
                </select>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {fmt(prepayment)} every {freq}
              </div>
            </div>
          </div>

          {/* Tenure Slider */}
          <div className="mt-6">  
            <label className="block font-medium mb-1">Loan Tenure (years)</label>  
            <div className="flex items-center gap-4">  
              <input
                type="range" min="0" max="50" step="1"
                value={tenure} onChange={e => {
                  const yrs = parseInt(e.target.value, 10);
                  setTenure(yrs);
                  const principal = Math.max(0, parseFloat(remaining) - parseFloat(oneTime));
                  setEmi(calculateEmi(principal, annualRate, yrs));
                }} className="flex-1" />  
              <div className="w-12 text-center">{tenure}</div>  
            </div>  
          </div>

          {/* Summary */}
          <div className={`mt-6 p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>  
            <p>Payoff time: <span className="font-semibold">{getPayoffTimeText()}</span></p>  
            <p>Total interest paid: <span className="font-semibold">{fmt(totalInterest)}</span></p>  
          </div>

          {/* Chart */}
          <div className="mt-6 mb-4" style={{ height: 300 }}>  
            <ResponsiveContainer width="100%" height="100%">  
              <LineChart data={scheduleData}>  
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />  
                <XAxis  
                  dataKey="period"  
                  label={{ value: `Period (${freq})`, position: 'insideBottom', offset: -5 }}  
                  stroke={darkMode ? "#aaa" : "#666"}  
                />  
                <YAxis  
                  label={{ value: `Balance (${currency})`, angle: -90, position: 'insideLeft' }}  
                  stroke={darkMode ? "#aaa" : "#666"}  
                  tickFormatter={val => {  
                    const absVal = Math.abs(val);  
                    if (absVal >= 1000000) return (val / 1000000).toFixed(1) + 'M';  
                    if (absVal >= 1000) return (val / 1000).toFixed(0) + 'K';  
                    return val;  
                  }}  
                />  
                <RechartsTooltip  
                  formatter={val => fmt(val)}  
                  contentStyle={{  
                    backgroundColor: darkMode ? '#333' : '#fff',  
                    borderColor: darkMode ? '#555' : '#ccc',  
                    color: darkMode ? '#eee' : '#333'  
                  }}  
                />  
                <Line  
                  type="monotone"  
                  dataKey="balance"  
                  stroke="#4f46e5"  
                  strokeWidth={2}  
                />  
              </LineChart>  
            </ResponsiveContainer>  
          </div>

          {/* Table Toggle */}
          <div className="flex justify-center">  
            <button  
              onClick={() => setShowTable(s => !s)}  
              className="mb-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"  
            >  
              {showTable ? 'Hide' : 'Show'} Amortization Table  
            </button>  
          </div>

          {/* Table */}
          {showTable && (
            <Table darkMode={darkMode} scheduleData={scheduleData} fmt={fmt} />
          )}

          {/* Export CSV */}
          <div className="flex items-center">
            <button
              onClick={exportCSV}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export Table to CSV
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Made with <span className="text-red-500">&hearts;</span> by <a href="https://www.github.com/SuharshTyagii">Suharsh Tyagi</a>
        </footer>
      </div>
    </div>
  );
}
