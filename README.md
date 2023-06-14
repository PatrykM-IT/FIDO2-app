# Magisterka_FIDO2
Tworzenie demonstratora w postaci aplikacji webowej, która wykorzystuje technologię protokołu FIDO2 oraz fizyczne klucze.

App build with this tut: https://www.youtube.com/watch?v=-RCnNyD0L-s

Used depends:

node.js
nodemon
ejs
express
express-session
bcrypt
mysql2
dotenv
passport 
passport-local 
express-flash
method-override 

dodano "./dist/helpers/decodeAttestationObject": "./dist/helpers/decodeAttestationObject.js"

1.Update the package.json file of the @simplewebauthn/server package.
2.Look for the "exports" field in the package.json file.
3.Ensure that the subpath "./dist/helpers/decodeAttestationObject" is included in the "exports" field.
4.If it's missing, add the following entry to the "exports" field:
Copy code
{
  "exports": {
    "./dist/helpers/decodeAttestationObject": "./dist/helpers/decodeAttestationObject"
  }
}