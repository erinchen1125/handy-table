import React, { useMemo, useRef } from 'react';
import { TableData, TableConfig } from '../types';
import { getRoughPath } from '../utils/sketchUtils';

interface HandDrawnTableProps {
  data: TableData;
  config: TableConfig;
}

// Helper for rough text wrapping measurement
const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  if (!text) return [];
  
  // Split by explicit newlines first to respect user formatting
  const paragraphs = text.split('\n');
  const finalLines: string[] = [];

  // Rough estimation: average char width ~ 0.55 * fontSize for Patrick Hand
  const charWidth = fontSize * 0.55; 

  paragraphs.forEach(paragraph => {
    // If paragraph is empty (double newline), add a spacer line
    if (!paragraph) {
        finalLines.push(' ');
        return;
    }

    const words = paragraph.split(' ');
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = (currentLine.length + 1 + word.length) * charWidth;
        if (width < maxWidth) {
        currentLine += ' ' + word;
        } else {
        finalLines.push(currentLine);
        currentLine = word;
        }
    }
    finalLines.push(currentLine);
  });
  
  return finalLines;
};

const HandDrawnTable: React.FC<HandDrawnTableProps> = ({ data, config }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const baseCellWidth = 120;
  const baseLineHeight = 24; // Height per line of text
  const basePadding = config.padding;
  
  // Calculate column widths
  const colWidths = useMemo(() => {
    if (data.length === 0) return [];
    
    // Auto widths based on content length (single line assumption for base width)
    const autoWidths = new Array(data[0].length).fill(baseCellWidth);
    
    data.forEach(row => {
      row.forEach((cell, i) => {
        if (cell.colSpan === 1 && !cell.hidden) {
             // Heuristic: Ensure enough width for at least reasonably long words
             // We split by newline to find the widest single segment
             const maxSegmentLen = Math.max(...cell.value.split('\n').map(s => s.length));
             const estimated = Math.min(250, Math.max(baseCellWidth, (maxSegmentLen * 9)));
             autoWidths[i] = Math.max(autoWidths[i], estimated);
        }
      });
    });

    return autoWidths.map((w, i) => {
        const custom = config.customColumnWidths?.[i];
        const base = custom !== undefined ? custom : w;
        return base * (config.widthScale || 1);
    });
  }, [data, config.customColumnWidths, config.widthScale]);

  // Calculate Row Heights considering text wrapping
  const rowHeights = useMemo(() => {
    return data.map((row, rowIndex) => {
        // If custom height exists, use it
        if (config.customRowHeights?.[rowIndex]) {
            return config.customRowHeights[rowIndex];
        }

        // Otherwise calculate based on wrapped text content of 1-span cells
        let maxLines = 1;
        const fontSize = rowIndex === 0 ? 20 : 16;

        row.forEach((cell, colIndex) => {
            if (cell.hidden || cell.rowSpan > 1) return; // Ignore multi-row cells for auto-height of this single row
            
            // Calculate effective width for this cell
            let cellWidth = colWidths[colIndex];
            if (cell.colSpan > 1) {
                // Sum widths of spanned columns
                for(let k=1; k < cell.colSpan; k++) {
                    cellWidth += colWidths[colIndex + k];
                }
            }
            // Subtract padding
            const contentWidth = Math.max(0, cellWidth - (basePadding * 2));
            const lines = wrapText(cell.value, contentWidth, fontSize);
            maxLines = Math.max(maxLines, lines.length);
        });

        const calculatedHeight = (maxLines * (fontSize * 1.4)) + (basePadding * 2);
        return Math.max(50, calculatedHeight);
    });
  }, [data, colWidths, config.customRowHeights, basePadding]);

  // Pre-calculate X and Y positions
  const xPositions = useMemo(() => {
      const pos = [0];
      colWidths.forEach(w => pos.push(pos[pos.length - 1] + w));
      return pos;
  }, [colWidths]);

  const yPositions = useMemo(() => {
      const pos = [0];
      rowHeights.forEach(h => pos.push(pos[pos.length - 1] + h));
      return pos;
  }, [rowHeights]);

  const totalWidth = xPositions[xPositions.length - 1];
  const totalHeight = yPositions[yPositions.length - 1];

  // Helper to find effective cell at coords
  const getCellAt = (r: number, c: number) => {
      if (r < 0 || r >= data.length || c < 0 || c >= data[0].length) return null;
      const cell = data[r][c];
      if (!cell.hidden) return { ...cell, r, c };
      // Resolve owner
      const ownerR = cell.ownerRow ?? r;
      const ownerC = cell.ownerCol ?? c;
      return { ...data[ownerR][ownerC], r: ownerR, c: ownerC };
  };

  // Generate paths for grid lines
  const paths = useMemo(() => {
    const lines: React.ReactElement[] = [];
    const rowCount = data.length;
    const colCount = data[0]?.length || 0;

    // Horizontal segments
    for (let r = 0; r <= rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
            let shouldDraw = false;
            if (r === 0 || r === rowCount) {
                shouldDraw = true;
            } else {
                const cellAbove = getCellAt(r - 1, c);
                if (cellAbove && (cellAbove.r + cellAbove.rowSpan) > r) {
                    shouldDraw = false; // Inside a merge
                } else {
                    shouldDraw = true;
                }
            }

            if (shouldDraw) {
                const x1 = xPositions[c];
                const x2 = xPositions[c + 1];
                const y = yPositions[r];
                const p1 = getRoughPath(x1, y, x2, y, config.roughness, config.bowing);
                lines.push(<path key={`h-${r}-${c}`} d={p1} stroke={config.stroke} strokeWidth={config.strokeWidth} fill="none" />);
                if (config.roughness > 0.5) {
                    const p2 = getRoughPath(x1, y, x2, y, config.roughness, config.bowing);
                    lines.push(<path key={`h-${r}-${c}-d`} d={p2} stroke={config.stroke} strokeWidth={config.strokeWidth * 0.5} fill="none" opacity="0.6" />);
                }
            }
        }
    }

    // Vertical segments
    for (let c = 0; c <= colCount; c++) {
        for (let r = 0; r < rowCount; r++) {
            let shouldDraw = false;
            if (c === 0 || c === colCount) {
                shouldDraw = true;
            } else {
                const cellLeft = getCellAt(r, c - 1);
                if (cellLeft && (cellLeft.c + cellLeft.colSpan) > c) {
                    shouldDraw = false;
                } else {
                    shouldDraw = true;
                }
            }

            if (shouldDraw) {
                const x = xPositions[c];
                const y1 = yPositions[r];
                const y2 = yPositions[r + 1];
                const p1 = getRoughPath(x, y1, x, y2, config.roughness, config.bowing);
                lines.push(<path key={`v-${c}-${r}`} d={p1} stroke={config.stroke} strokeWidth={config.strokeWidth} fill="none" />);
                 if (config.roughness > 0.5) {
                    const p2 = getRoughPath(x, y1, x, y2, config.roughness, config.bowing);
                    lines.push(<path key={`v-${c}-${r}-d`} d={p2} stroke={config.stroke} strokeWidth={config.strokeWidth * 0.5} fill="none" opacity="0.6" />);
                }
            }
        }
    }
    
    return lines;
  }, [data, xPositions, yPositions, config, totalWidth, totalHeight]);

  // Generate Text Elements with wrapping
  const textElements = useMemo(() => {
    const elements: React.ReactElement[] = [];
    
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.hidden) return;

        const x = xPositions[colIndex];
        const y = yPositions[rowIndex];
        const w = xPositions[colIndex + cell.colSpan] - x;
        const h = yPositions[rowIndex + cell.rowSpan] - y;
        
        const fontSize = rowIndex === 0 ? 20 : 16;
        const lines = wrapText(cell.value, w - (basePadding * 2), fontSize);
        const lineHeight = fontSize * 1.4;
        const totalTextHeight = lines.length * lineHeight;

        const startY = y + (h - totalTextHeight) / 2 + (lineHeight * 0.6); // Center vertical approx

        // We'll apply individual roughness to each line for a more organic look
        const textRoughness = config.roughness * 2;
        
        // Base random jitter for the whole block
        const blockTx = (Math.random() - 0.5) * textRoughness * 0.5;
        const blockTy = (Math.random() - 0.5) * textRoughness * 0.5;

        elements.push(
          <text 
            key={cell.id}
            x={x + w/2 + blockTx} 
            y={startY + blockTy} 
            textAnchor="middle" 
            fill={config.textColor}
            style={{ 
              fontSize: `${fontSize}px`,
              fontFamily: '"Patrick Hand", cursive',
              fontWeight: rowIndex === 0 ? 'bold' : 'normal'
            }}
          >
            {lines.map((line, i) => {
                // Per-line horizontal wiggle
                const lineTx = (Math.random() - 0.5) * textRoughness;
                return (
                    <tspan 
                        key={i} 
                        x={x + w/2 + blockTx + lineTx} 
                        dy={i === 0 ? 0 : lineHeight}
                    >
                        {line}
                    </tspan>
                );
            })}
          </text>
        );
      });
    });
    return elements;
  }, [data, xPositions, yPositions, config, basePadding]);

  // Background
  const headerBackground = useMemo(() => {
      if (data.length === 0 || config.fill !== 'hachure') return null;
      const rects: React.ReactElement[] = [];
      data[0].forEach((cell, colIndex) => {
          if (cell.hidden) return; 
          
          const x = xPositions[colIndex];
          const y = yPositions[0];
          const w = xPositions[colIndex + cell.colSpan] - x;
          const h = yPositions[0 + cell.rowSpan] - y;

          rects.push(
             <rect key={`bg-${colIndex}`} x={x} y={y} width={w} height={h} fill={config.fillColor} opacity="0.2" />
          );
      });
      return <g opacity="0.3">{rects}</g>;
  }, [data, xPositions, yPositions, config]);

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "handy_table.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPng = () => {
    if (!svgRef.current) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = (totalWidth + 10) * scale;
      canvas.height = (totalHeight + 10) * scale;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.translate(5, 5); 
        ctx.drawImage(img, -5, -5); 

        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "handy_table.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  return (
    <div className="relative overflow-auto p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg shadow-sm flex flex-col items-center">
       <div className="absolute top-2 right-2 flex gap-2">
         <button onClick={downloadSvg} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors">
            SVG
          </button>
          <button onClick={downloadPng} className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors">
            PNG
          </button>
       </div>
       
      <div className="bg-white p-4">
        <svg 
            ref={svgRef}
            width={totalWidth + 10} 
            height={totalHeight + 10} 
            viewBox={`-5 -5 ${totalWidth + 10} ${totalHeight + 10}`}
            xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
             <style>
               {`@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');`}
             </style>
          </defs>
          <rect x="-5" y="-5" width={totalWidth + 10} height={totalHeight + 10} fill="white" opacity="0"/>
          {headerBackground}
          {paths}
          {textElements}
        </svg>
      </div>
    </div>
  );
};

export default HandDrawnTable;