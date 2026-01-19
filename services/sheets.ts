
import axios from 'axios';
import { User, AppConfig } from '../types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Vercel 환경 변수(process.env.API_KEY)가 있으면 최우선으로 사용합니다.
const getApiKey = (config: AppConfig) => {
  return process.env.API_KEY || config.apiKey;
};

export const validateConfig = async (config: AppConfig): Promise<boolean> => {
  try {
    const key = getApiKey(config);
    const url = `${BASE_URL}/${config.sheetId}?key=${key}&fields=properties.title`;
    const response = await axios.get(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error: any) {
    throw error;
  }
};

export const fetchUsers = async (config: AppConfig): Promise<User[]> => {
  try {
    const key = getApiKey(config);
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}?key=${key}`;
    const response = await axios.get(url);
    const rows = response.data.values || [];
    
    if (rows.length <= 1) return [];

    // 시트의 각 열을 User 객체에 정확히 매핑 (A:번호, B:ID, C:성함, D:연락처, E:가입일)
    return rows.slice(1).map((row: any[], index: number) => ({
      no: parseInt(row[0]) || index + 1,
      id: String(row[1] || 'N/A'),
      name: String(row[2] || '이름없음'),
      phone: String(row[3] || '-'),
      joinedAt: String(row[4] || '-')
    }));
  } catch (error: any) {
    console.error('Fetch Error:', error);
    throw error;
  }
};

export const addUser = async (config: AppConfig, user: User): Promise<void> => {
  try {
    const key = getApiKey(config);
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}:append?valueInputOption=USER_ENTERED&key=${key}`;
    const data = {
      values: [[user.no, user.id, user.name, user.phone, user.joinedAt]]
    };
    await axios.post(url, data);
  } catch (error: any) {
    throw new Error('저장 실패: API 키의 권한을 확인하세요.');
  }
};

export const batchAddUsers = async (config: AppConfig, users: User[]): Promise<void> => {
  try {
    const key = getApiKey(config);
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}:append?valueInputOption=USER_ENTERED&key=${key}`;
    const data = {
      values: users.map(u => [u.no, u.id, u.name, u.phone, u.joinedAt])
    };
    await axios.post(url, data);
  } catch (error: any) {
    throw error;
  }
};
