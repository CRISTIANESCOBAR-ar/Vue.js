-- Crear tabla TENSORAPID_PAR para almacenar los datos de los archivos .PAR de TensoRapid
create table tensorapid_par (
   testnr           varchar2(10) primary key,
   uster_testnr     varchar2(10) not null,
   catalog          varchar2(50),
   time_stamp       varchar2(50),
   time             varchar2(50),
   sortiment        varchar2(50),
   article          varchar2(100),
   maschnr          varchar2(50),
   matclass         varchar2(50),
   nomcount         number,
   nomtwist         number,
   uscode           varchar2(500),
   laborant         varchar2(200),
   comment          varchar2(1000),
   artigo           varchar2(100),
   lote             varchar2(100),
   maquina          varchar2(50),
   titulo           varchar2(50),
   comprimento      number,
   length           number,
   comprimento_un   varchar2(20),
   pre_tensao       number,
   pretension       number,
   velocidade       number,
   extspeed         number,
   clamppressure    number,
   cycleforcell     number,
   cycleforceul     number,
   nmbofforcecycles number,
   cyclelongll      number,
   cyclelongul      number,
   nmbofelongcycles number,
   forcef1rel       number,
   elongatione1rel  number,
   evaltimerel      number,
   preloadcyclesrel number,
   forcef1ret       number,
   elongatione1ret  number,
   evaltimeret      number,
   preloadcyclesret number,
   cond_teste_1     number,
   cond_teste_2     number,
   cond_teste_3     number,
   cond_teste_4     number,
   repet            number,
   pausa            number,
   calib_elong_a    number,
   calib_elong_b    number,
   calib_carga_a    number,
   calib_carga_b    number,
   escala_carga     number,
   tempo_max        number,
   ajuda_ten        varchar2(50),
   observacao       varchar2(500),
   maquina_aux      varchar2(50),
   tecnico          varchar2(100),
   n_provas         number,
   peso_bob         number,
   tolerancia       number,
   bobina_esp       varchar2(50),
   mat_tipo         varchar2(50),
   mat_codigo       varchar2(50),
   leituras         varchar2(50),
   tabela_conf      varchar2(50),
   par_json         clob,
   created_at       timestamp default systimestamp not null,
   constraint fk_tensorapid_uster foreign key ( uster_testnr )
      references uster_par ( testnr )
);

-- Crear tabla TENSORAPID_TBL para almacenar los datos de medición individuales
create table tensorapid_tbl (
   testnr        varchar2(10) not null,
   ne_titulo     varchar2(20),
   huso_number   number not null,
   tiempo_rotura number,
   fuerza_b      number,
   elongacion    number,
   tenacidad     number,
   trabajo       number,
   created_at    timestamp default systimestamp not null,
   constraint pk_tensorapid_tbl primary key ( testnr,
                                              huso_number ),
   constraint fk_tensorapid_tbl_par foreign key ( testnr )
      references tensorapid_par ( testnr )
         on delete cascade
);

-- Crear índices para mejorar el rendimiento
create index idx_tensorapid_par_uster on
   tensorapid_par (
      uster_testnr
   );
create index idx_tensorapid_tbl_testnr on
   tensorapid_tbl (
      testnr
   );

-- Comentarios para documentación
comment on table tensorapid_par is
   'Datos de parámetros de ensayos TensoRapid vinculados a ensayos USTER';
comment on table tensorapid_tbl is
   'Datos de mediciones individuales de ensayos TensoRapid';
comment on column tensorapid_par.uster_testnr is
   'Referencia al ensayo USTER correspondiente';
comment on column tensorapid_par.created_at is
   'Fecha y hora de creación del registro';
comment on column tensorapid_tbl.ne_titulo is
   'Título del hilo en formato completo (ej: 62/5, 320/5)';
comment on column tensorapid_tbl.huso_number is
   'Número de huso extraído del título (ej: 62 de "62/5")';
comment on column tensorapid_tbl.created_at is
   'Fecha y hora de creación del registro';
comment on column tensorapid_par.par_json is
   'JSON completo con todos los campos parseados del archivo .PAR';