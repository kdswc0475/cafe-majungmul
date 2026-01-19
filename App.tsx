
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Users, 
  QrCode, 
  LayoutDashboard, 
  AlertCircle,
  PlusCircle,
  History,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Info,
  ExternalLink,
  TriangleAlert,
  CheckCircle2
} from 'lucide-react';
import { ViewType, AppConfig, User } from './types';
import { validateConfig, fetchUsers } from './services/sheets';
import { Button, Card, Input, Label } from './components/UI';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import MemberManager from './components/MemberManager';

// 테스트를 위해 사용자님이 제공하신 정보를 초기값으로 설정합니다.
const TEST_API_KEY = 'AIzaSyAqwOCRQtKoQPzaGW4UAcFlA5aB2rQ4HOE';
const DEFAULT_SHEET_ID = '1dZkKagoI5db_3fazqjFmpzSIe03tyxotpYmI_VM-5zc';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewType>(ViewType.DASHBOARD);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<AppConfig>({
    apiKey: TEST_API_KEY, // 제공된 키 자동 입력
    sheetId: DEFAULT_SHEET_ID,
    range: 'A:E'
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<{message: string, link?: string, raw?: string} | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (e) {
        setIsConfigModalOpen(true);
      }
    } else {
      setIsConfigModalOpen(true);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const data = await fetchUsers(config);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      loadData();
    }
  }, [config, loadData]);

  const handleSaveConfig = async () => {
    setIsValidating(true);
    setValidationError(null);
    try {
      const isValid = await validateConfig(tempConfig);
      if (isValid) {
        localStorage.setItem('app_config', JSON.stringify(tempConfig));
        setConfig(tempConfig);
        setIsConfigModalOpen(false);
        alert('연결 성공! 데이터를 불러옵니다.');
      }
    } catch (error: any) {
      setValidationError({
        message: error.message,
        link: error.consoleLink,
        raw: error.raw
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('app_config');
      setConfig(null);
      setIsConfigModalOpen(true);
    }
  };

  const renderContent = () => {
    if (!config) return null;

    switch (activeTab) {
      case ViewType.DASHBOARD: return <Dashboard users={users} onRefresh={loadData} />;
      case ViewType.SCAN: return <Scanner users={users} />;
      case ViewType.LIST: return <MemberManager users={users} config={config} onRefresh={loadData} />;
      case ViewType.SETTINGS:
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold mb-4">앱 설정</h2>
            <Card>
              <div className="space-y-4">
                <div>
                  <Label>연결된 시트 ID</Label>
                  <p className="text-xs break-all bg-slate-50 p-2 rounded border border-slate-200 text-slate-500 font-mono">{config.sheetId}</p>
                </div>
                <Button variant="danger" fullWidth onClick={handleResetConfig}>
                  <LogOut size={20} /> 설정 초기화 및 로그아웃
                </Button>
              </div>
            </Card>
          </div>
        );
      default: return <Dashboard users={users} onRefresh={loadData} />;
    }
  };

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-slate-50 relative shadow-xl">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <PlusCircle size={20} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">카페마중물</h1>
        </div>
        {loading && <RefreshCcw size={16} className="text-indigo-500 animate-spin" />}
      </header>

      <main className="min-h-[60vh]">{renderContent()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-200 safe-bottom shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          <button onClick={() => setActiveTab(ViewType.DASHBOARD)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === ViewType.DASHBOARD ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <LayoutDashboard size={22} /><span className="text-[10px] font-bold">홈</span>
          </button>
          <button onClick={() => setActiveTab(ViewType.SCAN)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === ViewType.SCAN ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <QrCode size={22} /><span className="text-[10px] font-bold">스캔</span>
          </button>
          <button onClick={() => setActiveTab(ViewType.LIST)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === ViewType.LIST ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <Users size={22} /><span className="text-[10px] font-bold">회원</span>
          </button>
          <button onClick={() => setActiveTab(ViewType.SETTINGS)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === ViewType.SETTINGS ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
            <Settings size={22} /><span className="text-[10px] font-bold">설정</span>
          </button>
        </div>
      </nav>

      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-800">연결 테스트</h2>
              <p className="text-slate-500 text-sm mt-1">제공해주신 API 키로 연결을 시도합니다.</p>
            </div>

            <div className="space-y-4">
              {validationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="flex gap-3">
                    <TriangleAlert size={20} className="text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-rose-800 leading-tight">{validationError.message}</p>
                      
                      {validationError.link && (
                        <div className="mt-3">
                          <a 
                            href={validationError.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
                          >
                            구글 콘솔에서 활성화 확인 <ExternalLink size={12} />
                          </a>
                        </div>
                      )}
                      
                      {validationError.raw && (
                        <div className="mt-3 p-2 bg-rose-100/50 rounded-lg">
                          <p className="text-[10px] font-mono text-rose-700 break-all leading-relaxed">
                            ERROR_DETAILS: {validationError.raw}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Google API Key (입력됨)</Label>
                <Input type="text" placeholder="API 키" value={tempConfig.apiKey} onChange={(e) => setTempConfig({...tempConfig, apiKey: e.target.value})} />
              </div>
              <div>
                <Label>Spreadsheet ID</Label>
                <Input placeholder="시트 ID" value={tempConfig.sheetId} onChange={(e) => setTempConfig({...tempConfig, sheetId: e.target.value})} />
              </div>
              
              <Button 
                fullWidth 
                onClick={handleSaveConfig} 
                disabled={isValidating || !tempConfig.apiKey}
                className="h-14 text-lg"
              >
                {isValidating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    연결 확인 중...
                  </div>
                ) : '연결 확인 및 테스트 시작'}
              </Button>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                  <AlertCircle size={14} /> 최종 점검 사항
                </h4>
                <ul className="text-[11px] text-amber-700 space-y-1 list-disc ml-3">
                  <li>API 키가 소속된 프로젝트에서 <b>Google Sheets API</b>가 켜져 있는지</li>
                  <li>구글 시트의 [공유] 설정이 <b>'링크가 있는 모든 사용자'</b>로 되어 있는지</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Simple refresh icon for the header
const RefreshCcw = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default App;
