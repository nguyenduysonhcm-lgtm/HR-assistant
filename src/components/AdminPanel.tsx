import React, { useState } from 'react';
import { 
  Users, FileText, Heart, ShieldAlert, Filter, Search, Plus, Edit2, 
  Trash2, Check, Mail, UserPlus
} from 'lucide-react';
import { Employee, Contract, TaxDependent, HRNotification } from '../types';
import { getDaysRemaining, generateNotifications } from '../data';

interface AdminPanelProps {
  employees: Employee[];
  contracts: Contract[];
  taxDependents: TaxDependent[];
  notifications: HRNotification[];
  onUpdateData: (
    newEmployees: Employee[],
    newContracts: Contract[],
    newTaxDependents: TaxDependent[],
    newNotifications: HRNotification[]
  ) => void;
  onOpenAssistantWithMessage: (message: string) => void;
}

export default function AdminPanel({
  employees,
  contracts,
  taxDependents,
  notifications,
  onUpdateData,
  onOpenAssistantWithMessage
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'contracts' | 'dependents' | 'alerts'>('employees');
  const [deptFilter, setDeptFilter] = useState<string>('Tất cả');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [addingEmployeeForm, setAddingEmployeeForm] = useState({
    name: '',
    department: 'Kỹ thuật',
    status: 'Thử việc' as 'Hoạt động' | 'Thử việc' | 'Đã nghỉ',
    email: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    role: '',
    salary: 10000000
  });

  const [isAddingContract, setIsAddingContract] = useState<string | null>(null);
  const [addingContractForm, setAddingContractForm] = useState({
    type: 'Xác định thời hạn' as 'Thử việc' | 'Xác định thời hạn' | 'Không xác định thời hạn',
    signedDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    salary: 12000000
  });

  const departments = ['Tất cả', ...Array.from(new Set(employees.map(emp => emp.department)))];

  const expiringContracts = contracts.filter(c => {
    const remaining = getDaysRemaining(c.expirationDate);
    return remaining > 0 && remaining <= 30 && c.status !== 'Hết hạn';
  });

  const pendingDependents = taxDependents.filter(d => d.status === 'Chờ duyệt');

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = deptFilter === 'Tất cả' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'Tất cả' || emp.status === statusFilter;
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery);
    return matchesDept && matchesStatus && matchesSearch;
  });

  // Sinh mã tự động dựa trên số lớn nhất hiện có, tránh trùng mã khi đã xóa bản ghi
  const getNextId = (items: { id: string }[], prefix: string, padLength: number) => {
    const maxNum = items.reduce((max, item) => {
      const match = item.id.match(new RegExp(`^${prefix}(\\d+)$`));
      const num = match ? parseInt(match[1], 10) : 0;
      return Math.max(max, num);
    }, 0);
    return `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
  };

  const handleAddEmployee = () => {
    const newEmpId = getNextId(employees, 'EMP', 3);
    const newEmployee: Employee = {
      id: newEmpId,
      ...addingEmployeeForm
    };

    const updatedEmployees = [...employees, newEmployee];
    
    const newContractId = getNextId(contracts, 'HD', 3);
    const isProbation = addingEmployeeForm.status === 'Thử việc';
    const newContract: Contract = {
      id: newContractId,
      employeeId: newEmpId,
      type: isProbation ? 'Thử việc' : 'Xác định thời hạn',
      signedDate: addingEmployeeForm.startDate,
      expirationDate: isProbation 
        ? new Date(new Date(addingEmployeeForm.startDate).getTime() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0]
        : new Date(new Date(addingEmployeeForm.startDate).getTime() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      salary: addingEmployeeForm.salary,
      status: 'Hiệu lực'
    };

    const daysRemaining = getDaysRemaining(newContract.expirationDate);
    if (daysRemaining > 0 && daysRemaining <= 30) {
      newContract.status = 'Sắp hết hạn';
    } else if (daysRemaining <= 0) {
      newContract.status = 'Hết hạn';
    }

    const updatedContracts = [...contracts, newContract];
    
    const updatedNotifications = generateNotifications(updatedContracts, taxDependents);

    onUpdateData(updatedEmployees, updatedContracts, taxDependents, updatedNotifications);
    setIsAddingEmployee(false);
    setAddingEmployeeForm({
      name: '',
      department: 'Kỹ thuật',
      status: 'Thử việc',
      email: '',
      phone: '',
      startDate: new Date().toISOString().split('T')[0],
      role: '',
      salary: 10000000
    });
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;
    const updatedEmployees = employees.map(emp => 
      emp.id === editingEmployee.id ? editingEmployee : emp
    );
    onUpdateData(updatedEmployees, contracts, taxDependents, notifications);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên ${id}? Các hợp đồng và người phụ thuộc liên quan cũng sẽ bị ảnh hưởng.`)) {
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      const updatedContracts = contracts.filter(c => c.employeeId !== id);
      const updatedDependents = taxDependents.filter(d => d.employeeId !== id);
      const updatedNotifications = generateNotifications(updatedContracts, updatedDependents);
      onUpdateData(updatedEmployees, updatedContracts, updatedDependents, updatedNotifications);
    }
  };

  const handleApproveDependent = (depId: string) => {
    const updatedDependents = taxDependents.map(dep => 
      dep.id === depId ? { ...dep, status: 'Đã duyệt' as const } : dep
    );
    const updatedNotifications = generateNotifications(contracts, updatedDependents);
    onUpdateData(employees, contracts, updatedDependents, updatedNotifications);
  };

  const handleRequestDocsDependent = (depId: string) => {
    const updatedDependents = taxDependents.map(dep => 
      dep.id === depId ? { ...dep, status: 'Yêu cầu bổ sung' as const } : dep
    );
    const updatedNotifications = generateNotifications(contracts, updatedDependents);
    onUpdateData(employees, contracts, updatedDependents, updatedNotifications);
  };

  const handleAddContract = () => {
    if (!isAddingContract) return;
    const newContractId = getNextId(contracts, 'HD', 3);
    
    const newContract: Contract = {
      id: newContractId,
      employeeId: isAddingContract,
      ...addingContractForm,
      status: 'Hiệu lực'
    };

    const daysRemaining = getDaysRemaining(newContract.expirationDate);
    if (daysRemaining > 0 && daysRemaining <= 30) {
      newContract.status = 'Sắp hết hạn';
    } else if (daysRemaining <= 0) {
      newContract.status = 'Hết hạn';
    }

    const updatedContracts = [...contracts, newContract];
    const updatedNotifications = generateNotifications(updatedContracts, taxDependents);
    
    onUpdateData(employees, updatedContracts, taxDependents, updatedNotifications);
    setIsAddingContract(null);
    setAddingContractForm({
      type: 'Xác định thời hạn',
      signedDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      salary: 12000000
    });
  };

  const triggerBotDraft = (contract: Contract, empName: string) => {
    const message = `Hãy soạn một Email thông báo gia hạn hợp đồng lao động gửi cho nhân viên ${empName} (Mã NV: ${contract.employeeId}). Hợp đồng hiện tại loại "${contract.type}" số ${contract.id} sẽ hết hạn vào ngày ${contract.expirationDate}. Hãy đưa ra gợi ý gia hạn thêm 12 tháng với mức lương hiện tại là ${(contract.salary / 1000000).toFixed(1)} triệu VND. Trình bày email chuyên nghiệp, lịch sự, có lời chúc và chỗ ký nhận.`;
    onOpenAssistantWithMessage(message);
  };

  return (
    <div className="space-y-6">
      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3 animate-pulse">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 text-sm">
              Bot Tự Động HR: Phát hiện {expiringContracts.length} hợp đồng sắp hết hạn (&lt; 30 ngày)
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Hệ thống đã tự động ghi nhận danh sách hợp đồng cần xử lý gia hạn để tránh rủi ro pháp lý theo Luật lao động.
            </p>
            <button 
              onClick={() => setActiveTab('alerts')}
              className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline mt-2 flex items-center gap-1"
            >
              Xem ngay và kích hoạt Bot soạn thảo mẫu thông báo &rarr;
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Nhân viên</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{employees.length}</h3>
            <p className="text-[10px] text-green-600 font-medium mt-0.5">
              {employees.filter(e => e.status === 'Hoạt động').length} đang làm việc
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-lg">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tổng Hợp đồng</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{contracts.length}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {contracts.filter(c => c.status === 'Hiệu lực').length} đang hiệu lực
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 text-amber-700 p-3 rounded-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hợp đồng hết hạn/sắp hết</p>
            <h3 className="text-2xl font-bold text-amber-700 mt-0.5">
              {contracts.filter(c => c.status === 'Sắp hết hạn' || c.status === 'Hết hạn').length}
            </h3>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">
              {expiringContracts.length} Hợp đồng &lt; 30 ngày
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-pink-50 text-pink-700 p-3 rounded-lg">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Người phụ thuộc</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{taxDependents.length}</h3>
            <p className="text-[10px] text-pink-600 font-medium mt-0.5">
              {pendingDependents.length} hồ sơ chờ duyệt
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'employees' 
                ? 'border-blue-700 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            Hồ sơ Nhân viên
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'contracts' 
                ? 'border-blue-700 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} />
            Hợp đồng Lao động
          </button>
          <button
            onClick={() => setActiveTab('dependents')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'dependents' 
                ? 'border-blue-700 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart size={16} />
            Người phụ thuộc ({pendingDependents.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all relative ${
              activeTab === 'alerts' 
                ? 'border-blue-700 text-blue-700 bg-white' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert size={16} />
            Bot Cảnh báo &lt; 30 Ngày
            {expiringContracts.length > 0 && (
              <span className="absolute top-3 right-2 h-4 w-4 bg-amber-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {expiringContracts.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'employees' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
              <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <Filter size={14} /> Lọc theo:
                </div>
                
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:border-blue-500 outline-none"
                >
                  {departments.map((dept, i) => (
                    <option key={i} value={dept}>{dept === 'Tất cả' ? 'Tất cả phòng ban' : dept}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:border-blue-500 outline-none"
                >
                  <option value="Tất cả">Tất cả trạng thái</option>
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Thử việc">Thử việc</option>
                  <option value="Đã nghỉ">Đã nghỉ</option>
                </select>
              </div>

              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <div className="relative flex-1 md:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm họ tên, email, SĐT..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs border border-slate-200 rounded-lg focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <button
                  onClick={() => setIsAddingEmployee(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-700/10 transition-all"
                >
                  <UserPlus size={14} />
                  Thêm nhân viên
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Mã NV</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Họ và Tên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Phòng ban</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Chức vụ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Ngày vào làm</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Mức lương</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-500">{emp.id}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-xs text-slate-800">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{emp.email} • {emp.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">{emp.department}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{emp.role}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{emp.startDate}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-slate-700 font-semibold">
                        {(emp.salary / 1000000).toFixed(1)}M VNĐ
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          emp.status === 'Hoạt động' ? 'bg-green-50 text-green-700 border border-green-200' :
                          emp.status === 'Thử việc' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setIsAddingContract(emp.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Thêm hợp đồng mới"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Xóa hồ sơ"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        Không tìm thấy hồ sơ nhân viên nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="p-6">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Số HĐ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Nhân viên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Phân loại</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Ngày ký</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Hạn Hợp Đồng</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Mức lương HĐ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Thời hạn còn lại</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((contract) => {
                    const employee = employees.find(e => e.id === contract.employeeId);
                    const daysRemaining = getDaysRemaining(contract.expirationDate);
                    
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-500">{contract.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-xs text-slate-800">{employee?.name || "N/A"}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Mã NV: {contract.employeeId}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">{contract.type}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{contract.signedDate}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-mono font-semibold">{contract.expirationDate}</td>
                        <td className="px-4 py-3.5 text-xs font-mono text-slate-700">
                          {(contract.salary / 1000000).toFixed(1)}M VNĐ
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium">
                          {daysRemaining <= 0 ? (
                            <span className="text-red-600">Đã hết hạn</span>
                          ) : (
                            <span className={daysRemaining <= 30 ? "text-amber-600 font-bold" : "text-slate-600"}>
                              {daysRemaining} ngày
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            contract.status === 'Hiệu lực' ? 'bg-green-50 text-green-700 border border-green-200' :
                            contract.status === 'Sắp hết hạn' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                            'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {contract.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dependents' && (
          <div className="p-6">
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Mã</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Người nộp thuế</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Người phụ thuộc</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Quan hệ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Mã số thuế NPT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Ngày sinh</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Hồ sơ</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">Phê duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {taxDependents.map((dep) => {
                    const employee = employees.find(e => e.id === dep.employeeId);
                    return (
                      <tr key={dep.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-500">{dep.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-xs text-slate-800">{employee?.name || "N/A"}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Mã NV: {dep.employeeId}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-800 font-semibold">{dep.name}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-600">{dep.relationship}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{dep.taxCode || "Chưa có"}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{dep.birthDate}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            dep.status === 'Đã duyệt' ? 'bg-green-50 text-green-700 border border-green-200' :
                            dep.status === 'Chờ duyệt' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {dep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {dep.status === 'Chờ duyệt' ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApproveDependent(dep.id)}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-2.5 py-1 rounded flex items-center gap-0.5"
                              >
                                <Check size={12} />
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleRequestDocsDependent(dep.id)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-2.5 py-1 rounded flex items-center gap-0.5"
                              >
                                Yêu cầu bổ sung
                              </button>
                            </div>
                          ) : dep.status === 'Yêu cầu bổ sung' ? (
                            <button
                              onClick={() => handleApproveDependent(dep.id)}
                              className="bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs px-2.5 py-1 rounded flex items-center gap-0.5 ml-auto"
                            >
                              Phê duyệt sau BS
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Không có thao tác</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-base flex items-center gap-2 text-amber-400">
                  <ShieldAlert /> Bot Tự Động HR &lt; 30 Ngày
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Tính năng tự động quét cột 'Hạn_Hợp_Đồng' của bảng Contracts. 
                  Khi còn dưới 30 ngày, Bot sẽ kích hoạt cảnh báo nổi bật và hỗ trợ HR soạn thảo nội dung gửi email thông báo trực tiếp qua trợ lý AI.
                </p>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
                <span className="text-xs text-slate-400 block font-medium uppercase">Trạng thái Bot</span>
                <span className="text-xs font-bold text-green-400 flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 bg-green-400 rounded-full inline-block animate-ping"></span>
                  Đang hoạt động (Auto)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Danh sách hợp đồng cảnh báo ({expiringContracts.length})</h5>
              
              {expiringContracts.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  Tuyệt vời! Hiện không có hợp đồng lao động nào sắp hết hạn trong 30 ngày tới.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expiringContracts.map((contract) => {
                    const employee = employees.find(e => e.id === contract.employeeId);
                    const daysRemaining = getDaysRemaining(contract.expirationDate);
                    
                    return (
                      <div key={contract.id} className="bg-white hover:border-amber-300 border border-slate-200 rounded-xl p-4 shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold text-[10px] rounded border border-amber-200">
                                Sắp hết hạn
                              </span>
                              <h6 className="font-bold text-sm text-slate-800 mt-2">{employee?.name}</h6>
                              <p className="text-xs text-slate-500">{employee?.department} • {employee?.role}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-400">{contract.id}</span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                            <div>
                              <span className="text-slate-400 block">Hạn hợp đồng:</span>
                              <span className="font-semibold text-slate-700 font-mono">{contract.expirationDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Thời gian còn lại:</span>
                              <span className="font-bold text-amber-600 font-mono animate-pulse">{daysRemaining} ngày</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => triggerBotDraft(contract, employee?.name || "Nhân viên")}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Mail size={13} />
                            Bot soạn mẫu Email
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isAddingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-semibold text-base flex items-center gap-1.5">
                <Plus size={18} /> Thêm nhân viên mới
              </h3>
              <button 
                onClick={() => setIsAddingEmployee(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={addingEmployeeForm.name}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, name: e.target.value})}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Phòng ban</label>
                  <select
                    value={addingEmployeeForm.department}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, department: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Hành chính Nhân sự">Hành chính Nhân sự</option>
                    <option value="Kỹ thuật">Kỹ thuật</option>
                    <option value="Kinh doanh">Kinh doanh</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Trạng thái hồ sơ</label>
                  <select
                    value={addingEmployeeForm.status}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, status: e.target.value as any})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Thử việc">Thử việc (Auto tạo HĐ thử việc 60 ngày)</option>
                    <option value="Hoạt động">Hoạt động (Auto tạo HĐ 1 năm)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Mã email</label>
                  <input
                    type="email"
                    value={addingEmployeeForm.email}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, email: e.target.value})}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={addingEmployeeForm.phone}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, phone: e.target.value})}
                    placeholder="09xxxxxxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Chức vụ</label>
                  <input
                    type="text"
                    value={addingEmployeeForm.role}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, role: e.target.value})}
                    placeholder="Chuyên viên..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Mức lương (VNĐ)</label>
                  <input
                    type="number"
                    value={addingEmployeeForm.salary}
                    onChange={(e) => setAddingEmployeeForm({...addingEmployeeForm, salary: parseInt(e.target.value) || 0})}
                    placeholder="Mức lương"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button 
                onClick={() => setIsAddingEmployee(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddEmployee}
                disabled={!addingEmployeeForm.name}
                className="bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Lưu hồ sơ &amp; Tạo HĐ
              </button>
            </div>
          </div>
        </div>
      )}

      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-semibold text-base flex items-center gap-1.5">
                <Edit2 size={18} /> Chỉnh sửa hồ sơ: {editingEmployee.id}
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-600 block mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Phòng ban</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({...editingEmployee, department: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Hành chính Nhân sự">Hành chính Nhân sự</option>
                    <option value="Kỹ thuật">Kỹ thuật</option>
                    <option value="Kinh doanh">Kinh doanh</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Trạng thái hồ sơ</label>
                  <select
                    value={editingEmployee.status}
                    onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value as any})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Đã nghỉ">Đã nghỉ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    value={editingEmployee.email}
                    onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editingEmployee.phone}
                    onChange={(e) => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Chức vụ</label>
                  <input
                    type="text"
                    value={editingEmployee.role}
                    onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Mức lương (VNĐ)</label>
                  <input
                    type="number"
                    value={editingEmployee.salary}
                    onChange={(e) => setEditingEmployee({...editingEmployee, salary: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button 
                onClick={() => setEditingEmployee(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleUpdateEmployee}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Cập nhật hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-semibold text-base flex items-center gap-1.5">
                <FileText size={18} /> Thêm Hợp đồng mới cho NV: {isAddingContract}
              </h3>
              <button 
                onClick={() => setIsAddingContract(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Loại hợp đồng</label>
                <select
                  value={addingContractForm.type}
                  onChange={(e) => setAddingContractForm({...addingContractForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Thử việc">Hợp đồng Thử việc</option>
                  <option value="Xác định thời hạn">Hợp đồng Xác định thời hạn (1 - 3 năm)</option>
                  <option value="Không xác định thời hạn">Hợp đồng Không xác định thời hạn</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Ngày ký</label>
                  <input
                    type="date"
                    value={addingContractForm.signedDate}
                    onChange={(e) => setAddingContractForm({...addingContractForm, signedDate: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Hạn Hợp Đồng</label>
                  <input
                    type="date"
                    value={addingContractForm.expirationDate}
                    onChange={(e) => setAddingContractForm({...addingContractForm, expirationDate: e.target.value})}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Mức lương trên HĐ</label>
                <input
                  type="number"
                  value={addingContractForm.salary}
                  onChange={(e) => setAddingContractForm({...addingContractForm, salary: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button 
                onClick={() => setIsAddingContract(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddContract}
                disabled={
                  !addingContractForm.signedDate ||
                  !addingContractForm.expirationDate ||
                  addingContractForm.expirationDate <= addingContractForm.signedDate ||
                  addingContractForm.salary <= 0
                }
                className="bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Lưu Hợp đồng mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
