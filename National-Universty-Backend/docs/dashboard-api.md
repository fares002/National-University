# Dashboard API Documentation

## Overview

The Dashboard API provides comprehensive financial overview and real-time metrics for the National University Financial Management System. This endpoint delivers key performance indicators, recent activity, and detailed breakdowns for effective financial monitoring.

## Base URL

```
/api/v1/reports/dashboard
```

## Authentication

- **Required**: Yes
- **Type**: Bearer Token
- **Roles**: admin, auditor

## Endpoints

### Get Dashboard Report

**GET** `/api/v1/reports/dashboard`

Retrieves comprehensive dashboard data including current month overview, month-to-month comparison, recent activity, today's metrics, and daily breakdown.

#### Request

**Headers:**

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Parameters:** None

#### Response

**Success Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "message": "Dashboard report retrieved successfully",
    "dashboard": {
      "overview": {
        "currentMonth": {
          "payments": {
            "total": 125000.5,
            "count": 85
          },
          "expenses": {
            "total": 45000.25,
            "count": 23
          },
          "netProfit": 80000.25,
          "totalTransactions": 108
        },
        "previousMonth": {
          "payments": {
            "total": 110000.0,
            "count": 78
          },
          "expenses": {
            "total": 38000.0,
            "count": 20
          },
          "netProfit": 72000.0
        },
        "comparison": {
          "paymentChange": 13.64,
          "expenseChange": 18.42,
          "paymentTrend": "increase",
          "expenseTrend": "increase"
        }
      },
      "recentActivity": {
        "lastPayment": {
          "id": 1234,
          "amount": 2500.0,
          "studentName": "أحمد علي محمد",
          "feeType": "Tuition Fee",
          "paymentMethod": "Bank Transfer",
          "paymentDate": "2025-08-05T14:30:00.000Z",
          "receiptNumber": "RCP-2025-001234",
          "timeSince": 1
        },
        "lastExpense": {
          "id": 567,
          "amount": 750.0,
          "category": "Office Supplies",
          "vendor": "مكتبة الجامعة",
          "description": "أدوات مكتبية ولوازم الإدارة",
          "date": "2025-08-04T10:15:00.000Z",
          "timeSince": 2
        }
      },
      "todayMetrics": {
        "totalTransactions": 12,
        "paymentsCount": 8,
        "expensesCount": 4
      },
      "dailyBreakdown": [
        {
          "date": "2025-08-01",
          "payments": {
            "total": 5500.0,
            "count": 3
          },
          "expenses": {
            "total": 1200.0,
            "count": 2
          },
          "netIncome": 4300.0,
          "totalTransactions": 5
        },
        {
          "date": "2025-08-02",
          "payments": {
            "total": 8750.0,
            "count": 5
          },
          "expenses": {
            "total": 2300.0,
            "count": 1
          },
          "netIncome": 6450.0,
          "totalTransactions": 6
        }
        // ... more daily data
      ],
      "metadata": {
        "currentMonth": "August 2025",
        "previousMonth": "July 2025",
        "generatedAt": "2025-08-06T12:00:00.000Z",
        "daysInCurrentMonth": 6
      }
    }
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "status": "error",
  "message": "Access denied. Token required."
}
```

**Error Response (403 Forbidden):**

```json
{
  "status": "error",
  "message": "Access denied. Insufficient permissions."
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "status": "error",
  "message": "Failed to generate dashboard report"
}
```

## Data Structure

### Overview Object

| Field           | Type   | Description                       |
| --------------- | ------ | --------------------------------- |
| `currentMonth`  | Object | Current month financial summary   |
| `previousMonth` | Object | Previous month financial summary  |
| `comparison`    | Object | Month-to-month comparison metrics |

### Current/Previous Month Object

| Field               | Type   | Description                      |
| ------------------- | ------ | -------------------------------- |
| `payments.total`    | Number | Total payment amount             |
| `payments.count`    | Number | Number of payment transactions   |
| `expenses.total`    | Number | Total expense amount             |
| `expenses.count`    | Number | Number of expense transactions   |
| `netProfit`         | Number | Net profit (payments - expenses) |
| `totalTransactions` | Number | Total number of transactions     |

### Comparison Object

| Field           | Type   | Description                   |
| --------------- | ------ | ----------------------------- |
| `paymentChange` | Number | Percentage change in payments |
| `expenseChange` | Number | Percentage change in expenses |
| `paymentTrend`  | String | "increase" or "decrease"      |
| `expenseTrend`  | String | "increase" or "decrease"      |

### Recent Activity Object

| Field         | Type         | Description                 |
| ------------- | ------------ | --------------------------- |
| `lastPayment` | Object\|null | Most recent payment details |
| `lastExpense` | Object\|null | Most recent expense details |

### Last Payment Object

| Field           | Type   | Description          |
| --------------- | ------ | -------------------- |
| `id`            | Number | Payment ID           |
| `amount`        | Number | Payment amount       |
| `studentName`   | String | Student name         |
| `feeType`       | String | Type of fee paid     |
| `paymentMethod` | String | Payment method used  |
| `paymentDate`   | String | ISO 8601 date string |
| `receiptNumber` | String | Receipt number       |
| `timeSince`     | Number | Days since payment   |

### Last Expense Object

| Field         | Type   | Description          |
| ------------- | ------ | -------------------- |
| `id`          | Number | Expense ID           |
| `amount`      | Number | Expense amount       |
| `category`    | String | Expense category     |
| `vendor`      | String | Vendor name          |
| `description` | String | Expense description  |
| `date`        | String | ISO 8601 date string |
| `timeSince`   | Number | Days since expense   |

### Today Metrics Object

| Field               | Type   | Description                |
| ------------------- | ------ | -------------------------- |
| `totalTransactions` | Number | Total transactions today   |
| `paymentsCount`     | Number | Payment transactions today |
| `expensesCount`     | Number | Expense transactions today |

### Daily Breakdown Object

| Field               | Type   | Description               |
| ------------------- | ------ | ------------------------- |
| `date`              | String | Date in YYYY-MM-DD format |
| `payments.total`    | Number | Daily payment total       |
| `payments.count`    | Number | Daily payment count       |
| `expenses.total`    | Number | Daily expense total       |
| `expenses.count`    | Number | Daily expense count       |
| `netIncome`         | Number | Daily net income          |
| `totalTransactions` | Number | Daily transaction count   |

### Metadata Object

| Field                | Type   | Description                      |
| -------------------- | ------ | -------------------------------- |
| `currentMonth`       | String | Current month name and year      |
| `previousMonth`      | String | Previous month name and year     |
| `generatedAt`        | String | ISO 8601 timestamp               |
| `daysInCurrentMonth` | Number | Number of days with transactions |

## Currency Format

All monetary values are returned as numbers in Jordanian Dinars (JD). When displaying to users, format with the "ج.س" suffix:

```javascript
const formatCurrency = (amount) =>
  `${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} ج.س`;
```

## Usage Examples

### JavaScript/Fetch

```javascript
const getDashboardData = async () => {
  try {
    const response = await fetch("/api/v1/reports/dashboard", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard data");
    }

    const data = await response.json();
    return data.data.dashboard;
  } catch (error) {
    console.error("Dashboard error:", error);
    throw error;
  }
};

// Usage
getDashboardData()
  .then((dashboard) => {
    console.log(
      "Current month profit:",
      dashboard.overview.currentMonth.netProfit
    );
    console.log("Payment trend:", dashboard.overview.comparison.paymentTrend);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

### cURL

```bash
curl -X GET \
  http://localhost:3000/api/v1/reports/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Axios

```javascript
import axios from "axios";

const dashboardApi = axios.create({
  baseURL: "/api/v1/reports",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const getDashboard = async () => {
  try {
    const response = await dashboardApi.get("/dashboard");
    return response.data.data.dashboard;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

## Key Features

### 📊 Real-time Metrics

- Current month financial overview
- Today's transaction counts
- Live net profit calculations

### 📈 Trend Analysis

- Month-to-month percentage changes
- Payment and expense trend indicators
- Historical comparison data

### 🔍 Recent Activity

- Last payment details with time tracking
- Last expense details with time tracking
- Days since last transactions

### 📅 Daily Breakdown

- Day-by-day financial data for current month
- Daily transaction counts
- Daily net income calculations

### 💰 Comprehensive Totals

- Payment totals and counts
- Expense totals and counts
- Net profit calculations
- Transaction volume metrics

## Performance Considerations

- **Efficient Queries**: Uses parallel database queries with `Promise.all()`
- **Targeted Selects**: Only retrieves necessary fields
- **Optimized Calculations**: Client-side aggregations minimize database load
- **Date Range Optimization**: Precise date filtering for better performance

## Error Handling

The API implements comprehensive error handling:

1. **Authentication Errors**: Invalid or missing tokens
2. **Authorization Errors**: Insufficient permissions
3. **Database Errors**: Connection or query failures
4. **Calculation Errors**: Mathematical operation failures
5. **General Errors**: Unexpected server errors

## Notes

- All dates are in ISO 8601 format (UTC)
- Currency amounts are in Jordanian Dinars
- Time calculations are in days
- Trends are calculated as percentage changes
- Dashboard data is generated in real-time for current date
- Previous month comparison handles year transitions correctly
- Empty data sets return zero values, not null
