// ملف إعداد الاختبارات
import dotenv from "dotenv";

// تحميل متغيرات البيئة للاختبارات
dotenv.config({ path: ".env.test" });

// إعداد timeout عام
jest.setTimeout(30000);

// mock لـ Redis للاختبارات
jest.mock("../utils/redis", () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
}));

// تنظيف بعد كل اختبار
afterEach(() => {
  jest.clearAllMocks();
});

// إعداد console للاختبارات
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // كتم أصوات console أثناء الاختبارات
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // إرجاع console العادي
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

// إضافة اختبار وهمي لمنع الخطأ
describe("Setup File", () => {
  it("should be properly configured", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
