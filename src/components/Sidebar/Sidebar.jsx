import React from 'react';
import { useEffect, useState } from 'react';
import { ChevronRight, Upload, Database } from 'lucide-react';

import '../element-style.css';
import '../input-controller-style.css';

const SidebarSection = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
      <ChevronRight size={14} /> {title}
    </h3>
    {children}
  </div>
);

const Sidebar = ({ dataCtrl, pcaCtrl, handleFileUpload, fileName }) => {
  const { columns, selectedCols, setSelectedCols, maxClassNum, setMaxClassNum } = dataCtrl;
  const { k, setK, standardize, setStandardize, confidence, setConfidence } = pcaCtrl;

  const [tempMaxClassNum, setTempMaxClassNum] = useState(maxClassNum);
    useEffect(() => {
      setTempMaxClassNum(maxClassNum);
    }, [maxClassNum]);
  
  const [tempK, setTempK] = useState(k);
  useEffect(() => {
    setTempK(k);
  }, [k]);

  const [tempConf, setTempConf] = useState(confidence);
  useEffect(() => {
    setTempConf(confidence);
  }, [confidence]);

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3 text-blue-600">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Phân tích thành phần chính</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <SidebarSection title="Dữ liệu đầu vào">
          {!fileName ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Kéo thả hoặc nhấn để chọn file CSV</p>
              </div>
              <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white">
                    <Database size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-400 font-bold uppercase">Đang mở file</p>
                    <p className="text-sm font-semibold text-slate-700 truncate">{fileName}</p>
                  </div>
                </div>
                <label className="block w-full text-center py-2 bg-white border border-blue-200 text-blue-600 text-xs font-bold rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                  Thay đổi file
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv" />
                </label>
              </div>

              {/* max number of classes */}
              <div>
                <div className="flex items-center gap-3 justify-between p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">
                  <label className="input-controller-title">Số lớp tối đa</label>
                  <span className="font-bold text-blue-600">{tempMaxClassNum}</span>
                </div>
                <input 
                  type="range" min="2" max="20" step="1" value={tempMaxClassNum}
                  onChange={e => setTempMaxClassNum(parseFloat(e.target.value))}
                  onMouseUp={e => setMaxClassNum(parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
            </div>
          )}
        </SidebarSection>

        {columns.length > 0 && (
          <>
            <SidebarSection title="Cấu hình PCA">
              <div className="space-y-4">
                <div className="flex items-center gap-3 justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors text-sm">
                  <label className="input-controller-title">Chuẩn hóa (Z-score)</label>
                  <input
                    type="checkbox" checked={standardize} 
                    onChange={e => setStandardize(e.target.checked)}
                    className="tickbox"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-3 justify-between p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">
                    <label className="input-controller-title">Số thành phần chính</label>
                    <span className="font-bold text-blue-600">{tempK}</span>
                  </div>
                  <input 
                    type="range" min="1" max={selectedCols.length} value={tempK}
                    onChange={e => setTempK(parseInt(e.target.value))}
                    onMouseUp={e => setK(parseInt(e.target.value))}
                    className="slider"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-3 justify-between p-2 hover:bg-slate-50 rounded-md transition-colors text-sm">
                    <label className="input-controller-title">Độ tin cậy</label>
                    <span className="font-bold text-blue-600">{(tempConf * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" min="0.80" max="0.99" step="0.01" value={tempConf}
                    onChange={e => setTempConf(parseFloat(e.target.value))}
                    onMouseUp={e => setConfidence(parseFloat(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
            </SidebarSection>

            <SidebarSection title="Chọn biến phân tích">
              <div className="grid grid-cols-1 gap-2 max-h-60 pr-2">
                {columns.map(col => (
                  <label key={col} className="flex items-center gap-3 justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors text-sm">
                    <span className="truncate">{col}</span>
                    <input 
                      type="checkbox" checked={selectedCols.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedCols(columns.filter(item => selectedCols.includes(item) || item === col));
                        else setSelectedCols(selectedCols.filter(c => c !== col));
                      }}
                      className="tickbox"
                    />
                  </label>
                ))}
              </div>
            </SidebarSection>
          </>
        )}
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);