const express = require('express')
const session = require('express-session');
const flash = require('express-flash')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const mysql = require('mysql2');
const initializePassport = require('./passport-config')
const methodOverride = require('method-override')


// Human-readable title for your website
const rpName = 'SimpleWebAuthn Example';
// A unique identifier for your website
const rpID = 'localhost';
// The URL at which registrations and authentications should occur
const origin = `http://${rpID}:3000`;

console.log(origin);

const {
  // Registration
  generateRegistrationOptions,
  verifyRegistrationResponse,
  // Authentication
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");


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
        console.log("MYSQL CONNECTED")
    }
})

app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(express.json());
app.use(flash())
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))


// Initialize passport configuration using the findUserByUsername function
initializePassport(passport) 


app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.username})
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')

})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}),
)

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.delete('/logout', (req, res) => {
  req.logOut(function(err) {
    if (err) {
      // Handle any error that occurred during logout
      console.error(err);
      return res.redirect('/login');
    }
    // Redirect to the login page after successful logout
    res.redirect('/login');
  });
});


app.get("/generate-authentication-options", async (req, res) => {

  if (!req.user) {
    return res.status(401).send('User not authenticated');
  }
  const { id } = req.user;

  // Query the authenticators table to fetch user's authenticators
  db.query(
    'SELECT * FROM authenticators WHERE user_id = ?',
    [id],
    (error, results, fields) => {
      if (error) throw error;

      const authenticators = results.map(row => ({
        id: row.id,
        credentialID: row.credentialID,
        credentialPublicKey: row.credentialPublicKey,
        counter: row.counter,
        credentialDeviceType: row.credentialDeviceType,
        credentialBackedUp: row.credentialBackedUp,
        transports: row.transports ? JSON.parse(row.transports) : []
      }));
      
      console.log('Authenticator credentialID values:', authenticators.map(authenticator => authenticator.credentialID));
      console.log('Authenticator ID values:', authenticators.map(authenticator => authenticator.id));
      
        const allowCredentials = authenticators.map(authenticator => {
        const base64UrlCredentialID = authenticator.credentialID.replace(/-/g, '+').replace(/_/g, '/');
        const binaryStr = atob(base64UrlCredentialID);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const decodedCredentialID = bytes;
        return {
          id: decodedCredentialID,
          type: 'public-key',
          // Optional
          transports: authenticator.transports,
        };
      });

      const options = generateAuthenticationOptions({
        allowCredentials,
        timeout: 60000,
        userVerification: 'required',
        rpID,
        extensions,
      });
    
      // Process the results and generate authentication options
      const challenge = options.challenge;
      //console.log("Wyzwanie zanim zostanie zapisane: "+ challenge)
      //console.log("userid: "+ user.id)
      const sql2 = "UPDATE users SET currentChallenge=? WHERE id=?";
      db.query(sql2, [challenge, id], (err, result) => {
        if (err) {
          res.status(500).send("Error updating current challenge");
        } else {
          console.log(`Wygenerowane opcje:`);
          res.json(options);
          console.log(options)
        }
      });
    }
  );
});


app.post('/verify-authentication', async (req, res) => {
  //console.log(`Received data from key: ${JSON.stringify(req.body)}`);
  //console.log("Username in verify-registration: "+req.session.username);
  const { body } = req;

  const sql = 'SELECT id, currentChallenge FROM users WHERE id = ?';
  try {
    const rows = await new Promise((resolve, reject) => {
      db.query(sql, [id], (err, rows) => {
        if (err) {
          console.error('Nie można było pobrać wyzwania z bazy:', err);
          reject(err);
        }
        resolve(rows);
      });
    });
  
    const expectedChallenge = rows[0].currentChallenge;
    console.log(expectedChallenge);
  
    console.log("Body id= " + body.id);
  
    let credentialID, credentialPublicKey;
    try {
      const results = await new Promise((resolve, reject) => {
        db.query(
          'SELECT credentialID, credentialPublicKey FROM authenticators WHERE credentialID = ?',
          [body.id],
          (error, results, fields) => {
            if (error) return reject(error);
            resolve(results);
          }
        );
      });
      if (results.length > 0) {
        credentialID = results[0].credentialID;
        credentialPublicKey = results[0].credentialPublicKey;
        console.log(`Credential ID ${credentialID} found.`);
        //console.log(`credentialPublicKey ${credentialPublicKey} found.`);
      } else {
        console.log('Credential ID not found.');
      }
    } catch (error) {
      console.error('Error while selecting credential ID and public key:', error);
      return res.status(500).send({ error: 'Internal Server Error' });
    }
  
    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: { credentialID, credentialPublicKey },
      });
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: error.message });
    }
  
    const { verified } = verification;
    console.log('VERIFICATION DATA:', verification);
    return res.send({ verified });
  
  } catch (err) {
    console.error('Weryfikacja nie powiodła się:', err);
    return;
  }
    

});

app.post("/generate-registration-options", async (req, res) => {
  try {
    db.beginTransaction((err) => {
      if (err) {
        throw err;
      }

      console.log(`Received registration data: ${JSON.stringify(req.body)}`);
      const username = req.body.name;
      req.session.username = username;

      bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        if (err) {
          db.rollback(() => {
            console.error(err);
            res.status(500).send("Error hashing password");
          });
        } else {
          const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
          db.query(sql, [username, hashedPassword], (err, result) => {
            if (err) {
              db.rollback(() => {
                console.error(err);
                res.status(500).json({ error: "Error registering user with password" });
              });
            } else {
              const user = { id: result.insertId, username };
              const userAuthenticators = [];
              const options = generateRegistrationOptions({
                rpName,
                rpID,
                userID: user.id,
                userName: user.username,
                attestationType: "direct",
                excludeCredentials: userAuthenticators.map((authenticator) => ({
                  id: authenticator.credentialID,
                  type: "public-key",
                  transports: authenticator.transports,
                })),
              });

              const challenge = options.challenge;
              const sql2 = "UPDATE users SET currentChallenge=? WHERE id=?";
              db.query(sql2, [challenge, user.id], (err, result) => {
                if (err) {
                  db.rollback(() => {
                    console.error(err);
                    res.status(500).send("Error updating current challenge");
                  });
                } else {
                  db.commit((err) => {
                    if (err) {
                      db.rollback(() => {
                        console.error(err);
                        res.status(500).send("Error committing transaction");
                      });
                    } else {
                      res.json(options);
                      console.log(options);
                      console.log("Pomyślnie wysłano opcje");
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user: "+ error });
  }
});

app.post('/verify-registration', async (req, res) => {
  const user = req.session.username;
  const sql = 'SELECT id, currentChallenge FROM users WHERE username = ?';

  try {
    const rows = await new Promise((resolve, reject) => {
      db.query(sql, [user], (err, rows) => {
        if (err) {
          console.error('Nie można było pobrać wyzwania z bazy:', err);
          reject(err);
        }
        resolve(rows);
      });
    });

    const user_id = rows[0].id;
    const expectedChallenge = rows[0].currentChallenge;

    const { body } = req;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error(error);
      return res.status(400).send({ error: error.message });
    }

    const { verified, registrationInfo } = verification;

    if (!verified) {
      return res.status(400).send({ error: 'Registration verification failed' });
    }

    const { credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

    const base64UrlCredentialID = Buffer.from(registrationInfo.credentialID)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const base64UrlCredentialIDdb = base64UrlCredentialID;

    const base64 = base64UrlCredentialID.replace(/-/g, '+').replace(/_/g, '/');
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const TESTcredentialID = bytes;

    console.log('Sprawdzenie poprawności zmiany z base64 ', TESTcredentialID);

    const sql3 = "INSERT INTO authenticators (credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, transports, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [
      base64UrlCredentialIDdb,
      Buffer.from(credentialPublicKey.buffer, credentialPublicKey.byteOffset, credentialPublicKey.byteLength),
      counter,
      credentialDeviceType,
      credentialBackedUp,
      null,
      user_id,
    ];

    db.query(sql3, values, (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).send('Error registering user with password');
      } else {
        console.log('Database INSERT to auth table result:', result);
        return res.send({ verified });
      }
    });
  } catch (err) {
    console.error('Weryfikacja nie powiodła się:', err);
    return res.status(500).send('Error registering user with password');
  }
});

app.post('/delete-user', (req, res) => {
  const username = req.body.username;
  const sql = 'DELETE FROM users WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      res.status(500).send('Error deleting user from the database');
    } else {
      console.log('User deleted:', username);
      res.sendStatus(200); // Send a success status code
    }
  });
});

function checkAuthenticated(req, res, next){
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next){
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}




app.listen(3000)