import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

const ScreeHeatTab = ({ pcaResults, selectedCols }) => {
  const varianceData = useMemo(() => {
    let cumulative = 0;
    return pcaResults.explainedVar.map((v, i) => {
      cumulative += v;
      return {
        pc: pcaResults.pcNames[i],
        eigenvalue: pcaResults.eigenvalues[i],
        variance: v * 100,
        cumulative: cumulative * 100
      };
    });
  }, [pcaResults]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* scree plot */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 text-slate-800">Scree Plot</h3>
          <div className="h-72">
            <Line 
              data={{
                labels: pcaResults.pcNames,
                datasets: [{
                  label: 'Phương sai (%)',
                  data: pcaResults.explainedVar.map(v => v * 100),
                  borderColor: '#3b82f6',
                  backgroundColor: '#3b82f6',
                  pointBorderWidth: 2,
                  pointRadius: 5,
                  tension: 0,
                }]
              }}
              options={{ 
                maintainAspectRatio: false,
                animations: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, title: { display: true, text: 'Thành phần chính' } },
                  y: { beginAtZero: true, title: { display: true, text: 'Phương sai' } }
                }
              }}
            />
          </div>
        </div>

        {/* variance table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6 text-slate-800">Bảng phương sai</h3>
          <div className="overflow-auto max-h-72">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3">PC</th>
                  <th className="px-4 py-3">Trị riêng</th>
                  <th className="px-4 py-3">% Phương sai</th>
                  <th className="px-4 py-3">% Tích lũy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {varianceData.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-blue-600">{row.pc}</td>
                    <td className="px-4 py-3 font-mono">{row.eigenvalue.toFixed(4)}</td>
                    <td className="px-4 py-3 font-mono">{row.variance.toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono">{row.cumulative.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* loading heatmap */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg mb-6 text-slate-800">Trọng số biến</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Âm (-)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 rounded-sm border"></div> Không (0)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Dương (+)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="p-2 text-xs text-slate-400 font-medium text-left sticky left-0 bg-white z-20 min-w-30">Biến dữ liệu</th>
                {pcaResults.pcNames.slice(0, 10).map(pc => (
                  <th key={pc} className="p-2 text-xs text-slate-500 font-bold text-center min-w-15">{pc}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedCols.map((col, i) => (
                <tr key={col} className="group">
                  <td className="p-2 text-xs font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                    {col}
                  </td>
                  {pcaResults.loadings[i].slice(0, 10).map((val, j) => {
                    const absVal = Math.abs(val);
                    const bgColor = val > 0 
                      ? `rgba(59, 130, 246, ${absVal * 0.9})` // Blue
                      : `rgba(239, 68, 68, ${absVal * 0.9})`; // Red
                    
                    return (
                      <td 
                        key={j} 
                        className="p-2 text-[11px] text-center font-mono rounded-md transition-transform hover:scale-105 cursor-default shadow-sm border border-white/20"
                        style={{ 
                          backgroundColor: absVal < 0.1 ? '#f8fafc' : bgColor, 
                          color: absVal > 0.4 ? 'white' : '#475569' 
                        }}
                        title={`Loading của ${col} trên ${pcaResults.pcNames[j]}: ${val.toFixed(4)}`}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScreeHeatTab);