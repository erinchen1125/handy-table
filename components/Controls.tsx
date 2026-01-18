import React, { useState } from 'react';
import { TableConfig, GenerateStatus } from '../types';

interface ControlsProps {
  config: TableConfig;
  setConfig: React.Dispatch<React.SetStateAction<TableConfig>>;
  onGenerate: (prompt: string) => void;
  onReset: () => void;
  onSave: () => void;
  status: GenerateStatus;
}

const Controls: React.FC<ControlsProps> = ({ config, setConfig, onGenerate, onReset, onSave, status }) => {
  const [prompt, setPrompt] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleChange = (key: keyof TableConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveClick = () => {
    onSave();
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full overflow-y-auto font-sans">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 font-['Patrick_Hand']">
          <span className="text-2xl">✏️</span> HandyTable
        </h2>
        <p className="text-sm text-gray-500 mt-1">手绘风格表格制作工具</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Persistence Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">💾 存储与同步</label>
          <div className="flex gap-2">
            <button
              onClick={handleSaveClick}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2
                ${saveFeedback ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'}`}
            >
              {saveFeedback ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  已保存
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  保存数据
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="py-2 px-3 rounded-lg text-gray-600 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
              title="重置所有内容"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* AI Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">✨ AI 表格生成</label>
          <div className="relative">
            <textarea
              className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-gray-50"
              rows={3}
              placeholder="例如：'一周健身计划' 或 '咖啡种类对比表格'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={status === GenerateStatus.LOADING}
            />
          </div>
          <button
            onClick={() => onGenerate(prompt)}
            disabled={status === GenerateStatus.LOADING || !prompt.trim()}
            className={`w-full py-2 px-4 rounded-lg text-white text-sm font-medium transition-all shadow-sm
              ${status === GenerateStatus.LOADING 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}
          >
            {status === GenerateStatus.LOADING ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                生成中...
              </span>
            ) : '智能生成表格'}
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Style Controls */}
        <div className="space-y-6">
           <h3 className="text-sm font-semibold text-gray-700">🎨 风格设置</h3>
           
            {/* Width Scale */}
           <div className="space-y-2">
             <div className="flex justify-between text-xs text-gray-500">
                <label>整体宽度</label>
                <span>{config.widthScale}x</span>
             </div>
             <input 
               type="range" min="0.5" max="3" step="0.1"
               value={config.widthScale}
               onChange={(e) => handleChange('widthScale', parseFloat(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
           </div>

           {/* Roughness */}
           <div className="space-y-2">
             <div className="flex justify-between text-xs text-gray-500">
                <label>手绘粗糙度</label>
                <span>{config.roughness}</span>
             </div>
             <input 
               type="range" min="0" max="3" step="0.1"
               value={config.roughness}
               onChange={(e) => handleChange('roughness', parseFloat(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
           </div>

           {/* Bowing */}
           <div className="space-y-2">
             <div className="flex justify-between text-xs text-gray-500">
                <label>线条弯曲度</label>
                <span>{config.bowing}</span>
             </div>
             <input 
               type="range" min="0" max="5" step="0.1"
               value={config.bowing}
               onChange={(e) => handleChange('bowing', parseFloat(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
           </div>

            {/* Stroke Width */}
           <div className="space-y-2">
             <div className="flex justify-between text-xs text-gray-500">
                <label>线条粗细</label>
                <span>{config.strokeWidth}px</span>
             </div>
             <input 
               type="range" min="0.5" max="5" step="0.5"
               value={config.strokeWidth}
               onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
           </div>

           {/* Colors */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">线条颜色</label>
                <div className="flex items-center gap-2">
                   <input 
                    type="color" 
                    value={config.stroke}
                    onChange={(e) => handleChange('stroke', e.target.value)}
                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                   />
                   <span className="text-xs text-gray-400 font-mono uppercase">{config.stroke}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-gray-500">文字颜色</label>
                <div className="flex items-center gap-2">
                   <input 
                    type="color" 
                    value={config.textColor}
                    onChange={(e) => handleChange('textColor', e.target.value)}
                    className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
                   />
                    <span className="text-xs text-gray-400 font-mono uppercase">{config.textColor}</span>
                </div>
              </div>
           </div>
           
           <div className="space-y-2">
               <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={config.fill === 'hachure'}
                    onChange={(e) => handleChange('fill', e.target.checked ? 'hachure' : 'none')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">表头高亮</span>
               </label>
                {config.fill === 'hachure' && (
                    <div className="flex items-center gap-2 ml-6">
                        <input 
                            type="color" 
                            value={config.fillColor}
                            onChange={(e) => handleChange('fillColor', e.target.value)}
                            className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-400">填充颜色</span>
                    </div>
                )}
           </div>

        </div>
      </div>
      
      <div className="mt-auto p-4 text-center text-xs text-gray-400 border-t border-gray-100">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default Controls;