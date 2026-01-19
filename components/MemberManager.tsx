
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, 
  FileUp, 
  X, 
  Plus, 
  Printer,
  QrCode,
  Calendar,
  Phone,
  Fingerprint,
  User as UserIcon,
  BadgeInfo
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
  const [submitting, setSubmitting] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '' });

  // 전화번호 마스킹 유틸리티 (010-****-1234)
  const maskPhone = (phone: string) => {
    if (!phone || phone === '-' || phone.length < 9) return phone || '-';
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
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.phone || '').includes(searchTerm)
  );

  const handleAddMember = async () => {
    if (!newMember.name) return;
    setSubmitting(true);
    try {
      const user: User = {
        no: users.length + 1,
        id: crypto.randomUUID().split('-')[0].toUpperCase(),
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
      if (window.confirm(`${jsonData.length}명을 일괄 등록하시겠습니까?`)) {
        setSubmitting(true);
        try {
          const bulkUsers: User[] = jsonData.map((item, idx) => ({
            no: users.length + idx + 1,
            id: (item['고유번호'] || item['ID'] || crypto.randomUUID().split('-')[0].toUpperCase()),
            name: item['성함'] || item['이름'] || '이름없음',
            phone: String(item['연락처'] || item['전화번호'] || '-'),
            joinedAt: item['가입일'] || new Date().toLocaleDateString('ko-KR')
          }));
          await batchAddUsers(config, bulkUsers);
          onRefresh();
        } catch (e) {
          alert('오류: ' + e);
        } finally {
          setSubmitting(false);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">이용자 명단</h2>
          <p className="text-xs font-bold text-indigo-600">총 {users.length}명 관리 중</p>
        </div>
        <div className="flex gap-2">
          <label className="bg-white w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <FileUp size={20} className="text-slate-600" />
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <Button onClick={() => setIsAddModalOpen(true)} className="h-12 px-5 rounded-2xl shadow-indigo-100">
            <Plus size={20} /> <span className="hidden sm:inline">등록</span>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          className="pl-12 h-14 rounded-2xl bg-white border-slate-200 shadow-sm" 
          placeholder="이름 또는 연락처 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card 
            key={user.id} 
            className="group active:scale-[0.98] transition-all border-2 border-transparent hover:border-indigo-500 cursor-pointer !p-0 overflow-hidden shadow-sm"
            onClick={() => { setSelectedUser(user); setIsQRModalOpen(true); }}
          >
            <div className="flex">
              <div className="w-1.5 bg-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg border border-indigo-100">
                      {user.no}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-xl leading-none mb-2">{user.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase">ID: {user.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                    <QrCode size={24} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                    <Phone size={14} className="text-indigo-400" />
                    <span>{maskPhone(user.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-indigo-400" />
                    <span>{user.joinedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 !rounded-[40px] animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">회원 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <Input placeholder="성함" className="h-16 text-lg" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              <Input placeholder="연락처 (010-0000-0000)" className="h-16 text-lg" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              <Button fullWidth onClick={handleAddMember} disabled={submitting || !newMember.name} className="h-16 text-xl rounded-2xl">
                {submitting ? '저장 중...' : '등록하기'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 초대형 QR 모달 */}
      {isQRModalOpen && selectedUser && (
        <>
          <div className="fixed inset-0 z-[80] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 print:hidden">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
              <div className="bg-white rounded-[50px] p-10 text-center shadow-2xl relative">
                <button onClick={() => setIsQRModalOpen(false)} className="absolute right-8 top-8 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><X size={28} /></button>
                <div className="mt-6 mb-10">
                  <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 inline-block">관리번호 {selectedUser.no}</span>
                  <h3 className="text-6xl font-black text-slate-900 mb-2">{selectedUser.name}</h3>
                  <p className="text-2xl text-slate-400 font-bold tracking-widest">{maskPhone(selectedUser.phone)}</p>
                </div>
                <div className="bg-white p-6 rounded-[40px] border-2 border-slate-50 shadow-sm inline-block mb-10">
                  <QRCodeSVG value={selectedUser.id} size={300} level="H" />
                </div>
                <Button variant="primary" onClick={() => window.print()} className="h-20 text-2xl font-black rounded-3xl w-full">
                  <Printer size={28} /> 이용증 인쇄하기
                </Button>
              </div>
            </div>
          </div>

          {/* 인쇄 전용 영역 */}
          <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
             <div className="flex flex-col items-center justify-center h-screen">
                <div className="border-[15px] border-slate-900 p-16 rounded-[80px] text-center w-[105mm] h-[148mm] flex flex-col items-center justify-between">
                   <div className="w-full">
                      <p className="text-3xl font-black text-slate-400 mb-2 tracking-[0.3em]">CAFÉ MAJOONGMOOL</p>
                      <h1 className="text-7xl font-black text-slate-900 mb-8">경로식당 이용증</h1>
                      <div className="w-32 h-3 bg-indigo-600 mx-auto rounded-full"></div>
                   </div>
                   <div className="my-8 p-6 bg-white border-[6px] border-slate-900 rounded-[50px]">
                      <QRCodeSVG value={selectedUser.id} size={350} level="H" />
                   </div>
                   <div className="w-full">
                      <p className="text-8xl font-black text-slate-900 mb-4">{selectedUser.name}</p>
                      <div className="flex justify-center gap-6 text-3xl font-black text-slate-500 uppercase">
                        <span className="bg-slate-100 px-6 py-2 rounded-2xl">NO. {selectedUser.no}</span>
                        <span>{maskPhone(selectedUser.phone)}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page { size: auto; margin: 0; }
          body { margin: 0; background: white !important; }
          header, nav, .print-hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MemberManager;
