# PSQL

## Getting stuff set up for a new app

Reset Password - https://www.postgresqltutorial.com/postgresql-administration/postgresql-reset-password/

Log in:
```
psql -U username
```

List databases
```
\l
```

Create database
```
create database database_name;
REVOKE connect ON DATABASE database_name FROM PUBLIC;
```

Create user with access to that db
```
CREATE USER user_name WITH PASSWORD 'pickabetterpassword';
GRANT ALL PRIVILEGES ON DATABASE database_name to user_name;
```

Connect to database
```
\c database_name
```

Grant schema (since PG15 - https://stackoverflow.com/questions/67276391/why-am-i-getting-a-permission-denied-error-for-schema-public-on-pgadmin-4)
```
GRANT ALL ON SCHEMA public TO user_name;
```
