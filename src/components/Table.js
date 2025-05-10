export function Table({darkMode, scheduleData, fmt}) {
  return (
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
  )
}