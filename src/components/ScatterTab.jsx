import React, { useMemo } from 'react';
import { Scatter } from 'react-chartjs-2';

const ScatterTab = ({ pcaResults, dataCtrl, viewCtrl }) => {
  const { rawData, selectedCols } = dataCtrl;
  const { plotMode, setPlotMode, xAxis, setXAxis, yAxis, setYAxis, classCol, setClassCol } = viewCtrl;

  React.useEffect(() => {
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

  // only use columns with less than 15 unique values for classification
  const classifiableCols = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    const keys = Object.keys(rawData[0]);
    return keys.filter(key => {
      const uniqueValues = new Set(rawData.map(d => d[key])).size;
      return uniqueValues > 1 && uniqueValues < 15;
    });
  }, [rawData]);

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

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-wrap gap-6 mb-8 items-end">
        {/* display space */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2">Không gian</label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => {setPlotMode('pc'); setXAxis('PC1'); setYAxis('PC2');}} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${plotMode === 'pc' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >PCA</button>
            <button 
              onClick={() => {setPlotMode('raw'); setXAxis(selectedCols[0]); setYAxis(selectedCols[1]);}} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${plotMode === 'raw' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
            >Gốc</button>
          </div>
        </div>

        {/* x axis */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2">Trục X</label>
          <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {(plotMode === 'pc' ? pcaResults.pcNames : selectedCols).map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>

        {/* y axis */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2">Trục Y</label>
          <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {(plotMode === 'pc' ? pcaResults.pcNames : selectedCols).map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>

        {/* classif column */}
        <div>
          <label className="block text-xs font-bold uppercase mb-2">Biến phân lớp</label>
          <select 
            value={classCol} 
            onChange={e => setClassCol(e.target.value)} 
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-blue-600 font-medium"
          >
            <option value="(none)">(không có)</option>
            {classifiableCols.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>
      </div>

      <div className="h-125 relative">
        <Scatter 
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
                  label: (context) => `Index: ${context.dataIndex} | ${xAxis}: ${context.parsed.x.toFixed(2)}, ${yAxis}: ${context.parsed.y.toFixed(2)}`
                }
              }
            }
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(ScatterTab);