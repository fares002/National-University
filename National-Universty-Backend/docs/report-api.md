# Report API Documentation

This document describes the financial reporting endpoints for the National University backend API.

## Base URL

All report endpoints are prefixed with `/api/v1/reports`

## Authentication

All endpoints require authentication via JWT token.

## Authorization

- **Admin**: Full access to all reports
- **Auditor**: Full access to all reports
- **Other roles**: No access

---

## 📊 **1. Daily Financial Report**

### **GET** `/api/v1/reports/daily/:date`

**Description:** Get comprehensive financial report for a specific date.

**URL Parameters:**

- `date` (required): Date in YYYY-MM-DD format

**Query Parameters:** None

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Daily report retrieved successfully",
    "report": {
      "date": "2025-08-03",
      "payments": {
        "total": 25500.75,
        "count": 15,
        "byFeeType": {
          "NEW_YEAR": { "count": 8, "total": 18000.0 },
          "SUPPLEMENTARY": { "count": 4, "total": 5500.0 },
          "EXAM": { "count": 3, "total": 2000.75 }
        },
        "byPaymentMethod": {
          "CASH": { "count": 10, "total": 15000.0 },
          "TRANSFER": { "count": 4, "total": 8500.75 },
          "CHEQUE": { "count": 1, "total": 2000.0 }
        }
      },
      "expenses": {
        "total": 8250.5,
        "count": 6,
        "byCategory": {
          "Software": { "count": 2, "total": 5000.0 },
          "Utilities": { "count": 1, "total": 2500.5 },
          "Office Supplies": { "count": 3, "total": 750.0 }
        },
        "topVendors": [
          { "vendor": "شركة مايكروسوفت", "total": 5000.0, "count": 2 },
          { "vendor": "شركة الكهرباء", "total": 2500.5, "count": 1 }
        ]
      },
      "netIncome": 17250.25
    }
  }
}
```

**Error Responses:**

- `400` - Invalid date format
- `401` - Unauthorized
- `403` - Forbidden (not admin/auditor)
- `500` - Internal server error

---

## 📅 **2. Monthly Financial Report**

### **GET** `/api/v1/reports/monthly/:year/:month`

**Description:** Get comprehensive financial report for a specific month with trends and comparisons.

**URL Parameters:**

- `year` (required): Year (2020 - current year)
- `month` (required): Month (1-12)

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Monthly report retrieved successfully",
    "report": {
      "year": 2025,
      "month": 8,
      "monthName": "August",
      "payments": {
        "total": 450500.0,
        "count": 120,
        "byFeeType": {
          "NEW_YEAR": { "count": 80, "total": 320000.0 },
          "SUPPLEMENTARY": { "count": 25, "total": 85000.0 },
          "EXAM": { "count": 15, "total": 45500.0 }
        },
        "byPaymentMethod": {
          "CASH": { "count": 70, "total": 280000.0 },
          "TRANSFER": { "count": 40, "total": 150000.0 },
          "CHEQUE": { "count": 10, "total": 20500.0 }
        },
        "dailyBreakdown": [
          { "date": "2025-08-01", "total": 15000.0, "count": 5 },
          { "date": "2025-08-02", "total": 22500.0, "count": 8 },
          { "date": "2025-08-03", "total": 18750.0, "count": 6 }
        ]
      },
      "expenses": {
        "total": 125000.0,
        "count": 45,
        "byCategory": {
          "Software": { "count": 8, "total": 45000.0 },
          "Utilities": { "count": 12, "total": 35000.0 },
          "Maintenance": { "count": 15, "total": 30000.0 },
          "Office Supplies": { "count": 10, "total": 15000.0 }
        },
        "topVendors": [
          { "vendor": "شركة مايكروسوفت", "total": 25000.0, "count": 5 },
          { "vendor": "شركة الكهرباء", "total": 20000.0, "count": 4 },
          { "vendor": "مكتبة جرير", "total": 15000.0, "count": 8 }
        ],
        "dailyBreakdown": [
          { "date": "2025-08-01", "total": 5000.0, "count": 2 },
          { "date": "2025-08-02", "total": 8500.0, "count": 3 },
          { "date": "2025-08-03", "total": 6250.0, "count": 4 }
        ]
      },
      "netIncome": 325500.0,
      "comparison": {
        "previousMonth": {
          "paymentsChange": 15.5,
          "expensesChange": -8.2,
          "netIncomeChange": 22.3
        }
      }
    }
  }
}
```

---

## 📊 **3. Yearly Financial Report**

### **GET** `/api/v1/reports/yearly/:year`

**Description:** Get comprehensive financial report for a specific year with monthly breakdown and comparisons.

**URL Parameters:**

- `year` (required): Year (2020 - current year)

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Yearly report retrieved successfully",
    "report": {
      "year": 2025,
      "summary": {
        "payments": {
          "total": 3600000.0,
          "count": 950,
          "byFeeType": {
            "NEW_YEAR": { "count": 650, "total": 2600000.0 },
            "SUPPLEMENTARY": { "count": 180, "total": 720000.0 },
            "EXAM": { "count": 120, "total": 280000.0 }
          },
          "byPaymentMethod": {
            "CASH": { "count": 570, "total": 2280000.0 },
            "TRANSFER": { "count": 320, "total": 1152000.0 },
            "CHEQUE": { "count": 60, "total": 168000.0 }
          }
        },
        "expenses": {
          "total": 980000.0,
          "count": 380,
          "byCategory": {
            "Software": { "count": 45, "total": 350000.0 },
            "Utilities": { "count": 120, "total": 280000.0 },
            "Maintenance": { "count": 85, "total": 200000.0 },
            "Office Supplies": { "count": 130, "total": 150000.0 }
          },
          "topVendors": [
            { "vendor": "شركة مايكروسوفت", "total": 180000.0, "count": 25 },
            { "vendor": "شركة الكهرباء", "total": 150000.0, "count": 48 },
            {
              "vendor": "شركة الصيانة المتقدمة",
              "total": 120000.0,
              "count": 32
            }
          ]
        },
        "netIncome": 2620000.0
      },
      "monthlyBreakdown": [
        {
          "month": 1,
          "monthName": "January",
          "payments": { "total": 320000.0, "count": 85 },
          "expenses": { "total": 85000.0, "count": 32 },
          "netIncome": 235000.0
        },
        {
          "month": 2,
          "monthName": "February",
          "payments": { "total": 298000.0, "count": 78 },
          "expenses": { "total": 92000.0, "count": 35 },
          "netIncome": 206000.0
        }
      ],
      "comparison": {
        "previousYear": {
          "paymentsChange": 12.8,
          "expensesChange": 5.4,
          "netIncomeChange": 18.2
        }
      }
    }
  }
}
```

---

## 📈 **4. Financial Summary**

### **GET** `/api/v1/reports/summary`

**Description:** Get current financial summary (this month, quarter, and year overview).

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Financial summary retrieved successfully",
    "summary": {
      "thisMonth": {
        "payments": 450500.0,
        "expenses": 125000.0,
        "netIncome": 325500.0,
        "paymentsCount": 120,
        "expensesCount": 45
      },
      "thisQuarter": {
        "payments": 1200000.0,
        "expenses": 350000.0,
        "netIncome": 850000.0,
        "paymentsCount": 320,
        "expensesCount": 125,
        "quarter": 3
      },
      "thisYear": {
        "payments": 3600000.0,
        "expenses": 980000.0,
        "netIncome": 2620000.0,
        "paymentsCount": 950,
        "expensesCount": 380,
        "year": 2025
      }
    }
  }
}
```

---

## 📈 **5. Dashboard Report**

### **GET** `/api/v1/reports/dashboard`

**Description:** Get comprehensive dashboard overview with current month metrics, comparisons, recent activity, and daily breakdown. This endpoint provides the most important financial KPIs for the dashboard view.

**URL Parameters:** None

**Query Parameters:** None

**Features:**

- **Smart Caching**: Results cached for 10 minutes for better performance
- **Current Month Focus**: Detailed current month financial data
- **Comparison Analytics**: Month-over-month percentage changes
- **Recent Activity**: Latest payment and expense records
- **Daily Breakdown**: Day-by-day breakdown of current month
- **Today's Metrics**: Real-time today's transaction counts

**Success Response (200):**

```json
{
  "status": "success",
  "data": {
    "message": "Dashboard report retrieved successfully",
    "dashboard": {
      "overview": {
        "currentMonth": {
          "payments": {
            "total": 450500.75,
            "count": 125
          },
          "expenses": {
            "total": 125000.5,
            "count": 45
          },
          "netProfit": 325500.25,
          "totalTransactions": 170
        },
        "previousMonth": {
          "payments": {
            "total": 380000.0,
            "count": 110
          },
          "expenses": {
            "total": 110000.0,
            "count": 40
          },
          "netProfit": 270000.0
        },
        "comparison": {
          "paymentChange": 18.55,
          "expenseChange": 13.64,
          "paymentTrend": "increase",
          "expenseTrend": "increase"
        }
      },
      "recentActivity": {
        "lastPayment": {
          "id": "cm123xyz789",
          "amount": 2500.0,
          "studentName": "أحمد محمد علي",
          "feeType": "NEW_YEAR",
          "paymentMethod": "CASH",
          "paymentDate": "2025-08-16T10:30:00.000Z",
          "receiptNumber": "RCP-2025-001234",
          "timeSince": 1
        },
        "lastExpense": {
          "id": "exp456abc",
          "amount": 1500.0,
          "category": "Office Supplies",
          "vendor": "ABC Office Store",
          "description": "Monthly office supplies purchase",
          "date": "2025-08-15T14:20:00.000Z",
          "timeSince": 2
        }
      },
      "todayMetrics": {
        "totalTransactions": 8,
        "paymentsCount": 5,
        "expensesCount": 3
      },
      "dailyBreakdown": [
        {
          "date": "2025-08-01",
          "payments": {
            "total": 12500.0,
            "count": 5
          },
          "expenses": {
            "total": 3200.0,
            "count": 2
          },
          "netIncome": 9300.0,
          "totalTransactions": 7
        },
        {
          "date": "2025-08-02",
          "payments": {
            "total": 18000.0,
            "count": 8
          },
          "expenses": {
            "total": 5500.0,
            "count": 3
          },
          "netIncome": 12500.0,
          "totalTransactions": 11
        }
      ],
      "metadata": {
        "currentMonth": "August 2025",
        "previousMonth": "July 2025",
        "generatedAt": "2025-08-17T10:30:45.123Z",
        "daysInCurrentMonth": 16
      }
    },
    "cached": false
  }
}
```

**Cache Response (200):**

When data is served from cache, the response includes `"cached": true` in the data object.

**Dashboard Data Fields:**

| Field                        | Description                                |
| ---------------------------- | ------------------------------------------ |
| `overview.currentMonth`      | Complete current month financial summary   |
| `overview.previousMonth`     | Previous month data for comparison         |
| `overview.comparison`        | Percentage changes and trend directions    |
| `recentActivity.lastPayment` | Most recent payment record with days since |
| `recentActivity.lastExpense` | Most recent expense record with days since |
| `todayMetrics`               | Today's transaction counts                 |
| `dailyBreakdown`             | Day-by-day breakdown for current month     |
| `metadata`                   | Report generation info and periods         |

**Performance:**

- **First Request**: ~800ms (database queries)
- **Cached Request**: ~50ms (from Redis)
- **Cache Duration**: 10 minutes
- **Auto-refresh**: Cache invalidates daily

---

## 🎯 **Report Endpoints Summary**

| Method | Endpoint                | Description                 | Typical Response Time | Cache |
| ------ | ----------------------- | --------------------------- | --------------------- | ----- |
| `GET`  | `/daily/:date`          | Daily financial report      | ~200ms                | ❌    |
| `GET`  | `/monthly/:year/:month` | Monthly financial report    | ~500ms                | ❌    |
| `GET`  | `/yearly/:year`         | Yearly financial report     | ~1s                   | ❌    |
| `GET`  | `/summary`              | Current financial summary   | ~300ms                | ❌    |
| `GET`  | `/dashboard`            | Dashboard overview          | ~800ms / ~50ms        | ✅    |
| `GET`  | `/daily/:date/pdf`      | Daily report PDF download   | similar to `/daily`   | ❌    |
| `GET`  | `/monthly/:y/:m/pdf`    | Monthly report PDF download | similar to `/monthly` | ❌    |
| `GET`  | `/yearly/:year/pdf`     | Yearly report PDF download  | similar to `/yearly`  | ❌    |

---

## 🔍 **Key Features**

✅ **Comprehensive Analytics**: Payments, expenses, and net income calculations  
✅ **Detailed Breakdowns**: By category, vendor, fee type, payment method  
✅ **Trend Analysis**: Comparison with previous periods (month/year)  
✅ **Daily Tracking**: Day-by-day breakdown in monthly reports  
✅ **Top Vendors**: Most expensive vendors in each period  
✅ **Performance Metrics**: Percentage changes and growth indicators  
✅ **Real-time Data**: Current period snapshots  
✅ **Financial Health**: Net income calculations

---

## 🚨 **Error Codes**

| Code  | Description                                              |
| ----- | -------------------------------------------------------- |
| `400` | Bad Request - Invalid date format or parameters          |
| `401` | Unauthorized - Invalid/missing token                     |
| `403` | Forbidden - Insufficient permissions (not admin/auditor) |
| `404` | Not Found - Report data not found                        |
| `500` | Internal Server Error                                    |

---

## 📋 **Examples for Postman Testing**

### **1. Daily Report**

```
GET http://localhost:3000/api/v1/reports/daily/2025-08-03
Cookie: token=YOUR_JWT_TOKEN
```

### **2. Monthly Report**

```
GET http://localhost:3000/api/v1/reports/monthly/2025/8
Cookie: token=YOUR_JWT_TOKEN
```

### **3. Yearly Report**

```
GET http://localhost:3000/api/v1/reports/yearly/2025
Cookie: token=YOUR_JWT_TOKEN
```

### **4. Financial Summary**

```
GET http://localhost:3000/api/v1/reports/summary
Cookie: token=YOUR_JWT_TOKEN
```

### **5. Dashboard Report**

```
GET http://localhost:3000/api/v1/reports/dashboard
Cookie: token=YOUR_JWT_TOKEN
```

---

## 💡 **Business Intelligence Insights**

### **Dashboard Report Helps With:**

- **Real-time Overview**: Current month performance at a glance
- **Trend Analysis**: Month-over-month comparison and growth tracking
- **Quick Decision Making**: Key metrics for management decisions
- **Daily Monitoring**: Day-by-day performance tracking
- **Recent Activity**: Latest financial transactions visibility
- **Performance KPIs**: Essential financial health indicators

### **Daily Reports Help With:**

- Daily cash flow monitoring
- Peak transaction day identification
- Daily expense tracking
- Vendor payment analysis

### **Monthly Reports Help With:**

- Monthly budget planning
- Trend analysis and forecasting
- Department expense allocation
- Month-over-month growth tracking

### **Yearly Reports Help With:**

- Annual budget preparation
- Long-term financial planning
- Year-over-year performance analysis
- Strategic decision making

### **Financial Summary Helps With:**

- Real-time financial health check
- Quick executive overviews
- Performance dashboards
- Key metrics monitoring

---

## 🔐 **Security Notes**

1. **Authentication Required**: All endpoints require valid JWT token
2. **Role-Based Access**: Only Admin and Auditor roles can access reports
3. **Data Privacy**: Reports aggregate data without exposing individual student information
4. **Date Validation**: Prevents future dates and limits historical data to 5 years
5. **Error Handling**: Comprehensive error responses without exposing system internals

These report APIs provide powerful business intelligence for the National University financial management system! 📊💰

---

## 📄 **6. PDF Report Downloads**

Download printable PDF versions of the daily, monthly, and yearly financial reports. These endpoints return an application/pdf stream with a filename attachment.

### a) Daily Report PDF

**GET** `/api/v1/reports/daily/:date/pdf`

- Description: Download the daily report as a PDF for a specific date.
- URL Params:
  - `date` (required): YYYY-MM-DD
- Response:
  - Content-Type: `application/pdf`
  - Content-Disposition: `attachment; filename="daily-report-YYYY-MM-DD.pdf"`
  - Status: `200` on success; errors: `400`, `401`, `403`, `500`

Example:

```
GET http://localhost:3000/api/v1/reports/daily/2025-08-03/pdf
Cookie: token=YOUR_JWT_TOKEN
```

### b) Monthly Report PDF

**GET** `/api/v1/reports/monthly/:year/:month/pdf`

- Description: Download the monthly report as a PDF.
- URL Params:
  - `year` (required): e.g., 2025
  - `month` (required): 1-12
- Response:
  - Content-Type: `application/pdf`
  - Content-Disposition: `attachment; filename="monthly-report-YYYY-MM.pdf"`
  - Status: `200` on success; errors: `400`, `401`, `403`, `500`

Example:

```
GET http://localhost:3000/api/v1/reports/monthly/2025/8/pdf
Cookie: token=YOUR_JWT_TOKEN
```

### c) Yearly Report PDF

**GET** `/api/v1/reports/yearly/:year/pdf`

- Description: Download the yearly report as a PDF.
- URL Params:
  - `year` (required): e.g., 2025
- Response:
  - Content-Type: `application/pdf`
  - Content-Disposition: `attachment; filename="yearly-report-YYYY.pdf"`
  - Status: `200` on success; errors: `400`, `401`, `403`, `500`

Example:

```
GET http://localhost:3000/api/v1/reports/yearly/2025/pdf
Cookie: token=YOUR_JWT_TOKEN
```
