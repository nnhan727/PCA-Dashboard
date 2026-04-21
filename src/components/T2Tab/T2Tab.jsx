import React, { useEffect, useRef } from 'react';
import { Scatter } from 'react-chartjs-2';
import { RotateCcw } from 'lucide-react';

import 'katex/dist/katex.min.css';
import katex from 'katex';

import '../element-style.css';
import '../table-style.css';

const KatexDisplay = ({ math, block }) => {
  const ref = useRef();
  useEffect(() => {
    katex.render(math, ref.current, { displayMode: block });
  }, [math, block]);
  return <span ref={ref} />;
};

const T2Tab = ({ t2Stats, rawData, selectedCols, k }) => {
  const annotations = {
    lineH: {
      type: 'line',
      xMin: t2Stats.uclH,
      xMax: t2Stats.uclH,
      borderColor: 'rgb(249, 115, 22)', // Orange-500
      borderWidth: 3,
      borderDash: [9, 9],
      label: {
        display: true,
        content: 'UCL Hotelling',
        position: 'end',
        backgroundColor: 'rgb(249, 115, 22)',
        color: 'white',
        font: { size: 10, weight: 'bold' },
        padding: 4
      }
    }
  };
  if (selectedCols.length !== k)
    annotations.lineR = {
      type: 'line',
      yMin: t2Stats.uclR,
      yMax: t2Stats.uclR,
      borderColor: 'rgb(239, 68, 68)', // Red-500
      borderWidth: 3,
      borderDash: [9, 9],
      label: {
        display: true,
        content: 'UCL Residual',
        position: 'end',
        backgroundColor: 'rgb(239, 68, 68)',
        color: 'white',
        font: { size: 10, weight: 'bold' },
        padding: 4
      }
    };
  
  const outlierIndices = t2Stats.hotellingT2
    .map((v, i) => (v > t2Stats.uclH && t2Stats.residualT2[i] <= t2Stats.uclR) ? i : -1)
    .filter(i => i !== -1);

  const anomalyIndices = t2Stats.residualT2
    .map((v, i) => v > t2Stats.uclR ? i : -1)
    .filter(i => i !== -1);

  const allColumns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  const DetectionTable = ({ title, indices, colorClass, borderClass }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

      <div className={`p-3 ${colorClass} text-white spread-container`}>
        <h4 className="font-bold tracking-wide">{title}</h4>
        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/30">
          {indices.length} điểm
        </span>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="table">
          <thead className="table-head">
            <tr className="border-b border-slate-200">
              <th className="table-head-id-item">
                Index
              </th>
              {allColumns.map(c => (
                <th key={c} className="table-head-item">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {indices.map(idx => (
              <tr key={idx}>
                <td className="table-row-id-item">
                  {idx}
                </td>
                {allColumns.map(c => (
                  <td key={c} className="table-row-item">
                    {rawData[idx][c] !== null ? String(rawData[idx][c]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
            
            {indices.length === 0 && (
              <tr>
                <td colSpan={allColumns.length + 1} className="p-12 text-center text-slate-400 italic bg-slate-50/30">
                  (không có)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // reset zoom & pan
  const chartRef = useRef(null);
  const handleResetZoom = () => {
    if (chartRef.current) {
      // zoomPlugin function
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-container">
          <div className="spread-container">
            <h3 className="card-title">Biểu đồ kiểm soát</h3>

            <button 
              onClick={handleResetZoom}
              className="button"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          <div className="h-6"></div>
          <div className="h-150">
            <Scatter 
              ref={chartRef}
              data={{
                datasets: [{
                  label: 'Dữ liệu',
                  data: t2Stats.hotellingT2.map((val, i) => ({ x: val, y: t2Stats.residualT2[i] })),
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgb(15, 23, 42)',
                  borderWidth: 1,
                  pointRadius: 4,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: { title: { display: true, text: 'Hotelling\'s T²' } },
                  y: { title: { display: true, text: 'Residual T²' } }
                },
                animations: false,       
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `Index: ${ctx.dataIndex} | Hot. T²: ${ctx.parsed.x.toFixed(2)}, Res. T²: ${ctx.parsed.y.toFixed(2)}`
                    }
                  },
                  annotation: {
                    annotations: annotations
                  },
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: 'xy',
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: 'xy',
                    },
                  }
                }
              }}
            />
          </div>
        </div>

        {/* ucl cell */}
        <div className="space-y-6">
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Thông số UCL</h4>
            <div className="space-y-4">
              <div>
                <p className="text-xs">UCL Hotelling (k = {k})</p>
                <p className="text-2xl font-mono font-bold">{t2Stats.uclH.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs">UCL Residual (p - k = {selectedCols.length - k})</p>
                <p className="text-2xl font-mono font-bold">{selectedCols.length !== k ? t2Stats.uclR.toFixed(4) : "NaN"}</p>
              </div>
            </div>
          </div>

          {/* explain stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Giải thích thông số</h4>
            
            <div className="space-y-6 text-sm text-slate-600">
              <p className="leading-relaxed">
                Với điểm dữ liệu <KatexDisplay math={"y = [y_1, y_2,...,y_p]"} block={false} /> và <KatexDisplay math={"k"} block={false} /> thành phần chính:
              </p>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800 text-xs mb-2">Hotelling's T²: Khoảng cách từ <KatexDisplay math={"y"} block={false} /> tới tâm của mô hình PCA trong không gian chính</p>
                <KatexDisplay math={"T^2 = \u005Csum_{i=1}^{k} \u005Cdfrac{y_i^2}{\u005Clambda_i}"} block={true} />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800 text-xs mb-2">Residual T²: Khoảng cách từ <KatexDisplay math={"y"} block={false} /> tới tâm của mô hình PCA trong không gian dư</p>
                <KatexDisplay math={"T^2_{res} = \u005Csum_{i=k+1}^{p} \u005Cdfrac{y_i^2}{\u005Clambda_i}"} block={true} />
              </div>
              
              <p className="leading-relaxed">
                Trong đó <KatexDisplay math={"\u005Clambda_i"} block={false} /> là trị riêng tương ứng của PC thứ <KatexDisplay math={"i"} block={false} />.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <DetectionTable 
          title="Điểm ngoại lai (Hotelling's T² vượt ngưỡng nhưng Residual T² không vượt ngưỡng)"
          indices={outlierIndices} 
          colorClass="bg-orange-500"
        />
        <DetectionTable 
          title="Điểm dị biệt (Residual T² vượt ngưỡng)" 
          indices={anomalyIndices} 
          colorClass="bg-red-500"
        />
      </div>
    </div>
  );
};

export default React.memo(T2Tab);