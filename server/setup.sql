-- BMS Database Setup
-- Run this script once in MySQL to create the required database and tables.

CREATE DATABASE IF NOT EXISTS bms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bms;

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('DEPOSIT', 'WITHDRAW') NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

-- Optional: seed a few accounts to get started
INSERT IGNORE INTO
    accounts (id, name, balance)
VALUES (1, 'Alice Johnson', 50000.00),
    (2, 'Bob Smith', 25000.00),
    (3, 'Carol White', 75000.00);