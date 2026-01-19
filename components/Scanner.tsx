
import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { User } from '../types';
import { Card, Button } from './UI';

interface ScannerProps {
  users: User[];
}

const Scanner: React.FC<ScannerProps> = ({ users }) => {
  const [scannedResult, setScannedResult] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setHasPermission(true);
        requestRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      setHasPermission(false);
      setError('카메라 권한이 필요합니다.');
    }
  };

  const stopCamera = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || scannedResult) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleDetectedId(code.data);
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  const handleDetectedId = (id: string) => {
    const found = users.find(u => 
      String(u.no) === id || 
      u.name === id || 
      (u.phone && u.phone.includes(id))
    );
    
    if (found) {
      setScannedResult(found);
      // 출석 기록 저장 (오늘 날짜 기준)
      recordAttendance(found.id);
      stopCamera();
    } else {
      setError('미등록 회원입니다.');
      setTimeout(() => setError(null), 2000);
      if (!scannedResult) requestRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const recordAttendance = (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `attendance_${today}`;
    const currentAttendance = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (!currentAttendance.includes(userId)) {
      const updated = [...currentAttendance, userId];
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setError(null);
    setManualInput('');
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] p-6">
      <div className="relative flex-1 bg-slate-900 rounded-[50px] overflow-hidden shadow-2xl border-[6px] border-white">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {!scannedResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 border-2 border-white/20 rounded-[40px]"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-t-[8px] border-l-[8px] border-indigo-500 rounded-tl-3xl -translate-x-1 -translate-y-1"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-[8px] border-r-[8px] border-indigo-500 rounded-tr-3xl translate-x-1 -translate-y-1"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[8px] border-l-[8px] border-indigo-500 rounded-bl-3xl -translate-x-1 translate-y-1"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[8px] border-r-[8px] border-indigo-500 rounded-br-3xl translate-x-1 translate-y-1"></div>
              <div className="absolute inset-x-6 top-1/2 h-1 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] animate-pulse"></div>
            </div>
            <div className="mt-12 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20">
              <p className="text-white text-sm font-black flex items-center gap-3">
                <i className="fa-solid fa-expand text-indigo-400"></i> 이용증 QR을 비춰주세요
              </p>
            </div>
          </div>
        )}

        <div className="absolute bottom-10 left-8 right-8">
          <div className="bg-white/10 backdrop-blur-2xl p-2.5 rounded-3xl border border-white/20 flex gap-3">
            <input 
              className="flex-1 bg-transparent border-none text-white px-4 font-black placeholder:text-white/30 focus:outline-none text-lg" 
              placeholder="직접 입력 (이름/번호/연번)"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleDetectedId(manualInput)}
            />
            <button 
              onClick={() => handleDetectedId(manualInput)}
              className="bg-indigo-600 text-white w-16 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
            >
              <i className="fa-solid fa-search text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {scannedResult && (
        <div className="fixed inset-0 z-[100] bg-indigo-600/90 backdrop-blur-xl flex items-center justify-center p-8 animate-in zoom-in duration-300">
          <Card className="w-full max-w-xs text-center p-12 !rounded-[60px] shadow-2xl border-none">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <i className="fa-solid fa-check text-5xl"></i>
            </div>
            <h3 className="text-xl font-black text-slate-400 mb-1 uppercase tracking-widest">식권 인증 완료</h3>
            <p className="text-5xl font-[900] text-indigo-600 mb-10 tracking-tighter">{scannedResult.name}</p>
            
            <div className="bg-slate-50 p-6 rounded-[32px] mb-10 text-sm space-y-3 text-left font-black border border-slate-100">
              <div className="flex justify-between items-center"><span className="text-slate-300">관할동</span><span className="text-slate-800 text-lg">{scannedResult.district}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-300">보호유형</span><span className="text-slate-800">{scannedResult.type}</span></div>
              <div className="flex justify-between items-center"><span className="text-slate-300">연락처</span><span className="text-slate-800 font-mono">{scannedResult.phone}</span></div>
            </div>

            <Button fullWidth onClick={resetScanner} className="h-20 text-2xl font-[900] rounded-[30px] shadow-xl">
              확인
            </Button>
          </Card>
        </div>
      )}

      {error && !scannedResult && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-6 z-50 border-2 border-rose-400">
          <i className="fa-solid fa-triangle-exclamation text-xl"></i> {error}
        </div>
      )}
    </div>
  );
};

export default Scanner;
