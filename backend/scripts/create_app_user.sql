-- backend/scripts/create_app_user.sql
-- This script creates a new PostgreSQL user with least-privilege access for the application.
-- It should be run by a superuser (e.g., 'postgres' user).

-- IMPORTANT: Replace 'your_app_password' with a strong, unique password for the application user.
CREATE USER app_user WITH PASSWORD 'Kandizz@1947';

-- Grant CONNECT privilege to the application database
GRANT CONNECT ON DATABASE "Github-test" TO app_user;

-- Grant privileges on existing tables
-- Note: Replace 'testcase_db' with your actual database name if different.
-- Note: Replace 'Users', 'RefreshTokens', 'TestCases' with your actual table names if different.

-- Users Table
GRANT SELECT, INSERT, UPDATE, DELETE ON "Users" TO app_user;

-- RefreshTokens Table
GRANT SELECT, INSERT, UPDATE, DELETE ON "RefreshTokens" TO app_user;

-- TestCases Table (assuming a TestCases model exists)
GRANT SELECT, INSERT, UPDATE, DELETE ON "TestCases" TO app_user;

-- Optional: Grant usage on sequences for primary keys (if using serial/bigserial)
-- This might be needed if your tables use auto-incrementing primary keys.
-- You may need to identify specific sequence names. Example:
-- GRANT USAGE ON SEQUENCE "Users_id_seq" TO app_user;
-- GRANT USAGE ON SEQUENCE "RefreshTokens_id_seq" TO app_user;
-- GRANT USAGE ON SEQUENCE "TestCases_id_seq" TO app_user;

-- Alert if database name or table names are different:
-- Please ensure 'Github-test' matches your database name in .env and docker-compose.yml.
-- Please ensure "Users", "RefreshTokens", "TestCases" match your actual table names.

SELECT 'Application user (app_user) created and permissions granted.' AS status;
