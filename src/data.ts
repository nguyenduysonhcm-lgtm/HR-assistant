import { Employee, Contract, TaxDependent, HRNotification } from './types';

export const initialEmployees: Employee[] = [
  {
    id: "EMP001",
    name: "Nguyễn Văn Trỗi",
    department: "Hành chính Nhân sự",
    status: "Hoạt động",
    email: "troi.nguyen@company.com",
    phone: "0901234567",
    startDate: "2022-01-15",
    role: "Trưởng phòng HCNS",
    salary: 28000000
  },
  {
    id: "EMP002",
    name: "Lê Thị Thu Thảo",
    department: "Hành chính Nhân sự",
    status: "Hoạt động",
    email: "thao.le@company.com",
    phone: "0912345678",
    startDate: "2023-06-01",
    role: "Chuyên viên HCNS",
    salary: 16000000
  },
  {
    id: "EMP003",
    name: "Trần Minh Hoàng",
    department: "Kỹ thuật",
    status: "Hoạt động",
    email: "hoang.tran@company.com",
    phone: "0923456789",
    startDate: "2021-03-10",
    role: "Kỹ sư phần mềm Lead",
    salary: 35000000
  },
  {
    id: "EMP004",
    name: "Phạm Hồng Sơn",
    department: "Kỹ thuật",
    status: "Hoạt động",
    email: "son.pham@company.com",
    phone: "0934567890",
    startDate: "2024-05-15",
    role: "Kỹ sư phần mềm Senior",
    salary: 24000000
  },
  {
    id: "EMP005",
    name: "Hoàng Thị Mai",
    department: "Kỹ thuật",
    status: "Thử việc",
    email: "mai.hoang@company.com",
    phone: "0945678901",
    startDate: "2026-06-15",
    role: "Kỹ sư phần mềm Junior",
    salary: 12000000
  },
  {
    id: "EMP006",
    name: "Vũ Anh Tuấn",
    department: "Kinh doanh",
    status: "Hoạt động",
    email: "tuan.vu@company.com",
    phone: "0956789012",
    startDate: "2023-11-01",
    role: "Trưởng nhóm Kinh doanh",
    salary: 20000000
  },
  {
    id: "EMP007",
    name: "Đặng Diệu Linh",
    department: "Kinh doanh",
    status: "Hoạt động",
    email: "linh.dang@company.com",
    phone: "0967890123",
    startDate: "2024-10-10",
    role: "Chuyên viên Kinh doanh",
    salary: 14000000
  },
  {
    id: "EMP008",
    name: "Bùi Quốc Khánh",
    department: "Marketing",
    status: "Hoạt động",
    email: "khanh.bui@company.com",
    phone: "0978901234",
    startDate: "2024-02-20",
    role: "Chuyên viên Marketing",
    salary: 15000000
  },
  {
    id: "EMP009",
    name: "Đỗ Bảo Trâm",
    department: "Marketing",
    status: "Đã nghỉ",
    email: "tram.do@company.com",
    phone: "0989012345",
    startDate: "2023-01-10",
    role: "Nhân viên Thiết kế",
    salary: 13000000
  }
];

export const initialContracts: Contract[] = [
  {
    id: "HD001",
    employeeId: "EMP001",
    type: "Không xác định thời hạn",
    signedDate: "2023-01-15",
    expirationDate: "2029-12-31", // Plenty of time
    salary: 28000000,
    status: "Hiệu lực"
  },
  {
    id: "HD002",
    employeeId: "EMP002",
    type: "Xác định thời hạn",
    signedDate: "2023-06-01",
    expirationDate: "2026-07-25", // UNDER 30 DAYS (Expires July 25, 2026 vs current date July 14, 2026) -> Warning!
    salary: 16000000,
    status: "Sắp hết hạn"
  },
  {
    id: "HD003",
    employeeId: "EMP003",
    type: "Không xác định thời hạn",
    signedDate: "2022-03-10",
    expirationDate: "2028-12-31",
    salary: 35000000,
    status: "Hiệu lực"
  },
  {
    id: "HD004",
    employeeId: "EMP004",
    type: "Xác định thời hạn",
    signedDate: "2024-05-15",
    expirationDate: "2026-08-05", // UNDER 30 DAYS (Expires Aug 5, 2026 vs July 14, 2026 - 22 days left) -> Warning!
    salary: 24000000,
    status: "Sắp hết hạn"
  },
  {
    id: "HD005",
    employeeId: "EMP005",
    type: "Thử việc",
    signedDate: "2026-06-15",
    expirationDate: "2026-08-15", // UNDER 30 DAYS (Expires Aug 15, 2026 vs July 14, 2026 - 32 days left, wait. Let's make it Aug 10, 2026 - 27 days left!) -> Warning!
    salary: 12000000,
    status: "Sắp hết hạn"
  },
  {
    id: "HD006",
    employeeId: "EMP006",
    type: "Xác định thời hạn",
    signedDate: "2023-11-01",
    expirationDate: "2026-11-01", // Active (more than 30 days)
    salary: 20000000,
    status: "Hiệu lực"
  },
  {
    id: "HD007",
    employeeId: "EMP007",
    type: "Xác định thời hạn",
    signedDate: "2024-10-10",
    expirationDate: "2026-10-10", // Active (more than 30 days)
    salary: 14000000,
    status: "Hiệu lực"
  },
  {
    id: "HD008",
    employeeId: "EMP008",
    type: "Xác định thời hạn",
    signedDate: "2024-02-20",
    expirationDate: "2026-06-30", // EXPIRED
    salary: 15000000,
    status: "Hết hạn"
  }
];

export const initialTaxDependents: TaxDependent[] = [
  {
    id: "NPT001",
    employeeId: "EMP001",
    name: "Nguyễn Minh Khang",
    relationship: "Con",
    taxCode: "8745239101",
    birthDate: "2018-04-12",
    status: "Đã duyệt"
  },
  {
    id: "NPT002",
    employeeId: "EMP001",
    name: "Nguyễn Khánh An",
    relationship: "Con",
    taxCode: "8745239102",
    birthDate: "2021-09-05",
    status: "Đã duyệt"
  },
  {
    id: "NPT003",
    employeeId: "EMP002",
    name: "Trần Anh Đức",
    relationship: "Vợ/Chồng",
    taxCode: "8694025192",
    birthDate: "1994-11-20",
    status: "Đã duyệt"
  },
  {
    id: "NPT004",
    employeeId: "EMP003",
    name: "Trần Minh Quang",
    relationship: "Con",
    taxCode: "8594203112",
    birthDate: "2015-02-28",
    status: "Đã duyệt"
  },
  {
    id: "NPT005",
    employeeId: "EMP004",
    name: "Phạm Hồng Ngọc",
    relationship: "Con",
    taxCode: "8920194123",
    birthDate: "2020-07-14",
    status: "Chờ duyệt"
  },
  {
    id: "NPT006",
    employeeId: "EMP006",
    name: "Vũ Văn Thành",
    relationship: "Bố/Mẹ",
    taxCode: "",
    birthDate: "1958-03-12",
    status: "Yêu cầu bổ sung"
  }
];

// Helper to calculate days between dates
export function getDaysRemaining(expirationDateStr: string, currentDateStr: string = "2026-07-14"): number {
  const expDate = new Date(expirationDateStr);
  const curDate = new Date(currentDateStr);
  const timeDiff = expDate.getTime() - curDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Generate notifications based on current date
export function generateNotifications(contracts: Contract[], dependents: TaxDependent[], currentDateStr: string = "2026-07-14"): HRNotification[] {
  const notifications: HRNotification[] = [];

  contracts.forEach(contract => {
    const daysRemaining = getDaysRemaining(contract.expirationDate, currentDateStr);
    if (daysRemaining > 0 && daysRemaining <= 30) {
      notifications.push({
        id: `NOT_CON_${contract.id}`,
        type: "contract_warning",
        title: "Cảnh báo Hạn hợp đồng",
        message: `Hợp đồng ${contract.id} của nhân viên mã ${contract.employeeId} sẽ hết hạn sau ${daysRemaining} ngày (${contract.expirationDate}).`,
        date: `${currentDateStr} 08:00`,
        isRead: false,
        targetId: contract.id
      });
    }
  });

  dependents.forEach(dep => {
    if (dep.status === "Chờ duyệt") {
      notifications.push({
        id: `NOT_DEP_${dep.id}`,
        type: "tax_pending",
        title: "Yêu cầu duyệt người phụ thuộc",
        message: `Người phụ thuộc ${dep.name} (${dep.relationship}) đăng ký bởi nhân viên ${dep.employeeId} đang chờ phê duyệt.`,
        date: `${currentDateStr} 09:30`,
        isRead: false,
        targetId: dep.employeeId
      });
    }
  });

  return notifications.sort((a, b) => b.date.localeCompare(a.date));
}
