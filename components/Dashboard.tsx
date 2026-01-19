
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Users, Calendar, RefreshCcw } from 'lucide-react';
import { Card } from './UI';

interface DashboardProps {
  users: User[];
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ users, onRefresh }) => {
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const totalUsers = users.length;
  
  const getKSTDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-CA'); 
  };

  const todayDisplay = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' 
  });

  const calculateAttendance = () => {
    const todayKey = getKSTDate();
    const attendance = JSON.parse(localStorage.getItem(`attendance_${todayKey}`) || '[]');
    setTodayAttendanceCount(attendance.length);
  };

  useEffect(() => {
    calculateAttendance();
    window.addEventListener('storage', calculateAttendance);
    const interval = setInterval(calculateAttendance, 2000);
    return () => {
      window.removeEventListener('storage', calculateAttendance);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-slate-800">현황판</h2>
          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{todayDisplay}</p>
        </div>
        <button onClick={onRefresh} className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:rotate-180 duration-500">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-600 text-white border-none shadow-indigo-100 shadow-xl !p-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">등록 인원</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">{totalUsers}</span>
              <span className="text-sm font-bold text-indigo-200">명</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="w-10 h-10 bg-indigo-500/50 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-xl !p-6 bg-white">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">오늘 이용</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-800">{todayAttendanceCount}</span>
              <span className="text-sm font-bold text-slate-400">명</span>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
              <Calendar size={20} />
            </div>
          </div>
        </Card>
      </div>

      <h3 className="text-sm font-black text-slate-800 mt-8 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
        최근 등록 회원
      </h3>
      <div className="space-y-3">
        {users.slice(0, 3).map((user) => (
          <Card key={`${user.no}-${user.name}`} className="!p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-none shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-lg">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-800">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400">{user.district} · {user.birthdate}</p>
              </div>
            </div>
            <div className="text-slate-300 font-black text-xs">NO.{user.no}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
