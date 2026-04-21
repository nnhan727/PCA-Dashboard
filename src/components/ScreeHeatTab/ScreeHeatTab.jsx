import React, { useMemo, useState, useRef } from 'react';
import { jStat } from 'jstat';
import { Line } from 'react-chartjs-2';
import { RotateCcw } from 'lucide-react';

import '../element-style.css';
import '../input-controller-style.css';
import '../table-style.css';

const ScreeHeatTab = ({ pcaResults, dataCtrl, pcaCtrl }) => {
  const { rawData, selectedCols } = dataCtrl;
  const { eigenvalues } = pcaResults;
  const { confidence } = pcaCtrl;

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

  const eigenvalueCI = useMemo(() => {
    const n = rawData.length;
    const zAlpha2 = jStat.normal.inv(1 - (1 - confidence) / 2, 0, 1);
    const errorFactor = zAlpha2 * Math.sqrt(2 / n);

    return eigenvalues.map(eig => ({
        low: eig / (1 + errorFactor),
        high: eig / (1 - errorFactor)
      }))
  }, [dataCtrl, pcaCtrl]);

  const errorBarAnnotations = useMemo(() => {
    const annotations = {};
    eigenvalueCI.forEach((ci, i) => {
      const pcLabel = pcaResults.pcNames[i];
      
      // vertical line
      annotations[`line${i}`] = {
        type: 'line',
        xMin: pcLabel,
        xMax: pcLabel,
        yMin: ci.low,
        yMax: ci.high,
        borderColor: '#3b82f6',
        borderWidth: 1.5,
      };

      // high cap
      annotations[`capTop${i}`] = {
        type: 'line',
        xMin: i - 0.1,
        xMax: i + 0.1,
        yMin: ci.high,
        yMax: ci.high,
        borderColor: '#3b82f6',
        borderWidth: 1.5,
      };

      // low cap
      annotations[`capBottom${i}`] = {
        type: 'line',
        xMin: i - 0.1,
        xMax: i + 0.1,
        yMin: ci.low,
        yMax: ci.low,
        borderColor: '#3b82f6',
        borderWidth: 1.5,
      };
    });
    return annotations;
  }, [pcaResults, eigenvalueCI]);

  // zoom & pan state
  const [zoomState, setZoomState] = useState({
    xMin: undefined,
    xMax: undefined,
    yMin: undefined,
    yMax: undefined
  });

  // reset zoom & pan
  const chartRef = useRef(null);
  const handleResetZoom = () => {
    if (chartRef.current) {
      // zoomPlugin function
      chartRef.current.resetZoom();

      setZoomState({
        // xMin: undefined,
        // xMax: undefined,
        yMin: undefined,
        yMax: undefined
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* scree plot */}
        <div className="card-container">
          <div className="spread-container">
            <h3 className="card-title">Scree Plot</h3>
            
            <button 
              onClick={handleResetZoom}
              className="button"
            >
              <RotateCcw size={20} />
            </button>
          </div>
          <div className="h-6"></div>
          <div className="h-72">
            <Line 
              ref={chartRef}
              data={{
                labels: pcaResults.pcNames,
                datasets: [{
                  label: 'Phương sai',
                  data: pcaResults.eigenvalues,
                  borderColor: '#3b82f6',
                  backgroundColor: '#3b82f6',
                  pointBorderWidth: 1,
                  pointRadius: 3,
                  tension: 0,
                }]
              }}
              options={{ 
                maintainAspectRatio: false,
                animations: false,
                scales: {
                  x: {
                    beginAtZero: true,
                    title: { display: true, text: 'Thành phần chính' },
                    // min: zoomState.xMin,
                    // max: zoomState.xMax
                  },
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Phương sai' },
                    min: zoomState.yMin,
                    max: zoomState.yMax
                  }
                },
                plugins: {
                  legend: {display: false },
                  annotation: {
                    annotations: errorBarAnnotations
                  },
                  tooltip: {
                    callbacks: {
                      afterLabel: (context) => {
                        const ci = eigenvalueCI[context.dataIndex];
                        return `Khoảng tin cậy (${(confidence * 100).toFixed(0)}%): [${ci.low.toFixed(3)}, ${ci.high.toFixed(3)}]`;
                      }
                    }
                  },
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: 'y',
                      onPanComplete: ({ chart }) => {
                        setZoomState({
                          // xMin: chart.scales.x.min,
                          // xMax: chart.scales.x.max,
                          yMin: chart.scales.y.min,
                          yMax: chart.scales.y.max
                        });
                      }
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: 'y',
                      onZoomComplete: ({ chart }) => {
                        setZoomState({
                          // xMin: chart.scales.x.min,
                          // xMax: chart.scales.x.max,
                          yMin: chart.scales.y.min,
                          yMax: chart.scales.y.max
                        });
                      }
                    },
                  }
                },
              }}
            />
          </div>
        </div>

        {/* variance table */}
        <div className="card-container">
          <h3 className="card-title">Bảng phương sai</h3>
          <div className="h-6"></div>
          <div className="overflow-auto h-72">
            <table className="table">
              <thead className="table-head">
                <tr>
                  <th className="table-head-id-item">PC</th>
                  <th className="table-head-item">Trị riêng</th>
                  <th className="table-head-item">% Phương sai</th>
                  <th className="table-head-item">% Tích lũy</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {varianceData.map((row, i) => (
                  <tr key={i}>
                    <td className="table-row-id-item">{row.pc}</td>
                    <td className="table-row-item">{row.eigenvalue.toFixed(4)}</td>
                    <td className="table-row-item">{row.variance.toFixed(2)}%</td>
                    <td className="table-row-item">{row.cumulative.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* loading heatmap */}
      <div className="card-container">
        <div className="spread-container">
          <h3 className="card-title">Trọng số biến</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Âm (-)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 rounded-sm border"></div> Không (0)</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Dương (+)</span>
          </div>
        </div>
        <div className="h-6"></div>
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
              {selectedCols.map((col, i) => {
                const row = pcaResults.loadings[i];
                if (!row) return null;
                
                return (
                  <tr key={col} className="group">
                    <td className="p-2 text-xs font-semibold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">
                      {col}
                    </td>
                    {row.slice(0, selectedCols.length).map((val, j) => {
                      const absVal = Math.abs(val);
                      const bgColor = val > 0 
                        ? `rgba(59, 130, 246, ${absVal * 0.9})` // Blue
                        : `rgba(239, 68, 68, ${absVal * 0.9})`; // Red
                      
                      return (
                        <td 
                          key={j} 
                          className="p-2 text-[11px] text-center font-mono rounded-md transition-transform hover:scale-105 cursor-default shadow-sm border border-white/20"
                          style={{ 
                            backgroundColor: bgColor, 
                            color: absVal > 0.4 ? 'white' : '#475569' 
                          }}
                          title={`Loading của ${col} trên ${pcaResults.pcNames[j]}: ${val.toFixed(4)}`}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ScreeHeatTab);