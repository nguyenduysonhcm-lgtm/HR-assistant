import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initialEmployees, initialContracts, initialTaxDependents, generateNotifications } from "./src/data";
import { Employee, Contract, TaxDependent, HRNotification } from "./src/types";

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required in Settings > Secrets");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const DB_FILE_PATH = path.join(process.cwd(), "src", "db_store.json");

interface DBStore {
  employees: Employee[];
  contracts: Contract[];
  taxDependents: TaxDependent[];
  notifications: HRNotification[];
}

// Ensure database file or load defaults
function loadDB(): DBStore {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading DB file, falling back to defaults:", error);
  }

  // Default initial store
  const store: DBStore = {
    employees: initialEmployees,
    contracts: initialContracts,
    taxDependents: initialTaxDependents,
    notifications: generateNotifications(initialContracts, initialTaxDependents, "2026-07-14")
  };
  saveDB(store);
  return store;
}

function saveDB(store: DBStore) {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving DB file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Get complete state (Employees, Contracts, Dependents, Notifications)
  app.get("/api/hr/data", (req, res) => {
    try {
      const db = loadDB();
      res.json(db);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 2: Save entire state or update records
  app.post("/api/hr/data", (req, res) => {
    try {
      const { employees, contracts, taxDependents, notifications } = req.body as DBStore;
      const store: DBStore = {
        employees: employees || [],
        contracts: contracts || [],
        taxDependents: taxDependents || [],
        notifications: notifications || []
      };
      saveDB(store);
      res.json({ success: true, message: "Dữ liệu đã được đồng bộ với hệ thống Google Sheets (Mô phỏng)." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API 3: Gemini Smart HR Assistant
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, chatHistory, context } = req.body;
      
      const ai = getGemini();

      const systemInstruction = `
        Bạn là "HR Smart Assistant" - Trợ lý Nhân sự Thông minh cho một doanh nghiệp tại Việt Nam.
        Nhiệm vụ của bạn là hỗ trợ cả HR Admin và Nhân viên về các thủ tục nhân sự, chính sách, hợp đồng và thuế TNCN.
        Ngôn ngữ giao tiếp: Tiếng Việt. Thái độ: Chuyên nghiệp, lịch sự, chu đáo và rõ ràng.

        Thông tin bối cảnh hệ thống hiện tại (ngày hiện tại là 14/07/2026):
        - Tổng số nhân viên: ${context?.employeesCount || 0}
        - Số hợp đồng sắp hết hạn (< 30 ngày): ${context?.expiringContractsCount || 0}
        - Số hồ sơ Người phụ thuộc đang chờ duyệt: ${context?.pendingDependentsCount || 0}

        Bạn có thể giúp:
        1. Giải đáp các thắc mắc về Hợp đồng lao động, cách gia hạn, tư vấn cho HR Admin các lựa chọn hợp đồng tối ưu khi hết hạn (ví dụ: chuyển từ Thử việc sang Xác định thời hạn, hoặc chuyển sang Không xác định thời hạn theo Luật lao động Việt Nam).
        2. Hướng dẫn nhân viên thủ tục đăng ký Người phụ thuộc giảm trừ gia cảnh (bố mẹ, con cái, vợ chồng). Giải thích các chứng từ cần thiết (ví dụ: Giấy khai sinh cho con, Đăng ký kết hôn cho vợ/chồng, xác nhận thu nhập cho bố mẹ dưới 1 triệu/tháng).
        3. Soạn thảo mẫu thông báo/Email gia hạn hợp đồng gửi nhân viên khi hợp đồng sắp hết hạn.
        4. Trả lời các câu hỏi về luật lao động Việt Nam cơ bản (thời giờ làm việc, nghỉ phép năm, bảo hiểm xã hội, thuế TNCN).

        Hãy trả lời trực tiếp câu hỏi của người dùng dựa trên các quy tắc trên. Trình bày đẹp mắt sử dụng định dạng Markdown.
      `;

      // Structure contents for @google/genai chat format
      const formattedContents = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.forEach((msg: any) => {
          formattedContents.push({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          });
        });
      }
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.status(500).json({ error: err.message || "Đã xảy ra lỗi khi kết nối với AI Studio." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HR Smart Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
