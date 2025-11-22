-- Create backup directory in Oracle
CREATE OR REPLACE DIRECTORY backup_dir AS 'C:\oracle_backup';
GRANT READ, WRITE ON DIRECTORY backup_dir TO SYSTEM;
EXIT;
