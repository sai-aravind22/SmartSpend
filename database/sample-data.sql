-- ========================================================
-- SmartSpend Sample Data with Demo User
-- Period: August 2026 - October 2026
-- ========================================================

USE smartspend_db;

DELETE FROM budgets;
DELETE FROM transactions;
DELETE FROM users;

-- Demo User: demo@smartspend.com / password123
-- BCrypt hash for "password123"
INSERT INTO users (id, full_name, email, password) VALUES
(1, 'Alex Morgan', 'demo@smartspend.com', '$2a$10$7Ez8GzYFjV3Hl0eBvB5yU.gN5P5mC6J4v3N5Q8V2r7k6H1j4q2e9u');

-- Transactions for October 2026 (user_id = 1)
INSERT INTO transactions (user_id, title, amount, type, category, transaction_date, payment_method, description) VALUES
(1, 'Monthly Software Engineer Salary', 85000.00, 'INCOME', 'Salary', '2026-10-01', 'Bank Transfer', 'Direct payroll deposit for October 2026'),
(1, 'Web Design Freelance Project', 22000.00, 'INCOME', 'Freelancing', '2026-10-05', 'UPI', 'Milestone payment for client landing page'),
(1, 'Mutual Fund Dividend Payout', 4500.00, 'INCOME', 'Investment Returns', '2026-10-10', 'Bank Transfer', 'Quarterly index fund dividend'),
(1, 'Supermarket Monthly Grocery', 4520.00, 'EXPENSE', 'Food', '2026-10-02', 'Credit Card', 'Vegetables, pantry staples, spices, and dairy'),
(1, 'Electricity Bill Payment', 2650.00, 'EXPENSE', 'Bills and Utilities', '2026-10-03', 'UPI', 'State electricity board online bill'),
(1, 'Fiber Internet Subscription', 1180.00, 'EXPENSE', 'Bills and Utilities', '2026-10-04', 'UPI', '300 Mbps unlimited plan recharge'),
(1, 'Metro Rail Monthly Pass', 1500.00, 'EXPENSE', 'Transportation', '2026-10-05', 'Debit Card', 'Monthly smart card commute recharge'),
(1, 'Weekend Dining at Bistro', 2150.00, 'EXPENSE', 'Food', '2026-10-06', 'Credit Card', 'Family dinner with pizza and mocktails'),
(1, 'Vehicle Fuel Refill', 2800.00, 'EXPENSE', 'Transportation', '2026-10-07', 'UPI', 'Full tank unleaded petrol'),
(1, 'Casual Footwear & Sneakers', 3499.00, 'EXPENSE', 'Shopping', '2026-10-08', 'Credit Card', 'Autumn festival sale purchase'),
(1, 'Cotton Formal Shirts', 2199.00, 'EXPENSE', 'Shopping', '2026-10-09', 'Debit Card', 'Office wear apparel'),
(1, 'Dental Consultation & Cleaning', 1200.00, 'EXPENSE', 'Health', '2026-10-10', 'UPI', 'Routine bi-annual dental hygienist visit'),
(1, 'Cloud Architecture Course', 3500.00, 'EXPENSE', 'Education', '2026-10-11', 'Net Banking', 'Certification exam prep bundle'),
(1, 'Streaming & Music Subscriptions', 899.00, 'EXPENSE', 'Entertainment', '2026-10-12', 'Credit Card', 'Netflix Standard & Spotify Family combo'),
(1, 'Coffee & Cafe Snacks', 450.00, 'EXPENSE', 'Food', '2026-10-13', 'UPI', 'Espresso and blueberry muffin with colleague'),
(1, 'Pharmacy Vitamins & Supplements', 850.00, 'EXPENSE', 'Health', '2026-10-14', 'Cash', 'Multivitamins and Vitamin D3'),
(1, 'Mobile Prepaid Annual Recharge', 719.00, 'EXPENSE', 'Bills and Utilities', '2026-10-14', 'UPI', 'Quarterly data + voice bundle'),
(1, 'Weekend Cinema & Popcorn', 700.00, 'EXPENSE', 'Entertainment', '2026-10-15', 'UPI', 'Evening IMAX premiere ticket'),
(1, 'Artisan Bakery Bread & Pastries', 950.00, 'EXPENSE', 'Food', '2026-10-15', 'Debit Card', 'Sourdough loaf and chocolate croissants');

-- Transactions for September 2026 (user_id = 1)
INSERT INTO transactions (user_id, title, amount, type, category, transaction_date, payment_method, description) VALUES
(1, 'Monthly Software Engineer Salary', 85000.00, 'INCOME', 'Salary', '2026-09-01', 'Bank Transfer', 'September payroll'),
(1, 'UI Consulting Project', 15000.00, 'INCOME', 'Freelancing', '2026-09-15', 'UPI', 'Dashboard prototype design fee'),
(1, 'Stock Trading Profit', 5200.00, 'INCOME', 'Investment Returns', '2026-09-20', 'Bank Transfer', 'Swing trade gains'),
(1, 'Monthly Groceries', 5100.00, 'EXPENSE', 'Food', '2026-09-03', 'Credit Card', 'Provisions and groceries'),
(1, 'Electricity & Water Bill', 2900.00, 'EXPENSE', 'Bills and Utilities', '2026-09-05', 'UPI', 'Utility payments'),
(1, 'Vehicle Fuel Refill', 3200.00, 'EXPENSE', 'Transportation', '2026-09-08', 'UPI', 'Petrol refill'),
(1, 'Autumn Clothing Sale', 4800.00, 'EXPENSE', 'Shopping', '2026-09-12', 'Credit Card', 'Jeans and winter jacket'),
(1, 'Dining & Takeaways', 3400.00, 'EXPENSE', 'Food', '2026-09-18', 'Debit Card', 'Restaurant meals and food delivery'),
(1, 'Home Plumbing Repair', 2200.00, 'EXPENSE', 'Housing', '2026-09-22', 'Cash', 'Kitchen sink and pipe replacement'),
(1, 'Books & Study Material', 1800.00, 'EXPENSE', 'Education', '2026-09-25', 'Net Banking', 'System design reference books');

-- Transactions for August 2026 (user_id = 1)
INSERT INTO transactions (user_id, title, amount, type, category, transaction_date, payment_method, description) VALUES
(1, 'Monthly Software Engineer Salary', 85000.00, 'INCOME', 'Salary', '2026-08-01', 'Bank Transfer', 'August payroll'),
(1, 'Independence Day Bonus', 10000.00, 'INCOME', 'Salary', '2026-08-15', 'Bank Transfer', 'Annual performance festive bonus'),
(1, 'Monthly Groceries', 4900.00, 'EXPENSE', 'Food', '2026-08-04', 'Credit Card', 'Provisions and vegetables'),
(1, 'Electricity Bill', 3100.00, 'EXPENSE', 'Bills and Utilities', '2026-08-06', 'UPI', 'Summer AC electricity bill'),
(1, 'Fuel & Transit', 3600.00, 'EXPENSE', 'Transportation', '2026-08-10', 'UPI', 'Petrol and tolls'),
(1, 'Weekend Getaway Resort', 8500.00, 'EXPENSE', 'Travel', '2026-08-16', 'Credit Card', 'Hills station resort stay'),
(1, 'Dining Out', 2800.00, 'EXPENSE', 'Food', '2026-08-20', 'Debit Card', 'Dinner outings');

-- Budgets for October 2026 (user_id = 1)
INSERT INTO budgets (user_id, category, monthly_limit, budget_month, budget_year) VALUES
(1, 'Food', 10000.00, 10, 2026),
(1, 'Transportation', 6000.00, 10, 2026),
(1, 'Shopping', 5000.00, 10, 2026),
(1, 'Bills and Utilities', 5000.00, 10, 2026),
(1, 'Entertainment', 2500.00, 10, 2026),
(1, 'Health', 3000.00, 10, 2026),
(1, 'Education', 5000.00, 10, 2026);

-- Budgets for September 2026 (user_id = 1)
INSERT INTO budgets (user_id, category, monthly_limit, budget_month, budget_year) VALUES
(1, 'Food', 10000.00, 9, 2026),
(1, 'Transportation', 6000.00, 9, 2026),
(1, 'Shopping', 6000.00, 9, 2026),
(1, 'Bills and Utilities', 5000.00, 9, 2026);
