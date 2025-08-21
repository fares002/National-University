// Shared validation helpers to mirror backend express-validator rules

// Username regex: allows Unicode letters, numbers, spaces, underscores, hyphens
export const usernameRegex = /^[\p{L}\p{N}_\-\s]+$/u;

// Password complexity: at least one lowercase, one uppercase, and one number
export const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

// Validation constants matching backend
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 50;
export const EMAIL_MAX = 100;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

// Student name validation
export const STUDENT_NAME_MIN = 2;
export const STUDENT_NAME_MAX = 100;

// Description validation
export const DESCRIPTION_MIN = 3;
export const DESCRIPTION_MAX = 1000;

// Vendor validation
export const VENDOR_MIN = 2;
export const VENDOR_MAX = 255;

// Notes/Receipt URL validation
export const NOTES_MAX = 500;
export const RECEIPT_URL_MAX = 500;

// Amount validation
export const AMOUNT_MAX = 99999999.99;
export const EXPENSE_AMOUNT_MAX = 999999999999.99;
