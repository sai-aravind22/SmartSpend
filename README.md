# SmartSpend — Smart Personal Expense Tracker

> **"Track Smarter. Spend Better."**

SmartSpend is a complete, modern personal expense management web application designed for portfolio demonstration and college mini-projects. It combines a clean, layered Spring Boot REST architecture with persistent MySQL storage, secure JWT authentication, and a responsive financial dashboard built with Bootstrap 5, Chart.js, and Font Awesome.

---

## 🌟 Key Features

### 1. User Authentication & Data Isolation
* **User Registration & Login**: Full account creation with validation and BCrypt password encryption (`register.html`, `login.html`).
* **Stateless JWT Security**: Industry-standard JSON Web Token (`jjwt`) bearer authentication.
* **Per-User Financial Data Isolation**: Every transaction, category budget, chart, insight, and CSV export is strictly scoped to the authenticated user.
* **1-Click Demo Login**: Built-in 1-click button to immediately test the application as **Alex Morgan** (`demo@smartspend.com` / `password123`) loaded with realistic multi-month financial records.
* **Profile Badge & Logout**: Dynamic user initials and display name in the sidebar footer with a 1-click **Logout** button on all pages.

### 2. Interactive Financial Dashboard
* **6 Live Metric Cards**:
  * **Total Income**: Sum of all incoming funds for the selected month/year.
  * **Total Expenses**: Real-time spending tally from recorded expenses.
  * **Net Balance**: Positive cash-flow or deficit indicator with visual badge.
  * **Savings Rate**: Percentage of income saved (`((Income - Expenses) / Income) * 100`).
  * **Transaction Count**: Total financial entries recorded in the selected period.
  * **Highest Spending Category**: Highlights top category and amount spent.
* **Month & Year Selector**: Real-time dynamic updates of all stats and charts.
* **Monthly Spending Trend**: Grouped bar chart comparing income versus expenses across the last 6 months.
* **Category Breakdown Chart**: Interactive doughnut chart displaying category spending percentages.
* **Rule-Based Financial Insights**: Automatic detection of high-spending categories, month-over-month expenditure changes, budget warnings (80%+), and deficit spending.
* **Recent Transactions Feed**: Fast table of the latest transactions with quick view, edit, and delete actions.

### 3. Transaction Management & Advanced Filtering
* **Full CRUD**: Create, read, update, and delete transactions with instant persistence in MySQL.
* **Granular Attributes**: Title, amount, transaction type (`INCOME` or `EXPENSE`), category, date, payment method, optional notes/description.
* **Dynamic Category Mapping**: Automatically shows income-specific categories when Income is selected, and expense-specific categories when Expense is selected.
* **Advanced Filters**:
  * Live debounce search by title or description.
  * Filter by Type (`INCOME`, `EXPENSE`, or All).
  * Filter by Category.
  * Filter by Payment Method (`UPI`, `Credit Card`, `Debit Card`, `Bank Transfer`, `Net Banking`, `Cash`).
  * Filter by Date Range (`Start Date` to `End Date`).
  * Sort by Date, Amount, or Title (Ascending / Descending).
  * Clear all filters with 1 click.
* **Summary Strip**: Displays filtered income, filtered expenses, net filtered total, and total matching count.
* **Pagination**: Handles large datasets smoothly with page buttons and "Showing X to Y of Z" indicators.

### 4. Monthly Budget Planning & Alerts
* Set monthly spending limits per category.
* **Duplicate Prevention**: Rejects duplicate budgets for the same category and month/year.
* **Real-time Utilization Calculations**:
  * Tracks actual expenses recorded against each category budget.
  * Computes remaining budget and utilization percentage.
* **Visual Status Indicators**:
  * **Normal (Green)**: Spending < 80% of limit ("On Track").
  * **Warning (Amber)**: Spending between 80% and 100% of limit ("Near Limit").
  * **Exceeded (Red)**: Spending > 100% of limit ("Exceeded by ₹X").
* **Overall Budget Summary Banner**: Shows aggregate monthly limit, total spent, remaining balance, and an overall progress bar.

### 5. Reports & Visual Analytics
* **Annual Bar Chart**: 12-month Income vs Expense comparison.
* **Category Share Doughnut Chart**: Interactive breakdown of expenditures by category.
* **Daily Spending Timeline**: Line chart plotting day-by-day spending spikes throughout the month.
* **Payment Method Distribution**: Polar area chart showing transaction distribution across payment channels.
* **Cumulative Wealth Trajectory**: Area chart visualizing net savings progress over time.
* **Monthly Financial Breakdown Table**: Detailed table showing monthly income, expenses, net savings, savings rate, and surplus/deficit status.

### 6. CSV Data Export
* Export filtered transactions directly to a standard RFC 4180 CSV file (`smartspend-transactions.csv`).
* Automatically applies active search and date filters to the export.
* Compatible with Microsoft Excel, Google Sheets, and LibreOffice Calc.

### 7. User Customization & Themes
* **Theme Support**: Seamless toggle between Light Theme and Dark Mode with instant `localStorage` persistence.
* **Currency Symbol**: Choose between Indian Rupee (`₹`), US Dollar (`$`), Euro (`€`), British Pound (`£`), Japanese Yen (`¥`), Australian Dollar (`A$`), or Canadian Dollar (`C$`).
* **Number Format**: Support for Indian numbering (`₹1,25,000.00`) and International numbering (`125,000.00`).
* **Date Formats**: Configurable display formats (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`).
* **Demo Data Utilities**: Built-in 1-click button to reset or reload sample data across months for demonstration purposes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21+, Spring Boot 3.3.5, Spring Security 6.3, Spring Data JPA, JJWT 0.11.5, Jakarta Bean Validation |
| **Database** | MySQL 8.0+, Hibernate ORM, HikariCP Connection Pool |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+), Bootstrap 5.3, Chart.js 4.4, Font Awesome 6 |
| **Build Tool** | Apache Maven 3.9+ |
| **Architecture** | Clean Layered REST (Controller -> Service -> Repository), Stateless JWT Auth, Global Exception Handling |

---

## 📂 Project Directory Structure

```
smartspend/
|-- src/
|   |-- main/
|   |   |-- java/com/smartspend/
|   |   |   |-- config/
|   |   |   |   `-- WebMvcConfig.java
|   |   |   |-- controller/
|   |   |   |   |-- AuthController.java
|   |   |   |   |-- BudgetController.java
|   |   |   |   |-- DashboardController.java
|   |   |   |   |-- DataSeedController.java
|   |   |   |   |-- ReportController.java
|   |   |   |   `-- TransactionController.java
|   |   |   |-- dto/
|   |   |   |   |-- ApiResponse.java
|   |   |   |   |-- AuthResponse.java
|   |   |   |   |-- BudgetRequest.java
|   |   |   |   |-- BudgetResponse.java
|   |   |   |   |-- DashboardChartsResponse.java
|   |   |   |   |-- DashboardSummaryResponse.java
|   |   |   |   |-- FinancialInsightDto.java
|   |   |   |   |-- LoginRequest.java
|   |   |   |   |-- RegisterRequest.java
|   |   |   |   |-- TransactionRequest.java
|   |   |   |   |-- TransactionResponse.java
|   |   |   |   `-- UserProfileResponse.java
|   |   |   |-- entity/
|   |   |   |   |-- Budget.java
|   |   |   |   |-- Transaction.java
|   |   |   |   |-- TransactionType.java
|   |   |   |   `-- User.java
|   |   |   |-- exception/
|   |   |   |   |-- BadRequestException.java
|   |   |   |   |-- DuplicateResourceException.java
|   |   |   |   |-- GlobalExceptionHandler.java
|   |   |   |   `-- ResourceNotFoundException.java
|   |   |   |-- repository/
|   |   |   |   |-- BudgetRepository.java
|   |   |   |   |-- TransactionRepository.java
|   |   |   |   `-- UserRepository.java
|   |   |   |-- security/
|   |   |   |   |-- CustomUserDetailsService.java
|   |   |   |   |-- JwtAuthenticationFilter.java
|   |   |   |   |-- JwtUtil.java
|   |   |   |   |-- SecurityConfig.java
|   |   |   |   |-- SecurityUtils.java
|   |   |   |   `-- UserPrincipal.java
|   |   |   |-- service/
|   |   |   |   |-- AuthService.java
|   |   |   |   |-- BudgetService.java
|   |   |   |   |-- DashboardService.java
|   |   |   |   |-- DataSeedService.java
|   |   |   |   |-- InsightService.java
|   |   |   |   |-- ReportService.java
|   |   |   |   `-- TransactionService.java
|   |   |   `-- SmartSpendApplication.java
|   |   `-- resources/
|   |       |-- application.properties
|   |       `-- static/
|   |           |-- css/style.css
|   |           |-- js/
|   |           |   |-- api.js
|   |           |   |-- budgets.js
|   |           |   |-- dashboard.js
|   |           |   |-- reports.js
|   |           |   |-- settings.js
|   |           |   `-- transactions.js
|   |           |-- budgets.html
|   |           |-- index.html
|   |           |-- login.html
|   |           |-- register.html
|   |           |-- reports.html
|   |           |-- settings.html
|   |           `-- transactions.html
|   `-- test/
|       `-- java/com/smartspend/service/
|           |-- BudgetServiceTest.java
|           |-- DashboardServiceTest.java
|           `-- TransactionServiceTest.java
|-- database/
|   |-- schema.sql
|   `-- sample-data.sql
|-- frontend/ (Static files copy)
|-- pom.xml
`-- README.md
```

---

## ⚙️ Prerequisites

1. **Java Development Kit (JDK)**: JDK 21 or later.
2. **Apache Maven**: Version 3.8+ (or Maven Wrapper).
3. **MySQL Server**: MySQL 8.0 or later running on port 3306.

---

## 🗄️ Database Setup

1. Open MySQL terminal or MySQL Workbench:
   ```powershell
   mysql -u root -p
   ```

2. Execute the schema script:
   ```sql
   SOURCE C:/Users/saiar/.gemini/antigravity-ide/scratch/smartspend/database/schema.sql;
   ```
   *(Hibernate will also automatically verify and manage schema definitions on start).*

---

## 🚀 Running the Application

### Step 1: Start the Server
From the project directory (`C:\Users\saiar\.gemini\antigravity-ide\scratch\smartspend`):
```powershell
java -jar target/smartspend-1.0.0.jar
```
*(Or run `mvn clean spring-boot:run`)*

### Step 2: Open in Browser
Open your browser and visit:
```
http://localhost:8080/
```

### Step 3: Login or Create Account
* **Demo Account (Immediate Evaluation)**:
  * Click **1-Click Demo Login** on the login page, or manually enter:
  * **Email**: `demo@smartspend.com`
  * **Password**: `password123`
* **Create New Account**:
  * Click **Create Free Account** (`register.html`) to test with a clean, isolated financial ledger.

---

## 🧪 Running the Backend Test Suite

To run all unit tests:
```powershell
mvn test
```
All 10 test cases across `BudgetServiceTest`, `DashboardServiceTest`, and `TransactionServiceTest` run with full mock security contexts and verify business calculations.

---

## 📡 REST API Documentation

### 1. Authentication Endpoints
| Method | Endpoint | Description | Public / Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Protected (JWT) |
| `POST` | `/api/auth/logout` | Client token invalidation | Protected (JWT) |

### 2. Transaction Endpoints (Protected by JWT)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/transactions` | Filtered & paginated transactions | `search`, `type`, `category`, `paymentMethod`, `startDate`, `endDate`, `month`, `year`, `page`, `size`, `sortBy`, `sortDirection` |
| `GET` | `/api/transactions/{id}` | Retrieve transaction by ID | — |
| `POST` | `/api/transactions` | Create a new transaction | Request body (`TransactionRequest`) |
| `PUT` | `/api/transactions/{id}` | Update existing transaction | Request body (`TransactionRequest`) |
| `DELETE` | `/api/transactions/{id}` | Delete transaction | — |
| `GET` | `/api/transactions/recent` | Retrieve latest 10 transactions | — |
| `GET` | `/api/transactions/years` | Retrieve list of distinct years | — |

### 3. Budget Endpoints (Protected by JWT)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/budgets` | Get category budgets with spent calculations | `month`, `year` |
| `GET` | `/api/budgets/{id}` | Get budget by ID | — |
| `POST` | `/api/budgets` | Set category budget | Request body (`BudgetRequest`) |
| `PUT` | `/api/budgets/{id}` | Update budget limit | Request body (`BudgetRequest`) |
| `DELETE` | `/api/budgets/{id}` | Delete budget | — |

### 4. Dashboard Endpoints (Protected by JWT)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary` | Summary cards & savings rate | `month`, `year` |
| `GET` | `/api/dashboard/charts` | Trend & category doughnut series | `month`, `year` |
| `GET` | `/api/dashboard/insights` | Rule-based personal finance insights | `month`, `year` |

### 5. Reports & Analytics (Protected by JWT)
| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/monthly` | 12-month financial breakdown table | `year` |
| `GET` | `/api/reports/categories` | Category expenditures & percentages | `month`, `year` |
| `GET` | `/api/reports/daily` | Day-by-day expense timeline | `month`, `year` |
| `GET` | `/api/reports/payment-methods` | Payment channel distribution | `month`, `year` |
| `GET` | `/api/reports/export` | RFC 4180 CSV export download | Filter query parameters |

---

## 📜 License & Acknowledgements
SmartSpend is built for educational, academic, and personal finance tracking purposes. Built with Spring Boot, Spring Security, Bootstrap 5, and Chart.js.
