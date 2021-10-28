'use strict';
require('dotenv').config() ;
const mysql = require('mysql2');
var util = require('util');

const config = {
  connectionLimit : 500,
  multipleStatements: true,
  connectTimeout: 1000000,
  host     : process.env.DB_SERVER ||  'lmpp-db-1.c11yjw3tuj93.us-east-2.rds.amazonaws.com',
  user     : process.env.DB_USER || 'libertymutual',
  password : process.env.DB_PASSWORD || 'l!b3Rty@!79!',
  database : process.env.DB_NAME || 'libertymutual_prod',
  port : '3306'
};

const config_dev = {
  connectionLimit : 500,
  multipleStatements: true,
  host     : 'localhost',
  user     : 'liberty_mutual',
  password : 'Tr#@12$dS',
  database : 'liberty_mutual',
  port : '3306'
};

const config_local = {
  connectionLimit :3,
  multipleStatements: true,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'liberty_new',
  port     : '3306'
};

// const pool =  mysql.createPool(config);
const pool =  mysql.createPool(config_local);

// Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
  if (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.error('Database connection was closed.')
      }
      if (err.code === 'ER_CON_COUNT_ERROR') {
          console.error('Database has too many connections.')
      }
      if (err.code === 'ECONNREFUSED') {
          console.error('Database connection was refused.')
      }
  }
  
  if (connection) {
    console.log('Database Connection established');
    connection.release();
  }   
   return
});

module.exports = pool.promise();

