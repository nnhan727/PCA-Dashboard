import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Scatter } from 'react-chartjs-2';
import { RotateCcw, Shapes, Loader2, ChevronsUp, ChevronsDown } from 'lucide-react';
import KNN from 'ml-knn';

import '../element-style.css';
import '../input-controller-style.css';

const ScatterTab = ({ pcaResults, dataCtrl, pcaCtrl, viewCtrl }) => {
  const { rawData, selectedCols, maxClassNum } = dataCtrl;
  const { k } = pcaCtrl;
  const { plotMode, setPlotMode, xAxis, setXAxis, yAxis, setYAxis, classCol, setClassCol } = viewCtrl;

  const [knnResults, setKnnResults] = useState(null);
  const [isKnnLoading, setIsKnnLoading] = useState(false);

  useEffect(() => {
    if (classCol === '(none)' || !pcaResults || rawData.length < 10) {
      setKnnResults(null);
      return;
    }

    setIsKnnLoading(true);

    // initialize Worker (only work with Vite)
    const worker = new Worker(new URL('./knn.worker.js', import.meta.url), {
      type: 'module'
    });

    // send data to Worker
    worker.postMessage({
      rawData,
      selectedCols,
      pcaResults,
      pcaK: pcaCtrl.k,
      classCol
    });

    // get result from Worker
    worker.onmessage = ({ data }) => {
      if (data.error) {
        console.error("KNN Worker Error:", data.error);
      } else {
        setKnnResults(data);
      }
      setIsKnnLoading(false);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [rawData, pcaResults, pcaCtrl.k, classCol, selectedCols]);

  useEffect(() => {
    if (plotMode === 'raw') {
      let corected = false;
      let newX = xAxis;
      let newY = yAxis;
      
      if (!selectedCols.includes(xAxis)) {
        newX = selectedCols[0] || '';
        corected = true;
      }
      
      if (!selectedCols.includes(yAxis)) {
        newY = selectedCols[1] || selectedCols[0] || '';
        corected = true;
      }

      if (corected) {
        setXAxis(newX);
        setYAxis(newY);
      }
    }
  }, [selectedCols, plotMode, xAxis, yAxis, setXAxis, setYAxis]);

  // only use columns with equal or less than 'maxClassNum' unique values for classification
  const classifiableCols = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    const keys = Object.keys(rawData[0]);
    return keys.filter(key => {
      const uniqueValues = new Set(rawData.map(d => d[key])).size;
      return uniqueValues > 1 && uniqueValues <= maxClassNum;
    });
  }, [rawData, maxClassNum]);

  // generate color with hue in HSL
  const getHSLColor = (index, total) => {
    const hue = (index * 360) / total;
    return `hsl(${hue}, 70%, 55%)`;
  };

  const chartData = useMemo(() => {
    if (!pcaResults) return { datasets: [] };

    const xIdx = pcaResults.pcNames.indexOf(xAxis);
    const yIdx = pcaResults.pcNames.indexOf(yAxis);

    const getPoint = (row, i) => {
      if (plotMode === 'pc') {
        return { x: pcaResults.scores[i][xIdx], y: pcaResults.scores[i][yIdx] };
      }
      const valX = row[xAxis] !== undefined ? Number(row[xAxis]) : 0;
      const valY = row[yAxis] !== undefined ? Number(row[yAxis]) : 0;
      return { x: valX || 0, y: valY || 0 };
    };

    if (classCol === '(none)') {
      return {
        datasets: [{
          label: 'Tất cả dữ liệu',
          data: rawData.map((row, i) => getPoint(row, i)),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          pointRadius: 4,
        }]
      };
    }

    // if classify
    const groups = {};
    const uniqueClasses = [...new Set(rawData.map(d => d[classCol]))];

    uniqueClasses.forEach((className, idx) => {
      const color = getHSLColor(idx, uniqueClasses.length);
      groups[className] = {
        label: String(className),
        data: [],
        backgroundColor: color.replace(')', ', 0.6)').replace('hsl', 'hsla'),
        borderColor: color,
        borderWidth: 1,
        pointRadius: 4,
      };
    });

    rawData.forEach((row, i) => {
      const currentClass = row[classCol];
      if (groups[currentClass]) {
        groups[currentClass].data.push(getPoint(row, i));
      }
    });
    
    return { datasets: Object.values(groups) };
  }, [rawData, pcaResults, plotMode, xAxis, yAxis, classCol]);

  // reset zoom & pan
  const chartRef = useRef(null);
  const handleResetZoom = () => {
    if (chartRef.current) {
      // zoomPlugin function
      chartRef.current.resetZoom();
    }
  };

  return (
    <div className="card-container">
      {(isKnnLoading || knnResults) && (
        <div className={`mb-6 p-4 border rounded-2xl flex items-center gap-6 transition-all ${isKnnLoading ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-100'}`}>
          <div className={`p-3 rounded-xl text-white ${isKnnLoading ? 'bg-slate-400' : 'bg-blue-600'}`}>
            {isKnnLoading ? <Loader2 className="animate-spin" size={24} /> : <Shapes size={24} />}
          </div>
          
          {isKnnLoading ? (
            <div className="animate-pulse">
              <p className="text-sm font-bold text-slate-500">Đang tính k-NN 5-fold cross-validation...</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Độ chính xác trung bình của mô hình k-NN với {selectedCols.length} biến ban đầu</p>
                <p className="text-xl font-bold text-slate-700">{knnResults.rawAccuracy.toFixed(2)}%</p>
              </div>
              <div className="border-l border-blue-200 pl-4">
                <p className="text-[10px] uppercase font-bold text-blue-500 mb-1">Độ chính xác trung bình của mô hình k-NN với {pcaCtrl.k} PC đầu tiên</p>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-blue-600">
                    {knnResults.pcaAccuracy.toFixed(2)}%
                  </span>
                  {knnResults.pcaAccuracy >= knnResults.rawAccuracy ? (
                    <ChevronsUp size={25} className="text-blue-600" />
                  ) : (
                    <ChevronsDown size={25} className="text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="spread-container">
        <div className="flex flex-wrap gap-6 items-end">
          {/* display space */}
          <div>
            <label className="input-controller-title">Không gian</label>
            <div className="h-2"></div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => {setPlotMode('pc'); setXAxis('PC1'); setYAxis('PC2');}} 
                className={`button ${plotMode === 'pc' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >PCA</button>
              <button 
                onClick={() => {setPlotMode('raw'); setXAxis(selectedCols[0]); setYAxis(selectedCols[1]);}} 
                className={`button ${plotMode === 'raw' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >Gốc</button>
            </div>
          </div>

          {/* x axis */}
          <div>
            <label className="input-controller-title">Trục X</label>
            <div className="h-2"></div>
            <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="dropdown">
              {(plotMode === 'pc' ? pcaResults.pcNames : selectedCols).map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {/* y axis */}
          <div>
            <label className="input-controller-title">Trục Y</label>
            <div className="h-2"></div>
            <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="dropdown">
              {(plotMode === 'pc' ? pcaResults.pcNames : selectedCols).map(opt => <option key={opt}>{opt}</option>)}
            </select>
          </div>

          {/* classif column */}
          <div>
            <label className="input-controller-title">Biến phân lớp (tối đa {maxClassNum} lớp)</label>
            <div className="h-2"></div>
            <select 
              value={classCol} 
              onChange={e => setClassCol(e.target.value)} 
              className="dropdown text-blue-600 font-medium"
            >
              <option value="(none)">(không có)</option>
              {classifiableCols.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={handleResetZoom}
          className="button"
        >
          <RotateCcw size={20} />
        </button>
      </div>
      <div className="h-6"></div>
      <div className="h-125 relative">
        <Scatter 
          ref={chartRef}
          data={chartData}
          options={{
            maintainAspectRatio: false,
            scales: {
              x: { 
                title: { display: true, text: xAxis, font: { weight: 'bold' } },
                grid: { color: '#f1f5f9' } 
              },
              y: { 
                title: { display: true, text: yAxis, font: { weight: 'bold' } },
                grid: { color: '#f1f5f9' } 
              },
            },
            animations: false,
            plugins: { 
              legend: { 
                display: classCol !== '(none)', 
                position: 'right',
                labels: { usePointStyle: true, padding: 20 }
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${xAxis}: ${context.parsed.x.toFixed(2)}, ${yAxis}: ${context.parsed.y.toFixed(2)}`
                }
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
  );
};

export default React.memo(ScatterTab);