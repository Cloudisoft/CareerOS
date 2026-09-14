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
          kind: "terminal",
          heading: "Querying the two linked tables",
          description:
            "orders.customer_id points at customers.id — that foreign key is the link, not a repeated copy of each customer's name and email.",
          lines: [
            { text: "SELECT * FROM customers;" },
            { text: " id | name       | email             ", output: true },
            { text: "----+------------+-------------------", output: true },
            { text: "  1 | Jane Smith | jane@example.com  ", output: true },
            { text: "  2 | Alex Kim   | alex@example.com  ", output: true },
            { text: "(2 rows)", output: true },
            { text: "SELECT * FROM orders;" },
            { text: " id | customer_id | total ", output: true },
            { text: "----+-------------+-------", output: true },
            { text: "  1 |           1 | 42.50 ", output: true },
            { text: "  2 |           1 | 18.00 ", output: true },
            { text: "  3 |           2 | 99.99 ", output: true },
            { text: "(3 rows)", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why normalize instead of one giant table",
          body: "Storing everything in one flat table means a customer's email appears once per order — updating it means updating potentially hundreds of rows, and inconsistency becomes a real bug. Splitting into linked tables (normalization) means each fact is stored once.",
        },
        {
          kind: "bullets",
          heading: "Constraints: making the database itself enforce the rules",
          intro:
            "A well-designed schema doesn't just organize data — it makes certain kinds of bad data impossible to insert in the first place.",
          bullets: [
            "NOT NULL — a column can't be left empty. Applying this to customer_id on the orders table means an order without a customer is rejected at write time, not caught later by a report showing orphaned rows.",
            "UNIQUE — no two rows can share a value in that column. An email column with a UNIQUE constraint stops the exact-duplicate-signup problem before it ever becomes a data-cleaning task.",
            "FOREIGN KEY (with a reference constraint) — the database refuses to insert an order with a customer_id that doesn't actually exist in customers, and by default refuses to delete a customer who still has orders referencing them.",
            "CHECK — a custom condition, like CHECK (total >= 0) on orders, which rejects a negative order total at the database level regardless of which application code path tried to insert it.",
          ],
        },
        {
          kind: "example",
          heading: "What a constraint violation looks like",
          body: "The database — not application code — is what actually stops this insert.",
          language: "sql",
          code: `INSERT INTO orders (customer_id, total) VALUES (999, -50);

ERROR: insert or update on table "orders" violates foreign key
constraint "orders_customer_id_fkey"
DETAIL: Key (customer_id)=(999) is not present in table "customers".

-- Even if customer 999 existed, a CHECK (total >= 0) constraint
-- would separately reject the negative total — two different
-- rules, each enforced regardless of which part of the app wrote this row.`,
        },
        {
          kind: "bullets",
          heading: "Relationship types: one-to-many isn't the only shape",
          intro:
            "The customers/orders example is one-to-many (one customer, many orders) — but a lot of real schemas need a many-to-many relationship, which a plain foreign key can't express directly.",
          bullets: [
            "One-to-many — a single foreign key does the job, as with orders.customer_id: each order belongs to exactly one customer, but a customer can have many orders.",
            "Many-to-many — needs a separate junction (or \"join\") table in between. A students table and a courses table, where each student takes many courses and each course has many students, can't be linked with a single foreign key on either side.",
            "A junction table (e.g. enrollments) holds a row per pairing — student_id and course_id together — with foreign keys pointing to both sides, and often a composite primary key across both columns to prevent the same student being enrolled in the same course twice.",
            "One-to-one is the rarest of the three — one row in a table corresponds to exactly one row in another, usually used to split a table for optional or sensitive columns (e.g., a separate user_profiles table with a one-to-one link back to users) rather than for a distinct entity.",
          ],
        },
        {
          kind: "example",
          heading: "A many-to-many relationship through a junction table",
          body: "Neither students nor courses gets a foreign key to the other directly — the junction table in between is what makes the many-to-many link possible.",
          code: `CREATE TABLE enrollments (
  student_id INT REFERENCES students(id),
  course_id  INT REFERENCES courses(id),
  enrolled_on DATE NOT NULL,
  PRIMARY KEY (student_id, course_id)
);

-- Find every course a specific student is enrolled in:
SELECT courses.name
FROM courses
JOIN enrollments ON enrollments.course_id = courses.id
WHERE enrollments.student_id = 42;

-- The composite primary key (student_id, course_id) is what
-- stops the same student from being double-enrolled in the
-- same course — the database rejects the duplicate insert.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: denormalizing before you have a reason to",
          body: "Copying a customer's name onto every order row (instead of joining to look it up) can look like a reasonable performance shortcut, but it recreates the update-anomaly problem normalization exists to avoid — the name can now drift out of sync across old orders after a legitimate name change. Denormalizing deliberately, for a measured performance reason, on a mature schema is a real technique; doing it upfront because joins feel like extra work is how data integrity bugs get built in from day one.",
        },
        {
          kind: "summary",
          heading: "The mental model worth keeping",
          bullets: [
            "A relational database is a structured way of representing real-world entities and their relationships, enforced through keys and constraints.",
            "Constraints (NOT NULL, UNIQUE, FOREIGN KEY, CHECK) push data-quality rules into the database itself, so bad data is rejected at write time instead of caught later.",
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
          kind: "terminal",
          heading: "The SELECT query's actual output",
          description: "Same query as above, run against real data — the newest signups come back first.",
          lines: [
            {
              text: "SELECT name, email FROM customers WHERE signup_date > '2026-01-01' ORDER BY signup_date DESC LIMIT 10;",
            },
            { text: "    name     |        email        ", output: true },
            { text: "--------------+----------------------", output: true },
            { text: " Priya Nair   | priya@example.com    ", output: true },
            { text: " Marcus Chen  | marcus@example.com   ", output: true },
            { text: " Dana Ruiz    | dana@example.com     ", output: true },
            { text: "(3 rows)", output: true },
          ],
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
        {
          kind: "callout",
          tone: "warning",
          heading: "The NULL comparison mistake almost everyone makes at least once",
          body: "WHERE email = NULL never matches anything, even for rows where email genuinely is NULL — NULL means \"unknown,\" and \"unknown = NULL\" is itself unknown, not true, so the row is silently excluded. The correct check is WHERE email IS NULL (or IS NOT NULL). This one mistake is a common, quiet source of a query that runs without error and simply returns the wrong rows.",
        },
        {
          kind: "example",
          heading: "Subqueries: a query inside a query",
          body: "A subquery answers a question the main query needs first — here, \"which customers have placed at least one order over $100,\" used to filter a different query.",
          language: "sql",
          code: `SELECT name, email FROM customers
WHERE id IN (
  SELECT customer_id FROM orders WHERE total > 100
);

-- Equivalent using a JOIN instead:
SELECT DISTINCT customers.name, customers.email
FROM customers
JOIN orders ON orders.customer_id = customers.id
WHERE orders.total > 100;

-- Both return the same customers. The JOIN version needs
-- DISTINCT because a customer with three qualifying orders
-- would otherwise appear three times; the IN version doesn't,
-- because the subquery only ever returns a list of IDs, not
-- one row per matching order.`,
        },
        {
          kind: "bullets",
          heading: "A few habits that separate a working query from a production-ready one",
          bullets: [
            "Avoid SELECT * in application code — it fetches columns you don't use, breaks silently if someone adds a large new column, and makes it unclear to the next reader which fields the code actually depends on. Name the columns you need.",
            "LIKE '%text%' (wildcards on both sides) can't use a standard index efficiently, since the database can't know where in the string to start looking — it forces a full scan on large tables. LIKE 'text%' (wildcard only at the end) can still use an index.",
            "DISTINCT removes duplicate rows from a result, but it's often a sign a JOIN produced more rows than intended (as in the subquery example above) — worth checking whether the real fix is the JOIN's join condition, not slapping DISTINCT on top.",
            "COUNT(*) counts every row including NULLs; COUNT(column_name) only counts rows where that specific column isn't NULL — using the wrong one silently changes the number in a report without any error.",
          ],
        },
        {
          kind: "terminal",
          heading: "COUNT(*) vs. COUNT(column) on the same table",
          description: "3 orders total, but only 2 have a discount_code recorded — COUNT(*) and COUNT(discount_code) disagree for exactly that reason.",
          lines: [
            { text: "SELECT COUNT(*) FROM orders;" },
            { text: " count ", output: true },
            { text: "-------", output: true },
            { text: "     3", output: true },
            { text: "SELECT COUNT(discount_code) FROM orders;" },
            { text: " count ", output: true },
            { text: "-------", output: true },
            { text: "     2", output: true },
          ],
        },
        {
          kind: "example",
          heading: "CTEs: naming a subquery for readability",
          body: "A WITH clause (common table expression) gives a subquery a name and lets the main query reference it like a temporary table — mainly a readability tool, though it also lets one subquery be reused more than once in the same statement.",
          language: "sql",
          code: `WITH big_spenders AS (
  SELECT customer_id, SUM(total) AS spent
  FROM orders
  GROUP BY customer_id
  HAVING SUM(total) > 500
)
SELECT customers.name, big_spenders.spent
FROM customers
JOIN big_spenders ON customers.id = big_spenders.customer_id
ORDER BY big_spenders.spent DESC;`,
        },
        {
          kind: "bullets",
          heading: "UNION, CASE, and a couple more everyday tools",
          bullets: [
            "UNION combines the results of two SELECT statements into one result set, removing duplicates by default (UNION ALL keeps duplicates and is faster, since it skips the dedup step).",
            "CASE WHEN ... THEN ... END lets you compute a conditional value inline — e.g., labeling orders as 'large' or 'small' based on total, without a separate lookup table.",
            "COALESCE(column, fallback) returns the first non-NULL value in its argument list — a common, tidy way to substitute a default for a NULL without a CASE statement.",
          ],
        },
        {
          kind: "bullets",
          heading: "GROUP BY beyond a single column, and ordering aggregated results",
          intro:
            "Real reporting queries often group by more than one column, and sort by the aggregate itself rather than the grouped columns.",
          bullets: [
            "GROUP BY customer_id, EXTRACT(MONTH FROM order_date) groups by the combination of both — one row per customer per month, not one row per customer overall.",
            "ORDER BY can reference an aggregate directly: ORDER BY SUM(total) DESC sorts groups by their total spend, highest first — useful for a \"top customers by revenue\" report, and something a plain WHERE clause can't do since aggregates don't exist until after grouping.",
            "A column in SELECT that isn't wrapped in an aggregate function generally must appear in GROUP BY too — most databases reject (or, worse, silently pick an arbitrary value for) a non-aggregated, non-grouped column, which is a common first error when learning GROUP BY.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "An implicit JOIN (comma syntax) is easy to get wrong silently",
          body: "SELECT * FROM orders, customers WHERE orders.customer_id = customers.id works, but omitting that WHERE clause by accident doesn't error — it silently produces a cross join, pairing every row in orders with every row in customers. On real tables that's not a small mistake; it can turn a 10,000-row result into a 10-billion-row one. Explicit JOIN ... ON syntax makes the join condition impossible to accidentally omit, which is why it's the standard in real codebases even though the comma syntax still technically works.",
        },
        {
          kind: "summary",
          heading: "The core statements, tied together",
          bullets: [
            "SELECT reads, filtered by WHERE, sorted by ORDER BY, limited by LIMIT.",
            "JOIN combines rows across tables via a shared key; INSERT/UPDATE/DELETE change data, and a missing WHERE on the latter two affects every row in the table.",
            "GROUP BY / HAVING summarize rows into groups; a subquery or JOIN can answer \"give me rows related to rows matching some other condition.\"",
            "NULL comparisons need IS NULL, not = NULL, and COUNT(*) vs. COUNT(column) is not an interchangeable choice — both are easy, quiet ways to get a technically-running query to return the wrong answer.",
          ],
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
          kind: "terminal",
          heading: "EXPLAIN before and after adding an index",
          description:
            "Same query against a 2-million-row orders table — the sequential scan touches every row; the index scan jumps straight to the matching ones.",
          lines: [
            { text: "EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 4471;" },
            {
              text: "Seq Scan on orders  (cost=0.00..48280.00 rows=6 width=72) (actual time=0.02..8123.40 rows=6 loops=1)",
              output: true,
            },
            { text: "  Filter: (customer_id = 4471)", output: true },
            { text: "  Rows Removed by Filter: 1999994", output: true },
            { text: "Planning Time: 0.11 ms", output: true },
            { text: "Execution Time: 8123.61 ms", output: true },
            { text: "CREATE INDEX idx_orders_customer_id ON orders (customer_id);" },
            { text: "EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 4471;" },
            {
              text: "Index Scan using idx_orders_customer_id on orders  (cost=0.42..8.55 rows=6 width=72) (actual time=0.03..0.05 rows=6 loops=1)",
              output: true,
            },
            { text: "  Index Cond: (customer_id = 4471)", output: true },
            { text: "Planning Time: 0.09 ms", output: true },
            { text: "Execution Time: 0.07 ms", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Composite indexes: order matters",
          intro:
            "An index on more than one column follows a strict left-to-right rule, the same way a phone book is only useful if you already know the last name.",
          bullets: [
            "An index on (customer_id, order_date) can be used to filter by customer_id alone, or by customer_id and order_date together — but it can't be used efficiently to filter by order_date alone, the same way a phone book sorted by last-name-then-first-name doesn't help you find everyone born in March.",
            "This is why the column order in a composite index should match the most common query pattern — usually the equality filter (customer_id = X) first, and a range or sort column (order_date) second.",
            "A covering index goes a step further: if every column a query needs is present in the index itself, the database can answer the query straight from the index without ever touching the actual table rows — a meaningful speedup on a hot query path.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A classic real-world trap: indexing the wrong side of a function",
          body: "WHERE LOWER(email) = 'jane@example.com' can't use a plain index on email, because the index stores the original values, not their lowercased form — the database would have to lowercase every row to compare, which defeats the index entirely. The fix is either storing emails pre-lowercased and indexing that, or creating a functional index (CREATE INDEX ON customers (LOWER(email))) that indexes the transformed value directly. This exact pattern — wrapping an indexed column in a function inside WHERE — is one of the most common reasons a table \"has an index\" but a specific query still runs a full scan.",
        },
        {
          kind: "bullets",
          heading: "Beyond the default B-tree: index types built for specific jobs",
          intro:
            "A plain B-tree index is the right default for most columns, but a few other index types exist for problems a B-tree handles poorly.",
          bullets: [
            "Unique index — enforces the UNIQUE constraint from the schema lesson and speeds up lookups on that column at the same time; most databases create one automatically for a primary key and any explicit UNIQUE column.",
            "Partial index — indexes only the rows matching a condition, e.g. CREATE INDEX ON orders (customer_id) WHERE status = 'pending' — much smaller and faster to maintain than a full index when queries almost always filter to a small, well-defined subset of rows.",
            "Full-text index (like PostgreSQL's GIN index with tsvector) — built for \"does this text contain these words,\" which a B-tree can't answer efficiently at all; this is what makes LIKE '%searchterm%' style queries fast on a real search feature instead of falling back to a full scan.",
            "The general rule: reach for a specialized index type only once a specific, measured query pattern justifies it — a plain B-tree on the right column already solves the overwhelming majority of real slow-query problems.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "An index has a real cost — it isn't free insurance",
          body: "Every index is itself a data structure that has to be kept correct: an INSERT, UPDATE, or DELETE has to update every index on the affected columns, not just the table's raw rows. A table with six indexes pays that update cost six times on every write, plus the ongoing disk space each index consumes. This is exactly why the earlier list of 'when an index doesn't help' matters as much as the list of when it does — an unused index is pure cost with zero benefit, and a surprising number of production databases accumulate exactly these over time as query patterns change but old indexes never get removed.",
        },
        {
          kind: "example",
          heading: "Composite index in action",
          body: "Same orders table — the composite index on (customer_id, order_date) serves this query's WHERE and ORDER BY in one pass, with no separate sort step needed.",
          code: `CREATE INDEX idx_orders_cust_date ON orders (customer_id, order_date);

EXPLAIN ANALYZE
SELECT * FROM orders
WHERE customer_id = 4471
ORDER BY order_date DESC;

Index Scan Backward using idx_orders_cust_date on orders
  (cost=0.42..9.10 rows=6 width=72) (actual time=0.03..0.04 rows=6 loops=1)
  Index Cond: (customer_id = 4471)
Execution Time: 0.05 ms

-- "Scan Backward" is the planner reading the index in reverse
-- to satisfy DESC, still without a separate sort step.`,
        },
        {
          kind: "summary",
          heading: "The practical habit",
          bullets: [
            "Add indexes deliberately, based on queries a table actually needs to serve well.",
            "In a composite index, column order determines which query patterns it can actually serve — put the equality filter first, the sort/range column second.",
            "Wrapping an indexed column in a function inside WHERE silently defeats a plain index — match the index to how the column is actually queried, or index the transformed expression directly.",
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
          kind: "diagram",
          heading: "A transaction's all-or-nothing lifecycle",
          description:
            "If any step between BEGIN and COMMIT fails, every change since BEGIN is rolled back — including the first UPDATE that already succeeded.",
          steps: [
            { label: "BEGIN", detail: "Start the transaction" },
            { label: "UPDATE accounts (-100)", detail: "Debit account 1" },
            { label: "UPDATE accounts (+100)", detail: "Credit account 2" },
            { label: "COMMIT", detail: "Both changes saved together — or ROLLBACK undoes both" },
          ],
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
        {
          kind: "bullets",
          heading: "What weaker isolation actually lets happen",
          intro:
            "Isolation levels exist because the strongest guarantee is also the slowest — the weaker levels each permit a specific, named kind of anomaly in exchange for speed.",
          bullets: [
            "Dirty read: transaction A reads a value that transaction B has changed but not yet committed — if B then rolls back, A acted on a value that never actually existed. Prevented by \"read committed,\" the default in most databases.",
            "Non-repeatable read: transaction A reads the same row twice within one transaction and gets two different values, because B committed a change in between. Prevented by \"repeatable read.\"",
            "Phantom read: transaction A runs the same query twice and gets a different set of rows the second time, because B inserted a new row that now matches the query's condition. Prevented by \"serializable,\" the strictest and slowest level.",
            "The practical rule: use the default (\"read committed\") unless a specific piece of logic actually depends on the data not shifting underneath it mid-transaction — e.g., a financial reconciliation job that reads the same balance twice and needs both reads to agree.",
          ],
        },
        {
          kind: "example",
          heading: "A real-world consequence: the double-spend race condition",
          body: "Without a transaction (or the right isolation level), two concurrent requests can both read the same starting balance before either one's update is visible to the other.",
          code: `Account balance: $100. Two withdrawal requests for $80 arrive
at nearly the same instant.

Request A: reads balance ($100)
Request B: reads balance ($100)   <- reads before A's write lands
Request A: balance is enough, withdraws $80, writes $20
Request B: balance is enough (it read $100), withdraws $80,
           writes -$60

Result: $160 was withdrawn from a $100 balance. Wrapping the
read-then-write in a transaction with row-level locking (e.g.,
SELECT ... FOR UPDATE) forces Request B to wait for Request A's
transaction to finish, so it reads the updated $20 balance and
correctly rejects the second withdrawal.`,
        },
        {
          kind: "bullets",
          heading: "Deadlocks: when two transactions block each other permanently",
          intro:
            "Locking prevents the double-spend problem above, but locking itself creates a new failure mode when two transactions need the same two resources in opposite order.",
          bullets: [
            "Transaction A locks row 1, then tries to lock row 2. At the same moment, transaction B has already locked row 2, and tries to lock row 1. Neither can proceed — each is waiting on a lock the other is holding, forever, unless something intervenes.",
            "Real databases detect this automatically: one of the two transactions is picked as the \"victim,\" forcibly rolled back with a deadlock error, freeing its locks so the other can complete. The application is expected to catch that specific error and retry the failed transaction.",
            "The practical prevention technique is consistent lock ordering: if every transaction that needs to touch both row 1 and row 2 always locks them in the same order (say, always the lower ID first), the circular wait that causes a deadlock simply can't form in the first place.",
          ],
        },
        {
          kind: "example",
          heading: "A deadlock, traced step by step",
          body: "Two transfers, opposite direction, same two accounts — a textbook deadlock, and exactly the kind of bug that's rare in testing and common under real concurrent load.",
          code: `Transaction A: transfer $50 from account 1 to account 2
  BEGIN;
  UPDATE accounts SET balance = balance - 50 WHERE id = 1;  -- locks row 1
  UPDATE accounts SET balance = balance + 50 WHERE id = 2;  -- waits for row 2's lock

Transaction B (running at nearly the same instant): transfer
$30 from account 2 to account 1
  BEGIN;
  UPDATE accounts SET balance = balance - 30 WHERE id = 2;  -- locks row 2
  UPDATE accounts SET balance = balance + 30 WHERE id = 1;  -- waits for row 1's lock

A is waiting on the lock B holds; B is waiting on the lock A
holds. The database detects the cycle, kills one transaction
with a deadlock error, and lets the other complete.`,
        },
        {
          kind: "summary",
          heading: "Transactions, in short",
          bullets: [
            "ACID guarantees mean a group of statements behaves as one all-or-nothing unit, safe from partial failure.",
            "Weaker isolation levels trade correctness guarantees (dirty reads, non-repeatable reads, phantom reads) for speed — pick based on what the specific operation actually requires.",
            "A read-then-write sequence without a transaction and appropriate locking is a race condition waiting to happen under real concurrent load, not just a theoretical risk.",
          ],
        },
      ],
    },
    {
      title: "Window Functions: Ranking and Running Totals Without Losing Rows",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Window Functions: Ranking and Running Totals Without Losing Rows",
          subheading:
            "GROUP BY collapses rows into one summary row per group. A window function computes something across a group of rows without collapsing anything.",
        },
        {
          kind: "text",
          heading: "Why GROUP BY isn't always enough",
          body: [
            "The aggregation lesson's GROUP BY answers questions like \"total spend per customer\" — but it collapses every customer down to one row, discarding the individual orders. Sometimes you want the per-row detail and a calculation across related rows at the same time: this employee's salary, and their rank within their department.",
            "A window function does exactly that — it computes a value \"over\" a defined window of related rows (via PARTITION BY and ORDER BY), without reducing the result to one row per group.",
          ],
        },
        {
          kind: "example",
          heading: "Ranking within a group",
          body: "RANK() assigns 1, 2, 3... within each department, restarting for each new department, without collapsing any employee rows.",
          language: "sql",
          code: `SELECT employee_name, department, salary,
       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees;

-- Every employee row is still present — dept_rank is just an
-- added column, unlike GROUP BY which would leave only one row
-- per department.`,
        },
        {
          kind: "terminal",
          heading: "RANK() OVER output — every row stays, ranked within its group",
          description:
            "dept_rank restarts at 1 for each new department; a tie (Tom and Jun) shares rank 2 and the next rank jumps to 4, not 3.",
          lines: [
            {
              text: "SELECT employee_name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank FROM employees;",
            },
            { text: " employee_name |  department | salary | dept_rank", output: true },
            { text: "----------------+-------------+--------+-----------", output: true },
            { text: " Maria Alvarez  | Engineering | 145000 |         1", output: true },
            { text: " Tom Weiss      | Engineering | 132000 |         2", output: true },
            { text: " Jun Park       | Engineering | 132000 |         2", output: true },
            { text: " Alicia Brooks  | Sales       |  98000 |         1", output: true },
            { text: " Devon Hughes   | Sales       |  91000 |         2", output: true },
            { text: "(5 rows)", output: true },
          ],
        },
        {
          kind: "example",
          heading: "A running total",
          body: "SUM() OVER with an ORDER BY computes a cumulative value row by row, instead of one grand total.",
          language: "sql",
          code: `SELECT order_date, amount,
       SUM(amount) OVER (
         ORDER BY order_date
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM orders
ORDER BY order_date;`,
        },
        {
          kind: "bullets",
          heading: "The window function toolkit",
          bullets: [
            "ROW_NUMBER() — a unique sequential number per row within its partition, even for ties.",
            "RANK() / DENSE_RANK() — like ROW_NUMBER, but ties share a rank; RANK() leaves a gap afterward, DENSE_RANK() doesn't.",
            "LAG() / LEAD() — read a value from the previous or next row in the ordering, useful for comparing a row to the one before it (e.g., month-over-month change).",
            "AVG() / SUM() / COUNT() OVER — the same aggregates from GROUP BY, but computed per row across a window instead of collapsing rows.",
          ],
        },
        {
          kind: "example",
          heading: "Filtering on a window function's result",
          body: "WHERE is evaluated before window functions are computed, so \"WHERE dept_rank <= 3\" fails — dept_rank doesn't exist yet at that stage. Wrap the query in a CTE and filter the outer query instead.",
          language: "sql",
          code: `WITH ranked AS (
  SELECT employee_name, department, salary,
         RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
  FROM employees
)
SELECT * FROM ranked WHERE dept_rank <= 3;`,
        },
        {
          kind: "example",
          heading: "LAG() for month-over-month comparison",
          body: "LAG() reaches back to the previous row in the ordering — here, the previous month's revenue — so each row can compute its own change without a self-join.",
          language: "sql",
          code: `SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month) AS prev_month_revenue,
       revenue - LAG(revenue) OVER (ORDER BY month) AS change
FROM monthly_sales
ORDER BY month;

-- month=Jan  revenue=40,000  prev=NULL     change=NULL
-- month=Feb  revenue=45,000  prev=40,000   change=5,000
-- month=Mar  revenue=42,000  prev=45,000   change=-3,000
--
-- The first row's LAG is NULL because there's no prior row —
-- this is expected, not a bug, and needs handling (e.g. COALESCE)
-- if a downstream calculation can't tolerate a NULL.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A common mistake: assuming the default frame is the whole partition",
          body: "SUM(amount) OVER (ORDER BY order_date) — without an explicit ROWS BETWEEN clause — doesn't sum the whole table by default when ORDER BY is present; it defaults to \"unbounded preceding to current row,\" which is actually the running-total behavior. The confusion runs the other way too: leaving out ORDER BY entirely changes the default frame to the whole partition, turning what looked like a running total into a flat, repeated grand total on every row. Always pair SUM()/AVG() OVER with an explicit ORDER BY (and ROWS BETWEEN, if the intent isn't obvious from context) rather than relying on the implicit default — it's one of the most common sources of a window function returning the wrong shape of answer, silently.",
        },
        {
          kind: "bullets",
          heading: "NTILE() and FIRST_VALUE()/LAST_VALUE(): two more practical window functions",
          intro:
            "Rank, running totals, and LAG/LEAD cover most cases, but two more window functions come up often enough in real reporting to be worth knowing.",
          bullets: [
            "NTILE(n) splits a partition into n roughly equal-sized buckets, numbered 1 through n — NTILE(4) OVER (ORDER BY salary) divides employees into salary quartiles, a common way to build a percentile-style report without writing separate boundary logic by hand.",
            "FIRST_VALUE() and LAST_VALUE() return a fixed value from the start or end of the window's frame, no matter which row is currently being computed — e.g., FIRST_VALUE(salary) OVER (PARTITION BY department ORDER BY salary DESC) attaches the department's top salary to every row in that department, useful for comparing each employee against the department's own ceiling.",
            "LAST_VALUE() specifically is a common trap: with the default frame (unbounded preceding to current row), \"last\" actually means \"the current row,\" not the true last row of the partition — getting the expected result requires explicitly widening the frame to ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.",
          ],
        },
        {
          kind: "example",
          heading: "NTILE() splitting employees into salary quartiles",
          body: "Every employee keeps their own row — NTILE just adds which quarter of the salary distribution they fall into.",
          language: "sql",
          code: `SELECT employee_name, salary,
       NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;

-- salary_quartile = 1  -> top 25% of earners
-- salary_quartile = 4  -> bottom 25% of earners
-- With 17 employees, NTILE(4) can't split evenly — it puts
-- the extra rows into the earlier groups (sizes 5, 4, 4, 4
-- rather than an impossible 4.25 each), which is expected
-- behavior, not a bug to work around.`,
        },
        {
          kind: "bullets",
          heading: "RANK() vs. DENSE_RANK(), concretely",
          bullets: [
            "RANK() leaves a gap after a tie: two employees tied for rank 2 means the next employee is rank 4, not 3 — the gap reflects that two people \"used up\" ranks 2 and 3.",
            "DENSE_RANK() doesn't leave a gap: the same tie gives the next employee rank 3.",
            "Neither is more \"correct\" — which one to use depends on whether the count of positions (RANK) or the count of distinct values (DENSE_RANK) is what the report actually needs.",
          ],
        },
        {
          kind: "summary",
          heading: "Window functions vs. GROUP BY",
          bullets: [
            "GROUP BY collapses rows into one summary row per group; a window function keeps every row and adds a computed column.",
            "PARTITION BY defines the group a window function calculates within; ORDER BY defines the sequence for ranking, running totals, and LAG/LEAD.",
            "Filtering on a window function's result requires a CTE or subquery, since WHERE runs before window functions are computed.",
          ],
        },
      ],
    },
    {
      title: "Practice: Window Functions and Query Optimization",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Window Functions and Query Optimization",
          subheading:
            "Three exercises: rank within a group, build a running total, and diagnose a slow query.",
        },
        {
          kind: "practice",
          heading: "Rank employees by salary within department",
          prompt:
            "Using an employees table with columns (employee_name, department, salary), write a query that returns each employee's salary rank within their department (1 = highest paid), without collapsing any employee rows.",
          hint: "You need PARTITION BY to restart the ranking per department, and ORDER BY salary DESC within that partition.",
          solution:
            "SELECT employee_name, department, salary, RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank FROM employees; — PARTITION BY department restarts the count at 1 for every new department, and ORDER BY salary DESC means rank 1 is the highest earner. Using RANK() rather than ROW_NUMBER() matters here — if two employees in the same department are tied on salary, they should share the same rank rather than one arbitrarily coming before the other.",
        },
        {
          kind: "practice",
          heading: "Build a running total of monthly sales",
          prompt:
            "Given a monthly_sales table with columns (month, revenue), write a query showing each month's revenue alongside the cumulative revenue up to and including that month.",
          hint: "SUM() OVER an ORDER BY without a PARTITION BY treats the whole table as one running window.",
          solution:
            "SELECT month, revenue, SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue FROM monthly_sales ORDER BY month; — no PARTITION BY is needed since there's only one running total across all months. ORDER BY month inside the OVER() clause is what makes it cumulative rather than a flat total — it tells the window to only sum rows up through the current one.",
        },
        {
          kind: "practice",
          heading: "Diagnose and fix a slow query",
          prompt:
            "This query takes 8 seconds on a 2-million-row orders table: SELECT * FROM orders WHERE customer_id = 4471 ORDER BY order_date DESC; EXPLAIN shows a sequential scan of the whole table. There's currently no index besides the primary key on id. What would you add, and why?",
          hint: "Think about which column the WHERE clause filters on, and whether the same index could help the ORDER BY too.",
          solution:
            "Add a composite index: CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date); — indexing customer_id lets the database jump straight to that customer's rows instead of scanning all 2 million. Putting order_date second in the same index means those rows are already stored in the right order for the ORDER BY, so the database can avoid a separate sort step too. A single-column index on just customer_id would fix the sequential scan but still require sorting the matching rows afterward — the composite index solves both at once.",
        },
        {
          kind: "practice",
          heading: "Compute month-over-month change without a self-join",
          prompt:
            "Given a monthly_sales table (month, revenue), write a query showing each month's revenue, the previous month's revenue, and the dollar change between them — without using a self-join.",
          hint: "LAG() reaches back to a prior row in the current ordering without needing to join the table to itself — that's exactly the problem it exists to solve.",
          solution:
            "SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS prev_revenue, revenue - LAG(revenue) OVER (ORDER BY month) AS change FROM monthly_sales ORDER BY month; — LAG(revenue) OVER (ORDER BY month) pulls the revenue value from the row immediately before the current one in month order. The very first month has no prior row, so its prev_revenue and change come back NULL — expected, not a bug, and worth handling explicitly (e.g. with COALESCE) if a downstream chart or calculation can't tolerate a NULL in the first position.",
        },
        {
          kind: "practice",
          heading: "Diagnose a query that returns the wrong count",
          prompt:
            "A report shows 'Total orders: 1,847' using SELECT COUNT(discount_code) FROM orders, but a teammate insists there are actually 2,103 orders in the table. Both numbers turn out to be correct in what they measure — explain the discrepancy and write the query that gives the actual total order count.",
          hint: "COUNT(column) and COUNT(*) count different things when the column can be NULL. Think about how many orders in this table might not have a discount_code.",
          solution:
            "COUNT(discount_code) only counts rows where discount_code is NOT NULL — it's silently answering 'how many orders used a discount code,' not 'how many orders exist.' The gap (2,103 - 1,847 = 256) is the number of orders with no discount code, which is a real and possibly useful number, just not the one the report label promised. The fix: SELECT COUNT(*) FROM orders; counts every row regardless of NULLs, giving the true total of 2,103.",
        },
        {
          kind: "practice",
          heading: "Rewrite a cross join into a correct JOIN",
          prompt:
            "A junior teammate wrote this query to find each order's customer name, and it's returning far more rows than there are orders: SELECT orders.id, customers.name FROM orders, customers;. Explain what's wrong and rewrite it correctly.",
          hint: "Comma-separated tables with no join condition produce a cross join — every row from the first table paired with every row from the second, not matched pairs.",
          solution:
            "With no WHERE or ON condition linking the tables, this is an implicit cross join: every order gets paired with every customer, not just its own customer. On a table with 500 orders and 200 customers, that's 100,000 result rows instead of 500. The fix is an explicit JOIN with the actual matching condition: SELECT orders.id, customers.name FROM orders JOIN customers ON orders.customer_id = customers.id; — using explicit JOIN ... ON syntax rather than the comma form makes it much harder to accidentally omit the join condition in the first place.",
        },
        {
          kind: "terminal",
          heading: "Confirming the fix with EXPLAIN before shipping it",
          description: "Checking the query plan isn't just for slow queries — it's a quick sanity check that the join is actually matching, not multiplying, rows.",
          lines: [
            { text: "EXPLAIN ANALYZE SELECT orders.id, customers.name FROM orders JOIN customers ON orders.customer_id = customers.id;" },
            { text: "Hash Join  (cost=15.25..89.10 rows=500 width=36) (actual time=0.31..1.42 rows=500 loops=1)", output: true },
            { text: "  Hash Cond: (orders.customer_id = customers.id)", output: true },
            { text: "Execution Time: 1.58 ms", output: true },
          ],
        },
        {
          kind: "practice",
          heading: "Use DENSE_RANK() to pick the top N per group without gaps",
          prompt:
            "A report needs the top 2 highest-paid employees per department, but if two employees tie for #1, the report should still only show 2 distinct salary levels — not accidentally return 3 rows for a department because of a tie. Write the query.",
          hint: "RANK() would let a tie at #1 push the query to effectively return 3 rows for <= 2 (two at rank 1, one at rank 2, because of the gap RANK() leaves). DENSE_RANK() doesn't leave that gap, so <= 2 means exactly the top 2 distinct salary levels.",
          solution: `WITH ranked AS (
  SELECT employee_name, department, salary,
         DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS salary_rank
  FROM employees
)
SELECT * FROM ranked WHERE salary_rank <= 2;
-- DENSE_RANK() means a tie at the top still only counts as
-- "rank 1" once — the next distinct salary is rank 2, with no
-- gap, so filtering <= 2 reliably means "top 2 salary levels,"
-- ties included, rather than an unpredictable row count.`,
        },
        {
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Using PARTITION BY and RANK() to compute a per-group ranking without collapsing rows.",
            "Building a running total with SUM() OVER an ORDER BY, and knowing when PARTITION BY is and isn't needed.",
            "Reaching for LAG() instead of a self-join to compare a row to the one before it in some ordering.",
            "Reading a slow query's access pattern (WHERE and ORDER BY columns) and choosing a composite index that serves both.",
            "Recognizing that COUNT(column) and COUNT(*) answer different questions, and that a missing JOIN condition silently produces a cross join rather than an error.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check",
          subheading:
            "Five questions across the whole course — the kind of understanding that should survive being asked a different way than the lesson asked it.",
        },
        {
          kind: "quiz",
          heading: "LEFT JOIN behavior",
          question:
            "You run a LEFT JOIN from customers to orders. A customer with no orders appears in the result. What does the orders side of that row contain?",
          options: [
            "The row is silently excluded from the result",
            "NULL values for every column that comes from orders",
            "Zero values for every numeric column from orders",
            "An error, since there's no matching row",
          ],
          correctIndex: 1,
          explanation:
            "A LEFT JOIN keeps every row from the left table (customers) regardless of whether a match exists on the right (orders). When there's no match, the columns that would have come from orders are filled with NULL, not zero or an error — that distinction matters a lot when aggregating, since NULL is excluded from most aggregate calculations.",
        },
        {
          kind: "quiz",
          heading: "Indexing tradeoffs",
          question:
            "You add an index to a column that's rarely queried, on a table that receives thousands of writes per second. What's the most likely effect?",
          options: [
            "Reads get faster with no real downside",
            "Writes get slower, since every insert/update must also update the index, with little read benefit to offset it",
            "Nothing changes, since indexes only affect SELECT queries",
            "The table's storage size decreases",
          ],
          correctIndex: 1,
          explanation:
            "Every index has to be maintained on every write, which adds real overhead on a write-heavy table. If the column is rarely used in queries, that cost isn't offset by any meaningful read speedup — indexing \"just in case\" is a real cost with no real benefit in this case.",
        },
        {
          kind: "quiz",
          heading: "Atomicity",
          question:
            "Inside a transaction, the first UPDATE succeeds but the second UPDATE fails before COMMIT. What happens to the first UPDATE?",
          options: [
            "It's already permanently saved and stays in effect",
            "It's rolled back along with the failed second UPDATE, as if neither ran",
            "It's saved, but flagged as inconsistent",
            "It depends on which database engine is used",
          ],
          correctIndex: 1,
          explanation:
            "This is atomicity: a transaction either completes entirely or has no effect at all. If any statement inside it fails before COMMIT, the whole transaction rolls back, undoing every change made since BEGIN — including the first UPDATE that had technically succeeded.",
        },
        {
          kind: "quiz",
          heading: "Filtering window function results",
          question:
            "Why does \"WHERE dept_rank <= 3\" fail when dept_rank is computed with a window function in the same query?",
          options: [
            "WHERE clauses can't reference numeric columns",
            "WHERE is evaluated before window functions are computed, so dept_rank doesn't exist yet at that stage",
            "RANK() can only be used with GROUP BY",
            "dept_rank needs to be wrapped in quotes",
          ],
          correctIndex: 1,
          explanation:
            "Window functions are computed after WHERE filtering happens, conceptually. To filter on a window function's result, wrap the query in a CTE or subquery and apply the filter in the outer query, where the computed column already exists.",
        },
        {
          kind: "quiz",
          heading: "Why normalize",
          question:
            "Why split customer data into a separate customers table instead of repeating each customer's name and email on every one of their order rows?",
          options: [
            "It makes the database file smaller, which is the main goal",
            "It means each fact is stored once, so updating a customer's email doesn't require updating every order row",
            "Foreign keys require it as a technical limitation",
            "It makes JOIN queries unnecessary",
          ],
          correctIndex: 1,
          explanation:
            "This is normalization: storing each fact once and referencing it via a foreign key. The main benefit isn't file size — it's avoiding the update-anomaly problem, where the same fact repeated across many rows can drift out of sync if only some copies get updated.",
        },
        {
          kind: "summary",
          heading: "The course's core takeaways",
          bullets: [
            "Tables connect through primary and foreign keys; normalizing means storing each fact once.",
            "JOIN combines tables; GROUP BY collapses rows into summaries; window functions add per-row calculations without collapsing anything.",
            "Index columns that are actually used in WHERE, JOIN, and ORDER BY — indexing has a real write-time cost, so it's not free insurance.",
            "Transactions guarantee a set of changes either all commit or all roll back together (atomicity), which is what makes multi-step updates safe.",
          ],
        },
      ],
    },
  ],
};
