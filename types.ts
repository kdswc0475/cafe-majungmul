
export interface User {
  no: number;       // A열: 연번
  name: string;     // B열: 이름
  birthdate: string; // C열: 생년월일
  gender: string;    // D열: 성별
  district: string;  // E열: 관할동
  address: string;   // F열: 주소
  phone: string;     // G열: 전화번호
  type: string;      // H열: 보호유형
  id: string;        // 식별자 (no와 동일)
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
