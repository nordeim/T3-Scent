Here’s how you can do it using PostgreSQL’s interactive terminal, **psql**:

1. **List all databases:**  
   Open your terminal and run:
   ```sql
   \l
   ```
   This command will show a list of all available databases on your PostgreSQL server.

2. **Select (connect to) a database:**  
   To connect to a specific database (let's say it's named `my_database`), enter:
   ```sql
   \c my_database
   ```
   This command switches your session to the specified database so that any subsequent commands run against that database.

3. **List the tables in the selected database:**  
   Once connected, list the tables by running:
   ```sql
   \dt
   ```
   This command displays all tables in the current database, typically within the `public` schema. If you need to see tables in a specific schema, you can modify the command like so:
   ```sql
   \dt schema_name.*
   ```

These steps should cover the basics of database management within psql. Additionally, if you prefer running an SQL query to list the tables, you can execute:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```
This query retrieves the names of all base tables in the `public` schema.

https://copilot.microsoft.com/shares/vUtx1a6hnbkBhEAvRG4YM

---
When you run the command without specifying a database (using the `-d` flag), PostgreSQL connects by default to a database that has the same name as the user—in this case, it’s likely connecting to the **postgres** database (assuming that's the default configured on your system). So all the objects (tables, types, etc.) defined in your SQL script are created in that default database.

To remove these inadvertently created objects, you can either:

- **Drop the specific objects:** Connect to the default database (e.g., using `psql -U postgres -d postgres`) and run the appropriate `DROP` commands such as:  
  ```sql
  DROP TABLE IF EXISTS "users";
  DROP TYPE IF EXISTS "Role" CASCADE;
  -- etc.
  ```
- **Drop the entire schema (if all the objects were created in a specific schema):** If the objects are isolated within a schema (like `public`), you might run:  
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```  
  *Be cautious* with this approach, as it will remove everything in that schema.

Now, to ensure your script runs on a specific database (for example, `scent_db`), modify your command to include the `-d` option followed by the database name. For instance:

```bash
sudo -u postgres PGPASSWORD="Admin1234" psql -h localhost -d scent_db -f create_database_schema.sql
```

This command will connect to the `scent_db` database and execute the SQL script there, ensuring that all your tables and objects are created within `scent_db` rather than the default database.

https://copilot.microsoft.com/shares/3Q8Sn37zJXFmQHaASc6gh

