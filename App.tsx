import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import HandDrawnTable from './components/HandDrawnTable';
import DataEditor from './components/DataEditor';
import { TableConfig, TableData, GenerateStatus } from './types';
import { generateTableData } from './services/geminiService';

const STORAGE_KEY_DATA = 'handy_table_data_v1';
const STORAGE_KEY_CONFIG = 'handy_table_config_v1';

const DEFAULT_CONFIG: TableConfig = {
  roughness: 1.5,
  bowing: 1.2,
  stroke: '#2d3748', // Gray 800
  strokeWidth: 2,
  padding: 10,
  textColor: '#1a202c', // Gray 900
  fill: 'hachure',
  fillColor: '#60a5fa', // Blue 400
  widthScale: 1.0,
  customColumnWidths: {},
  customRowHeights: {}
};

const DEFAULT_DATA: TableData = [
  [
      { id: '1', value: "Feature", rowSpan: 1, colSpan: 1 },
      { id: '2', value: "Basic", rowSpan: 1, colSpan: 1 }, 
      { id: '3', value: "Pro", rowSpan: 1, colSpan: 1 }
  ],
  [
      { id: '4', value: "Users", rowSpan: 1, colSpan: 1 }, 
      { id: '5', value: "1", rowSpan: 1, colSpan: 1 }, 
      { id: '6', value: "Unlimited", rowSpan: 1, colSpan: 1 }
  ],
  [
      { id: '7', value: "Storage", rowSpan: 1, colSpan: 1 }, 
      { id: '8', value: "5GB", rowSpan: 1, colSpan: 1 }, 
      { id: '9', value: "1TB", rowSpan: 1, colSpan: 1 }
  ],
  [
      { id: '10', value: "Support", rowSpan: 1, colSpan: 1 }, 
      { id: '11', value: "Email", rowSpan: 1, colSpan: 1 }, 
      { id: '12', value: "24/7 Live", rowSpan: 1, colSpan: 1 }
  ]
];

export default function App() {
  // Initialize from localStorage if available
  const [config, setConfig] = useState<TableConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  
  const [data, setData] = useState<TableData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved) : DEFAULT_DATA;
  });

  const [status, setStatus] = useState<GenerateStatus>(GenerateStatus.IDLE);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');

  // Sync with localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  }, [config]);

  const handleGenerate = async (prompt: string) => {
    setStatus(GenerateStatus.LOADING);
    try {
      const generatedData = await generateTableData(prompt);
      setData(generatedData);
      setStatus(GenerateStatus.SUCCESS);
      setActiveTab('preview');
    } catch (error) {
      console.error(error);
      setStatus(GenerateStatus.ERROR);
      alert("Failed to generate table. Please try again.");
    } finally {
      setTimeout(() => setStatus(GenerateStatus.IDLE), 1000);
    }
  };

  const handleReset = () => {
    if (window.confirm("确定要重置所有数据和设置吗？保存的内容将被清除。")) {
      setData(DEFAULT_DATA);
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_CONFIG);
    }
  };

  const handleSaveManually = () => {
    // Already synced via useEffect, but provide feedback as requested
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Controls 
        config={config} 
        setConfig={setConfig} 
        onGenerate={handleGenerate} 
        onReset={handleReset}
        onSave={handleSaveManually}
        status={status}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
           <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                👁️ 预览效果
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                📝 编辑数据
              </button>
           </div>
           
           <div className="hidden md:block text-xs text-green-600 font-medium">
             ✓ 数据已自动保存至浏览器
           </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-5xl mx-auto h-full flex flex-col">
            {activeTab === 'preview' ? (
              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                 <HandDrawnTable data={data} config={config} />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col h-[calc(100vh-140px)]">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">编辑表格数据</h3>
                <div className="flex-1 overflow-hidden">
                    <DataEditor 
                        data={data} 
                        setData={setData} 
                        config={config} 
                        setConfig={setConfig} 
                    />
                </div>
              </div>
            )}
            
            {activeTab === 'preview' && (
              <div className="mt-6 text-center text-gray-400 text-sm font-['Patrick_Hand']">
                "Imperfection is beauty, madness is genius..."
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}