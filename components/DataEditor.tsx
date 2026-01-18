import React, { useState, useEffect } from 'react';
import { TableData, TableConfig } from '../types';

interface DataEditorProps {
  data: TableData;
  setData: React.Dispatch<React.SetStateAction<TableData>>;
  config: TableConfig;
  setConfig: React.Dispatch<React.SetStateAction<TableConfig>>;
}

interface Selection {
  start: { r: number; c: number };
  end: { r: number; c: number };
}

interface ResizeState {
  type: 'col' | 'row';
  index: number;
  startPos: number;
  startSize: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const DataEditor: React.FC<DataEditorProps> = ({ data, setData, config, setConfig }) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [resizing, setResizing] = useState<ResizeState | null>(null);

  // Global resize handlers
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (resizing.type === 'col') {
        const diff = e.clientX - resizing.startPos;
        const newWidth = Math.max(50, resizing.startSize + diff);
        setConfig(prev => ({
          ...prev,
          customColumnWidths: { ...prev.customColumnWidths, [resizing.index]: newWidth }
        }));
      } else {
        const diff = e.clientY - resizing.startPos;
        const newHeight = Math.max(30, resizing.startSize + diff);
        setConfig(prev => ({
          ...prev,
          customRowHeights: { ...prev.customRowHeights, [resizing.index]: newHeight }
        }));
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = resizing.type === 'col' ? 'col-resize' : 'row-resize';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [resizing, setConfig]);

  // Helper to get normalized selection range
  const getRange = () => {
    if (!selection) return null;
    const minR = Math.min(selection.start.r, selection.end.r);
    const maxR = Math.max(selection.start.r, selection.end.r);
    const minC = Math.min(selection.start.c, selection.end.c);
    const maxC = Math.max(selection.start.c, selection.end.c);
    return { minR, maxR, minC, maxC };
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    const cell = { ...newData[rowIndex][colIndex], value };
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = cell;
    setData(newData);
  };

  const addRow = () => {
    if (data.length === 0) {
      setData([[{ id: generateId(), value: "New Cell", rowSpan: 1, colSpan: 1 }]]);
      return;
    }
    const colCount = data[0].length;
    const newRow = Array.from({ length: colCount }).map(() => ({
      id: generateId(),
      value: "",
      rowSpan: 1,
      colSpan: 1
    }));
    setData([...data, newRow]);
  };

  const addCol = () => {
    if (data.length === 0) {
      setData([[{ id: generateId(), value: "New Cell", rowSpan: 1, colSpan: 1 }]]);
      return;
    }
    const newData = data.map(row => [
      ...row, 
      { id: generateId(), value: "", rowSpan: 1, colSpan: 1 }
    ]);
    setData(newData);
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
    
    // Adjust row height indices
    const newHeights: Record<number, number> = {};
    Object.keys(config.customRowHeights || {}).forEach(key => {
        const k = parseInt(key);
        if (k < index) newHeights[k] = config.customRowHeights[k];
        if (k > index) newHeights[k - 1] = config.customRowHeights[k];
    });
    setConfig(prev => ({ ...prev, customRowHeights: newHeights }));
    setSelection(null);
  };

  const removeCol = (index: number) => {
    const newData = data.map(row => row.filter((_, i) => i !== index));
    if (newData.length === 0 || newData[0].length === 0) {
        setData([]);
    } else {
        setData(newData);
    }
    
    // Adjust column width indices
    const shiftedWidths: Record<number, number> = {};
    Object.keys(config.customColumnWidths).forEach(key => {
        const k = parseInt(key);
        if (k < index) shiftedWidths[k] = config.customColumnWidths[k];
        if (k > index) shiftedWidths[k - 1] = config.customColumnWidths[k];
    });
    setConfig(prev => ({ ...prev, customColumnWidths: shiftedWidths }));
    setSelection(null);
  };

  // Selection Logic
  const handleMouseDown = (r: number, c: number) => {
    setSelection({ start: { r, c }, end: { r, c } });
    setIsSelecting(true);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isSelecting && selection) {
      setSelection({ ...selection, end: { r, c } });
    }
  };

  // Stop selecting on mouse up globally
  useEffect(() => {
    const endSelect = () => setIsSelecting(false);
    window.addEventListener('mouseup', endSelect);
    return () => window.removeEventListener('mouseup', endSelect);
  }, []);

  const isSelected = (r: number, c: number) => {
    if (!selection) return false;
    const { minR, maxR, minC, maxC } = getRange()!;
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const mergeCells = () => {
    const range = getRange();
    if (!range) return;
    const { minR, maxR, minC, maxC } = range;
    if (minR === maxR && minC === maxC) return;

    const newData = data.map(row => row.map(cell => ({ ...cell })));
    let combinedValue = "";
    for(let r = minR; r <= maxR; r++) {
      for(let c = minC; c <= maxC; c++) {
        if (!newData[r][c].hidden && newData[r][c].value) {
            combinedValue += (combinedValue ? "\n" : "") + newData[r][c].value;
        }
      }
    }

    const master = newData[minR][minC];
    master.value = combinedValue;
    master.rowSpan = maxR - minR + 1;
    master.colSpan = maxC - minC + 1;
    master.hidden = false;
    delete master.ownerRow;
    delete master.ownerCol;

    for(let r = minR; r <= maxR; r++) {
      for(let c = minC; c <= maxC; c++) {
        if (r === minR && c === minC) continue;
        newData[r][c].hidden = true;
        newData[r][c].rowSpan = 1;
        newData[r][c].colSpan = 1;
        newData[r][c].ownerRow = minR;
        newData[r][c].ownerCol = minC;
        newData[r][c].value = "";
      }
    }
    setData(newData);
    setSelection({ start: { r: minR, c: minC }, end: { r: minR, c: minC } });
  };

  const unmergeCells = () => {
    const range = getRange();
    if (!range) return;
    const { minR, minC } = range;
    const cell = data[minR][minC];
    if (cell.rowSpan === 1 && cell.colSpan === 1) return;

    const newData = data.map(row => row.map(c => ({ ...c })));
    const rSpan = cell.rowSpan;
    const cSpan = cell.colSpan;

    newData[minR][minC].rowSpan = 1;
    newData[minR][minC].colSpan = 1;

    for(let r = minR; r < minR + rSpan; r++) {
      for(let c = minC; c < minC + cSpan; c++) {
         if (r === minR && c === minC) continue;
         newData[r][c].hidden = false;
         delete newData[r][c].ownerRow;
         delete newData[r][c].ownerCol;
      }
    }
    setData(newData);
  };

  const canMerge = () => {
    const range = getRange();
    if (!range) return false;
    return (range.maxR > range.minR || range.maxC > range.minC);
  };

  const canUnmerge = () => {
    const range = getRange();
    if (!range) return false;
    if (range.minR !== range.maxR || range.minC !== range.maxC) return false;
    const cell = data[range.minR][range.minC];
    return cell.rowSpan > 1 || cell.colSpan > 1;
  };

  if (data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Table is empty</p>
              <button 
                onClick={() => setData([[{ id: generateId(), value: "New Cell", rowSpan: 1, colSpan: 1 }]])}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                  Initialize Table
              </button>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-white font-sans">
        {/* Toolbar */}
        <div className="flex gap-2 mb-4 pb-2 border-b border-gray-100 flex-wrap items-center">
             <button onClick={addRow} className="btn-toolbar">+ Row</button>
             <button onClick={addCol} className="btn-toolbar">+ Col</button>
             <div className="w-px h-5 bg-gray-200 mx-2"></div>
             <button 
                onClick={mergeCells}
                disabled={!canMerge()}
                className={`btn-toolbar ${!canMerge() ? 'opacity-50 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
            >
                Merge
            </button>
            <button 
                onClick={unmergeCells}
                disabled={!canUnmerge()}
                className={`btn-toolbar ${!canUnmerge() ? 'opacity-50 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
            >
                Unmerge
            </button>
        </div>

      <div className="overflow-auto flex-1 select-none border border-gray-300 rounded-sm">
        <table className="min-w-full divide-gray-200 border-collapse">
          <thead>
            <tr>
               {/* Top-Left Corner */}
               <th className="w-10 bg-gray-100 border-r border-b border-gray-300 sticky left-0 top-0 z-30"></th>
               
               {/* Column Headers */}
               {data[0].map((_, colIndex) => (
                   <th key={`head-${colIndex}`} 
                       className="relative bg-gray-100 border-b border-r border-gray-300 h-8 min-w-[50px] sticky top-0 z-20 group text-center select-none"
                       style={{ width: config.customColumnWidths?.[colIndex] || 120 }}
                   >
                       <span className="text-xs font-semibold text-gray-500 block py-1">
                           {String.fromCharCode(65 + colIndex)}
                       </span>
                       
                       {/* Delete Button (Hover) */}
                       <button 
                           onClick={() => removeCol(colIndex)}
                           className="absolute top-1 right-2 hidden group-hover:block text-[10px] text-gray-400 hover:text-red-500 bg-gray-100 rounded px-1"
                           title="Delete Column"
                       >
                           ✕
                       </button>

                       {/* Resize Handle */}
                       <div 
                           className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-400 z-30 transition-colors opacity-0 hover:opacity-100"
                           onMouseDown={(e) => {
                               const w = config.customColumnWidths?.[colIndex] ?? 120;
                               setResizing({ type: 'col', index: colIndex, startPos: e.clientX, startSize: w });
                           }}
                       />
                   </th>
               ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row Header */}
                <td className="relative w-10 bg-gray-100 border-r border-b border-gray-300 sticky left-0 z-10 text-center group">
                    <span className="text-xs font-semibold text-gray-500">{rowIndex + 1}</span>
                    
                     {/* Delete Button (Hover) */}
                     <button 
                        onClick={() => removeRow(rowIndex)}
                        className="absolute left-1 top-1 hidden group-hover:block text-[10px] text-gray-400 hover:text-red-500 bg-gray-100 rounded px-1"
                        title="Delete Row"
                    >
                        ✕
                    </button>

                    {/* Resize Handle */}
                    <div 
                        className="absolute bottom-0 left-0 w-full h-1.5 cursor-row-resize hover:bg-blue-400 z-30 transition-colors opacity-0 hover:opacity-100"
                        onMouseDown={(e) => {
                            const h = config.customRowHeights?.[rowIndex] ?? 50;
                            setResizing({ type: 'row', index: rowIndex, startPos: e.clientY, startSize: h });
                        }}
                    />
                </td>

                {/* Data Cells */}
                {row.map((cell, colIndex) => {
                  if (cell.hidden) return null;
                  const selected = isSelected(rowIndex, colIndex);
                  
                  return (
                    <td 
                        key={cell.id} 
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={`
                            relative p-0 border-r border-b border-gray-200 
                            ${selected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-0' : 'bg-white hover:bg-gray-50'}
                        `}
                        onMouseDown={(e) => {
                            if (e.button === 0) handleMouseDown(rowIndex, colIndex);
                        }}
                        onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                    >
                      <div className="relative w-full h-full">
                         <textarea
                            value={cell.value}
                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                            className={`
                                block w-full bg-transparent border-none focus:outline-none resize-none px-2 py-1 text-sm text-gray-800 leading-tight
                                ${rowIndex === 0 ? 'font-semibold' : ''}
                            `}
                            style={{
                                height: `${config.customRowHeights?.[rowIndex] ?? 50}px`,
                                minHeight: '30px'
                            }}
                          />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .btn-toolbar {
            @apply px-3 py-1 text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded hover:bg-white hover:shadow-sm transition-all;
        }
      `}</style>
    </div>
  );
};

export default DataEditor;