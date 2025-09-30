-- prepares a MySQL server for the project

CREATE DATABASE IF NOT EXISTS National_university;
CREATE USER IF NOT EXISTS 'National_university_admin'@'localhost' IDENTIFIED BY 'National_university_password';
GRANT ALL PRIVILEGES ON `National_university`.* TO 'National_university_admin'@'localhost';
GRANT SELECT ON `performance_schema`.* TO 'National_university_admin'@'localhost';
FLUSH PRIVILEGES;

GRANT ALL PRIVILEGES ON *.* TO 'National_university_admin'@'localhost';
FLUSH PRIVILEGES;