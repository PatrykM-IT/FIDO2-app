// Setup the MySQL database
const mysql = require('mysql2');


const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'Qwerty123',
    database: 'fido2_users'
}).promise()


const insert = await pool.query("SELECT * FROM user")

console.log(insert)