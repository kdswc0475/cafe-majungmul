
import axios from 'axios';
import { User, AppConfig } from '../types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

export const validateConfig = async (config: AppConfig): Promise<boolean> => {
  try {
    const url = `${BASE_URL}/${config.sheetId}?key=${config.apiKey}&fields=properties.title`;
    const response = await axios.get(url, {
      timeout: 5000 
    });
    return response.status === 200;
  } catch (error: any) {
    let errorMessage = '연결 중 오류가 발생했습니다.';
    let consoleLink = '';
    let rawError = '';
    
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;
      const remoteMessage = data?.error?.message || JSON.stringify(data);
      rawError = remoteMessage;
      
      console.error(`Validation Error (Response ${status}):`, remoteMessage);

      if (status === 403) {
        if (remoteMessage.toLowerCase().includes('disabled') || remoteMessage.toLowerCase().includes('not been used')) {
          const projectMatch = remoteMessage.match(/project (\d+)/);
          const projectNum = projectMatch ? projectMatch[1] : '알 수 없음';
          
          errorMessage = `프로젝트 설정 오류: API 키가 속한 [프로젝트 ${projectNum}]에서 Sheets API가 활성화되지 않았습니다. 링크를 눌러 활성화 버튼을 클릭하세요.`;
          
          const linkMatch = remoteMessage.match(/https:\/\/console\.developers\.google\.com\/[^\s]+/);
          if (linkMatch) consoleLink = linkMatch[0];
        } else if (remoteMessage.toLowerCase().includes('permission')) {
          errorMessage = '구글 시트 공유 권한 부족: 시트의 [공유] 설정을 "링크가 있는 모든 사용자 - 뷰어"로 변경해야 합니다.';
        } else {
          errorMessage = `접근 거부 (403): ${remoteMessage}`;
        }
      } else if (status === 400) {
        errorMessage = '요청 오류 (400): API Key가 잘못되었거나, Spreadsheet ID가 유효하지 않습니다.';
      } else {
        errorMessage = `서버 오류 (${status}): ${remoteMessage}`;
      }
    } else {
      errorMessage = '네트워크 연결 오류: 인터넷 상태를 확인하거나 구글 서버와 통신할 수 없는 상태입니다.';
    }
    
    const structuredError: any = new Error(errorMessage);
    structuredError.consoleLink = consoleLink;
    structuredError.raw = rawError;
    throw structuredError;
  }
};

export const fetchUsers = async (config: AppConfig): Promise<User[]> => {
  try {
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}?key=${config.apiKey}`;
    const response = await axios.get(url);
    const rows = response.data.values || [];
    
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: string[], index: number) => ({
      no: parseInt(row[0]) || index + 1,
      id: row[1] || '',
      name: row[2] || '',
      phone: row[3] || '',
      joinedAt: row[4] || ''
    }));
  } catch (error: any) {
    throw error;
  }
};

export const addUser = async (config: AppConfig, user: User): Promise<void> => {
  // Note: Standard API Key usage usually restricts writes. 
  // This is a placeholder as API Key alone might not have write permission.
  try {
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}:append?valueInputOption=USER_ENTERED&key=${config.apiKey}`;
    const data = {
      values: [[user.no, user.id, user.name, user.phone, user.joinedAt]]
    };
    await axios.post(url, data);
  } catch (error: any) {
    throw new Error('데이터 쓰기 실패: API Key 방식은 일반적으로 읽기만 허용됩니다. (OAuth 필요)');
  }
};

export const batchAddUsers = async (config: AppConfig, users: User[]): Promise<void> => {
  try {
    const url = `${BASE_URL}/${config.sheetId}/values/${config.range}:append?valueInputOption=USER_ENTERED&key=${config.apiKey}`;
    const data = {
      values: users.map(u => [u.no, u.id, u.name, u.phone, u.joinedAt])
    };
    await axios.post(url, data);
  } catch (error: any) {
    throw error;
  }
};
