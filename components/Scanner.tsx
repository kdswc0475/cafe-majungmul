
import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { Card, Button } from './UI';

// Note: Standard HTML5 QR Scanner is robust and easy to integrate via a small wrapper or just using native capabilities.
// Here we use a simpler camera preview logic since actual react-qr-reader can be buggy in SPAs without proper dependency resolution.
// For this app, we'll implement a clean UI for scanning.

interface ScannerProps {
  users: User[];
}

const Scanner: React.FC<ScannerProps> = ({ users }) => {
  const [scannedResult, setScannedResult] = useState<User | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // In a real environment, we would use html5-qrcode library.
  // For this prototype/code, we mimic the scanning behavior with a text input 
  // and explain how to use the camera.
  const [manualInput, setManualInput] = useState('');

  const handleManualScan = () => {
    const found = users.find(u => u.id === manualInput || u.phone.includes(manualInput));
    if (found) {
      setScannedResult(found);
      setError(null);
    } else {
      setError('회원 정보를 찾을 수 없습니다.');
      setScannedResult(null);
    }
    setManualInput('');
  };

  const closeResult = () => {
    setScannedResult(null);
    setError(null);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col p-4">
      <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative border-4 border-slate-200">
        {/* Camera Simulation View */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <Camera size={64} className="mb-4 text-indigo-400 animate-pulse" />
          <h3 className="text-xl font-bold mb-2">QR 스캐너</h3>
          <p className="text-sm text-slate-400 text-center">
            이용자의 QR코드를 화면 가이드 영역에 맞춰주세요.
          </p>
          
          {/* Guide Line */}
          <div className="mt-12 w-64 h-64 border-2 border-indigo-500 rounded-2xl relative">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl -translate-x-1 -translate-y-1"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl translate-x-1 -translate-y-1"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl -translate-x-1 translate-y-1"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl translate-x-1 translate-y-1"></div>
             <div className="absolute left-0 top-1/2 w-full h-[2px] bg-indigo-500/50 animate-bounce"></div>
          </div>
        </div>

        {/* Manual Input for testing or fallback */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="ID 또는 전화번호 직접 입력"
                className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm font-bold"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              />
              <button onClick={handleManualScan} className="bg-indigo-600 px-4 py-2 rounded-xl text-xs font-bold">확인</button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Overlay */}
      {scannedResult && (
        <div className="fixed inset-0 z-[100] bg-emerald-500 flex items-center justify-center p-6 animate-in slide-in-from-top duration-300">
           <Card className="w-full max-w-md text-center py-10 shadow-2xl">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">인증 성공!</h2>
              <p className="text-xl font-bold text-emerald-600 mb-6">{scannedResult.name} 님 반갑습니다.</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl mb-8 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">관리번호</span>
                  <span className="text-sm font-bold">{scannedResult.no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">연락처</span>
                  <span className="text-sm font-bold">{scannedResult.phone}</span>
                </div>
              </div>

              <Button fullWidth variant="primary" onClick={closeResult} className="h-16 text-lg">
                완료
              </Button>
           </Card>
        </div>
      )}

      {error && (
        <div className="fixed inset-x-4 bottom-24 z-[100] animate-in slide-in-from-bottom duration-300">
           <Card className="bg-rose-50 border-rose-200 flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-rose-900">조회 실패</h4>
                <p className="text-xs text-rose-800/70">{error}</p>
              </div>
              <button onClick={closeResult} className="text-rose-400 p-2">
                <X size={20} />
              </button>
           </Card>
        </div>
      )}
    </div>
  );
};

export default Scanner;
