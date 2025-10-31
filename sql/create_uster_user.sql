-- SQL script to create a dedicated application user for Uster and grant minimal privileges.
-- Run this script as a privileged user (for example SYSTEM) using SQL*Plus or SQL Developer.
-- Example (PowerShell):
-- sqlplus SYSTEM/<system_password>@<host>:1521/<servicename> @create_uster_user.sql

   SET DEFINE OFF;

PROMPT Creating user USTER_USER (change password before running in production)

-- Change the password 'ChangeMe123!' to a strong password before running in production
create user uster_user identified by "ChangeMe123!";

PROMPT Granting session and resource privileges
grant create session to uster_user;
-- Optional: if you want the user to create objects in its schema uncomment the next line
-- GRANT CREATE TABLE, CREATE VIEW, CREATE SEQUENCE, CREATE TRIGGER TO USTER_USER;

PROMPT Granting tablespace quota (adjust tablespace name to your environment)
-- Give some quota on USERS tablespace (or change to appropriate tablespace)
alter user uster_user
   quota unlimited on users;

PROMPT Granting object privileges on existing USTER tables (if they are owned by SYSTEM)
-- If your USTER_PAR and USTER_TBL were created under the SYSTEM schema, grant the needed rights:
grant select,insert,update,delete on system.uster_par to uster_user;
grant select,insert,update,delete on system.uster_tbl to uster_user;

PROMPT Done. Review grants and change password as appropriate.

-- Helpful queries for verification (run after connecting as SYSTEM):
-- SELECT owner, table_name FROM all_tables WHERE table_name IN ('USTER_PAR','USTER_TBL');
-- SELECT grantee, privilege FROM dba_tab_privs WHERE table_name IN ('USTER_PAR','USTER_TBL');

commit;
EXIT;