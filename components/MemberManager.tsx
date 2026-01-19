
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  FileUp, 
  Download, 
  X, 
  Plus, 
  Printer,
  QrCode,
  Calendar,
  Phone,
  Fingerprint,
  Hash
} from 'lucide-react';
import { User, AppConfig } from '../types';
import { addUser, batchAddUsers } from '../services/sheets';
import { Button, Card, Input, Label } from './UI';

interface MemberManagerProps {
  users: User[];
  config: AppConfig;
  onRefresh: () => void;
}

const MemberManager: React.FC<MemberManagerProps> = ({ users, config, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newMember, setNewMember] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  // 전화번호 마스킹 함수
  const maskPhone = (phone: string) => {
    if (!phone || phone === '-' || phone.length < 7) return phone || '-';
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) {
      const first = cleaned.slice(0, 3);
      const last = cleaned.slice(-4);
      const middle = cleaned.length === 11 ? '****' : '***';
      return `${first}-${middle}-${last}`;
    }
    return phone;
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone.includes(searchTerm) ||
    u.id.includes(searchTerm)
  );

  const handleAddMember = async () => {
    if (!newMember.name) return;
    setSubmitting(true);
    try {
      const user: User = {
        no: users.length + 1,
        id: crypto.randomUUID().split('-')[0].toUpperCase(), // 짧은 고유 ID 생성
        name: newMember.name,
        phone: newMember.phone || '-',
        joinedAt: new Date().toLocaleDateString('ko-KR')
      };
      await addUser(config, user);
      setNewMember({ name: '', phone: '' });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) return;

      if (window.confirm(`${jsonData.length}명의 데이터를 일괄 등록하시겠습니까?`)) {
        setSubmitting(true);
        try {
          const bulkUsers: User[] = jsonData.map((item, idx) => ({
            no: users.length + idx + 1,
            id: (item['ID'] || crypto.randomUUID().split('-')[0].toUpperCase()),
            name: item['성함'] || item['이름'] || '이름없음',
            phone: item['연락처'] || item['전화번호'] || '-',
            joinedAt: item['가입일'] || new Date().toLocaleDateString('ko-KR')
          }));
          await batchAddUsers(config, bulkUsers);
          onRefresh();
          alert('일괄 등록 완료!');
        } catch (e) {
          alert('오류 발생: ' + e);
        } finally {
          setSubmitting(false);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const openQRModal = (user: User) => {
    setSelectedUser(user);
    setIsQRModalOpen(true);
  };

  return (
    <div className="p-4 space-y-4 print:hidden">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800">회원 명단</h2>
          <p className="text-xs text-slate-500">전체 {users.length}명의 이용자가 등록됨</p>
        </div>
        <div className="flex gap-2">
          <label className="bg-white w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shadow-sm transition-all active:scale-95">
            <FileUp size={20} />
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <Button onClick={() => setIsAddModalOpen(true)} className="!px-4 !py-0 h-12 rounded-2xl shadow-indigo-100">
            <Plus size={20} /> <span className="hidden sm:inline">회원 등록</span>
          </Button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <Input 
          className="pl-12 h-14 bg-white border-slate-200 rounded-2xl shadow-sm" 
          placeholder="이름, 연락처, ID로 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
          <Card 
            key={user.id} 
            className="group hover:border-indigo-400 transition-all cursor-pointer active:scale-[0.99] border-2 border-transparent relative overflow-hidden !p-0" 
            onClick={() => openQRModal(user)}
          >
            <div className="flex">
              <div className="w-1.5 bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm border border-indigo-100">
                      {user.no}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight">{user.name}</h4>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                        <Fingerprint size={10} /> ID: {user.id}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 text-slate-400 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <QrCode size={22} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Phone size={12} />
                    </div>
                    <span className="font-bold text-slate-700 tracking-wider">{maskPhone(user.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Calendar size={12} />
                    </div>
                    <span className="font-medium">{user.joinedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )) : (
          <div className="text-center py-24 bg-white rounded-[32px] border-4 border-dashed border-slate-100 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md animate-in slide-in-from-bottom-8 duration-300 !rounded-[32px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">회원 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <Label>성함 (필수)</Label>
                <Input placeholder="홍길동" className="h-14" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              </div>
              <div>
                <Label>연락처</Label>
                <Input placeholder="010-0000-0000" className="h-14" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <Button fullWidth onClick={handleAddMember} disabled={submitting || !newMember.name} className="h-16 text-lg rounded-2xl">
                {submitting ? '등록 중...' : '등록 완료'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Large QR Modal */}
      {isQRModalOpen && selectedUser && (
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 print:hidden">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="bg-white rounded-[40px] p-8 text-center shadow-2xl relative overflow-hidden">
                <button 
                  onClick={() => setIsQRModalOpen(false)} 
                  className="absolute right-6 top-6 w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
                
                <div className="mt-4 mb-10">
                  <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black mb-3 uppercase tracking-widest border border-indigo-100">
                    관리번호 {selectedUser.no}
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tight">{selectedUser.name}</h3>
                  <p className="text-lg text-slate-400 mt-2 font-bold tracking-widest">{maskPhone(selectedUser.phone)}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] inline-block mb-10 shadow-inner border-2 border-white">
                  <QRCodeSVG 
                    value={selectedUser.id} 
                    size={280} 
                    level="H" 
                    includeMargin={false}
                    className="mx-auto"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Button variant="primary" onClick={() => window.print()} className="h-16 text-lg rounded-2xl shadow-xl shadow-indigo-200">
                    <Printer size={22} /> 이용증 인쇄하기
                  </Button>
                  <button onClick={() => setIsQRModalOpen(false)} className="text-slate-400 font-bold text-sm py-2">
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Printable Meal Pass Card */}
          <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
             <div className="flex flex-col items-center justify-center h-screen p-0">
                <div className="border-[12px] border-slate-900 p-12 rounded-[60px] text-center w-[105mm] h-[148mm] flex flex-col items-center justify-between shadow-none">
                   <div className="w-full">
                      <p className="text-2xl font-black text-slate-400 mb-1 tracking-[0.2em]">CAFÉ MAJOONGMOOL</p>
                      <h1 className="text-6xl font-black text-slate-900 mb-6">경로식당 이용증</h1>
                      <div className="w-24 h-2.5 bg-indigo-600 mx-auto rounded-full"></div>
                   </div>
                   
                   <div className="my-10 p-4 bg-white border-4 border-slate-100 rounded-[40px]">
                      <QRCodeSVG value={selectedUser.id} size={320} level="H" includeMargin={false} />
                   </div>

                   <div className="w-full">
                      <p className="text-7xl font-black text-slate-900 mb-4 tracking-tighter">{selectedUser.name}</p>
                      <div className="flex justify-center items-center gap-4 text-2xl font-black text-slate-500">
                        <span className="bg-slate-100 px-4 py-1 rounded-xl">NO. {selectedUser.no}</span>
                        <span>{maskPhone(selectedUser.phone)}</span>
                      </div>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-slate-100 w-full text-slate-400 font-bold text-lg italic">
                     이 카드를 스캐너에 보여주세요
                   </div>
                </div>
             </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            background: white !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberManager;
