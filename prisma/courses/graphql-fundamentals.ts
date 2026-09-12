import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "graphql-fundamentals",
  title: "GraphQL Fundamentals",
  description:
    "The problem GraphQL actually solves versus REST, how schemas, queries, mutations, and resolvers fit together, and when it's the right tool at all.",
  category: "Web Development",
  level: "INTERMEDIATE",
  order: 23,
  lessons: [
    {
      title: "The Problem GraphQL Solves",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The Problem GraphQL Solves",
          subheading:
            "GraphQL is often introduced as \"an alternative to REST,\" which undersells it — it exists to fix two specific, common problems REST APIs run into as they grow.",
        },
        {
          kind: "text",
          heading: "Over-fetching",
          body: [
            "A REST endpoint returns a fixed shape of data, defined by whoever built the endpoint. If a mobile screen only needs a user's name and avatar, but `/api/users/42` returns the full user object — email, address, preferences, account history — the client downloads all of it anyway and throws most of it away. On a slow connection or at scale, that waste is real: more bytes over the wire, more parsing, more battery.",
          ],
        },
        {
          kind: "text",
          heading: "Under-fetching",
          body: [
            "The opposite problem: a screen needs data that spans multiple REST resources — a user, their recent orders, and each order's line items — and no single endpoint returns all of it. The client ends up making several round trips (get the user, then get their orders, then get each order's items), each with its own network latency, just to render one screen.",
          ],
        },
        {
          kind: "example",
          heading: "The same request, contrasted",
          body: "With REST, a client fetching a user and their recent orders often needs multiple calls. With GraphQL, one request describes exactly the shape needed, across what would otherwise be separate resources.",
          code: `// REST: likely two or three separate requests
GET /api/users/42
GET /api/users/42/orders

// GraphQL: one request, one response, only the fields asked for
query {
  user(id: "42") {
    name
    orders {
      id
      total
    }
  }
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "GraphQL moves the decision from server to client",
          body: "In REST, the server decides what shape of data each endpoint returns, and every consumer of that endpoint gets the same shape whether they need all of it or not. In GraphQL, the server exposes what data and relationships exist, and each client decides exactly which fields it wants for its specific need. That single shift is the root of almost every other difference covered in this course.",
        },
      ],
    },
    {
      title: "Schemas and Types",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Schemas and Types",
          subheading:
            "A GraphQL API is defined by a schema — a strongly typed contract describing exactly what data exists and how it's shaped, before a single query is ever run.",
        },
        {
          kind: "example",
          heading: "A basic schema",
          body: "The schema is written in GraphQL's own type language (SDL), independent of whatever server language implements it behind the scenes.",
          code: `type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]!
}

type Order {
  id: ID!
  total: Float!
  createdAt: String!
}

type Query {
  user(id: ID!): User
  orders: [Order!]!
}`,
        },
        {
          kind: "bullets",
          heading: "Reading the type syntax",
          bullets: [
            "String, Int, Float, Boolean, and ID are the built-in scalar types — the actual leaf values a query can ask for.",
            "A `!` after a type means non-nullable — that field is guaranteed to have a value, and the server contractually can't return null there.",
            "Square brackets mean a list: `[Order!]!` is a non-null list of non-null Orders — the list itself won't be null, and it won't contain any null entries either.",
            "A type like User or Order is an object type — a shape made of other fields, some scalar and some pointing to other object types (the relationship between User and Order above).",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why the strictness is a feature, not friction",
          body: "Because every field's type is declared up front, tooling can validate a query against the schema before it ever runs — a query asking for a field that doesn't exist, or supplying the wrong argument type, is caught immediately, often directly in an editor, rather than surfacing as a runtime error or a silently wrong response later.",
        },
        {
          kind: "text",
          heading: "The schema is the actual API documentation",
          body: [
            "Because the schema fully describes every type, field, and relationship, tools can generate interactive documentation and auto-complete directly from it. This is a genuinely different experience than REST, where documentation is a separate artifact that has to be written and kept in sync by hand — in GraphQL, the schema and the documentation are, practically speaking, the same artifact.",
          ],
        },
      ],
    },
    {
      title: "Queries and Mutations",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Queries and Mutations",
          subheading:
            "GraphQL has exactly one endpoint, typically `/graphql` — what you send to it, not the URL, determines whether you're reading or writing data.",
        },
        {
          kind: "example",
          heading: "A query: reading data, shaped exactly as needed",
          body: "The requested fields are listed explicitly — the response mirrors that shape exactly, nothing more.",
          code: `query {
  user(id: "42") {
    name
    orders {
      total
    }
  }
}

// Response:
// { "data": { "user": { "name": "Priya", "orders": [{ "total": 39.99 }] } } }`,
        },
        {
          kind: "example",
          heading: "A mutation: writing data",
          body: "Mutations follow the same syntax as queries, using the `mutation` keyword instead of `query`. By convention, a mutation typically returns the data it just changed, so the client can update its own state without a separate follow-up query.",
          code: `mutation {
  createOrder(userId: "42", items: [{ productId: "9", quantity: 2 }]) {
    id
    total
    createdAt
  }
}`,
        },
        {
          kind: "bullets",
          heading: "Variables: don't hand-build query strings",
          intro: "Real applications pass dynamic values as variables rather than string-interpolating them directly into the query:",
          bullets: [
            "The query defines a typed variable: `query GetUser($id: ID!) { user(id: $id) { name } }`",
            "The client sends the variable's actual value separately: `{ \"id\": \"42\" }`",
            "This mirrors the reason SQL uses parameterized queries instead of string concatenation — it avoids a class of injection bugs, and it lets the same query string be reused and cached instead of rebuilt per value.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Mutations run in the order you write them, queries might not",
          body: "The GraphQL spec guarantees that top-level mutation fields execute one after another, in the order listed — important when one write might depend on another. Top-level query fields, by contrast, are allowed to execute in parallel and don't carry that same ordering guarantee, since reads typically don't depend on each other's side effects.",
        },
      ],
    },
    {
      title: "Resolvers, Conceptually",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Resolvers, Conceptually",
          subheading:
            "The schema describes what data exists. Resolvers are the actual functions that go get it — one function per field, in principle.",
        },
        {
          kind: "text",
          heading: "What a resolver actually is",
          body: [
            "For every field in the schema, there's a corresponding function — a resolver — responsible for returning that field's value. When a query comes in, the GraphQL server walks the requested fields and calls the matching resolver for each one, assembling the final response from whatever each resolver returns.",
            "Most fields don't need a resolver written out explicitly — if a field's name matches a property already present on the parent object, a default resolver handles it automatically. You write custom resolvers where actual logic is needed: fetching from a database, calling another service, computing a derived value.",
          ],
        },
        {
          kind: "example",
          heading: "A resolver map",
          body: "This is a simplified but representative shape — Query resolvers handle top-level fields, and object type resolvers (like User.orders here) handle fields on the objects a query returns.",
          code: `const resolvers = {
  Query: {
    user: (parent, args, context) => {
      return context.db.user.findUnique({ where: { id: args.id } });
    },
  },
  User: {
    orders: (parent, args, context) => {
      // "parent" here is the User object already resolved above
      return context.db.order.findMany({ where: { userId: parent.id } });
    },
  },
};`,
        },
        {
          kind: "bullets",
          heading: "The four resolver arguments, briefly",
          bullets: [
            "parent — the result already resolved from the level above this field (for a top-level Query field, this is usually unused).",
            "args — the arguments passed to this specific field in the query (e.g., the `id` in `user(id: \"42\")`).",
            "context — shared data available to every resolver in a single request: a database connection, the current authenticated user, request headers.",
            "info — details about the query's structure itself; rarely needed outside advanced optimization cases.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The N+1 query trap",
          body: "Naively written, resolving `orders` for each of 50 users in a single query result triggers 50 separate database calls — one per user — plus the original query, instead of one efficient batched call. This N+1 problem is one of the most common real GraphQL performance issues, and it's usually solved with a batching layer (a \"DataLoader\" pattern) that collects individual resolver requests within a tick and issues one combined query instead.",
        },
      ],
    },
    {
      title: "When GraphQL Is (and Isn't) the Right Choice",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "When GraphQL Is (and Isn't) the Right Choice",
          subheading:
            "GraphQL solves real problems — it also introduces real costs. Knowing both sides is what separates a deliberate choice from a trend-driven one.",
        },
        {
          kind: "bullets",
          heading: "Where GraphQL genuinely earns its complexity",
          bullets: [
            "Multiple clients with different data needs — a mobile app, a web app, and a public API all pulling different shapes from the same underlying data, without needing a bespoke REST endpoint per client.",
            "Deeply nested or relationship-heavy data — screens that would otherwise require several chained REST calls collapse into one GraphQL query.",
            "A large, evolving data graph with many consumers, where a strongly typed, self-documenting schema materially reduces coordination overhead between frontend and backend teams.",
          ],
        },
        {
          kind: "bullets",
          heading: "Where REST is often still the better fit",
          bullets: [
            "Simple CRUD APIs with a small, stable set of consumers — the added tooling and complexity of GraphQL may not pay for itself.",
            "File uploads and downloads, and streaming responses — these map naturally onto plain HTTP and awkwardly onto GraphQL's request/response model.",
            "Heavy reliance on HTTP-native caching — REST responses cache cleanly at the URL level (CDNs, browser caches); a single GraphQL endpoint with varying query shapes makes that same caching meaningfully harder to get right.",
            "A small team without the bandwidth to build out schema design, resolver performance (N+1 handling), and query complexity limits properly — GraphQL rewards being taken seriously, and punishes being adopted casually.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A GraphQL endpoint isn't automatically safer or faster than REST",
          body: "Because a GraphQL query can request arbitrarily deep, arbitrarily broad data in one call, an API without query complexity limits or depth limits is exposed to a client (malicious or just careless) sending one enormous, expensive query — something REST's fixed, separate endpoints naturally cap without extra effort. Real GraphQL deployments need explicit safeguards here; they don't come for free.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "GraphQL exists to fix over-fetching and under-fetching by letting the client shape the response instead of the server dictating it.",
            "A typed schema, queries, mutations, and resolvers are the core mechanics — but the client-driven query flexibility is the underlying idea behind all of them.",
            "The choice between GraphQL and REST is a real tradeoff, not a strict upgrade — client diversity and nested data favor GraphQL; simple CRUD, caching, and file transfer often still favor REST.",
          ],
        },
      ],
    },
    {
      title: "Fragments and Pagination: Structuring Real Queries",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Fragments and Pagination: Structuring Real Queries",
          subheading:
            "The queries so far have all fetched short, hand-written field lists returning full lists. Real applications need to reuse field selections and handle lists with millions of rows — both have standard, well-worn answers.",
        },
        {
          kind: "example",
          heading: "Fragments: naming a reusable set of fields",
          body: "A fragment is a named, reusable selection of fields on a given type. It stops the same field list from being copy-pasted across every query that needs a user summary, and keeps them in sync in one place.",
          code: `fragment UserSummary on User {
  id
  name
  email
}

query GetUserWithOrders($id: ID!) {
  user(id: $id) {
    ...UserSummary
    orders {
      id
      total
    }
  }
}

query GetAllUsers {
  users {
    ...UserSummary
  }
}`,
        },
        {
          kind: "text",
          heading: "Why a list field can't just return everything",
          body: [
            "A naive `orders: [Order!]!` field that returns every order for a user works fine for a user with 12 orders and falls apart for one with 400,000 — the response gets enormous, and the resolver has to load the entire result set into memory to send it. Real GraphQL APIs paginate any list that can grow without bound, the same way a REST API would page a large collection.",
          ],
        },
        {
          kind: "example",
          heading: "Cursor-based pagination, the pattern most GraphQL APIs converge on",
          body: "Rather than page numbers (which shift under you as new rows get inserted), a cursor points at a specific position in the result set. `pageInfo` tells the client whether more results exist and what cursor to ask for next.",
          code: `type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
}

type OrderEdge {
  node: Order!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}

type Query {
  orders(first: Int!, after: String): OrderConnection!
}

# query GetOrders {
#   orders(first: 20, after: "cursor_abc") {
#     edges { node { id total } cursor }
#     pageInfo { hasNextPage endCursor }
#   }
# }`,
        },
        {
          kind: "bullets",
          heading: "Why cursors instead of just an offset/limit",
          bullets: [
            "An offset (\"skip 40, take 20\") shifts silently if a row is inserted or deleted earlier in the list between two page requests — a client can see a duplicate or miss a row entirely without any error.",
            "A cursor (often an encoded ID or a sort key) points at an actual position, so \"give me the 20 after this cursor\" stays correct even as the underlying data changes between requests.",
            "This shape — edges, node, cursor, pageInfo — became a de facto standard (popularized as the Relay connection spec) precisely because so many APIs independently needed the same answer to the same problem.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Fragments and pagination solve different problems, and combine naturally",
          body: "A fragment controls what fields you ask for; pagination controls how much of a list you ask for at once. They compose directly — a fragment for the fields on each Order node, inside a paginated OrderConnection — and together they're what turns the simple query/mutation examples from earlier lessons into something that actually holds up at real-world scale and query complexity.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "Fragments name a reusable field selection, keeping duplicate field lists out of every query that needs the same shape.",
            "Any list field that can grow without bound needs pagination — returning everything doesn't scale, in GraphQL any more than in REST.",
            "Cursor-based pagination (edges/node/cursor/pageInfo) is the standard pattern, because it stays correct even as the underlying list changes between page requests, unlike a plain offset.",
          ],
        },
      ],
    },
    {
      title: "Practice: Writing Resolvers and Paginated Queries",
      durationMinutes: 13,
      slides: [
        {
          kind: "title",
          heading: "Practice: Writing Resolvers and Paginated Queries",
          subheading:
            "Given a schema, write the actual resolver logic and query shape that make it work correctly and efficiently.",
        },
        {
          kind: "practice",
          heading: "1. Write the resolver for a nested field",
          prompt:
            "Given this schema, write the resolver map for the `Post.author` field, so that querying a list of posts along with each one's author works. Assume `context.db.user.findUnique({ where: { id } })` fetches a single user by id, and each post row has an `authorId` column.\n\n```graphql\ntype Post {\n  id: ID!\n  title: String!\n  author: User!\n}\n\ntype User {\n  id: ID!\n  name: String!\n}\n\ntype Query {\n  posts: [Post!]!\n}\n```",
          hint:
            "Query.posts already returns rows with an authorId on them (the \"parent\" object for the Post type). The author resolver receives that parent as its first argument — use it to look up the actual User.",
          solution:
            "```js\nconst resolvers = {\n  Query: {\n    posts: (parent, args, context) => {\n      return context.db.post.findMany();\n    },\n  },\n  Post: {\n    author: (parent, args, context) => {\n      // parent is the specific Post already resolved by Query.posts;\n      // parent.authorId is the foreign key on that row\n      return context.db.user.findUnique({ where: { id: parent.authorId } });\n    },\n  },\n};\n```\nKey decision: `id`, `title` on Post, and `id`, `name` on User need no custom resolver at all — they match properties already present on the underlying row, so GraphQL's default resolver handles them. Only `author` needs custom logic, because it requires a second lookup the raw Post row doesn't already contain.",
        },
        {
          kind: "practice",
          heading: "2. Fix the N+1 query this resolver causes",
          prompt:
            "The resolver from the previous exercise works correctly, but a query for 100 posts triggers 100 separate `user.findUnique` calls — one per post — instead of one batched query. Describe the fix (you don't need working DataLoader code, just the batching strategy and why it works), and explain what would happen without it at real scale.",
          hint:
            "Instead of resolving each post's author independently the moment it's asked for, what if the individual requests within a single tick were collected first, and issued as one combined query?",
          solution:
            "This is the DataLoader pattern: instead of each `Post.author` resolver call immediately hitting the database, it registers the requested `authorId` with a per-request batching queue. DataLoader collects every `.load(id)` call made within the same event-loop tick, then issues one combined query (e.g. `user.findMany({ where: { id: { in: [...allRequestedIds] } } })`) and distributes each result back to the resolver that asked for it — turning 100 individual queries into 1.\n\n```js\nconst { author: authorLoader } = createLoaders(context.db); // one per request\n\nconst resolvers = {\n  Post: {\n    author: (parent, args, context) => {\n      return context.authorLoader.load(parent.authorId);\n    },\n  },\n};\n```\nWithout batching, at real scale this isn't just slower — 100 posts becomes 100 round trips to the database on every single request for that list, and a page requesting posts-with-comments-with-authors compounds into hundreds or thousands of queries for one API call, the exact kind of hidden cost the course flagged as one of GraphQL's most common real performance traps.\nKey decision: the fix batches by collecting individual load calls within one tick, not by changing the schema or the query the client sends — N+1 is a resolver implementation problem, invisible to (and unfixable from) the client side.",
        },
        {
          kind: "practice",
          heading: "3. Add cursor-based pagination to a list field",
          prompt:
            "`Query.orders` currently returns every order at once: `orders: [Order!]!`. Redesign the schema to paginate it using the cursor-based (edges/node/pageInfo) pattern, and describe — in words, not full resolver code — how the resolver would use an incoming cursor to fetch the next page.",
          hint:
            "The connection type wraps the list in edges (each with a node and a cursor) plus a pageInfo object. The resolver needs to translate an opaque cursor argument into \"give me rows after this position, limited to N.\"",
          solution:
            "```graphql\ntype OrderConnection {\n  edges: [OrderEdge!]!\n  pageInfo: PageInfo!\n}\n\ntype OrderEdge {\n  node: Order!\n  cursor: String!\n}\n\ntype PageInfo {\n  hasNextPage: Boolean!\n  endCursor: String\n}\n\ntype Query {\n  orders(first: Int!, after: String): OrderConnection!\n}\n```\nResolver behavior: decode `after` (commonly a base64-encoded order id or timestamp) back into a real database position, query for `first + 1` rows starting just after that position (ordered consistently, e.g. by id), use the extra row only to determine `hasNextPage` without including it in the returned edges, and set `endCursor` to the cursor of the last returned edge so the client can pass it back as `after` on the next request.\nKey decision: querying one extra row (`first + 1`) is what lets the resolver answer `hasNextPage` without a separate, second count query — a small trick that avoids doubling the database work just to know whether more data exists.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Understanding that a resolver's `parent` argument is the already-resolved object one level up, and that most fields need no custom resolver at all.",
            "Recognizing the N+1 pattern by its shape (one query per item in a list) and knowing batching, not caching, is the actual fix.",
            "Designing a list field so it never has to return an unbounded amount of data — pagination is part of a schema's design, not an afterthought bolted on later.",
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
            "Five questions across the whole course — testing whether the client-driven, typed-schema mental model actually stuck, not lesson-by-lesson recall.",
        },
        {
          kind: "quiz",
          heading: "The core problem GraphQL solves",
          question:
            "A mobile screen needs a user's name, their 3 most recent orders, and each order's total. In REST this typically takes multiple round trips; what does GraphQL change about this specifically?",
          options: [
            "GraphQL is simply a faster network protocol than HTTP, so each round trip completes quicker.",
            "The client can describe this exact nested shape in a single query, and the server returns exactly those fields in one response — no separate calls per resource, no unused fields shipped either.",
            "GraphQL automatically caches every REST endpoint response so subsequent requests don't need a round trip at all.",
            "GraphQL requires the server to pre-define one endpoint per possible combination of fields a client might want.",
          ],
          correctIndex: 1,
          explanation:
            "GraphQL runs over regular HTTP — it isn't a faster transport. The actual fix for this scenario is structural: one client-shaped query replaces what would otherwise be several REST calls chained together (under-fetching), and it returns only the requested fields rather than each resource's full shape (over-fetching). That's the client-decides-the-shape idea the whole course builds on.",
        },
        {
          kind: "quiz",
          heading: "Reading schema type syntax",
          question:
            "In the schema `orders: [Order!]!`, what does this field guarantee, and what can it still return?",
          options: [
            "It guarantees the list itself is never null and contains no null entries — it can still be an empty list, `[]`.",
            "It guarantees at least one order always exists — an empty list is not a valid response.",
            "It means orders is optional and may be entirely omitted from the response.",
            "The `!` after Order means each order can be null, while the outer `!` means the list itself cannot.",
          ],
          correctIndex: 0,
          explanation:
            "Each `!` is a separate non-null guarantee: the inner one (`Order!`) says no entry in the list can be null, and the outer one (the `]!`) says the list itself can't be null. Neither guarantee rules out an empty list — `[]` satisfies both, since it's a non-null list containing zero (therefore no null) entries.",
        },
        {
          kind: "quiz",
          heading: "Queries vs. mutations, ordering guarantees",
          question:
            "A client sends a mutation with two fields: `deleteOldAddress` followed by `setNewDefaultAddress`. What does the GraphQL spec guarantee about their execution order, and how does this differ from top-level query fields?",
          options: [
            "No guarantee either way — GraphQL always executes every top-level field, mutation or query, in parallel.",
            "Top-level mutation fields execute in the order listed, one after another; top-level query fields carry no such ordering guarantee and may run in parallel.",
            "Mutations and queries both execute strictly in the order listed, since GraphQL processes every request as one sequential list of instructions.",
            "The order is determined by the server's resolver file, not by the order fields appear in the request.",
          ],
          correctIndex: 1,
          explanation:
            "This ordering guarantee exists specifically because mutations are writes, and one write (deleting the old address) plausibly needs to complete before the next one (setting a new default) runs. Query fields, being reads, don't carry this same guarantee and are allowed to execute in parallel, since reads typically don't depend on each other's side effects.",
        },
        {
          kind: "quiz",
          heading: "Diagnosing an N+1 problem",
          question:
            "A query for 200 blog posts, each including its author, causes 201 total database calls. What's the underlying cause, and what's the standard fix?",
          options: [
            "The schema is missing non-null markers, which forces extra validation queries — add `!` to every field.",
            "Each post's author resolver independently queries the database once per post; the fix is batching those individual lookups (commonly with a DataLoader) into one combined query per tick.",
            "GraphQL mutations are being used where queries should be, which always causes duplicate calls.",
            "The client's query is malformed and should use a fragment instead of listing author fields directly.",
          ],
          correctIndex: 1,
          explanation:
            "This is the textbook N+1 shape: one query for the list (1) plus one more per item needing a related lookup (N) — here, 1 for the posts plus 200 for each post's author. Fragments control field reuse, not query batching, so switching to a fragment wouldn't change the resolver call count at all. The actual fix collects the individual per-post author lookups within a tick and issues them as a single batched query.",
        },
        {
          kind: "quiz",
          heading: "GraphQL vs. REST, choosing deliberately",
          question:
            "A small internal tool has one consumer, does simple CRUD on a handful of resources, and occasionally needs to stream a large file download. Which framing best matches this course's guidance?",
          options: [
            "GraphQL is a strict upgrade over REST in every case, so it should be used regardless of these details.",
            "REST is likely the better fit here — a single consumer with simple, stable CRUD needs doesn't need GraphQL's flexibility, and file downloads map awkwardly onto GraphQL's request/response model anyway.",
            "GraphQL should be used only for the file download endpoint, and REST for everything else, since GraphQL cannot coexist with REST endpoints in the same system.",
            "Neither is relevant here — file downloads always require a completely separate protocol from both REST and GraphQL.",
          ],
          correctIndex: 1,
          explanation:
            "The course is explicit that GraphQL is a real trade-off, not a strict upgrade: it earns its complexity with multiple clients needing different shapes, deeply nested data, or a large evolving graph with many consumers — none of which apply to a single-consumer CRUD tool. File uploads/downloads were specifically called out as mapping awkwardly onto GraphQL's model. And GraphQL and REST endpoints coexisting in one system is common in practice, not mutually exclusive.",
        },
        {
          kind: "summary",
          heading: "Course takeaways",
          bullets: [
            "GraphQL fixes over-fetching and under-fetching by letting the client dictate the exact shape of a response, instead of the server dictating a fixed shape per endpoint.",
            "A strongly typed schema (with explicit nullability via !) doubles as the API's documentation and lets tooling validate a query before it ever runs.",
            "Resolvers are per-field functions; most fields need none at all, and parent/args/context are what a custom one actually works with.",
            "N+1 queries are the most common real GraphQL performance trap, and batching (DataLoader) — not caching or schema changes — is the standard fix.",
            "Fragments reuse field selections and cursor-based pagination handles unbounded lists — both are what make a schema hold up under real-world query complexity.",
            "GraphQL vs. REST is a genuine trade-off: client diversity and nested data favor GraphQL; simple CRUD, native HTTP caching, and file transfer often still favor REST.",
          ],
        },
      ],
    },
  ],
};
