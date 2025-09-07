-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `role` ENUM('admin', 'auditor') NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `lastLoginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_lastLoginAt_idx`(`lastLoginAt`),
    INDEX `users_created_at_idx`(`created_at`),
    INDEX `users_role_lastLoginAt_idx`(`role`, `lastLoginAt`),
    INDEX `users_role_created_at_idx`(`role`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `feeType` ENUM('NEW_YEAR', 'SUPPLEMENTARY', 'TRAINING', 'STUDENT_SERVICES', 'OTHER', 'EXAM') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `amountUSD` DECIMAL(15, 2) NULL,
    `usdAppliedRate` DECIMAL(10, 6) NULL,
    `receiptNumber` VARCHAR(191) NOT NULL,
    `paymentMethod` ENUM('CASH', 'TRANSFER', 'CHEQUE') NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_receiptNumber_key`(`receiptNumber`),
    INDEX `payments_paymentDate_idx`(`paymentDate`),
    INDEX `payments_feeType_idx`(`feeType`),
    INDEX `payments_paymentMethod_idx`(`paymentMethod`),
    INDEX `payments_createdById_idx`(`createdById`),
    INDEX `payments_paymentDate_feeType_idx`(`paymentDate`, `feeType`),
    INDEX `payments_paymentDate_paymentMethod_idx`(`paymentDate`, `paymentMethod`),
    INDEX `payments_createdById_paymentDate_idx`(`createdById`, `paymentDate`),
    INDEX `payments_studentId_idx`(`studentId`),
    INDEX `payments_receiptNumber_idx`(`receiptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `amountUSD` DECIMAL(15, 2) NULL,
    `usdAppliedRate` DECIMAL(10, 6) NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `vendor` VARCHAR(255) NULL,
    `receipt_url` VARCHAR(500) NULL,
    `date` DATE NOT NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `expenses_date_idx`(`date`),
    INDEX `expenses_category_idx`(`category`),
    INDEX `expenses_vendor_idx`(`vendor`),
    INDEX `expenses_created_by_idx`(`created_by`),
    INDEX `expenses_date_category_idx`(`date`, `category`),
    INDEX `expenses_date_vendor_idx`(`date`, `vendor`),
    INDEX `expenses_created_by_date_idx`(`created_by`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currency_rates` (
    `id` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'EGP',
    `rate` DECIMAL(10, 6) NOT NULL,
    `validFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `currency_rates_currency_isActive_idx`(`currency`, `isActive`),
    INDEX `currency_rates_validFrom_idx`(`validFrom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
