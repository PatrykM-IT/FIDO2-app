# Magisterka_FIDO2

# Wprowadznie

Celem pracy magisterskiej jest implementacja oraz analiza protokołu FIDO2 z wykorzystaniem kluczy fizycznych. Praca skupia się na stworzeniu demonstratora w postaci aplikacji webowej, która wykorzystuje technologię protokołu FIDO2 oraz fizyczne klucze do uwierzytelniania użytkowników.

# Wymagania systemowe

Do skompilowania i uruchomienia projektu wymagane są:
- komputer z zainstalowanym 64-bitowym systemem operacyjnym,
- zainstalowany framework node.js w wersji v18.14.1 lub wyższym,
- przeglądarka internetowa obsługująca JavaScript.
- zainstaloawny MySQL comunity serwer w wersji 8.0.32 lub wyższym

# Instalacja i uruchomienie

## Instalacja

1. Otwórz wiersz poleceń/terminal w folderze do którego chcesz zkopiować pliki repozytorium
2. Wykonaj polecenie: 
2. Wykonaj następujące polecenia:


## Uruchomienie

W celu uruchomienia demo wykonaj polecenie `npm run devStart`

Po czym przejdź na link podany przez serwer.


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