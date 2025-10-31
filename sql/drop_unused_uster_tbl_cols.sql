-- Script: drop_unused_uster_tbl_cols.sql
-- Purpose: Remove unused columns from USTER_TBL that are not needed
-- Columns to remove: TIEMPO_ROTURA, FUERZA_B, ELONGACION, TENACIDAD, TRABAJO
-- NOTE: Run this script as a DBA or the owner of the USTER_TBL table (e.g., USTER_USER or SYSTEM).
-- This script is idempotent: it only drops columns that currently exist.

   SET DEFINE OFF;

declare
   v_cnt number;
   v_col varchar2(100);
   cursor c_cols is
   select column_name
     from user_tab_columns
    where table_name = 'USTER_TBL'
      and column_name in ( 'TIEMPO_ROTURA',
                           'FUERZA_B',
                           'ELONGACION',
                           'TENACIDAD',
                           'TRABAJO' );
begin
   for r in c_cols loop
      v_col := r.column_name;
      begin
         execute immediate 'ALTER TABLE USTER_TBL DROP COLUMN "'
                           || v_col
                           || '"';
         dbms_output.put_line('Dropped column: ' || v_col);
      exception
         when others then
        -- If drop fails for any reason, print the error and continue with other columns
            dbms_output.put_line('Failed to drop column '
                                 || v_col
                                 || ': ' || sqlerrm);
      end;
   end loop;
end;
/

   SET DEFINE ON;

-- After running: consider running a COMMIT (DDL auto-commits) and verifying the table structure:
-- SELECT column_name FROM user_tab_columns WHERE table_name = 'USTER_TBL' ORDER BY column_id;

-- Optional: if you want to fully remove any dependent objects, review constraints and indexes referencing these columns before running.