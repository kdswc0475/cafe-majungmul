
export interface User {
  id: string;      // UUID or unique ID
  no: number;      // Serial number (1, 2, 3...)
  name: string;    // User name
  phone: string;   // Phone number
  joinedAt: string; // Registration date
}

export interface AppConfig {
  apiKey: string;
  sheetId: string;
  range: string;
}

export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  SCAN = 'SCAN',
  LIST = 'LIST',
  SETTINGS = 'SETTINGS'
}

export interface SheetResponse {
  values: string[][];
}
