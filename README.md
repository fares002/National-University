# National University Financial Management System

A comprehensive full-stack financial management system designed specifically for National University to streamline accounting operations, track payments and expenses, generate detailed reports, and provide real-time analytics.

## 🚀 Features

### Core Functionality

- **User Authentication & Authorization**: Secure login system with role-based access (Admin, Auditor)
- **Payment Management**: Track and manage all university payments with categorization
- **Expense Tracking**: Monitor and categorize university expenses
- **Financial Reporting**: Generate daily, monthly, yearly, and custom date range reports
- **Analytics Dashboard**: Real-time financial insights with interactive charts
- **PDF Generation**: Automated PDF reports and payment receipts
- **Search & Filtering**: Advanced search capabilities across payments and expenses

### User Experience

- **Multi-Language Support**: Full Arabic and English localization with RTL/LTR support
- **Dark Mode**: Modern dark theme toggle for comfortable viewing
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Updates**: Live data synchronization across the application

### Technical Features

- **RESTful API**: Well-structured backend API with comprehensive endpoints
- **Database Integration**: PostgreSQL with Prisma ORM for reliable data management
- **Caching**: Redis integration for improved performance
- **Email Services**: Automated email notifications and password recovery
- **Security**: JWT authentication, password hashing, and secure API endpoints

## 🛠️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Query** for data fetching and caching
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Recharts** for data visualization
- **React i18next** for internationalization
- **Lucide React** for icons

### Backend

- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** for database operations
- **PostgreSQL** database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Puppeteer** for PDF generation
- **Redis** for caching
- **Nodemailer** for email services
- **Jest** for testing

### DevOps & Tools

- **ESLint & Prettier** for code quality
- **VPS Deployment** with Nginx
- **SSL Certificate** for secure connections
- **PM2/Systemd** for process management
- **CI/CD Pipeline** for automated deployment

## 📁 Project Structure

```
National-University/
├── National-Universty-Backend/     # Backend API server
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── middlewares/           # Express middlewares
│   │   ├── routes/               # API route definitions
│   │   ├── utils/                # Utility functions
│   │   ├── validators/           # Input validation schemas
│   │   └── __tests__/            # Test files
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── docs/                     # API documentation
└── sudani-fin-flow/              # Frontend React application
    ├── src/
    │   ├── components/           # Reusable UI components
    │   ├── pages/               # Page components
    │   ├── contexts/            # React contexts
    │   ├── hooks/               # Custom React hooks
    │   ├── lib/                 # Utility libraries
    │   └── services/            # API service functions
    └── public/                   # Static assets
```

## 🔗 API Endpoints

### Authentication (`/api/auth`)

- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout
- `GET /me` - Get current user profile
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `POST /verify-reset-token` - Verify reset token validity

### Users (`/api/users`)

- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID (Admin only)
- `POST /` - Create new user (Admin only)
- `PATCH /:id` - Update user (Admin only)
- `DELETE /:id` - Delete user (Admin only)

### Payments (`/api/payments`)

- `GET /` - Get all payments (Admin, Auditor)
- `GET /search` - Search payments with filters (Admin, Auditor)
- `GET /:id` - Get payment by ID (Admin, Auditor)
- `POST /` - Create new payment (Admin only)
- `PATCH /:id` - Update payment (Admin only)
- `DELETE /:id` - Delete payment (Admin only)
- `GET /category/:category` - Get payments by category (Admin, Auditor)
- `GET /vendor/:vendor` - Get payments by vendor (Admin, Auditor)

### Expenses (`/api/expenses`)

- `GET /` - Get all expenses (Admin, Auditor)
- `GET /search` - Search expenses with filters (Admin, Auditor)
- `GET /:id` - Get expense by ID (Admin, Auditor)
- `POST /` - Create new expense (Admin only)
- `PATCH /:id` - Update expense (Admin only)
- `DELETE /:id` - Delete expense (Admin only)
- `GET /category/:category` - Get expenses by category (Admin, Auditor)
- `GET /vendor/:vendor` - Get expenses by vendor (Admin, Auditor)

### Reports (`/api/v1/reports`)

- `GET /daily/:date` - Get daily financial report
- `GET /monthly/:year/:month` - Get monthly financial report
- `GET /yearly/:year` - Get yearly financial report
- `GET /dashboard` - Get comprehensive dashboard report
- `GET /summary` - Get financial summary (current month, quarter, year)
- `GET /daily/:date/pdf` - Download daily report as PDF
- `GET /monthly/:year/:month/pdf` - Download monthly report as PDF
- `GET /yearly/:year/pdf` - Download yearly report as PDF
- `GET /custom/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD` - Download custom date range report as PDF

### Analytics (`/api/analytics`)

- `GET /overview` - Get financial overview metrics
- `GET /trends` - Get financial trends data
- `GET /comparison` - Get period comparison data

## 🎨 Frontend Pages

### Authentication Pages

- **Login**: User authentication with email/password
- **Forgot Password**: Password recovery request
- **Reset Password**: Password reset with token
- **Receipt Verification**: Verify payment receipts

### Main Application Pages

- **Dashboard**: Overview with charts, summaries, and key metrics
- **Payments**: Payment management with CRUD operations
- **Expenses**: Expense tracking and management
- **Reports**: Financial reporting and PDF generation
- **Settings**: Application configuration and user preferences

### Additional Pages

- **Not Found**: 404 error page for invalid routes

## 🧩 UI Components

### Core Components (shadcn/ui)

- **Form Components**: Input, Textarea, Select, Checkbox, Radio Group
- **Feedback Components**: Alert, Toast, Dialog, Sheet
- **Navigation**: Navigation Menu, Breadcrumb, Pagination
- **Data Display**: Table, Card, Badge, Avatar, Skeleton
- **Layout Components**: Sidebar, Header, Tabs, Accordion
- **Interactive**: Button, Dropdown Menu, Context Menu, Tooltip
- **Charts**: Chart components for data visualization
- **Calendar**: Date picker and calendar components

### Custom Components

- **Forms**: PaymentForm, ExpenseForm, UserForm with validation
- **Layout**: DashboardLayout, Header with dark mode toggle, Sidebar navigation
- **ProtectedRoute**: Route protection based on authentication
- **Language Toggle**: Multi-language support toggle

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis (optional, for caching)
- npm or yarn package manager

### Backend Setup

1. **Navigate to backend directory**:

   ```bash
   cd National-Universty-Backend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:

   - Copy `.env.example` to `.env`
   - Configure database connection, JWT secrets, email settings

4. **Database Setup**:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd sudani-fin-flow
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Environment Setup**:

   - Copy `.env.example` to `.env`
   - Configure API base URL

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 📊 Database Schema

The application uses Prisma ORM with PostgreSQL. Key entities include:

- **Users**: User accounts with roles (Admin, Auditor)
- **Payments**: Payment records with categories and vendors
- **Expenses**: Expense records with categories and vendors
- **Categories**: Payment and expense categories
- **Vendors**: Payment and expense vendors

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access Control**: Admin and Auditor roles with different permissions
- **Input Validation**: Zod schemas for comprehensive input validation
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: Protection against brute force attacks

## 🌐 Internationalization

- **Languages**: Arabic and English support
- **RTL/LTR Support**: Automatic direction switching based on language
- **Translation Management**: Centralized translation files with react-i18next
- **Date/Number Formatting**: Localized formatting for different regions

## 📈 Performance Optimizations

- **React Query**: Efficient data fetching and caching
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Optimized static assets
- **Database Indexing**: Optimized database queries with proper indexing
- **Redis Caching**: Fast data retrieval for frequently accessed data

## 🧪 Testing

- **Unit Tests**: Jest for backend API testing
- **Integration Tests**: End-to-end API testing
- **Frontend Testing**: React Testing Library for component testing

## 📦 Deployment

The application is configured for VPS deployment with:

- **Nginx**: Reverse proxy and static file serving
- **SSL**: HTTPS encryption with Let's Encrypt
- **PM2**: Process management and clustering
- **Systemd**: Service management for reliability
- **CI/CD**: Automated deployment pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is proprietary software for National University.

## 📞 Support

For technical support or questions, please contact the development team.

---

**Built with ❤️ for National University**
