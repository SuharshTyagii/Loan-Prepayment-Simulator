import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Plus, Minus, Info, Sun, Moon, Star, Globe } from 'lucide-react';

// Currency configuration with locale mapping
const currencies = 
[
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', locale: 'ar-AE' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'BRL', name: 'Brazilian Real', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', locale: 'ar-EG' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰', locale: 'zh-HK' },
  { code: 'IDR', name: 'Indonesian Rupiah', flag: '🇮🇩', locale: 'id-ID' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷', locale: 'ko-KR' },
  { code: 'MXN', name: 'Mexican Peso', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾', locale: 'ms-MY' },
  { code: 'NOK', name: 'Norwegian Krone', flag: '🇳🇴', locale: 'nb-NO' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', locale: 'en-NZ' },
  { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭', locale: 'fil-PH' },
  { code: 'PKR', name: 'Pakistani Rupee', flag: '🇵🇰', locale: 'ur-PK' },
  { code: 'RUB', name: 'Russian Ruble', flag: '🇷🇺', locale: 'ru-RU' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', locale: 'ar-SA' },
  { code: 'SEK', name: 'Swedish Krona', flag: '🇸🇪', locale: 'sv-SE' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', locale: 'th-TH' },
  { code: 'TRY', name: 'Turkish Lira', flag: '🇹🇷', locale: 'tr-TR' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'VND', name: 'Vietnamese Dong', flag: '🇻🇳', locale: 'vi-VN' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦', locale: 'en-ZA' }
]


// Custom Tooltip Component 
const CustomTooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-10 w-60 p-2 text-sm bg-black text-white rounded shadow-lg -translate-x-1/2 left-1/2 bottom-full mb-2">
          {content}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"></div>
        </div>
      )}
    </div>
  );
};

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
  const [original, setOriginal] = useLocalStorage('original', 2945000);
  const [remaining, setRemaining] = useLocalStorage('remaining', 2945000);
  const [emi, setEmi] = useLocalStorage('emi', 33600);
  const [annualRate, setAnnualRate] = useLocalStorage('annualRate', 8.2);
  const [prepayment, setPrepayment] = useLocalStorage('prepayment', 0);
  const [oneTime, setOneTime] = useLocalStorage('oneTime', 0);
  const [freq, setFreq] = useLocalStorage('freq', 'monthly');
  const [currency, setCurrency] = useLocalStorage('currency', 'INR');
  const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
  const [showTable, setShowTable] = useLocalStorage('showTable', true);
  const [locationDetected, setLocationDetected] = useLocalStorage('locationDetected', false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Apply system dark mode preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Detect system preference once if not in storage
  useEffect(() => {
    if (!localStorage.getItem('darkMode')) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setDarkMode(mq.matches);
      mq.addEventListener('change', e => setDarkMode(e.matches));
    }
  }, []);

  // Toggle dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Payment frequency mapping
  const freqMap = { weekly: 52, biweekly: 26, monthly: 12, '6-months': 2, yearly: 1 };
  const periodsPerYear = freqMap[freq];

  // Get current currency locale
  const currencyInfo = useMemo(() => {
    return currencies.find(c => c.code === currency) || { code: currency, locale: 'en-US' };
  }, [currency]);

  const periodCap = 500;

  const scheduleData = useMemo(() => {
    let balance = Math.max(0, remaining - oneTime);
    const ratePerPeriod = annualRate / 100 / periodsPerYear;
    const data = [];
    let period = 0;
    let cumInterest = 0;
    const paymentBase = emi * (periodsPerYear / 12);

    if (emi < (balance * ratePerPeriod)) {
      console.warn('EMI is too low to cover the interest!');
    }
    
    while (balance > 0 && period < periodCap) {
      period++;
      const interest = balance * ratePerPeriod;
      let payment = paymentBase + prepayment;
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
  }, [remaining, oneTime, emi, annualRate, prepayment, freq]);
    
  const payoffPeriods = scheduleData.length;
  const totalInterest = scheduleData.reduce((sum, r) => sum + r.interest, 0).toFixed(2);

  // Enhanced formatting helper with locale support
  const fmt = val => {
    const options = { 
      style: 'currency', 
      currency: currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' || currency === 'VND' ? 0 : 2
    };
    
    return new Intl.NumberFormat(currencyInfo.locale, options).format(val);
  };

  // Format numbers without currency symbol
  const fmtNum = val => {
    const options = { 
      maximumFractionDigits: 2
    };
    
    return new Intl.NumberFormat(currencyInfo.locale, options).format(val);
  };

  // Export CSV
  const exportCSV = () => {
    const header = ['Period', 'Interest', 'CumulativeInterest', 'Balance'];
    const rows = scheduleData.map(r => [r.period, r.interest, r.cumInterest, r.balance]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    // Using a simple download method instead of file-saver
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'amortization.csv';
    link.click();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="mx-auto max-w-4xl px-4 py-8 w-full">
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <a href="https://github.com/SuharshTyagii/Loan-Prepayment-Simulator/" target="_blank" rel="noopener" className="flex items-center text-yellow-500 hover:text-yellow-400">
            <Star className="w-5 h-5 mr-1" /> Star on GitHub
          </a>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-full sm:w-auto relative">
              <label className="block text-sm mb-1">Currency</label>
              <div className="flex">
                <select 
                  className={`p-2 border rounded-lg w-full sm:w-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                  value={currency} 
                  onChange={e => setCurrency(e.target.value)}
                >
                  {currencies.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <button 
                  onClick={() => {
                    setIsDetectingLocation(true);
                    // Simulate geolocation detection
                    setTimeout(() => {
                      // In a real implementation, you'd use the browser's geolocation API
                      // or a service like ipinfo.io to get the user's country
                      setIsDetectingLocation(false);
                      setLocationDetected(true);
                      // For demo, we'll just set USD - in real app you'd detect locale
                      setCurrency('USD');
                    }, 1000);
                  }}
                  disabled={isDetectingLocation}
                  className={`ml-1 p-2 rounded-lg transition-colors ${
                    darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'
                  } ${isDetectingLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Auto-detect currency based on your location"
                >
                  <Globe className="w-4 h-4" />
                </button>
              </div>
              {isDetectingLocation && (
                <div className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Detecting location...
                </div>
              )}
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
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
                value={original} 
                onChange={e => setOriginal(+e.target.value)} 
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
                value={remaining} 
                onChange={e => setRemaining(+e.target.value)} 
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
                value={oneTime} 
                onChange={e => setOneTime(Math.min(+e.target.value, remaining))} 
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Will reduce balance by {fmt(Math.min(oneTime, remaining))}</div>
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
                value={emi} 
                onChange={e => setEmi(+e.target.value)} 
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(emi)}</div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block font-medium mb-1 flex items-center">
                Interest Rate: {fmtNum(annualRate)}% p.a. 
                <CustomTooltip content="Annual interest rate applied to your loan">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                step="0.1" 
                value={annualRate} 
                onChange={e => setAnnualRate(+e.target.value)} 
                className="w-full mt-1" 
              />
            </div>

            {/* Extra Payment & Frequency */}
            <div>
              <label className="block font-medium mb-1 flex items-center">
                Recurring Pre-Payment 
                <CustomTooltip content="Additional payment made each period on top of your regular EMI">
                  <Info className={`ml-1 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </CustomTooltip>
              </label>
              <div className="flex mt-1">
                <button 
                  onClick={() => setPrepayment(p => Math.max(0, p - 2000))} 
                  className={`p-2 rounded-l-lg transition-colors ${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  step="1000" 
                  className={`w-full text-center p-3 border-t border-b transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                  value={prepayment} 
                  onChange={e => setPrepayment(Math.max(0, Math.min(remaining, +e.target.value)))} 
                />
                <button 
                  onClick={() => setPrepayment(p => Math.min(remaining, p + 2000))} 
                  className={`p-2 rounded-r-lg transition-colors ${darkMode ? 'bg-blue-800 hover:bg-blue-700' : 'bg-blue-100 hover:bg-blue-200'}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <select 
                  className={`w-full p-3 border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} 
                  value={freq} 
                  onChange={e => setFreq(e.target.value)}
                >
                  {['weekly','biweekly','monthly','6-months','yearly'].map(v => 
                    <option key={v} value={v}>{v}</option>
                  )}
                </select>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fmt(prepayment)} every {freq}</div>
            </div>
          </div>

          {/* Summary */}
          <div className={`mt-6 p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p>Periods to payoff (Months): <span className="font-semibold">{fmtNum(payoffPeriods)}</span></p>
            <p>Total interest paid: <span className="font-semibold">{fmt(totalInterest)}</span></p>
          </div>

          {/* Chart */}
          <div className="mt-6 mb-4" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scheduleData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
                <XAxis 
                  dataKey="period" 
                  label={{ value: 'Period (months)', position: 'insideBottom', offset: -5 }} 
                  stroke={darkMode ? "#aaa" : "#666"}
                />
                <YAxis 
                  label={{ value: `Balance (${currency})`, angle: -90, position: 'insideLeft' }} 
                  stroke={darkMode ? "#aaa" : "#666"}
                  tickFormatter={val => {
                    // Short format for chart labels
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
            <div className="overflow-auto">
              <table className={`min-w-full table-auto border-collapse mb-6 transition-colors ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    {['Period', 'Interest', 'Cumulative Interest', 'Balance'].map(h => (
                      <th key={h} className={`border px-3 py-2 text-left ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.map(r => (
                    <tr key={r.period} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className={`border px-3 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{r.period}</td>
                      <td className={`border px-3 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{fmt(r.interest)}</td>
                      <td className={`border px-3 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{fmt(r.cumInterest)}</td>
                      <td className={`border px-3 py-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{fmt(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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