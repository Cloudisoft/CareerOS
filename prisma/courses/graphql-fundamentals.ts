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
  ],
};
