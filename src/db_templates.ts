let postgresTemplate = `const { Pool } = require("pg");

const pool = new Pool({
  host: 'YOUR_DB_HOST',
  port: 'YOUR_DB_PORT',
  user: 'YOUR_DB_USER',
  database: 'YOUR_DB_NAME',
  password: 'YOUR_DB_PASSWORD',
});

const query = async (text, params, callback) => {
  return pool.query(text, params, callback);
};

module.exports = { query, pool };`;

export { postgresTemplate };
