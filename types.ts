export interface TableConfig {
  roughness: number; // How wiggly lines are
  bowing: number; // How curved lines are
  stroke: string; // Color of lines
  strokeWidth: number;
  padding: number; // Cell padding
  textColor: string;
  fill: string; // Background fill style (solid, hachure, none)
  fillColor: string;
  widthScale: number; // Horizontal scaling factor
  customColumnWidths: Record<number, number>; // Map of colIndex -> width in px
  customRowHeights: Record<number, number>; // Map of rowIndex -> height in px
}

export interface TableCell {
  id: string;
  value: string;
  rowSpan: number;
  colSpan: number;
  hidden?: boolean;
  // If hidden, these point to the merging cell
  ownerRow?: number;
  ownerCol?: number;
}

export type TableData = TableCell[][];

export interface Point {
  x: number;
  y: number;
}

export enum GenerateStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}