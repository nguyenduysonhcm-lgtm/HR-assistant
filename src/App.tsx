import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Bot, HelpCircle, Users, FileText, Heart, Sparkles, 
  Settings, RefreshCw, LayoutDashboard, UserCheck, AlertTriangle
} from 'lucide-react';
import { Employee, Contract, TaxDependent, HRNotification } from './types';
import AdminPanel from './components/AdminPanel';
import EmployeePanel from './components/EmployeePanel';
import SmartAssistant from './components/SmartAssistant';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [taxDependents, setTaxDependents] = useState<TaxDependent[]>([]);
  const [notifications, setNotifications] = useState<HRNotification[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // App settings/modes
  const [activeRole, setActiveRole] = useState<'admin' | 'employee'>('admin');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMsg, setAssistantMsg] = useState('');

  // Fetch initial state from Express backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hr/data');
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu từ máy chủ.');
      }
      const data = await response.json();
      setEmployees(data.employees || []);
      setContracts(data.contracts || []);
      setTaxDependents(data.taxDependents || []);
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update data and synchronize with backend
  const handleUpdateData = async (
    newEmployees: Employee[],
    newContracts: Contract[],
    newTaxDependents: TaxDependent[],
    newNotifications: HRNotification[]
  ) => {
    // Optimistic UI update
    setEmployees(newEmployees);
    setContracts(newContracts);
    setTaxDependents(newTaxDependents);
    setNotifications(newNotifications);
    
    setSyncing(true);
    try {
      const response = await fetch('/api/hr/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees: newEmployees,
          contracts: newContracts,
          taxDependents: newTaxDependents,
          notifications: newNotifications
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi đồng bộ dữ liệu với hệ thống lưu trữ.');
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`⚠️ Không thể lưu trữ: ${err.message}. Đang lưu cục bộ trong phiên này.`);
    } finally {
      setSyncing(false);
    }
  };

  // Helper when employee data changes independently (e.g. adding dependent)
  const handleUpdateDependents = (newTaxDependents: TaxDependent[]) => {
    // Recompute notifications
    const recomputedNotifs = generateNotificationsLocal(contracts, newTaxDependents);
    handleUpdateData(employees, contracts, newTaxDependents, recomputedNotifs);
  };

  // Local helper to recompute notifications
  const generateNotificationsLocal = (conList: Contract[], depList: TaxDependent[]): HRNotification[] => {
    const notifs: HRNotification[] = [];
    const currentDateStr = "2026-07-14";
    
    conList.forEach(c => {
      const expDate = new Date(c.expirationDate);
      const curDate = new Date(currentDateStr);
      const remaining = Math.ceil((expDate.getTime() - curDate.getTime()) / (1000 * 3600 * 24));
      
      if (remaining > 0 && remaining <= 30 && c.status !== 'Hết hạn') {
        notifs.push({
          id: `NOT_CON_${c.id}`,
          type: "contract_warning",
          title: "Cảnh báo Hạn hợp đồng",
          message: `Hợp đồng ${c.id} của nhân viên mã ${c.employeeId} sẽ hết hạn sau ${remaining} ngày (${c.expirationDate}).`,
          date: `${currentDateStr} 08:00`,
          isRead: false,
          targetId: c.id
        });
      }
    });

    depList.forEach(d => {
      if (d.status === "Chờ duyệt") {
        notifs.push({
          id: `NOT_DEP_${d.id}`,
          type: "tax_pending",
          title: "Yêu cầu duyệt người phụ thuộc",
          message: `Người phụ thuộc ${d.name} (${d.relationship}) đăng ký bởi nhân viên ${d.employeeId} đang chờ phê duyệt.`,
          date: `${currentDateStr} 09:30`,
          isRead: false,
          targetId: d.employeeId
        });
      }
    });

    return notifs.sort((a, b) => b.date.localeCompare(a.date));
  };

  // Open the Gemini Smart Assistant with a pre-filled prompt
  const handleOpenAssistantWithMessage = (message: string) => {
    setAssistantMsg(message);
    setIsAssistantOpen(true);
    // Auto clear after passing down so it doesn't re-trigger
    setTimeout(() => setAssistantMsg(''), 100);
  };

  // Calculate quick indicators for context
  const contextStats = {
    employeesCount: employees.length,
    expiringContractsCount: contracts.filter(c => {
      const expDate = new Date(c.expirationDate);
      const curDate = new Date("2026-07-14");
      const remaining = Math.ceil((expDate.getTime() - curDate.getTime()) / (1000 * 3600 * 24));
      return remaining > 0 && remaining <= 30 && c.status !== 'Hết hạn';
    }).length,
    pendingDependentsCount: taxDependents.filter(d => d.status === 'Chờ duyệt').length
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Primary Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-700 p-2 rounded-xl text-white shadow-sm shadow-blue-500/20">
              <Bot size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
                HR Smart Assistant
                <span className="text-[10px] bg-blue-900 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-800">
                  v1.2
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">Hệ thống đồng bộ Google Sheets</p>
            </div>
          </div>

          {/* Subsystem switcher & Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-center">
              <button
                onClick={() => setActiveRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'admin'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                id="btn-subsystem-admin"
              >
                <LayoutDashboard size={13} />
                <span className="hidden sm:inline">Phân hệ</span> Admin HR
              </button>
              <button
                onClick={() => setActiveRole('employee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'employee'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                id="btn-subsystem-user"
              >
                <UserCheck size={13} />
                <span className="hidden sm:inline">Phân hệ</span> Nhân viên
              </button>
            </div>

            {/* Smart Assistant Toggle Button */}
            <button
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isAssistantOpen 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700 hover:border-blue-500/30'
              }`}
              id="btn-toggle-assistant"
            >
              <Sparkles size={14} className={isAssistantOpen ? 'animate-spin' : ''} />
              <span>Trợ lý AI</span>
            </button>
          </div>

        </div>
      </header>

      {/* Connection status bar */}
      <div className="bg-slate-100 border-b border-slate-200/60 px-4 py-2 text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
            <span>Cơ sở dữ liệu: <strong>Google Sheets</strong> (Employees, Contracts, Tax_Dependents)</span>
            {syncing && (
              <span className="flex items-center gap-1 text-blue-600 ml-2">
                <RefreshCw size={10} className="animate-spin" /> Đang đồng bộ...
              </span>
            )}
          </div>
          <div className="font-mono">
            Phiên làm việc: 14/07/2026
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex gap-6 overflow-hidden">
        
        {/* Left Side: Active Subsystem Dashboard */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={32} className="animate-spin text-blue-700" />
              <p className="text-sm font-semibold text-slate-500">Đang khởi tạo HR Smart Assistant...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center space-y-4 max-w-md mx-auto mt-12">
              <AlertTriangle className="text-red-600 mx-auto" size={36} />
              <h3 className="font-bold text-red-900">Không thể tải ứng dụng</h3>
              <p className="text-xs text-red-700">{error}</p>
              <button 
                onClick={fetchData}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Thử lại
              </button>
            </div>
          ) : activeRole === 'admin' ? (
            <AdminPanel
              employees={employees}
              contracts={contracts}
              taxDependents={taxDependents}
              notifications={notifications}
              onUpdateData={handleUpdateData}
              onOpenAssistantWithMessage={handleOpenAssistantWithMessage}
            />
          ) : (
            <EmployeePanel
              employees={employees}
              contracts={contracts}
              taxDependents={taxDependents}
              onUpdateDependents={handleUpdateDependents}
              onOpenAssistantWithMessage={handleOpenAssistantWithMessage}
            />
          )}
        </div>

        {/* Right Side: Collapsible Gemini Assistant Sidebar */}
        {isAssistantOpen && (
          <div className="w-96 shrink-0 hidden lg:block h-[calc(100vh-10rem)] sticky top-24">
            <SmartAssistant
              context={contextStats}
              onClose={() => setIsAssistantOpen(false)}
              prepopulatedMessage={assistantMsg}
            />
          </div>
        )}
      </main>

      {/* Mobile Floating Assistant Modal when Open */}
      {isAssistantOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden p-4 flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-md h-[85vh]">
            <SmartAssistant
              context={contextStats}
              onClose={() => setIsAssistantOpen(false)}
              prepopulatedMessage={assistantMsg}
            />
          </div>
        </div>
      )}

      {/* Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">HR Smart Assistant © 2026</p>
          <p className="text-[10px] text-slate-500 max-w-lg mx-auto">
            Hệ thống Quản lý Nhân sự & Giảm trừ gia cảnh Thuế TNCN. Tích hợp giải pháp AI Studio phục vụ vận hành doanh nghiệp Clean & Professional.
          </p>
        </div>
      </footer>
    </div>
  );
}
