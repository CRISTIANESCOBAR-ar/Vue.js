Server API for Uster export

Overview

This small Express server exposes a single endpoint to receive Uster data and store it into Oracle:

POST /api/uster/upload

Payload shape:
{
"par": { "TESTNR": "001694", "CATALOG": "...", ... },
"tbl": [ { "SEQNO": 1, "NO": 1, "TIEMPO_ROTURA": 8.78, "FUERZA_B": 16.14, "ELONGACION": 18.82, "TENACIDAD": 3.5, "TRABAJO": 0.54 }, ... ]
}

Behavior

- The server performs a MERGE into `Uster_PAR` (upsert by TESTNR).
- It deletes any existing rows in `Uster_TBL` for the TESTNR and inserts the supplied rows using bulk insert (executeMany).
- All DB operations run inside a transaction. If anything fails, the transaction is rolled back.

Setup

1. Install Node dependencies

   cd server
   npm install

2. Set environment variables (create a `.env` file in `server/`):

   ORACLE_USER=your_user
   ORACLE_PASSWORD=your_password
   ORACLE_CONNECTIONSTRING=host:port/service_name # e.g. localhost/XEPDB1
   PORT=3001

3. Start the server

   npm start

Example curl

curl -X POST http://localhost:3001/api/uster/upload -H "Content-Type: application/json" -d '{"par": {"TESTNR": "001694", "MASCHNR":"OR10", "NOMCOUNT":7}, "tbl": [{"SEQNO":1,"NO":1,"TIEMPO_ROTURA":8.78,"FUERZA_B":16.14,"ELONGACION":18.82,"TENACIDAD":3.5,"TRABAJO":0.54}] }'

Notes

- The server uses the `oracledb` driver. Installing `oracledb` requires Oracle Instant Client libraries in the environment. Follow the official installation docs: https://oracle.github.io/node-oracledb/INSTALL.html
- If your Oracle server/version does not support IDENTITY columns for `Uster_TBL`, the earlier SQL script can be adjusted to use a SEQUENCE + TRIGGER.
- For production, secure this endpoint (authentication, TLS), validate payloads more strictly (e.g. Joi), and limit request sizes.
