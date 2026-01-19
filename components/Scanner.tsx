
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, X, ShieldAlert, Smartphone } from 'lucide-react';
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
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('카메라 권한이 거부되었거나 카메라를 찾을 수 없습니다.');
    }
  };

  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
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
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          handleDetectedId(code.data);
          return; // Stop scanning once found
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  const handleDetectedId = (id: string) => {
    const found = users.find(u => u.id === id || u.id.toLowerCase() === id.toLowerCase());
    if (found) {
      setScannedResult(found);
      setError(null);
      stopCamera();
    } else {
      // 잠깐 오류 보여주고 다시 스캔하게 함
      setError('등록되지 않은 QR 코드입니다.');
      setTimeout(() => setError(null), 2000);
      requestRef.current = requestAnimationFrame(scanFrame);
    }
  };

  const handleManualScan = () => {
    const found = users.find(u => u.id === manualInput || u.phone.includes(manualInput));
    if (found) {
      setScannedResult(found);
      setError(null);
      stopCamera();
    } else {
      setError('회원 정보를 찾을 수 없습니다.');
    }
    setManualInput('');
  };

  const resetScanner = () => {
    setScannedResult(null);
    setError(null);
    startCamera();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col p-4 space-y-4">
      <div className="flex-1 bg-black rounded-[40px] overflow-hidden relative border-4 border-slate-200 shadow-2xl">
        {/* Real Video Feed */}
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* UI Overlays */}
        {!scannedResult && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Guide Square */}
            <div className="w-64 h-64 border-4 border-indigo-500/50 rounded-[40px] relative">
              <div className="absolute -inset-1 border-4 border-indigo-500 rounded-[40px] animate-pulse opacity-50"></div>
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-white rounded-tl-[30px] -translate-x-2 -translate-y-2"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-white rounded-tr-[30px] translate-x-2 -translate-y-2"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-white rounded-bl-[30px] -translate-x-2 translate-y-2"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-white rounded-br-[30px] translate-x-2 translate-y-2"></div>
              {/* Scanning Line */}
              <div className="absolute left-4 right-4 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] top-1/2 animate-[bounce_2s_infinite]"></div>
            </div>
            <div className="mt-12 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <p className="text-white font-bold text-sm flex items-center gap-2">
                <Smartphone size={16} className="text-indigo-400" /> 가이드 안에 QR코드를 맞춰주세요
              </p>
            </div>
          </div>
        )}

        {/* Manual Fallback */}
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20 shadow-2xl">
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="ID 또는 전화번호 입력"
                className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-lg font-bold px-2"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
              />
              <button 
                onClick={handleManualScan} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
              >
                조회
              </button>
            </div>
          </div>
        </div>

        {/* Permission Denied UI */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
            <ShieldAlert size={64} className="text-rose-500 mb-6" />
            <h3 className="text-2xl font-black mb-2">카메라 권한 필요</h3>
            <p className="text-slate-400 mb-8">QR 스캔을 위해 브라우저의 카메라 권한을 허용해 주셔야 합니다.</p>
            <Button onClick={startCamera} className="w-full h-16 text-lg">권한 다시 요청하기</Button>
          </div>
        )}
      </div>

      {/* Success Result Modal */}
      {scannedResult && (
        <div className="fixed inset-0 z-[100] bg-indigo-600 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
           <Card className="w-full max-w-md text-center py-12 px-8 !rounded-[50px] shadow-2xl border-none">
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle2 size={56} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">인증 확인</h2>
              <p className="text-2xl font-bold text-indigo-600 mb-10">{scannedResult.name} 회원님</p>
              
              <div className="bg-slate-50 p-6 rounded-[32px] mb-10 text-left space-y-4 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">관리번호</span>
                  <span className="text-lg font-black text-slate-800">{scannedResult.no}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">연락처</span>
                  <span className="text-lg font-black text-slate-800">{scannedResult.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-400">고유 ID</span>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">{scannedResult.id}</span>
                </div>
              </div>

              <Button fullWidth onClick={resetScanner} className="h-20 text-2xl font-black rounded-3xl shadow-xl shadow-indigo-200 transition-all active:scale-95">
                완료 및 다음 스캔
              </Button>
           </Card>
        </div>
      )}

      {/* Temp Error Toast */}
      {error && !scannedResult && (
        <div className="fixed inset-x-8 bottom-28 z-[100] animate-in slide-in-from-bottom-4 duration-300">
           <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl border-2 border-rose-400">
              <ShieldAlert size={24} className="shrink-0" />
              <p className="font-black text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
