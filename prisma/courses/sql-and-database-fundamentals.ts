import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "sql-and-database-fundamentals",
  title: "SQL and Database Fundamentals",
  description:
    "The relational model, writing real queries, and the indexing and normalization concepts that separate a database that works from one that scales.",
  category: "Databases",
  level: "BEGINNER",
  order: 9,
  lessons: [
    {
      title: "The Relational Model and Why Tables Work",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "The Relational Model and Why Tables Work",
          subheading:
            "A relational database organizes data into tables connected through shared keys.",
        },
        {
          kind: "text",
          heading: "Tables, rows, and columns",
          body: [
            "A table represents one type of entity. Each row is one instance; each column is one attribute. A \"customers\" table might have id, name, and email columns.",
          ],
        },
        {
          kind: "bullets",
          heading: "Primary keys and foreign keys",
          bullets: [
            "Primary key — every table typically has one: a column that uniquely identifies each row, letting other tables reference it reliably.",
            "Foreign key — a column in one table that references a primary key in another. An \"orders\" table with a customer_id column referencing \"customers\" links each order to exactly one customer without repeating their details.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why normalize instead of one giant table",
          body: "Storing everything in one flat table means a customer's email appears once per order — updating it means updating potentially hundreds of rows, and inconsistency becomes a real bug. Splitting into linked tables (normalization) means each fact is stored once.",
        },
        {
          kind: "summary",
          heading: "The mental model worth keeping",
          bullets: [
            "A relational database is a structured way of representing real-world entities and their relationships, enforced through keys and constraints.",
          ],
        },
      ],
    },
    {
      title: "Writing Real Queries",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Writing Real Queries",
          subheading:
            "SQL is how you ask a relational database for data, or tell it to change data.",
        },
        {
          kind: "example",
          heading: "SELECT: reading data",
          body: "Get the name and email columns from customers, filtered to rows after a date, sorted newest first, limited to 10 rows.",
          code: `SELECT name, email FROM customers
WHERE signup_date > '2026-01-01'
ORDER BY signup_date DESC
LIMIT 10;`,
          language: "sql",
        },
        {
          kind: "example",
          heading: "JOIN: combining data across tables",
          body: "An INNER JOIN (default) only returns rows matching in both tables; a LEFT JOIN returns all rows from the left table even without a match (NULLs fill the gap).",
          code: `SELECT orders.id, customers.name
FROM orders
JOIN customers ON orders.customer_id = customers.id;`,
          language: "sql",
        },
        {
          kind: "example",
          heading: "INSERT, UPDATE, DELETE: changing data",
          body: "The WHERE clause is critical — omitting it updates or deletes every row in the table, one of the most damaging real-world SQL mistakes.",
          code: `INSERT INTO customers (name, email)
VALUES ('Jane Smith', 'jane@example.com');

UPDATE customers SET email = 'new@example.com' WHERE id = 42;

DELETE FROM customers WHERE id = 42;`,
          language: "sql",
        },
        {
          kind: "example",
          heading: "Aggregation: summarizing data",
          body: "GROUP BY collapses rows into summary rows; HAVING filters after aggregation (unlike WHERE, which filters before).",
          code: `SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 5;`,
          language: "sql",
        },
      ],
    },
    {
      title: "Indexing: Why Some Queries Are Slow",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Indexing: Why Some Queries Are Slow",
          subheading:
            "A database without the right index has to scan every row to answer a query.",
        },
        {
          kind: "text",
          heading: "What an index actually is",
          body: [
            "An index is a separate, ordered data structure (typically a B-tree) letting the database find matching rows without scanning the entire table.",
          ],
        },
        {
          kind: "bullets",
          heading: "When an index helps",
          bullets: [
            "Columns frequently used in WHERE clauses.",
            "Columns used to JOIN tables (foreign keys especially).",
            "Columns used in ORDER BY.",
          ],
        },
        {
          kind: "bullets",
          heading: "When an index doesn't help (or actively hurts)",
          bullets: [
            "Small tables — a full scan is already fast.",
            "Columns rarely queried — indexing \"just in case\" adds cost without benefit.",
            "Write-heavy tables — every index must be updated on every write.",
            "Low-cardinality columns (like a boolean flag) — often don't narrow the search space enough.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Reading a query plan",
          body: "EXPLAIN (or EXPLAIN ANALYZE) shows how a query will actually be executed — whether it's using an index or falling back to a full scan.",
        },
        {
          kind: "summary",
          heading: "The practical habit",
          bullets: [
            "Add indexes deliberately, based on queries a table actually needs to serve well.",
          ],
        },
      ],
    },
    {
      title: "Transactions and Data Integrity",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Transactions and Data Integrity",
          subheading:
            "Some operations need multiple steps to complete together, or not at all.",
        },
        {
          kind: "bullets",
          heading: "ACID, briefly",
          bullets: [
            "Atomicity — a transaction either completes entirely or has no effect at all.",
            "Consistency — a transaction moves the database from one valid state to another.",
            "Isolation — concurrent transactions don't interfere with each other's intermediate states.",
            "Durability — once committed, a transaction survives even a crash immediately afterward.",
          ],
        },
        {
          kind: "example",
          heading: "A concrete example",
          body: "If the second UPDATE fails, the transaction rolls back — undoing the first too.",
          code: `BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;`,
          language: "sql",
        },
        {
          kind: "text",
          heading: "Why this matters even for less dramatic examples",
          body: [
            "The same principle applies to creating an order and decrementing inventory, or registering a user and creating default settings.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Isolation levels, briefly",
          body: "Full isolation has a real performance cost, so most databases offer configurable isolation levels (e.g., PostgreSQL's \"read committed\" vs. \"serializable\").",
        },
      ],
    },
  ],
};
