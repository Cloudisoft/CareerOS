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
          kind: "chart",
          heading: "Round trips to render one screen",
          description: "Fetching a user and their orders — REST's separate endpoints vs. one GraphQL query.",
          chartType: "bar",
          unit: "requests",
          data: [
            { label: "REST (/users/42 + /users/42/orders)", value: 2 },
            { label: "GraphQL (one query)", value: 1 },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "GraphQL moves the decision from server to client",
          body: "In REST, the server decides what shape of data each endpoint returns, and every consumer of that endpoint gets the same shape whether they need all of it or not. In GraphQL, the server exposes what data and relationships exist, and each client decides exactly which fields it wants for its specific need. That single shift is the root of almost every other difference covered in this course.",
        },
        {
          kind: "bullets",
          heading: "How teams patched over-fetching before GraphQL existed, and why the patches fall short",
          intro: "Over-fetching wasn't an undiscovered problem — REST APIs have tried several workarounds over the years, each with its own real downside:",
          bullets: [
            "A `fields` or `?include=` query parameter (/api/users/42?fields=name,avatar) lets a client trim the response, but it's untyped and unenforced — a typo in a field name silently returns less than expected, and nested selections (only some fields, only for the third order) get unwieldy fast.",
            "A dedicated endpoint per screen (/api/mobile/user-summary) gives an exact shape, but multiplies endpoints — every new screen or client need means another bespoke endpoint to design, build, document, and maintain indefinitely.",
            "API versioning (/v1/users, /v2/users) manages breaking changes over time, but doesn't touch the shape problem at all — v2 still returns one fixed shape to every consumer, same as v1 did.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Under-fetching's usual REST fix is just... more endpoints",
          body: "Teams facing under-fetching in REST often respond by building composite endpoints — /api/dashboard that stitches together a user, their orders, and their notifications server-side for one specific screen. This works, but every new screen with a different combination of data needs its own composite endpoint, and those endpoints tend to accumulate for years, since removing one risks breaking a client nobody remembers is still calling it. GraphQL replaces an ever-growing pile of bespoke composite endpoints with one general mechanism: the client just asks for the shape it needs, this week's or next year's, without anyone having to build a new endpoint first.",
        },
        {
          kind: "terminal",
          heading: "Seeing the size difference for real",
          description: "Same underlying user record, requested two different ways — the REST call ships every field the user model has; the GraphQL call ships exactly the two fields asked for and nothing else.",
          lines: [
            { text: "curl -s http://localhost:3001/api/users/42 | wc -c" },
            { text: "4238", output: true },
            { text: `curl -s -X POST http://localhost:4000/graphql -d '{"query":"{ user(id:\\"42\\"){ name avatar } }"}' | wc -c` },
            { text: "312", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A quick way to spot over-fetching in your own REST API",
          body: "Look at your largest response payloads and ask how many of the fields shipped are actually rendered on the screen that requested them — teams are often surprised to find a \"lightweight\" list screen pulling in a response several times larger than what it displays. If the answer regularly comes back well under half, that's exactly the shape of problem GraphQL was built to remove structurally, rather than just work around with a fields= hack bolted onto an existing endpoint.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "GraphQL trades away some things REST got for free",
          body: "The flexibility that fixes over- and under-fetching has a real cost elsewhere: REST's GET requests are cacheable by browsers, CDNs, and HTTP infrastructure out of the box, keyed by URL. GraphQL typically sends every operation as a POST to one single endpoint, which defeats that same HTTP-level caching almost entirely — a GraphQL server needs its own caching strategy (persisted queries, a response cache keyed by query and variables) to get back some of what REST got for free. This isn't a reason to avoid GraphQL, but it is a real trade, not a strict upgrade over REST in every dimension.",
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
          kind: "example",
          heading: "Enums and input types round out the everyday type system",
          body: "Beyond scalars and object types, two more constructs show up in almost every real schema: an enum restricts a field to a fixed set of named values, and an input type is a special object type used only for arguments — you can pass an input type into a field, but you can never return one.",
          language: "graphql",
          code: `enum OrderStatus {
  PENDING
  SHIPPED
  DELIVERED
  CANCELLED
}

input CreateOrderInput {
  userId: ID!
  items: [OrderItemInput!]!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
}`,
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
        {
          kind: "bullets",
          heading: "Interfaces and unions: modeling data that comes in more than one shape",
          intro: "A single field sometimes needs to return one of several different types — search results mixing products and articles, for instance — and two schema constructs handle exactly that:",
          bullets: [
            "An interface declares a set of fields every implementing type must have — a SearchResult interface with a title field, implemented by both Product and Article, lets a query ask for title once and get it back no matter which concrete type actually matched.",
            "A union groups otherwise-unrelated types without requiring any shared fields at all — union SearchResult = Product | Article works even though Product and Article share nothing structurally in common.",
            "Querying either one needs an inline fragment per possible concrete type to reach type-specific fields — `... on Product { price }` and `... on Article { author }` — with the client picking which type-specific fields it wants based on which type actually came back.",
          ],
        },
        {
          kind: "example",
          heading: "__typename tells the client which concrete type it actually got back",
          body: "__typename is a meta-field available on every type automatically, without ever declaring it in the schema. It's essential when querying an interface or union, since the client needs to know which concrete type came back before it can decide which inline fragment's fields actually apply.",
          language: "graphql",
          code: `query {
  search(term: "wireless") {
    __typename
    title
    ... on Product {
      price
    }
    ... on Article {
      author
    }
  }
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Custom scalars extend the five built-ins for domain-specific values",
          body: "The five built-in scalars (String, Int, Float, Boolean, ID) don't cover everything a real schema needs — a DateTime, an EmailAddress, or a URL benefits from its own validation and serialization logic rather than being passed around as an unchecked String. Most GraphQL server libraries support declaring a custom scalar (scalar DateTime) and supplying serialize/parseValue functions for it, so an invalid value is rejected right at the schema boundary instead of causing a confusing failure three layers deeper in application code.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "@deprecated marks a field as on its way out, without breaking existing clients",
          body: "Removing a field outright breaks every client still querying it, often without warning. The @deprecated directive — email: String! @deprecated(reason: \"Use contactEmail instead\") — marks a field as discouraged while keeping it fully functional: tooling surfaces a warning to anyone still using it, and the schema stays fully introspectable, so teams can migrate consumers off a field on their own timeline before it's finally deleted for good.",
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
          kind: "terminal",
          heading: "Calling the GraphQL endpoint directly",
          description: "GraphQL has exactly one HTTP endpoint — POST a query or mutation as JSON.",
          lines: [
            {
              text: `curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ user(id: \\"42\\") { name } }"}'`,
            },
            { text: '{"data":{"user":{"name":"Priya"}}}', output: true },
          ],
        },
        {
          kind: "example",
          heading: "Aliases: requesting the same field twice, differently shaped",
          body: "A query can't repeat a field name at the same level with two different arguments — the response object would end up with a duplicate key. An alias renames the field in the response instead, which is exactly what's needed when a client wants, say, two specific orders by id in one round trip.",
          code: `query {
  firstOrder: order(id: "101") {
    total
  }
  secondOrder: order(id: "102") {
    total
  }
}

// Response:
// { "data": { "firstOrder": { "total": 42 }, "secondOrder": { "total": 15 } } }`,
        },
        {
          kind: "example",
          heading: "Multiple root fields and operation names in one request",
          body: "A single query can ask for more than one unrelated thing at the root level, and naming the operation (GetDashboardData instead of an anonymous query {) makes debugging, logging, and client-side tooling meaningfully easier once an app has more than a couple of queries in it.",
          code: `query GetDashboardData {
  currentUser {
    name
  }
  recentOrders: orders(first: 5) {
    id
  }
  unreadNotificationCount
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Introspection: asking the schema about itself",
          body: "GraphQL servers typically expose their own schema through a special introspection query (`{ __schema { types { name } } }`), which is exactly what lets tools like GraphiQL and Apollo Studio generate interactive docs and autocomplete without any separate documentation file to write or keep in sync by hand.",
        },
        {
          kind: "bullets",
          heading: "Directives: @include and @skip conditionally include a field",
          bullets: [
            "@include(if: $showDetails) keeps a field in the response only when the given boolean variable is true — otherwise it's left out entirely, without needing two separate query strings for two versions of the same screen.",
            "@skip(if: $condensed) is the inverse — the field is included unless the condition is true.",
            "Both are evaluated per request from variables, not hardcoded into the query text, so one query definition can serve a \"compact\" and a \"detailed\" version of the same screen depending on what the client passes in.",
          ],
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
        {
          kind: "callout",
          tone: "warning",
          heading: "A 200 OK response can still contain errors — check the errors array, not just the status code",
          body: "Unlike REST, where a failure usually shows up as a 4xx or 5xx status, GraphQL almost always responds with HTTP 200, even when something went wrong. The response body carries a top-level errors array alongside (or instead of) data — and because GraphQL resolves field by field, one failing field doesn't necessarily fail the whole request: data can come back partially populated, with null standing in for whatever failed and a matching entry in errors explaining why. Client code that only checks response.ok and ignores the errors array will silently treat a partial failure as a full success.",
        },
        {
          kind: "example",
          heading: "Fragments avoid repeating the same field selection",
          body: "A fragment names a reusable set of fields on a given type, so the same selection doesn't need to be retyped everywhere it's needed — and, more importantly, stays consistent if the fields it selects ever change.",
          code: `fragment OrderSummary on Order {
  id
  total
  createdAt
}

query {
  recentOrders: orders(first: 5) {
    ...OrderSummary
  }
  order(id: "101") {
    ...OrderSummary
  }
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Fragments colocated with the component that uses them",
          body: "In client frameworks built around GraphQL (Relay, and Apollo Client to a lesser degree), fragments are often defined right next to the UI component that renders those fields, and a parent query composes them together — so a component's own data needs live in the same file as its rendering logic, instead of one giant query listing every field every part of the page happens to need.",
        },
        {
          kind: "example",
          heading: "What a partial failure actually looks like on the wire",
          body: "name resolved fine here; orders failed, so it comes back null inside data, with the reason recorded separately in errors — the response is neither a clean success nor a clean failure, and handling it correctly means checking both parts.",
          code: `{
  "data": {
    "user": {
      "name": "Priya",
      "orders": null
    }
  },
  "errors": [
    {
      "message": "Failed to fetch orders: connection timeout",
      "path": ["user", "orders"]
    }
  ]
}`,
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
          kind: "diagram",
          heading: "How a query resolves, field by field",
          description: "For { user(id: \"42\") { name orders { total } } }.",
          steps: [
            { label: "Query arrives", detail: "user(id: \"42\") { name orders { total } }" },
            { label: "Query.user resolver runs", detail: "context.db.user.findUnique({ where: { id: \"42\" } })" },
            { label: "User.orders resolver runs", detail: "parent = the already-resolved user; context.db.order.findMany(...)" },
            { label: "Response assembled", detail: "Shaped to match exactly what the query asked for" },
          ],
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
          tone: "insight",
          heading: "Resolvers can return a value, a promise, or throw — GraphQL handles either way",
          body: "The resolver examples so far return whatever context.db.user.findUnique(...) returns, which is itself a promise, not the eventual data directly. GraphQL execution understands this: if a resolver returns a promise, GraphQL awaits it automatically before moving on and assembling that part of the response. This is why real resolvers, which almost always call an async data source, don't strictly need async/await syntax to work correctly — though most are written with it anyway, purely for readability.",
        },
        {
          kind: "example",
          heading: "Throwing inside a resolver becomes an entry in the errors array",
          body: "A resolver that throws doesn't crash the whole request — GraphQL catches it, records the message (and the field's path) as an entry in the response's top-level errors array, sets that specific field to null in data, and keeps resolving every other field normally. This is exactly the partial-failure shape from the previous lesson, and it's how it actually gets produced.",
          code: `const resolvers = {
  Query: {
    user: async (parent, args, context) => {
      const user = await context.db.user.findUnique({ where: { id: args.id } });
      if (!user) {
        throw new Error(\`No user found with id \${args.id}\`);
      }
      return user;
    },
  },
};

// A query for a missing id comes back:
// { "data": { "user": null }, "errors": [{ "message": "No user found with id 999", ... }] }`,
        },
        {
          kind: "bullets",
          heading: "context is built fresh per request, never shared or reused across requests",
          bullets: [
            "A new context object is created for every incoming request — it's the right place for a per-request database connection, the currently authenticated user (decoded from that request's auth token), or a DataLoader instance that needs to reset its cache between requests.",
            "Anything meant to be shared across every request instead — a connection pool, a config object — should be set up once outside the request lifecycle and referenced from context, not recreated on every single call.",
            "This distinction matters most for authorization: checking context.currentUser inside a resolver is the standard place to enforce \"can this specific caller see this specific field,\" since context is guaranteed fresh and correct for whichever request is currently being handled.",
            "Never store per-request state like the current user on a module-level variable outside context — under real concurrent traffic, two requests running at once would silently stomp on each other's value.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The N+1 query trap",
          body: "Naively written, resolving `orders` for each of 50 users in a single query result triggers 50 separate database calls — one per user — plus the original query, instead of one efficient batched call. This N+1 problem is one of the most common real GraphQL performance issues, and it's usually solved with a batching layer (a \"DataLoader\" pattern) that collects individual resolver requests within a tick and issues one combined query instead.",
        },
        {
          kind: "chart",
          heading: "Database queries to resolve 50 users' orders",
          description: "One resolver, two very different outcomes depending on whether it's batched.",
          chartType: "bar",
          unit: "database queries",
          data: [
            { label: "Naive (1 per user)", value: 51 },
            { label: "Batched with DataLoader", value: 2 },
          ],
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
          kind: "bullets",
          heading: "A gradual adoption path: GraphQL doesn't have to replace REST overnight",
          intro: "The most common real-world starting point isn't a rewrite:",
          bullets: [
            "A Backend-For-Frontend (BFF) layer is the typical entry point: a single GraphQL server sits in front of existing REST services and databases, and its resolvers simply call out to those existing endpoints internally, rather than requiring every underlying service to be rewritten first.",
            "This lets a team ship GraphQL to actual clients quickly, while the resolvers behind it are refactored to talk directly to a database (or another service) over time — invisibly to whoever's calling the GraphQL API from the outside.",
            "Most companies running GraphQL in production today still have plenty of REST underneath it, or running alongside it for cases like webhooks and file uploads where REST remains the better fit — full replacement is rare, and rarely even the goal.",
          ],
        },
        {
          kind: "text",
          heading: "Two example teams, two different right answers",
          body: [
            "An early-stage startup with one web app and three engineers, doing straightforward CRUD against a Postgres database, is very unlikely to need GraphQL — a handful of REST endpoints, maybe with a thin fields= parameter for the one screen that needs trimming, gets them shipping faster with less to learn and less to operate.",
            "A company with a public API serving a web app, an iOS app, an Android app, and third-party integration partners — each historically maintaining its own bespoke REST endpoints that have quietly diverged over two years — is closer to a textbook case for GraphQL: one typed schema replaces the divergence, and each client's different data needs are finally served by one mechanism instead of four codebases slowly growing apart from each other.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "At large-organization scale, GraphQL federation splits one graph across many teams",
          body: "A single schema owned by one team works fine at moderate scale, but breaks down once dozens of teams each own a different slice of the data graph — every change then requires coordinating through one shared schema file. Federation (an approach popularized by Apollo, later formalized further) lets each team publish its own subgraph — a Users service owns User, an Orders service owns Order — and a gateway composes them into one graph the client queries against, without any single team needing write access to the whole thing. It's real added infrastructure, worth reaching for only once organizational scale, not technical curiosity, actually demands it.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "GraphQL exists to fix over-fetching and under-fetching by letting the client shape the response instead of the server dictating it.",
            "A typed schema, queries, mutations, and resolvers are the core mechanics — but the client-driven query flexibility is the underlying idea behind all of them.",
            "The choice between GraphQL and REST is a real tradeoff, not a strict upgrade — client diversity and nested data favor GraphQL; simple CRUD, caching, and file transfer often still favor REST.",
            "Adoption is usually gradual (a BFF layer in front of existing REST services), not a rewrite — and federation is the answer only once many teams, not one, need to own separate parts of the same graph.",
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
          kind: "diagram",
          heading: "Paging through a large list with a cursor",
          description: "Each request asks for the next page relative to where the last one left off.",
          steps: [
            { label: "First request", detail: "orders(first: 20) — no cursor yet" },
            { label: "Server returns 20 edges + endCursor", detail: "pageInfo.hasNextPage: true" },
            { label: "Client requests again", detail: "orders(first: 20, after: endCursor)" },
            { label: "Server returns the next 20", detail: "Positioned after that cursor, even if rows changed" },
            { label: "Repeat until hasNextPage: false", detail: "Client knows it has reached the end" },
          ],
        },
        {
          kind: "example",
          heading: "Offset-based pagination, for contrast",
          body: "Simpler to implement than cursors, and fine for a small or rarely-changing list — but it's the shape most APIs eventually migrate away from once a list gets large or volatile, for exactly the reason on the next slide.",
          code: `type Query {
  orders(offset: Int!, limit: Int!): [Order!]!
}

# query {
#   orders(offset: 40, limit: 20) { id total }
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
          kind: "bullets",
          heading: "Paging backward too: first/after and last/before",
          intro: "The examples so far only page forward. The same connection pattern usually supports the reverse direction as well:",
          bullets: [
            "first (how many) plus after (cursor) page forward; last (how many from the end) plus before (cursor) page backward — useful for a client loading older messages after scrolling to the top of a chat, for instance.",
            "totalCount is a common, though non-standard, addition to a connection type — it gives the client an overall count without having to fetch and count every page itself, useful for a \"page 3 of 40\" style UI.",
            "hasPreviousPage joins hasNextPage in a fuller PageInfo, so a client paging in either direction can tell reliably when it's actually reached either end of the list.",
          ],
        },
        {
          kind: "example",
          heading: "Fragments can include other fragments",
          body: "Nesting keeps a large query's field list organized by what it actually represents — an order summary made of order items — rather than as one long, flat list of fields with no structure of its own.",
          code: `fragment OrderItem on OrderLineItem {
  productName
  quantity
  price
}

fragment OrderSummary on Order {
  id
  total
  items {
    ...OrderItem
  }
}

query GetOrder($id: ID!) {
  order(id: $id) {
    ...OrderSummary
  }
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Colocating fragments with the components that use them",
          body: "In frontend frameworks paired with GraphQL (Apollo Client, Relay), a genuinely useful pattern is defining a fragment right next to the UI component that renders those fields — a UserAvatar component declares its own UserAvatar_user fragment, and a parent screen's query simply spreads it in without needing to know or care exactly which fields UserAvatar needs internally. Change what UserAvatar renders, and only that fragment's definition needs updating — the parent query's text doesn't change at all, even though the data it fetches does.",
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
          kind: "practice",
          heading: "4. Add authorization to a resolver",
          prompt:
            "The Query.user resolver currently returns any user's full record, email included, to any caller who asks. Modify it so it throws an error unless `context.currentUser` exists and either `context.currentUser.id` equals the requested `id`, or `context.currentUser.role` is `\"ADMIN\"`. Assume `context.currentUser` is already populated (or left null) by upstream auth middleware before any resolver runs.",
          hint:
            "Put the check as the very first thing inside the resolver, before touching the database at all — there's no reason to spend a database round trip on a request you're about to reject anyway.",
          solution:
            "```js\nconst resolvers = {\n  Query: {\n    user: (parent, args, context) => {\n      if (!context.currentUser) {\n        throw new Error(\"Not authenticated\");\n      }\n      const isOwnRecord = context.currentUser.id === args.id;\n      const isAdmin = context.currentUser.role === \"ADMIN\";\n      if (!isOwnRecord && !isAdmin) {\n        throw new Error(\"Not authorized to view this user\");\n      }\n      return context.db.user.findUnique({ where: { id: args.id } });\n    },\n  },\n};\n```\nKey decision: the check runs before the database call, and it throws rather than quietly returning null. A masked \"not found\" would be indistinguishable from a genuinely missing user, while a clear \"not authorized\" error describes what actually happened — and it's safe to return, since it doesn't leak whether the requested user even exists.",
        },
        {
          kind: "practice",
          heading: "5. Write a resolver for a computed field",
          prompt:
            "Add a fullName field to the User type that isn't stored in the database — the underlying table only has firstName and lastName columns. Write the resolver for User.fullName.",
          hint:
            "parent here is the already-resolved User row, which does have firstName and lastName on it, even though the schema's fullName field doesn't correspond to any single column directly.",
          solution:
            "```graphql\ntype User {\n  id: ID!\n  firstName: String!\n  lastName: String!\n  fullName: String!\n}\n```\n```js\nconst resolvers = {\n  User: {\n    fullName: (parent) => `${parent.firstName} ${parent.lastName}`,\n  },\n};\n```\nKey decision: fullName needs a custom resolver specifically because its name doesn't match any property on the underlying row — GraphQL's default resolver only works automatically when the field name and the parent object's property name line up exactly, which is why id, firstName, and lastName above need no resolver of their own at all.",
        },
        {
          kind: "practice",
          heading: "6. Write the actual DataLoader batch function",
          prompt:
            "Exercise 2 described the DataLoader batching strategy in words. Now write it for real: implement batchGetUsers(ids), the batch function context.authorLoader would call internally. Assume context.db.user.findMany({ where: { id: { in: [...] } } }) returns the matching users, in arbitrary order. DataLoader's contract requires the batch function to return results in the exact same order as the input ids array, with undefined (not simply omitted) for any id that wasn't found.",
          hint:
            "findMany won't necessarily return rows in the same order as your ids array, and it won't include placeholders for missing ids at all — build a lookup Map from the results first, then map over the original ids array to reconstruct the correct order and fill any gaps.",
          solution:
            "```js\nasync function batchGetUsers(ids) {\n  const users = await context.db.user.findMany({\n    where: { id: { in: ids } },\n  });\n\n  const usersById = new Map(users.map((user) => [user.id, user]));\n\n  // Must return one entry per input id, in the SAME order as ids —\n  // this is what lets DataLoader match each result back to its caller.\n  return ids.map((id) => usersById.get(id)); // undefined for a missing id\n}\n\nconst authorLoader = new DataLoader(batchGetUsers);\n```\nKey decision: order is rebuilt explicitly with a Map lookup rather than trusting the database to return rows in input order — most databases make no such guarantee, and DataLoader's entire batching contract silently breaks if that assumption is wrong.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Resolvers are just functions — test them like any other function",
          body: "A resolver doesn't need a running GraphQL server, a real database, or an HTTP request to test. Call it directly with a hand-built parent, args, and context — a mock context.db that returns fixed data in place of a real database connection — and assert on what it returns or throws, exactly like testing any other plain function. This is usually far faster and far more targeted than spinning up the whole server and sending a query string through it just to check one resolver's authorization logic or one edge case in its output.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Understanding that a resolver's `parent` argument is the already-resolved object one level up, and that most fields need no custom resolver at all.",
            "Recognizing the N+1 pattern by its shape (one query per item in a list) and knowing batching, not caching, is the actual fix — and that a batch function's contract (same order, same length as its input) has to be honored exactly.",
            "Designing a list field so it never has to return an unbounded amount of data — pagination is part of a schema's design, not an afterthought bolted on later.",
            "Putting authorization checks inside the resolver itself, before any database work, and failing with a clear error rather than a misleading null.",
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
