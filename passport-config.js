const { authenticate } = require('passport')
const bcrypt = require('bcrypt')
const mysql = require('mysql2');

const LocalStrategy = require('passport-local').Strategy

function initialize(passport) {
    
    const authenticateUser = async (username, password, done) => {

        const db = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "Qwerty123",
            database: "test_fido",
          });
        
          db.connect((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("MYSQL CONNECTED inside authenticateUser")
            }
        })
    
        db.query(`SELECT * FROM users WHERE username = ?`, [username], async (error, results) => {
        if (error) { return done(error); }
        if (!results || !results[0]) {
          return done(null, false, { message: 'No user with that username' });
        }

        const user = results[0];
      
        try {
          if (await bcrypt.compare(password, user.password)) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        } catch (e) {
          return done(e);
        }
        
      });
    }
  
    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));
    passport.serializeUser((user, done) => {
        done(null, user)
    })
    passport.deserializeUser((id, done) => {
        done(null, id)
    })
  }
  
  module.exports = initialize;