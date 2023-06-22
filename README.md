# Magisterka_FIDO2

# Wprowadznie

Celem pracy magisterskiej jest implementacja oraz analiza protokołu FIDO2 z wykorzystaniem kluczy fizycznych. Praca skupia się na stworzeniu demonstratora w postaci aplikacji webowej, która wykorzystuje technologię protokołu FIDO2 oraz fizyczne klucze do uwierzytelniania użytkowników.

# Wymagania systemowe

Do skompilowania i uruchomienia projektu wymagane są:
- połączenie z internetem
- komputer z zainstalowanym 64-bitowym systemem operacyjnym,
- zainstalowany framework node.js w wersji v18.14.1 lub wyższym,
- przeglądarka internetowa obsługująca JavaScript.
- zainstaloawny MySQL comunity serwer w wersji 8.0.32 lub wyższym
- (Opconalnie) MySQL workbench do zarządzania bazą danych.

# Instalacja i uruchomienie

## Przygotownie bazy danych

Konto oraz hasło użyte podczas konfiguracji serwera MySQL będą użyte w połączeniu z bazą w kodzie.
Po skonfigurowaniu serwera należy stowrzyć baze danych wraz z tablicami, zaleca się do tego celu skorzystanie z MySQL MySQL Workbench.

CREATE DATABASE twojaBaza;
USE twojaBaza;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL,
  password VARCHAR(255) CHARACTER SET utf8mb4 NOT NULL,
  currentChallenge VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  UNIQUE KEY username_unique (username)
);

CREATE TABLE authenticators (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  credentialID TEXT CHARACTER SET utf8mb4 NOT NULL,
  credentialPublicKey BLOB NOT NULL,
  counter BIGINT NOT NULL,
  credentialDeviceType VARCHAR(32) CHARACTER SET utf8mb4 NOT NULL,
  credentialBackedUp BOOL NOT NULL,
  transports VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT NULL,
  user_id INT UNSIGNED NOT NULL,
  INDEX credentialID_index (credentialID(255)),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

## Instalacja

1. Otwórz wiersz poleceń/terminal w folderze z plikami repozytorium
2. Wykonaj polecenie: `npm install`

3. Następnie w plikach: serwer.js oraz passport-config.js wprowadź dane do połączenia z bazą:

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "twojeHaslo",
  database: "twojaBaza",
});

## Uruchomienie

W celu uruchomienia demo wykonaj polecenie `npm run devStart`

Po czym przejdź na link podany przez serwer.
