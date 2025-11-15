# Firebase Migration Scripts

## Overview
This directory contains scripts to migrate data from Oracle to Firebase and maintain synchronization between both systems.

## Scripts

### 1. `export-oracle.js`
Exports data from Oracle database to JSON files.

**Usage:**
```bash
cd server/firebase
node export-oracle.js
```

**Output:**
- `data/uster_par.json`
- `data/uster_tbl.json`
- `data/tensorapid_par.json`
- `data/tensorapid_tbl.json`

### 2. `import-firebase.js`
Imports JSON files to Firebase Firestore.

**Usage:**
```bash
node import-firebase.js
```

**Requirements:**
- Firebase project created
- `serviceAccountKey.json` in this directory

### 3. `sync-bidirectional.js`
Synchronizes changes between Oracle and Firebase.

**Usage:**
```bash
node sync-bidirectional.js
```

**Features:**
- Detects new records in Oracle
- Uploads to Firebase
- Maintains sync log

## Setup Instructions

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project: "carga-datos-vue"
3. Enable Firestore Database
4. Generate service account key

### 2. Download Credentials
1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `server/firebase/serviceAccountKey.json`
4. Add to `.gitignore`:
   ```
   server/firebase/serviceAccountKey.json
   server/firebase/data/
   ```

### 3. Install Dependencies
```bash
cd server
npm install firebase-admin
```

### 4. Run Migration
```bash
cd server/firebase
node export-oracle.js    # Export from Oracle
node import-firebase.js  # Import to Firebase
```

## Safety Features

- ✅ Oracle remains untouched (read-only operations)
- ✅ Data validation before upload
- ✅ Rollback capability
- ✅ Detailed logging
- ✅ Checksums for data integrity

## Rollback

To revert migration:
1. Delete Firebase collections (via console)
2. Oracle data remains intact
3. No code changes in main branch

## Support

- Oracle continues working 100%
- Firebase is parallel/optional
- No impact on current functionality
