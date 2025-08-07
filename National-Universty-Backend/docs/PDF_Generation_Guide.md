# PDF Report Generation

This document describes the PDF download functionality for financial reports in the National University Backend system.

## Overview

The system now supports downloading daily, monthly, and yearly financial reports as well-formatted PDF documents. These PDFs contain tabular data with proper formatting, summary statistics, and professional styling.

## API Endpoints

### 1. Download Daily Report PDF

**Endpoint:** `GET /api/v1/reports/daily/:date/pdf`

**Parameters:**

- `date` (string): Date in YYYY-MM-DD format

**Response:** PDF file download

**Example:**

```
GET /api/v1/reports/daily/2024-01-15/pdf
```

### 2. Download Monthly Report PDF

**Endpoint:** `GET /api/v1/reports/monthly/:year/:month/pdf`

**Parameters:**

- `year` (number): 4-digit year
- `month` (number): Month (1-12)

**Response:** PDF file download

**Example:**

```
GET /api/v1/reports/monthly/2024/1/pdf
```

### 3. Download Yearly Report PDF

**Endpoint:** `GET /api/v1/reports/yearly/:year/pdf`

**Parameters:**

- `year` (number): 4-digit year

**Response:** PDF file download

**Example:**

```
GET /api/v1/reports/yearly/2024/pdf
```

## PDF Features

### Daily Report PDF

- **Title:** Daily Financial Report with date
- **Table:** Combined payments and expenses with columns:
  - Type (Payment/Expense)
  - Description
  - Category/Fee Type
  - Method/Vendor
  - Amount
- **Summary:** Total payments, expenses, net income, and transaction counts
- **File naming:** `daily-report-YYYY-MM-DD.pdf`

### Monthly Report PDF

- **Title:** Monthly Financial Report with month/year
- **Table:** Daily breakdown with columns:
  - Date
  - Payments
  - Expenses
  - Net Income
  - Transactions
- **Summary:** Monthly totals and transaction counts
- **File naming:** `monthly-report-YYYY-MM.pdf`

### Yearly Report PDF

- **Title:** Yearly Financial Report with year
- **Table:** Monthly breakdown with columns:
  - Month
  - Payments
  - Expenses
  - Net Income
  - Transactions
- **Summary:** Yearly totals and average monthly income
- **File naming:** `yearly-report-YYYY.pdf`

## PDF Format Features

- **Professional header** with title, subtitle, and generation timestamp
- **Alternating row colors** for better readability
- **Currency formatting** for monetary values
- **Number formatting** for counts and statistics
- **Page numbering** and proper pagination
- **Summary section** with key financial metrics
- **Footer** with organization branding

## Authorization

All PDF endpoints require the same authorization as their corresponding JSON endpoints:

- **Roles:** admin, auditor
- **Authentication:** Bearer token required

## Usage Examples

### Frontend Implementation (JavaScript/React)

```javascript
// Download daily report PDF
const downloadDailyPDF = async (date) => {
  try {
    const response = await fetch(`/api/v1/reports/daily/${date}/pdf`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-report-${date}.pdf`;
      a.click();
    }
  } catch (error) {
    console.error("Error downloading PDF:", error);
  }
};

// Download monthly report PDF
const downloadMonthlyPDF = async (year, month) => {
  const response = await fetch(`/api/v1/reports/monthly/${year}/${month}/pdf`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-report-${year}-${month
      .toString()
      .padStart(2, "0")}.pdf`;
    a.click();
  }
};
```

### cURL Examples

```bash
# Download daily report
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -o "daily-report-2024-01-15.pdf" \
     "http://localhost:3000/api/v1/reports/daily/2024-01-15/pdf"

# Download monthly report
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -o "monthly-report-2024-01.pdf" \
     "http://localhost:3000/api/v1/reports/monthly/2024/1/pdf"

# Download yearly report
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -o "yearly-report-2024.pdf" \
     "http://localhost:3000/api/v1/reports/yearly/2024/pdf"
```

## Error Handling

The PDF endpoints return the same error responses as the JSON endpoints:

- **400 Bad Request:** Invalid date format or parameters
- **401 Unauthorized:** Missing or invalid authentication token
- **403 Forbidden:** Insufficient permissions
- **500 Internal Server Error:** Server error during PDF generation

## Technical Implementation

The PDF generation is handled by the `PDFGenerator` utility class located in `src/utils/pdfGenerator.ts`. This class uses the PDFKit library to create professionally formatted PDF documents with:

- Table generation with customizable columns
- Automatic page breaks
- Currency and number formatting
- Professional styling and layout
- Summary sections

## Performance Considerations

- PDF generation is performed synchronously during the request
- Large date ranges may take longer to process
- Consider implementing caching for frequently requested reports
- Monitor memory usage for large datasets

## Future Enhancements

Potential improvements for the PDF generation system:

1. **Async Processing:** Implement background PDF generation for large reports
2. **Caching:** Cache generated PDFs for frequently requested periods
3. **Custom Styling:** Allow customization of PDF styling and branding
4. **Charts and Graphs:** Add visual elements to enhance reports
5. **Email Delivery:** Automatically email reports to stakeholders
6. **Batch Downloads:** Generate multiple reports in a single request
