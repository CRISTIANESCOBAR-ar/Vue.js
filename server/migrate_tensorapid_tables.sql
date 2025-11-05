-- Script de migración para actualizar tablas TENSORAPID existentes
-- Ejecutar SOLO si las tablas ya fueron creadas previamente

-- Opción 1: Si las tablas están vacías, es mejor eliminarlas y recrearlas
-- DROP TABLE TENSORAPID_TBL CASCADE CONSTRAINTS;
-- DROP TABLE TENSORAPID_PAR CASCADE CONSTRAINTS;
-- Luego ejecutar: create_tensorapid_tables.sql

-- Opción 2: Si ya hay datos, ejecutar las siguientes alteraciones

-- Agregar CREATED_AT a TENSORAPID_PAR
alter table tensorapid_par add (
   created_at timestamp default systimestamp not null
);

-- Modificar TENSORAPID_TBL para agregar nuevas columnas
-- Paso 1: Eliminar la constraint de primary key existente
alter table tensorapid_tbl drop constraint pk_tensorapid_tbl;

-- Paso 2: Renombrar NO_ a HUSO_NUMBER (o agregar nueva columna)
alter table tensorapid_tbl rename column no_ to huso_number;

-- Paso 3: Agregar nuevas columnas
alter table tensorapid_tbl add (
   ne_titulo  varchar2(20),
   created_at timestamp default systimestamp not null
);

-- Paso 4: Recrear la primary key con HUSO_NUMBER
alter table tensorapid_tbl add constraint pk_tensorapid_tbl primary key ( testnr,
                                                                          huso_number );

-- Agregar comentarios
comment on column tensorapid_par.created_at is
   'Fecha y hora de creación del registro';
comment on column tensorapid_tbl.ne_titulo is
   'Título del hilo en formato completo (ej: 62/5, 320/5)';
comment on column tensorapid_tbl.huso_number is
   'Número de huso extraído del título (ej: 62 de "62/5")';
comment on column tensorapid_tbl.created_at is
   'Fecha y hora de creación del registro';

-- Confirmar cambios
commit;