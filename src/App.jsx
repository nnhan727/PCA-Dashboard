import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { jStat } from 'jstat';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title
} from 'chart.js';
import { 
  LayoutGrid, AlertCircle, Database, ChartScatter
} from 'lucide-react';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';

import Sidebar from './components/Sidebar/Sidebar';
import DataTab from './components/DataTab/DataTab';
import ScreeHeatTab from './components/ScreeHeatTab/ScreeHeatTab';
import ScatterTab from './components/ScatterTab/ScatterTab';
import T2Tab from './components/T2Tab/T2Tab';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title, annotationPlugin, zoomPlugin);

const App = () => {
  const [fileName, setFileName] = useState("");

  const [rawData, setRawData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [maxClassNum, setMaxClassNum] = useState(10);

  const dataCtrl = useMemo(() => ({
    rawData, setRawData,
    columns, setColumns,
    selectedCols, setSelectedCols,
    maxClassNum, setMaxClassNum
  }), [rawData, columns, selectedCols, maxClassNum]);

  const [k, setK] = useState(2);
  const [standardize, setStandardize] = useState(true);
  const [confidence, setConfidence] = useState(0.95);

  const pcaCtrl = useMemo(() => ({
    k, setK,
    standardize, setStandardize,
    confidence, setConfidence
  }), [k, standardize, confidence]);

  const [activeTab, setActiveTab] = useState('data');
  const [plotMode, setPlotMode] = useState('pc'); // 'pc', 'raw'
  const [xAxis, setXAxis] = useState('PC1');
  const [yAxis, setYAxis] = useState('PC2');
  const [classCol, setClassCol] = useState('(none)');

  const viewCtrl = useMemo(() => ({
    activeTab, setActiveTab,
    plotMode, setPlotMode,
    xAxis, setXAxis,
    yAxis, setYAxis,
    classCol, setClassCol
  }), [activeTab, plotMode, xAxis, yAxis, classCol]);
  
  // read input file, remove row with no data
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    // reset states
    setRawData([]);
    setActiveTab('data');
    setPlotMode('pc');
    setXAxis('PC1');
    setYAxis('PC2');
    setClassCol('(none)');
    setStandardize(false);
    setMaxClassNum(10);
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const allKeys = Object.keys(results.data[0]);
        
        // filter numerical variables
        const numeric = allKeys.filter(key => {
          return results.data.slice(0, 5).some(row => typeof row[key] === 'number');
        });

        // remove all rows with null/NaN/empty data
        const cleanedData = results.data.filter(row => {
          return allKeys.every(key => {
            const val = row[key];
            
            // null/undefined
            if (val === null || val === undefined) return false;
            
            // NaN
            if (typeof val === 'number' && isNaN(val)) return false;
            
            // empty string
            if (typeof val === 'string' && val.trim() === "") return false;
            
            return true;
          });
        });

        // update states from new data
        setRawData(cleanedData);
        setColumns(numeric);
        setSelectedCols(numeric);
        
        const defaultK = Math.min(2, numeric.length);
        setK(defaultK);
      },
    });
  };

  const [pcaResults, setPcaResults] = useState(null);
  const [isPcaLoading, setIsPcaLoading] = useState(false);

  useEffect(() => {
    if (rawData.length === 0) {
      setPcaResults(null);
      return;
    }

    setIsPcaLoading(true);

    const worker = new Worker(new URL('./pca.worker.js', import.meta.url), {
      type: 'module'
    });

    worker.postMessage({
      rawData,
      standardize,
      selectedCols
    });

    worker.onmessage = ({ data }) => {
      if (data.error) {
        console.error("PCA Worker Error:", data.error);
      } else {
        setPcaResults(data);
      }
      setIsPcaLoading(false);
      worker.terminate();
    };

    return () => worker.terminate();
  }, [rawData, selectedCols, standardize]);
  
  // calculate T2 stats
  const t2Stats = useMemo(() => {
    if (!pcaResults) return null;

    const { scores, eigenvalues } = pcaResults;
    const p = eigenvalues.length;

    // Mahalanobis distance to center in main space
    const hotellingT2 = scores.map(row => {
      let sum = 0;
      for (let i = 0; i < k; i++) sum += (row[i] ** 2) / (eigenvalues[i] + 1e-12);
      return sum;
    });

    // Mahalanobis distance to center in residual space
    const residualT2 = scores.map(row => {
      let sum = 0;
      for (let i = k; i < p; i++) sum += (row[i] ** 2) / (eigenvalues[i] + 1e-12);
      return sum;
    });

    return {
      hotellingT2,
      residualT2,
      uclH: jStat.chisquare.inv(confidence, k),
      uclR: p - k > 0 ? jStat.chisquare.inv(confidence, p - k) : 0,
    };
  }, [pcaResults, k, confidence]);

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-700 font-sans">
      {/* SIDEBAR */}
      <Sidebar 
        dataCtrl={dataCtrl}
        pcaCtrl={pcaCtrl}
        handleFileUpload={handleFileUpload}
        fileName={fileName}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* no data */}
        {rawData.length === 0 && !isPcaLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="bg-white p-8 rounded-full shadow-sm border border-slate-100">
              <Database size={64} className="text-slate-200" />
            </div>
            <p className="text-lg font-medium text-slate-400">Chưa có dữ liệu để phân tích</p>
            <p className="text-sm">Hãy tải lên một tệp CSV từ thanh bên trái</p>
          </div>
        )}

        {/* calculate PCA */}
        {isPcaLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">Đang tính toán PCA...</p>
            </div>
          </div>
        )}

        {/* show results */}
        {!isPcaLoading && pcaResults && (
          <>
            {/* TABS NAVIGATION */}
            <header className="bg-white border-b border-slate-200 px-8 pt-6 flex-none">
              <div className="flex gap-8">
                {[
                  { id: 'data', label: 'Dữ liệu', icon: <Database size={18}/> },
                  { id: 'scree', label: 'Scree Plot', icon: <LayoutGrid size={18}/> },
                  { id: 'scatter', label: 'Scatter Plot', icon: <ChartScatter size={18}/> },
                  { id: 'stats', label: 'Hotelling\'s & Residual T²', icon: <AlertCircle size={18}/> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all border-b-2 ${
                      activeTab === tab.id 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className={activeTab === 'data' ? 'block' : 'hidden'}>
                <DataTab dataCtrl={dataCtrl} />
              </div>

              <div className={activeTab === 'scree' ? 'block' : 'hidden'}>
                <ScreeHeatTab
                  pcaResults={pcaResults}
                  dataCtrl={dataCtrl}
                  pcaCtrl={pcaCtrl}
                  selectedCols={selectedCols}
                />
              </div>

              <div className={activeTab === 'scatter' ? 'block' : 'hidden'}>
                <ScatterTab
                  pcaResults={pcaResults}
                  dataCtrl={dataCtrl}
                  pcaCtrl={pcaCtrl}
                  viewCtrl={viewCtrl}
                />
              </div>

              <div className={activeTab === 'stats' ? 'block' : 'hidden'}>
                <T2Tab
                  t2Stats={t2Stats}
                  rawData={rawData}
                  selectedCols={selectedCols}
                  k={k}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;