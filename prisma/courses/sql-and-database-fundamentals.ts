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
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Using PARTITION BY and RANK() to compute a per-group ranking without collapsing rows.",
            "Building a running total with SUM() OVER an ORDER BY, and knowing when PARTITION BY is and isn't needed.",
            "Reading a slow query's access pattern (WHERE and ORDER BY columns) and choosing a composite index that serves both.",
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
