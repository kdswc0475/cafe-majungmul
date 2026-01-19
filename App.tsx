
import React, { useState, useEffect, useCallback } from 'react';
import { ViewType, AppConfig, User } from './types';
import { validateAndGetConfig, fetchUsers } from './services/sheets';
import { Button, Card, Input, Label } from './components/UI';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import MemberManager from './components/MemberManager';

const DEFAULT_SHEET_ID = '1dZkKagoI5db_3fazqjFmpzSIe03tyxotpYmI_VM-5zc';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewType>(ViewType.DASHBOARD);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [inputSheetId, setInputSheetId] = useState(DEFAULT_SHEET_ID);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('app_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
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
      setValidationError(null);
    } catch (error: any) {
      setValidationError(error.message);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config) loadData();
  }, [config, loadData]);

  const handleSaveConfig = async () => {
    if (!inputSheetId) return;
    setIsValidating(true);
    setValidationError(null);
    try {
      const validConfig = await validateAndGetConfig(inputSheetId);
      localStorage.setItem('app_config', JSON.stringify(validConfig));
      setConfig(validConfig);
      setIsConfigModalOpen(false);
    } catch (error: any) {
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Café <span className="text-indigo-600">Majoongmool</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">운영 관리 시스템</p>
        </div>
        <button 
          onClick={() => setIsConfigModalOpen(true)}
          className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all"
        >
          <i className="fa-solid fa-database"></i>
        </button>
      </div>

      {/* Error Banner */}
      {validationError && !isConfigModalOpen && (
        <div className="mx-4 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-pulse">
          <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
          <p className="text-xs font-bold text-rose-800 flex-1">{validationError}</p>
          <button onClick={loadData} className="text-rose-500 font-black text-xs underline">재시도</button>
        </div>
      )}

      <main className="max-w-md mx-auto">
        {config ? (
          activeTab === ViewType.DASHBOARD ? <Dashboard users={users} onRefresh={loadData} /> :
          activeTab === ViewType.SCAN ? <Scanner users={users} /> :
          <MemberManager users={users} config={config} onRefresh={loadData} />
        ) : null}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center px-4 h-20 z-50">
        {[
          { id: ViewType.DASHBOARD, icon: 'fa-house-chimney', label: '홈' },
          { id: ViewType.SCAN, icon: 'fa-qrcode', label: '스캔' },
          { id: ViewType.LIST, icon: 'fa-users', label: '명단' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-300'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-indigo-50' : ''}`}>
              <i className={`fa-solid ${item.icon} text-xl`}></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Config Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="w-full max-w-sm p-10 !rounded-[50px] shadow-2xl">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 text-2xl">
              <i className="fa-solid fa-link"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">데이터베이스 연결</h3>
            <p className="text-sm text-slate-400 mb-8 font-medium">시트가 <span className="text-indigo-600 font-bold">공개</span> 상태여야 합니다.</p>
            
            <div className="space-y-4">
              <div>
                <Label>구글 시트 ID 또는 URL</Label>
                <Input 
                  value={inputSheetId} 
                  onChange={e => setInputSheetId(e.target.value)}
                  placeholder="URL을 붙여넣으세요"
                />
              </div>
              
              {validationError && (
                <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-[11px] font-bold leading-relaxed border border-rose-100">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                  {validationError}
                </div>
              )}

              <Button fullWidth onClick={handleSaveConfig} disabled={isValidating} className="h-14">
                {isValidating ? <i className="fa-solid fa-spinner animate-spin"></i> : '연결 완료'}
              </Button>
            </div>
            
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-bold leading-normal border border-slate-100">
              <p className="mb-2 text-indigo-500"><i className="fa-solid fa-circle-info mr-1"></i> 권한 확인 방법</p>
              <p>1. 구글 시트 우측 상단 [공유] 클릭</p>
              <p>2. 일반 액세스를 [링크가 있는 모든 사용자]로 변경</p>
              <p>3. 권한을 [편집자]로 설정 (등록 기능 사용 시 필수)</p>
            </div>
          </Card>
        </div>
      )}

      {loading && !isConfigModalOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <i className="fa-solid fa-spinner animate-spin"></i>
          데이터 동기화 중
        </div>
      )}
    </div>
  );
};

export default App;
