import React, { useState } from 'react';
import { 
  User, FileText, Heart, ShieldAlert, Sparkles, Send, Plus, 
  Upload, FileCheck, CheckCircle2, AlertCircle, Trash2, HelpCircle 
} from 'lucide-react';
import { Employee, Contract, TaxDependent, HRNotification } from '../types';
import { getDaysRemaining } from '../data';

interface EmployeePanelProps {
  employees: Employee[];
  contracts: Contract[];
  taxDependents: TaxDependent[];
  onUpdateDependents: (newDependents: TaxDependent[]) => void;
  onOpenAssistantWithMessage: (message: string) => void;
}

export default function EmployeePanel({
  employees,
  contracts,
  taxDependents,
  onUpdateDependents,
  onOpenAssistantWithMessage
}: EmployeePanelProps) {
  // Let the user select who they want to act as (to test both normal/expiring users)
  const activeEmployees = employees.filter(e => e.status !== 'Đã nghỉ');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(activeEmployees[1]?.id || activeEmployees[0]?.id || "EMP001");

  // Form states for registering a new dependent
  const [isRegistering, setIsRegistering] = useState(false);
  const [newDepForm, setNewDepForm] = useState({
    name: '',
    relationship: 'Con' as 'Con' | 'Vợ/Chồng' | 'Bố/Mẹ' | 'Khác',
    taxCode: '',
    birthDate: ''
  });

  // Drag and drop states for document uploads
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const currentEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];
  const employeeContracts = contracts.filter(c => c.employeeId === selectedEmpId);
  const employeeDependents = taxDependents.filter(d => d.employeeId === selectedEmpId);

  // Expiration checking for this employee
  const expiringContract = employeeContracts.find(c => {
    const remaining = getDaysRemaining(c.expirationDate);
    return remaining > 0 && remaining <= 30 && c.status !== 'Hết hạn';
  });

  // Handle new dependent submission
  const handleRegisterDependent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepForm.name || !newDepForm.birthDate) return;

    // Simulate standard tax code generation if not provided
    const generatedTaxCode = newDepForm.taxCode || Math.floor(1000000000 + Math.random() * 9000000000).toString();

    const newDep: TaxDependent = {
      id: `NPT${String(taxDependents.length + 1).padStart(3, '0')}`,
      employeeId: selectedEmpId,
      name: newDepForm.name,
      relationship: newDepForm.relationship,
      taxCode: generatedTaxCode,
      birthDate: newDepForm.birthDate,
      status: 'Chờ duyệt' // Submitting requires HR approval
    };

    onUpdateDependents([...taxDependents, newDep]);
    setIsRegistering(false);
    setNewDepForm({
      name: '',
      relationship: 'Con',
      taxCode: '',
      birthDate: ''
    });
    setUploadedFiles([]);
    
    alert("Đã gửi hồ sơ đăng ký Người phụ thuộc lên hệ thống Google Sheets! HR sẽ nhận được thông báo phê duyệt.");
  };

  // Drag and drop file upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileList = Array.from(e.dataTransfer.files);
      const fileNames = fileList.map((f: any) => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileList = Array.from(e.target.files);
      const fileNames = fileList.map((f: any) => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  // Quick helper question
  const askProcedure = () => {
    onOpenAssistantWithMessage(`Tôi là ${currentEmployee.name}. Tôi muốn biết thủ tục hồ sơ chứng từ cần thiết để đăng ký người phụ thuộc giảm trừ gia cảnh cho đối tượng là "${newDepForm.relationship}".`);
  };

  const askAboutMyContract = (contractId: string) => {
    onOpenAssistantWithMessage(`Tôi là ${currentEmployee.name}. Tôi thấy hợp đồng số ${contractId} của mình sắp hết hạn. Tôi cần làm những thủ tục gì tiếp theo để gia hạn hoặc ký tiếp?`);
  };

  return (
    <div className="space-y-6">
      {/* Employee Switcher bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <User className="text-blue-400" size={20} />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Đang xem chế độ Nhân viên:</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value);
              setIsRegistering(false);
              setUploadedFiles([]);
            }}
            className="flex-1 sm:w-64 bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-500"
          >
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.role} - {emp.department})
              </option>
            ))}
          </select>
          <span className="bg-blue-600/30 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[10px] font-bold shrink-0">
            Môi trường Demo
          </span>
        </div>
      </div>

      {/* Contract Warning Alert for active employee */}
      {expiringContract && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm flex items-start justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-red-900 text-sm">
                Cảnh báo Hạn hợp đồng lao động!
              </h4>
              <p className="text-xs text-red-700 mt-1">
                Hợp đồng lao động hiện tại của bạn ({expiringContract.id}) sẽ hết hạn vào ngày <strong>{expiringContract.expirationDate}</strong> (Còn {getDaysRemaining(expiringContract.expirationDate)} ngày).
              </p>
            </div>
          </div>
          <button
            onClick={() => askAboutMyContract(expiringContract.id)}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shrink-0 transition-colors"
          >
            <Sparkles size={12} />
            Hỏi Trợ lý gia hạn &rarr;
          </button>
        </div>
      )}

      {/* Main Grid: Profile & Contacts / Dependents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Personal Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="text-center pb-6 border-b border-slate-100">
              <div className="h-20 w-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4 border-4 border-slate-100">
                {currentEmployee.name.split(' ').pop()?.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{currentEmployee.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">Mã nhân viên: {currentEmployee.id}</p>
              <span className="inline-block mt-3 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold rounded-full">
                {currentEmployee.status}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Phòng ban:</span>
                <span className="text-slate-700 font-semibold text-sm">{currentEmployee.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Chức danh công việc:</span>
                <span className="text-slate-700 font-semibold">{currentEmployee.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Địa chỉ email:</span>
                <span className="text-slate-700 font-mono">{currentEmployee.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Điện thoại liên hệ:</span>
                <span className="text-slate-700 font-mono">{currentEmployee.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ngày vào làm:</span>
                <span className="text-slate-700 font-mono">{currentEmployee.startDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mức lương cơ sở:</span>
                <span className="text-slate-800 font-bold font-mono text-sm">
                  {(currentEmployee.salary).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Contracts & Tax Dependents */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Contracts Section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="text-slate-400" size={16} />
              Lịch sử Hợp đồng Lao động
            </h4>

            <div className="space-y-3">
              {employeeContracts.map((contract) => {
                const isExpiring = getDaysRemaining(contract.expirationDate) <= 30;
                return (
                  <div key={contract.id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/40 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{contract.type}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({contract.id})</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Ngày ký: {contract.signedDate} • Hết hạn: {contract.expirationDate}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          contract.status === 'Hiệu lực' ? 'bg-green-50 text-green-700' :
                          contract.status === 'Sắp hết hạn' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {contract.status}
                        </span>
                        
                        <span className="text-xs font-mono font-bold text-slate-800">
                          {(contract.salary).toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax Dependents Section */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Heart className="text-slate-400" size={16} />
                Danh sách Người phụ thuộc (Thuế TNCN)
              </h4>
              
              {!isRegistering && (
                <button
                  onClick={() => setIsRegistering(true)}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Plus size={12} />
                  Đăng ký người phụ thuộc
                </button>
              )}
            </div>

            {/* List of registered dependents */}
            {!isRegistering ? (
              <div className="space-y-3">
                {employeeDependents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Bạn chưa đăng ký người phụ thuộc nào.</p>
                ) : (
                  employeeDependents.map((dep) => (
                    <div key={dep.id} className="border border-slate-100 rounded-xl p-4 flex justify-between items-center hover:bg-slate-50/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{dep.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {dep.relationship}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          MST: {dep.taxCode || "Chưa cấp"} • Ngày sinh: {dep.birthDate}
                        </p>
                      </div>

                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dep.status === 'Đã duyệt' ? 'bg-green-50 text-green-700' :
                          dep.status === 'Chờ duyệt' ? 'bg-pink-50 text-pink-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {dep.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Form for registration
              <form onSubmit={handleRegisterDependent} className="space-y-4 border border-blue-50 bg-blue-50/10 p-5 rounded-xl animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h5 className="text-xs font-bold text-blue-900 uppercase">Khai báo Người phụ thuộc mới</h5>
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hủy
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-600 block mb-1">Họ và tên người phụ thuộc</label>
                    <input
                      type="text"
                      required
                      value={newDepForm.name}
                      onChange={(e) => setNewDepForm({...newDepForm, name: e.target.value})}
                      placeholder="Nguyễn Văn B"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Mối quan hệ</label>
                    <select
                      value={newDepForm.relationship}
                      onChange={(e) => setNewDepForm({...newDepForm, relationship: e.target.value as any})}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500"
                    >
                      <option value="Con">Con cái</option>
                      <option value="Vợ/Chồng">Vợ hoặc Chồng</option>
                      <option value="Bố/Mẹ">Bố hoặc Mẹ</option>
                      <option value="Khác">Khác (anh/chị/em, người giám hộ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      required
                      value={newDepForm.birthDate}
                      onChange={(e) => setNewDepForm({...newDepForm, birthDate: e.target.value})}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 block mb-1">Mã số thuế NPT (Nếu đã có)</label>
                      <button
                        type="button"
                        onClick={askProcedure}
                        className="text-[10px] text-blue-700 hover:underline flex items-center gap-0.5"
                      >
                        <HelpCircle size={10} /> Hỏi thủ tục và giấy tờ cần nộp
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newDepForm.taxCode}
                      onChange={(e) => setNewDepForm({...newDepForm, taxCode: e.target.value})}
                      placeholder="Nếu chưa có, Cơ quan Thuế sẽ tự cấp sau khi duyệt"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Usability Pattern: Drag and drop file upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">Tải lên chứng từ đính kèm (Giấy khai sinh, Đăng ký kết hôn...)</label>
                  
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                    <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                    <p className="text-xs text-slate-600">
                      Kéo thả tài liệu của bạn vào đây, hoặc{' '}
                      <label htmlFor="file-upload" className="text-blue-700 font-semibold cursor-pointer hover:underline">
                        chọn từ máy tính
                      </label>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ PDF, PNG, JPG (Tối đa 5MB)</p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileCheck size={12} className="text-green-600" /> Tệp đã sẵn sàng đính kèm ({uploadedFiles.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {uploadedFiles.map((name, i) => (
                          <span key={i} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[10px] font-medium text-slate-600 flex items-center gap-1 shadow-xs">
                            {name}
                            <button 
                              type="button" 
                              onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:text-red-700 ml-1 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-4 py-2 rounded-lg"
                  >
                    Nộp đơn đăng ký
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
