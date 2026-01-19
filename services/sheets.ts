
import axios from 'axios';
import { User, AppConfig } from '../types';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getApiKey = () => {
  return process.env.API_KEY;
};

export const extractSheetId = (input: string): string => {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  // 제어 문자 및 줄바꿈 완벽 제거
  const cleanLine = line.replace(/[\r\n\t]/g, '');
  for (let i = 0; i < cleanLine.length; i++) {
    const char = cleanLine[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const mapRowToUser = (row: any[]): User => {
  const no = parseInt(row[0]);
  return {
    no: isNaN(no) ? 0 : no,
    name: String(row[1] || '').trim(),
    birthdate: String(row[2] || '').trim(),
    gender: String(row[3] || '').trim(),
    district: String(row[4] || '').trim(),
    address: String(row[5] || '').trim(),
    phone: String(row[6] || '').trim(),
    type: String(row[7] || '').trim(),
    id: String(row[0] || Math.random().toString(36).substr(2, 9)).trim()
  };
};

export const fetchUsers = async (config: AppConfig): Promise<User[]> => {
  try {
    // 캐시 방지를 위해 타임스탬프 추가
    const csvUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/export?format=csv&gid=0&t=${Date.now()}`;
    const response = await axios.get(csvUrl, { timeout: 5000 });
    const lines = (response.data as string).split('\n');
    if (lines.length <= 1) return [];
    
    const validUsers: User[] = [];
    const seenNos = new Set<number>();

    // 1행(헤더) 제외하고 분석
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 2) continue;

      const no = parseInt(row[0]);
      const name = String(row[1] || '').trim();
      const birthdate = String(row[2] || '').trim();
      const phone = String(row[6] || '').trim();

      /**
       * [초정밀 필터링 - 66명 타겟팅]
       * 1. 연번(A)이 유효한 숫자여야 함
       * 2. 성함(B)이 2자 이상이어야 함 (공백/테스트 행 제거)
       * 3. 생년월일(C) 정보가 비어있지 않아야 함
       * 4. 연락처(G) 정보가 비어있지 않아야 함
       * 5. 헤더 명칭(성함, 이름 등)은 데이터에서 제외
       */
      const isRealData = 
        !isNaN(no) && 
        no > 0 && 
        name.length >= 2 && 
        birthdate.length >= 4 && 
        phone.length >= 7 &&
        !['성함', '이름', 'name', '연번', 'no'].includes(name.toLowerCase());

      if (isRealData && !seenNos.has(no)) {
        seenNos.add(no);
        validUsers.push(mapRowToUser(row));
      }
    }

    // 최신 순 정렬
    return validUsers.sort((a, b) => b.no - a.no);
  } catch (csvError) {
    console.warn('CSV 로드 실패, API로 전환...', csvError);
    const key = getApiKey();
    if (!key) throw new Error('API 키 설정이 필요합니다.');

    try {
      const apiUri = `${BASE_URL}/${config.sheetId}/values/${encodeURIComponent(config.range)}?key=${key}`;
      const response = await axios.get(apiUri);
      const rows = response.data.values || [];
      const validUsers: User[] = [];
      const seenNos = new Set<number>();

      rows.slice(1).forEach((row: any[]) => {
        const no = parseInt(row[0]);
        const name = String(row[1] || '').trim();
        const birthdate = String(row[2] || '').trim();
        const phone = String(row[6] || '').trim();

        const isRealData = !isNaN(no) && no > 0 && name.length >= 2 && birthdate.length >= 4 && phone.length >= 7;
        
        if (isRealData && !seenNos.has(no)) {
          seenNos.add(no);
          validUsers.push(mapRowToUser(row));
        }
      });
      
      return validUsers.sort((a, b) => b.no - a.no);
    } catch (apiError: any) {
      throw new Error(`데이터를 가져올 수 없습니다: ${apiError.message}`);
    }
  }
};

export const validateAndGetConfig = async (input: string): Promise<AppConfig> => {
  const sheetId = extractSheetId(input);
  if (!sheetId) throw new Error('올바른 시트 ID를 입력하세요.');

  try {
    const testUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&t=${Date.now()}`;
    await axios.get(testUrl, { timeout: 3000 });
    return { apiKey: getApiKey() || '', sheetId, range: '시트1!A:H' };
  } catch (e) {
    throw new Error('시트 접근 권한이 없습니다. [공유] 설정에서 [링크가 있는 모든 사용자]로 변경하세요.');
  }
};

export const addUser = async (config: AppConfig, user: User): Promise<void> => {
  const key = getApiKey();
  if (!key) throw new Error('편집 권한이 없습니다.');
  const url = `${BASE_URL}/${config.sheetId}/values/${encodeURIComponent(config.range)}:append?valueInputOption=USER_ENTERED&key=${key}`;
  const data = { values: [[user.no, user.name, user.birthdate, user.gender, user.district, user.address, user.phone, user.type]] };
  await axios.post(url, data);
};
