
const {Client} = require('pg');


// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

const writeQuery = (table, row, pgClient) => {
  const {valuesStr, queryPayload} = toValuesStr(row);
  const queryStr = `INSERT INTO ${table} ${valuesStr}`;
  return queryPostgres(queryStr, queryPayload, 'write', pgClient);
};


const deleteQuery = (table, filters, pgClient) => {
  const {filterStr, queryPayload}  = toFilterStr(filters);
  const queryStr = `DELETE FROM ${table} ${filterStr}`;
  return queryPostgres(queryStr, queryPayload, 'write', pgClient);
};


const selectQuery = (table, columns, filters, orderBy, limit, pgClient) => {
  const selectStr = `SELECT ${columns.join(', ')} FROM ${table}`;
  const {filterStr, queryPayload} = toFilterStr(filters, orderBy, 0, false, limit);
  const queryStr = `${selectStr} ${filterStr}`;
  return queryPostgres(queryStr, queryPayload, 'readOnly', pgClient);
};


const upsertQuery = (table, row, updateRow, filters, pgClient) => {
  const setStr = toUpdateStr(updateRow);
  const values = toValuesStr(row);
  const {filterStr, queryPayload} = toFilterStr(filters, null, Object.keys(row).length, true);
  const conflictTarget = Object.keys(filters).join(',');
  const queryStr = `INSERT INTO ${table} ${values.valuesStr}
    ON CONFLICT (${conflictTarget}) DO UPDATE ${setStr} ${filterStr}`;
  return queryPostgres(
    queryStr, [...values.queryPayload, ...queryPayload], 'write', pgClient,
  );
};

const updateQuery = (table, row, filters, pgClient) => {
  const setStr = toUpdateStr(row);
  const {filterStr, queryPayload} = toFilterStr(filters);
  const queryStr = `UPDATE ${table} ${setStr} ${filterStr}`;
  return queryPostgres(queryStr, queryPayload, 'write', pgClient);
};


// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

const getPostgresClient = () => {
  const port = process.env.PORT || 8000;
  const settings = port == 8000
    ? {database: 'postgres'}
    : {
        connectionString: process.env.DATABASE_URL,
        ssl: {rejectUnauthorized: false},
    };
  const client = new Client(settings);
  // TODO: can you connect/end the same client multiple times?
  return client;
};


// returns the query as a promise
const queryPostgres = (queryStr, queryPayload, readMode, pgClient) => {
  const client = pgClient != null ? pgClient : getPostgresClient();
  client.connect();
  if (readMode == 'readOnly' || readMode == 'readonly' || readMode == 'read only') {
    client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY;', () => {});
  }
 return  client.query(queryStr, queryPayload)
  .then(
    (res) => {
      if (pgClient == null) client.end();
      return res;
    },
    (err) => {
      if (pgClient == null) client.end();
      console.error('error for query: ', queryStr);
      console.error(err);
      throw err;
    },
  );
}


// convert filters json into sql where conditions
const toFilterStr = (filters, orderBy, offset, excluded, limit) => {
  const excludeStr = excluded ? 'EXCLUDED.' : '';
  let filterStr = ' ';
  offset = offset == null ? 0 : offset;
  const queryPayload = [];
  const cols = Object.keys(filters);
  for (let i = 0; i < cols.length; i++) {
    if (i == 0) {
      filterStr += 'WHERE ';
    }
    const col = cols[i];
    filterStr += excludeStr + col + "= $" + (i + offset + 1);
    queryPayload.push(filters[col]);
    if (i < cols.length - 1) {
      filterStr += ' AND ';
    }
  }
  if (orderBy != null) {
    if (orderBy.order != null) {
      filterStr += ` ORDER BY ${orderBy.orderBy} ${orderBy.order}`;
    } else {
      filterStr += ` ORDER BY ${orderBy} ASC`;
    }
  }
  if (limit != null) {
    filterStr += ` LIMIT ${limit}`;
  }

  return {filterStr, queryPayload};
}

const toValuesStr = (row) => {
  let columnStr = '';
  let valueStr = '';
  const queryPayload = [];
  const cols = Object.keys(row);
  for (let i = 0; i < cols.length; i++) {
    columnStr += cols[i];
    let value = row[cols[i]];
    // if (value != (parseFloat(value))) {
    //   value = "'" + value + "'";
    // }
    queryPayload.push(value);
    valueStr += "$" + (i + 1);
    if (i < cols.length - 1) {
      columnStr += ', ';
      valueStr += ', ';
    }
  }

  return {
    valuesStr: `(${columnStr}) VALUES (${valueStr})`,
    queryPayload,
  };
}

const toUpdateStr = (row) => {
  let setStr = '';
  const cols = Object.keys(row);
  for (let i = 0; i < cols.length; i++) {
    if (i == 0) {
      setStr += 'SET ';
    }
    const col = cols[i];
    setStr += col + "=" + row[col];
    if (i < cols.length - 1) {
      setStr += ', ';
    }
  }
  return setStr;
}


module.exports = {
  getPostgresClient,
  writeQuery,
  selectQuery,
  updateQuery,
  deleteQuery,
  upsertQuery,
}
