import React from 'react';

import '../element-style.css';
import '../table-style.css';

const DataTab = ({ dataCtrl }) => {
  const { rawData } = dataCtrl;
  
  const allColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  return (
    <div className="card-container">
      <div className="spread-container">
        <h3 className="card-title">Dữ liệu đầu vào</h3>
        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
          {rawData.length} dòng x {allColumns.length} cột
        </span>
      </div>

      <div className="h-6"></div>
      
      <div className="overflow-x-auto max-h-150">
        <table className="table">
          <thead className="table-head">
            <tr>
              {allColumns.map(c => (
                <th key={c} className="table-head-item">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {rawData.map((row, i) => (
              <tr key={i}>
                {allColumns.map(c => (
                  <td key={c} className="table-row-item">
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