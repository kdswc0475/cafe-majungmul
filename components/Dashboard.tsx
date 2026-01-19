
import React from 'react';
import { User } from '../types';
import { Users, Calendar, ArrowUpRight, History, RefreshCcw } from 'lucide-react';
import { Card, Button } from './UI';

interface DashboardProps {
  users: User[];
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ users, onRefresh }) => {
  const totalUsers = users.length;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 space-y-4">
      {/* Welcome & Stats */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold">대시보드</h2>
          <p className="text-xs text-slate-500">{today}</p>
        </div>
        <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">전체 등록 인원</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black">{totalUsers}</span>
              <span className="text-xs font-medium text-indigo-200">명</span>
            </div>
          </div>
          <div className="mt-4 p-2 bg-indigo-500/50 rounded-lg flex items-center justify-center">
            <Users size={24} />
          </div>
        </Card>

        <Card className="border-indigo-100">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">오늘 이용 현황</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">-</span>
              <span className="text-xs font-medium text-slate-400">명</span>
            </div>
          </div>
          <div className="mt-4 p-2 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            <Calendar size={24} />
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <h3 className="text-sm font-bold text-slate-600 mt-6 mb-2 flex items-center gap-2">
        <History size={16} /> 최근 등록 이용자
      </h3>
      <div className="space-y-2">
        {users.slice(-3).reverse().map((user) => (
          <Card key={user.id} className="!p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.joinedAt}</p>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-slate-300" />
          </Card>
        ))}
        {users.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
            등록된 회원이 없습니다.
          </div>
        )}
      </div>

      <Card className="mt-6 bg-amber-50 border-amber-100">
        <div className="flex gap-3">
          <div className="text-amber-500">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">QR 스캔 팁</h4>
            <p className="text-xs text-amber-800/70 mt-1">
              스캔 화면에서 이용자의 QR코드를 인식하면 자동으로 출석 체크가 진행됩니다.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
