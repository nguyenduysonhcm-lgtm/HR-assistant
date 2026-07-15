export interface Employee {
  id: string; // e.g., EMP001
  name: string;
  department: string; // e.g., Hành chính Nhân sự, Kinh doanh, Kỹ thuật, Marketing, v.v.
  status: 'Hoạt động' | 'Thử việc' | 'Đã nghỉ';
  email: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  role: string;
  salary: number; // in VND
}

export interface Contract {
  id: string; // e.g., HD001
  employeeId: string;
  type: 'Thử việc' | 'Xác định thời hạn' | 'Không xác định thời hạn';
  signedDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD (Hạn_Hợp_Đồng)
  salary: number; // in VND
  status: 'Hiệu lực' | 'Hết hạn' | 'Sắp hết hạn'; // Sắp hết hạn if <= 30 days
}

export interface TaxDependent {
  id: string; // e.g., NPT001
  employeeId: string;
  name: string;
  relationship: 'Con' | 'Vợ/Chồng' | 'Bố/Mẹ' | 'Khác';
  taxCode: string;
  birthDate: string; // YYYY-MM-DD
  status: 'Đã duyệt' | 'Chờ duyệt' | 'Yêu cầu bổ sung';
}

export interface HRNotification {
  id: string;
  type: 'contract_warning' | 'tax_pending' | 'system';
  title: string;
  message: string;
  date: string; // YYYY-MM-DD HH:MM
  isRead: boolean;
  targetId?: string; // e.g., employeeId or contractId
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}
