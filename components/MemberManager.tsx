
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User, AppConfig } from '../types';
import { addUser } from '../services/sheets';
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
  
  const [newMember, setNewMember] = useState<Omit<User, 'no' | 'id'>>({
    name: '', birthdate: '', gender: '여', district: '', address: '', phone: '', type: '수급자'
  });

  // 검색 필터링도 실제 유효 데이터 기반
  const filteredUsers = users.filter(u => 
    (u.name || '').includes(searchTerm) || 
    (u.phone || '').includes(searchTerm) ||
    (u.district || '').includes(searchTerm) ||
    String(u.no).includes(searchTerm)
  );

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.phone || !newMember.birthdate) {
      alert('성함, 생년월일, 연락처는 필수 입력 사항입니다.');
      return;
    }
    setSubmitting(true);
    try {
      // 실제 유효한 회원들 중 가장 높은 번호를 찾음
      const nextNo = users.length > 0 ? Math.max(...users.map(u => u.no)) + 1 : 1;
      const user: User = {
        no: nextNo,
        id: String(nextNo),
        ...newMember
      };
      await addUser(config, user);
      setIsAddModalOpen(false);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 print:hidden">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-[900] text-slate-800 tracking-tight">회원 명단</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
            실제 등록 {users.length}명
            {searchTerm && ` / 검색결과 ${filteredUsers.length}명`}
          </p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="h-12 w-12 !p-0 rounded-2xl">
          <i className="fa-solid fa-user-plus text-xl"></i>
        </Button>
      </div>

      <div className="relative group">
        <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
        <Input 
          className="pl-14 h-16 rounded-[24px] bg-white border-none shadow-sm text-lg font-medium" 
          placeholder="이름, 번호, 연번 검색" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
          <Card 
            key={`${user.no}-${user.name}`} 
            className="group active:scale-[0.98] transition-all border-none hover:shadow-xl cursor-pointer !p-6 !rounded-[32px] flex items-center justify-between bg-white"
            onClick={() => { setSelectedUser(user); setIsQRModalOpen(true); }}
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-[20px] flex items-center justify-center font-black text-lg border border-slate-100 transition-colors">
                {user.no}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-[900] text-slate-900 text-2xl leading-tight">{user.name}</h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${user.gender === '남' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>{user.gender}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-bold text-slate-400">
                  <span className="text-indigo-500">{user.district}</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                  <span>{user.type}</span>
                </div>
              </div>
            </div>
            <div className="text-indigo-600 bg-indigo-50 w-14 h-14 rounded-[22px] flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white">
              <i className="fa-solid fa-qrcode text-2xl"></i>
            </div>
          </Card>
        )) : (
          <div className="text-center py-32 bg-white rounded-[40px] border-4 border-dashed border-slate-50">
             <i className="fa-solid fa-user-slash text-6xl mb-6 text-slate-100"></i>
             <p className="font-black text-slate-300 text-xl">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {isQRModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[80] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-6 print:hidden">
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-300">
            <div className="bg-white rounded-[60px] p-10 text-center shadow-2xl relative">
              <button onClick={() => setIsQRModalOpen(false)} className="absolute right-8 top-8 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark text-xl"></i></button>
              <div className="mt-6 mb-10">
                <h3 className="text-6xl font-[900] text-slate-900 mb-2 tracking-tighter">{selectedUser.name}</h3>
                <p className="text-slate-400 font-black">{selectedUser.birthdate} | {selectedUser.phone}</p>
              </div>
              <div className="bg-white p-6 rounded-[50px] border-2 border-slate-50 shadow-sm inline-block mb-12">
                <QRCodeSVG value={String(selectedUser.no)} size={280} level="H" />
              </div>
              <Button variant="primary" onClick={() => window.print()} className="h-20 text-2xl font-[900] rounded-[30px] w-full shadow-2xl shadow-indigo-100">
                <i className="fa-solid fa-print mr-3"></i> 이용증 인쇄
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <Card className="w-full max-w-sm p-10 !rounded-[50px] shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-[900] text-slate-800">신규 회원 등록</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <Label>성함 (필수)</Label>
                <Input placeholder="홍길동" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>생년월일 (필수)</Label>
                  <Input placeholder="6자리 (450101)" value={newMember.birthdate} onChange={e => setNewMember({...newMember, birthdate: e.target.value})} />
                </div>
                <div>
                  <Label>성별</Label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800"
                    value={newMember.gender} 
                    onChange={e => setNewMember({...newMember, gender: e.target.value})}
                  >
                    <option value="여">여</option>
                    <option value="남">남</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>관할동</Label>
                  <Input placeholder="천호3동" value={newMember.district} onChange={e => setNewMember({...newMember, district: e.target.value})} />
                </div>
                <div>
                  <Label>보호유형</Label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-800"
                    value={newMember.type} 
                    onChange={e => setNewMember({...newMember, type: e.target.value})}
                  >
                    <option value="수급자">수급자</option>
                    <option value="기초연금">기초연금</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>연락처 (필수)</Label>
                <Input placeholder="010-0000-0000" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <div>
                <Label>주소</Label>
                <Input placeholder="상세 주소 입력" value={newMember.address} onChange={e => setNewMember({...newMember, address: e.target.value})} />
              </div>
            </div>
            <Button fullWidth onClick={handleAddMember} disabled={submitting || !newMember.name} className="h-16 text-xl rounded-3xl mt-8">
              {submitting ? <i className="fa-solid fa-spinner animate-spin"></i> : '회원 등록 완료'}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
