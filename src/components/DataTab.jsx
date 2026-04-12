import React from 'react';

const DataTab = ({ dataCtrl }) => {
  const { rawData } = dataCtrl;
  
  const allColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-lg text-slate-800">Dữ liệu đầu vào</h3>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
          {rawData.length} dòng x {allColumns.length} cột
        </span>
      </div>
      <div className="overflow-x-auto max-h-150">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              {allColumns.map(c => (
                <th key={c} className="px-4 py-3 border-b border-slate-200 text-slate-600 font-bold whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rawData.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                {allColumns.map(c => (
                  <td key={c} className="px-4 py-3 text-slate-500 whitespace-nowrap border-b border-slate-50">
                    {row[c] !== null ? String(row[c]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(DataTab);