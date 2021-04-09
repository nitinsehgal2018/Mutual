'use strict';
require('dotenv').config() ;
const mysql = require('mysql2');
var util = require('util');

const config = {
  connectionLimit : 100,
  host     : process.env.DB_SERVER ||  'localhost',
  user     : process.env.DB_USER || 'liberty_mutual',
  password : process.env.DB_PASSWORD || 'Tr#@12$dS',
  database : process.env.DB_NAME || 'liberty_mutual',
  port : '3306'
};

const config2 = {
  connectionLimit : 100,
  host     : '127.0.0.1',
  user     : 'root',
  password :  '',
  database : 'liberty',
  port : '3306'
};

const pool =  mysql.createPool(config);

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

