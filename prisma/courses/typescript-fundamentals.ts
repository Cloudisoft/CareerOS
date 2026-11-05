import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "typescript-fundamentals",
  title: "TypeScript Fundamentals",
  description:
    "How to add real, load-bearing types on top of JavaScript you already know — basic types, interfaces, generics, and narrowing, without the theory overload.",
  category: "Programming",
  level: "INTERMEDIATE",
  order: 11,
  lessons: [
    {
      title: "Why Add Types to JavaScript?",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Why Add Types to JavaScript?",
          subheading:
            "TypeScript is JavaScript plus a type checker that runs before your code ever executes. It doesn't change how the code runs — it changes when a whole category of bugs gets caught.",
        },
        {
          kind: "example",
          heading: "The bug TypeScript exists to catch",
          body: "This is valid JavaScript. It runs. It also silently produces the wrong answer, and nothing tells you until a customer complains their total is wrong.",
          language: "javascript",
          code: `function applyDiscount(price, discountPercent) {
  return price - price * discountPercent;
}

// Someone calls it with a string by mistake — no error, wrong result
applyDiscount(100, "10"); // "10010" is NOT what you think it is`,
        },
        {
          kind: "example",
          heading: "The same function, typed",
          body: "TypeScript catches the bad call before the code ever runs — right in the editor, with a red underline, not in production.",
          language: "typescript",
          code: `function applyDiscount(price: number, discountPercent: number): number {
  return price - price * discountPercent;
}

applyDiscount(100, "10");
// Error: Argument of type 'string' is not assignable
// to parameter of type 'number'.`,
        },
        {
          kind: "terminal",
          heading: "What tsc actually prints",
          description: "Running the type checker directly shows the exact error your editor is underlining live — before the code ever ships.",
          lines: [
            { text: "npx tsc discount.ts" },
            {
              text: "discount.ts:5:19 - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.",
              output: true,
            },
            { text: "", output: true },
            { text: "5 applyDiscount(100, \"10\");", output: true },
            { text: "                    ~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in discount.ts:5", output: true },
          ],
        },
        {
          kind: "example",
          heading: "TypeScript checks shape, not name — this is \"structural typing\"",
          body: "Unlike languages where a type has to be explicitly declared as implementing an interface, TypeScript only cares whether a value has the right shape. Two unrelated types with identical fields are freely interchangeable.",
          language: "typescript",
          code: `interface Point { x: number; y: number }

function distanceFromOrigin(p: Point): number {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

// This has nothing to do with Point by name — never declared as one —
// but it has the right shape, so TypeScript accepts it without complaint
const dot = { x: 3, y: 4, color: "red" };
distanceFromOrigin(dot); // 5 — extra fields like color are simply ignored`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Types adopt gradually — you don't need a big-bang rewrite",
          body: "A .js file can be renamed to .ts and will usually produce a handful of errors, not hundreds — TypeScript infers what it can and only complains where something is genuinely ambiguous. Most real migrations go file by file, and tsconfig's allowJs option even lets plain .js and typed .ts files coexist in the same project while it happens.",
        },
        {
          kind: "bullets",
          heading: "What types actually buy you",
          bullets: [
            "Errors move earlier — from \"a user hit this in production\" to \"your editor underlined it as you typed.\"",
            "Autocomplete gets real — your editor can suggest exactly the fields an object has, not just guess.",
            "Refactoring gets safer — rename a field, and every place that breaks lights up immediately instead of failing silently at runtime.",
            "Types double as documentation that can't drift out of date, because the compiler enforces it.",
          ],
        },
        {
          kind: "bullets",
          heading: "What types cost you — and when that cost is worth it",
          intro: "Types aren't free. Weighing them honestly is part of using them well, not just selling the upside.",
          bullets: [
            "A build/compile step gets added to your workflow — even a fast one is one more thing between saving a file and seeing it run.",
            "You'll spend real time fighting the type checker on genuinely awkward cases — a third-party library with bad or missing types, a deeply nested generic, a migration that needs `any` as a temporary escape hatch.",
            "Prototyping something throwaway is often faster in plain JavaScript — you're not paying for a contract you don't intend to keep.",
            "On a small script you'll run once and delete, the safety net rarely pays for itself. On anything a team will touch for months, it almost always does — and the earlier a codebase adds types, the cheaper that transition stays.",
          ],
        },
        {
          kind: "example",
          heading: "The bigger payoff: types catch mistakes across a refactor, not just at one call site",
          body: "A single typo is the easy case. The real value shows up when you rename a field that's used in thirty places across a codebase you didn't write and don't fully remember — plain JavaScript won't tell you which of those thirty call sites you missed until each one fails at runtime, possibly in production, possibly for a user in a timezone you're asleep in.",
          language: "typescript",
          code: `interface Order {
  id: string;
  totalCents: number; // renamed from "total" during a refactor
}

function formatOrder(order: Order) {
  return \`Order \${order.id}: $\${(order.total / 100).toFixed(2)}\`;
  // Error: Property 'total' does not exist on type 'Order'.
  // Did you mean 'totalCents'? — caught here, not in three other files
}`,
        },
        {
          kind: "terminal",
          heading: "Adopting types without a rewrite: allowJs and checkJs",
          description: "Most real migrations don't start by renaming every file to .ts. They start by turning on checking for the .js files a project already has, and fixing what surfaces one error at a time.",
          lines: [
            { text: "# tsconfig.json: \"allowJs\": true, \"checkJs\": true" },
            { text: "npx tsc --noEmit" },
            { text: "src/billing.js:14:3 - error TS2554: Expected 2 arguments, but got 1.", output: true },
            { text: "", output: true },
            { text: "14   applyDiscount(100);", output: true },
            { text: "     ~~~~~~~~~~~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in src/billing.js:14", output: true },
            { text: "# Fix that one call, rerun, fix the next — no rewrite required" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "\"Add types later\" quietly becomes \"never\"",
          body: "Plenty of teams start a project in plain JavaScript planning to add types once it's proven out — and then never do, because a growing codebase with no types is exactly the kind of codebase that's hardest to safely add them to later. The cheapest time to add TypeScript to a project is at the start, or the moment it stops being a throwaway script.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "TypeScript disappears at runtime",
          body: "Every type annotation is erased when TypeScript compiles down to JavaScript — types have zero effect on how fast your code runs or what it does at runtime. They exist entirely to catch mistakes before that point, which is exactly why they're worth adding even to code you're the only one who'll ever touch.",
        },
      ],
    },
    {
      title: "Basic Types and Inference",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Basic Types and Inference",
          subheading:
            "You'll write far fewer explicit type annotations than you'd expect — TypeScript is usually smart enough to figure the type out on its own.",
        },
        {
          kind: "example",
          heading: "The core types",
          language: "typescript",
          code: `let age: number = 30;
let name: string = "Ada";
let isActive: boolean = true;
let tags: string[] = ["engineer", "remote"];
let coords: [number, number] = [40.7, -74.0]; // tuple: fixed length & types
let anything: unknown = fetchSomeValue(); // safer alternative to "any"`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Let inference do the work",
          body: "const age = 30 already gives age the type number — TypeScript reads the value you assigned and infers the type automatically. Writing const age: number = 30 is redundant. Reserve explicit annotations for function parameters and return types, and places where inference genuinely can't tell what you mean, like an empty array.",
        },
        {
          kind: "example",
          heading: "const infers a narrower type than let does",
          body: "This trips people up the first time they see it. let assumes you'll reassign, so TypeScript widens the type to the general string. const can never be reassigned, so TypeScript keeps the exact literal value as the type.",
          language: "typescript",
          code: `let status = "active";      // inferred as: string (could become anything else later)
const role = "admin";       // inferred as: "admin" (this exact literal, forever)

function setRole(role: "admin" | "editor") { /* ... */ }

setRole(role);   // fine — role's type is literally "admin"
let r = "admin";
setRole(r);       // Error — r's type widened to string, not the literal "admin"`,
        },
        {
          kind: "example",
          heading: "any vs unknown — the difference that matters",
          body: "any turns off type checking entirely for that value — it's an escape hatch that can hide real bugs. unknown says \"could be anything,\" but forces you to check before using it, which is almost always what you actually want.",
          language: "typescript",
          code: `function handleAny(value: any) {
  value.toUpperCase(); // compiles fine — even if value is a number
}

function handleUnknown(value: unknown) {
  value.toUpperCase(); // Error: Object is of type 'unknown'
  if (typeof value === "string") {
    value.toUpperCase(); // fine — TypeScript now knows it's a string
  }
}`,
        },
        {
          kind: "terminal",
          heading: "Compiling the any vs. unknown example",
          description: "Only the unknown version stops the compiler — the any version compiles with zero complaints, which is exactly the danger.",
          lines: [
            { text: "npx tsc types.ts --noEmit" },
            { text: "types.ts:6:9 - error TS18046: 'value' is of type 'unknown'.", output: true },
            { text: "", output: true },
            { text: "6   value.toUpperCase();", output: true },
            { text: "          ~~~~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in types.ts:6", output: true },
          ],
        },
        {
          kind: "example",
          heading: "Type assertions: telling the compiler what you already know",
          body: "as overrides TypeScript's own inference when you're confident about a type it can't figure out on its own — reading from the DOM is the classic case. It's not a runtime conversion or a safety check; it only affects what the compiler believes, so an incorrect assertion compiles fine and fails at runtime instead.",
          language: "typescript",
          code: `const input = document.getElementById("email") as HTMLInputElement;
input.value; // TypeScript now knows this has a .value property

// The non-null assertion (!) is a narrower version of the same idea —
// it tells TypeScript "this is never null/undefined here, trust me":
function getUser(id: string): User | undefined { /* ... */ return undefined; }
const user = getUser("123")!; // asserts the result isn't undefined
user.name; // compiles — but throws at runtime if getUser really did return undefined

// Prefer a real check over ! whenever you can — it fails loudly instead
// of asserting past a bug that a narrowing check would have caught`,
        },
        {
          kind: "example",
          heading: "Enums vs union literals for a fixed set of values",
          body: "TypeScript has a built-in enum construct, but most modern codebases prefer a plain union of string literals for the same job — it's simpler, and the values are the actual strings you'd log or send over the network, not an indirect numeric reference.",
          language: "typescript",
          code: `// enum — generates real runtime JavaScript, and by default backs each
// member with a number, not the label you typed:
enum Status { Pending, Active, Cancelled }
Status.Active; // 1 — not the string "Active"

// Union of string literals — no runtime code generated, and the value
// really is the readable string you compare against:
type StatusLiteral = "pending" | "active" | "cancelled";
const s: StatusLiteral = "active";
s === "active"; // reads naturally, matches what you'd log or send over the wire`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A tuple's fixed length isn't fully enforced by array methods",
          body: "let coords: [number, number] = [40.7, -74.0] correctly rejects coords = [1, 2, 3] as too many elements. But coords.push(99) compiles without complaint — push isn't aware of the tuple's fixed arity, so the array can still grow past its declared length at runtime. Tuples type-check assignment and indexed access well; they don't fully protect against mutation methods.",
        },
        {
          kind: "bullets",
          heading: "Special types worth knowing",
          bullets: [
            "void — a function that doesn't return a meaningful value (most side-effecting functions).",
            "null and undefined — their own types; with strictNullChecks on (the default in new projects), you must handle them explicitly rather than assume a value exists.",
            "never — a function that never returns normally, like one that always throws or loops forever. Rare, but shows up in exhaustiveness checks.",
          ],
        },
        {
          kind: "example",
          heading: "Literal types apply to numbers and booleans too, not just strings",
          body: "A number or boolean can be narrowed to one exact value the same way a string can — which is what lets a union like 1 | 2 | 3 or \"asc\" | \"desc\" act as a genuinely restricted set of allowed values, not just a loose description of the general type.",
          language: "typescript",
          code: `type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

function roll(): DiceRoll {
  return (Math.floor(Math.random() * 6) + 1) as DiceRoll;
}

type SortDirection = "asc" | "desc";
function sortBy(field: string, direction: SortDirection) { /* ... */ }
sortBy("price", "up"); // Error — "up" is not "asc" | "desc"`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Object literals widen more aggressively than primitives",
          body: "let retries = 3 infers the literal type 3 for a moment, then TypeScript widens it to plain number because let means the value can change. That's expected. What surprises people is that the same widening happens to every field inside an object literal too — const config = { retries: 3, mode: \"fast\" } infers { retries: number; mode: string }, not the specific values, even though config itself can never be reassigned.",
        },
        {
          kind: "example",
          heading: "as const locks a literal's fields down to their exact values",
          body: "Adding `as const` after an object or array literal tells TypeScript to infer the narrowest possible type for every field instead of widening it — turning number into the literal 3, string into a specific literal, and making the whole structure readonly in the process. It's the object-level version of what const alone does for a single variable.",
          language: "typescript",
          code: `const config = { retries: 3, mode: "fast" };
// inferred as { retries: number; mode: string }

const strictConfig = { retries: 3, mode: "fast" } as const;
// inferred as { readonly retries: 3; readonly mode: "fast" }

const directions = ["asc", "desc"] as const;
// inferred as readonly ["asc", "desc"], not string[]`,
        },
        {
          kind: "terminal",
          heading: "strictNullChecks catching a real bug before it ships",
          description: "With strict mode on (the default for new tsconfig.json files), TypeScript refuses to let you call a method on a value that might be null or undefined — you have to prove it isn't first.",
          lines: [
            { text: "npx tsc profile.ts --strict --noEmit" },
            { text: "profile.ts:8:20 - error TS18048: 'user.nickname' is possibly 'undefined'.", output: true },
            { text: "", output: true },
            { text: "8   return user.nickname.toUpperCase();", output: true },
            { text: "                     ~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in profile.ts:8" , output: true },
            { text: "# Fix: user.nickname?.toUpperCase() ?? user.name.toUpperCase()" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Inference stops at function boundaries — on purpose",
          body: "TypeScript happily infers the type of a local variable from the value you give it, but it deliberately does not infer a function's parameter types from how the function is later called — it only looks at the parameter's own annotation, or lack of one. That asymmetry is why you'll still write explicit parameter types constantly even in a codebase that leans on inference everywhere else: a function's parameters are its public contract, and that contract shouldn't silently shift depending on who happens to call it first.",
        },
        {
          kind: "example",
          heading: "Template literal types build a string type out of other types, the same way template literals build a string value",
          body: "This is one of the newer, less obvious corners of the type system — but it shows up constantly in typed CSS-in-JS libraries, typed routing, and typed event names, where a huge but well-structured set of valid strings needs describing without listing every single one by hand.",
          language: "typescript",
          code: `type Size = "sm" | "md" | "lg";
type Direction = "top" | "right" | "bottom" | "left";

type Spacing = \`margin-\${Direction}-\${Size}\`;
// "margin-top-sm" | "margin-top-md" | ... all 12 combinations, generated for you

function setSpacing(prop: Spacing, value: string) { /* ... */ }
setSpacing("margin-top-sm", "8px");   // fine
setSpacing("margin-diagonal-sm", "8px"); // Error — not a valid combination`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Inference works the same way for arrays as it does for primitives",
          body: "const tags = [\"a\", \"b\"] infers string[], and pushing a number onto it later is caught immediately — but an empty array, const items = [], infers any[] because there's nothing yet to infer from. Give it an explicit type the moment you declare it, const items: string[] = [], rather than letting the first .push() implicitly decide the element type for the rest of the array's life.",
        },
      ],
    },
    {
      title: "Interfaces and Type Aliases",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Interfaces and Type Aliases",
          subheading:
            "Describing the shape of an object is the single most common thing you'll do in TypeScript. There are two ways to do it, and the difference is smaller than the debate about it suggests.",
        },
        {
          kind: "example",
          heading: "Both describe the same shape",
          language: "typescript",
          code: `interface User {
  id: string;
  name: string;
  email: string;
  age?: number; // the ? makes this field optional
}

type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
};

function greet(user: User) {
  return \`Hello, \${user.name}\`;
}`,
        },
        {
          kind: "example",
          heading: "readonly locks a field after the object is created",
          body: "Marking a field readonly means it can be set when the object is built, but reassigning it afterward is a compile error — useful for an id or createdAt that should never legitimately change once the object exists.",
          language: "typescript",
          code: `interface Invoice {
  readonly id: string;
  total: number;
}

const invoice: Invoice = { id: "inv_1", total: 100 };
invoice.total = 150;  // fine — total isn't readonly
invoice.id = "inv_2";  // Error: Cannot assign to 'id' because it is a read-only property`,
        },
        {
          kind: "bullets",
          heading: "When the difference actually matters",
          bullets: [
            "interface can be \"reopened\" and extended later by declaring it again with new fields — useful for public library types, rare in application code.",
            "interface extends another with a clean keyword: interface Admin extends User { permissions: string[] }.",
            "type can describe things interface can't: unions (\"A or B\"), tuples, and mapped types.",
            "A practical default: use interface for object shapes you expect to extend, type for everything else, including unions. Most teams settle on one as the house style and stop debating it.",
          ],
        },
        {
          kind: "example",
          heading: "Union types: \"this OR that\"",
          body: "A union is one of TypeScript's most useful additions over plain JavaScript — it lets you say precisely which values are valid, instead of just \"a string.\"",
          language: "typescript",
          code: `type Status = "pending" | "active" | "cancelled";

function setStatus(status: Status) {
  // ...
}

setStatus("active");   // fine
setStatus("archived"); // Error: not assignable to type 'Status'`,
        },
        {
          kind: "example",
          heading: "Intersection types: combining shapes with &",
          body: "Where a union means \"one of these,\" an intersection means \"all of these at once.\" It's the type-only equivalent of the spread pattern you'd use at runtime to merge two objects, and it's how you attach extra fields to a type you don't control.",
          language: "typescript",
          code: `type Timestamped = { createdAt: Date; updatedAt: Date };
type User = { id: string; name: string };

type TimestampedUser = User & Timestamped;
// has every field from both: id, name, createdAt, updatedAt — all required

const u: TimestampedUser = {
  id: "1",
  name: "Ada",
  createdAt: new Date(),
  updatedAt: new Date(),
}; // missing any one of the four fields is a compile error`,
        },
        {
          kind: "example",
          heading: "Index signatures type an object used as a dictionary",
          body: "When you don't know the exact keys ahead of time — a config object, a lookup built from user input — an index signature says \"every key is a string, and every value has this type,\" without listing the keys individually.",
          language: "typescript",
          code: `interface WordCounts {
  [word: string]: number;
}

const counts: WordCounts = {};
counts.the = 12;
counts.and = 5;
counts["a-word-with-dashes"] = 1; // bracket syntax works for any string key

function totalWords(counts: WordCounts): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Object literals get checked more strictly than variables",
          body: "Passing an object literal directly to a function triggers TypeScript's \"excess property check\": greet({ name: \"Ada\", extra: true }) errors immediately if greet expects only { name: string }. But store that same object in a variable first — const obj = { name: \"Ada\", extra: true }; greet(obj); — and it compiles, because the check only applies to literals written right at the call site, not to values assigned earlier. Both are equally wrong at runtime; only the literal form catches it at compile time.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Optional (?) is not the same as nullable",
          body: "age?: number means the field can be left out of the object entirely — but if it's present, it must be a number, not null. If you need to allow either a real value or an explicit null, write age: number | null instead.",
        },
        {
          kind: "example",
          heading: "Nesting interfaces mirrors how the real data is actually shaped",
          body: "Most real objects aren't flat — a User has an Address, an order has line items, a comment has replies. Rather than inlining every nested field, define the smaller shape once and reference it by name; it reads closer to the data and each piece can be reused or tested on its own.",
          language: "typescript",
          code: `interface Address {
  street: string;
  city: string;
  postalCode: string;
}

interface Customer {
  id: string;
  name: string;
  billingAddress: Address;
  shippingAddress?: Address; // falls back to billingAddress when absent
}

function ship(customer: Customer) {
  const dest = customer.shippingAddress ?? customer.billingAddress;
  return \`Shipping to \${dest.city}\`;
}`,
        },
        {
          kind: "example",
          heading: "Recursive types describe self-referential data, like a comment thread",
          body: "An interface is allowed to reference itself — the compiler doesn't try to \"unroll\" it into infinite depth, it just checks each level as you actually build one. This is the standard shape for anything tree-like: nested comments, a file system, an org chart, a category with subcategories.",
          language: "typescript",
          code: `interface CommentNode {
  id: string;
  author: string;
  body: string;
  replies: CommentNode[]; // each reply is a full CommentNode of its own
}

function countAll(node: CommentNode): number {
  return 1 + node.replies.reduce((sum, r) => sum + countAll(r), 0);
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "extends and & usually agree — but they fail differently on a conflict",
          body: "interface Admin extends User { role: string } and type Admin = User & { role: string } produce the same shape when the fields don't collide. Where they diverge is a genuine conflict — extending User with a role field that's typed differently than one User already declares is a compile error right at the interface declaration, with a clear message. The intersection version instead quietly collapses that field's type to never, which only surfaces later, as a confusing error the first time you try to actually assign a value to it.",
        },
        {
          kind: "terminal",
          heading: "What a shape mismatch looks like from tsc",
          description: "This is the everyday error you'll see most: an object that's close, but missing or misspelling one required field.",
          lines: [
            { text: "npx tsc customer.ts --noEmit" },
            { text: "customer.ts:12:7 - error TS2741: Property 'postalCode' is missing in type", output: true },
            { text: "  '{ street: string; city: string; }' but required in type 'Address'.", output: true },
            { text: "", output: true },
            { text: "12 const addr: Address = { street: \"1 Elm St\", city: \"Boise\" };", output: true },
            { text: "         ~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in customer.ts:12", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Naming conventions worth adopting early",
          intro: "None of these are enforced by the compiler, but they save real confusion once a codebase has a few hundred types in it.",
          bullets: [
            "Name a type after what it represents, not where it's used — Customer, not CustomerFormData or CustomerFromApi, unless the shape genuinely differs at that boundary.",
            "Suffix input/payload types clearly — CreateCustomerInput, UpdateCustomerInput — so it's obvious at a glance which one a function expects.",
            "Don't prefix interfaces with I (IUser) — that convention comes from languages where interfaces and classes are separate concepts; in TypeScript's structural system it just adds noise.",
            "Keep a shared types.ts (or a types/ folder) for shapes used across multiple files, and colocate a type with its file when nothing else uses it.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A type alias for a primitive is cheap, and pays for itself quickly",
          body: "type UserId = string and type ProductId = string look pointless at first — they're both still just string underneath, and TypeScript won't stop you from passing a ProductId where a UserId is expected, because it checks structure, not the alias name. What they do buy you is readability at every call site: function transferOwnership(from: UserId, to: UserId) documents itself far better than four interchangeable string parameters in a row, and renaming the alias later (say, to a branded type for real mix-up prevention) touches one declaration instead of every function signature in the codebase.",
        },
      ],
    },
    {
      title: "Typing Functions",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Typing Functions",
          subheading:
            "Parameters and return values are where types earn their keep the most — this is the contract other code relies on when it calls your function.",
        },
        {
          kind: "example",
          heading: "Parameters, return types, and optional params",
          language: "typescript",
          code: `function formatPrice(amount: number, currency: string = "USD"): string {
  return \`\${currency} \${amount.toFixed(2)}\`;
}

function findUser(id: string): User | undefined {
  return users.find((u) => u.id === id);
  // the | undefined is honest: .find() can come up empty
}`,
        },
        {
          kind: "bullets",
          heading: "Why return types are worth the extra keystrokes",
          bullets: [
            "They catch a wrong return path immediately, at the function's own definition, not wherever it happens to get used.",
            "They document the contract for every caller without needing comments.",
            "For a public or shared function, an explicit return type is cheap insurance — TypeScript can infer it, but making it explicit means a future edit that accidentally changes the return shape gets flagged right there.",
          ],
        },
        {
          kind: "example",
          heading: "Async functions are typed by what they resolve to, not a promise you write yourself",
          body: "An async function's return type is automatically wrapped in Promise<...> — you annotate the resolved value, never Promise<T> directly on the function signature itself, since TypeScript adds that wrapper for you.",
          language: "typescript",
          code: `async function getUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json(); // TypeScript trusts this is a User — worth validating at runtime too
}

// Calling code awaits it to get the resolved User, not a Promise<User>
const user: User = await getUser("123");

// Writing Promise<Promise<User>> by hand would be a mistake here —
// an async function never returns a nested promise; it's flattened automatically`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A callback typed to return void can still return anything",
          body: "type Listener = () => void looks like it enforces \"don't return a value,\" but TypeScript actually allows any return value there — it just ignores it. This exists so array.forEach(item => items.push(item)) type-checks even though push returns a number: the void return type means \"the return value will be ignored,\" not \"nothing may be returned.\" It only becomes a real restriction if you explicitly assign a function expression to that type and then try to use its return value.",
        },
        {
          kind: "example",
          heading: "Typing a function passed as a callback",
          body: "Array methods like .map and .filter already know the shape of the callback they expect — you rarely need to annotate these parameters yourself, because TypeScript infers them from context.",
          language: "typescript",
          code: `const prices: number[] = [10, 20, 30];

// "p" is inferred as number — no annotation needed here
const withTax = prices.map((p) => p * 1.08);

// Only needed when defining a standalone function type
type Formatter = (price: number) => string;
const format: Formatter = (p) => \`$\${p.toFixed(2)}\`;`,
        },
        {
          kind: "example",
          heading: "Overloads: one function name, several distinct call signatures",
          body: "Sometimes a function's return type genuinely depends on which shape of arguments it's called with, in a way a single signature can't express. Overloads list each valid call shape above one real implementation.",
          language: "typescript",
          code: `function parseInput(value: string): string;
function parseInput(value: number): number;
function parseInput(value: string | number): string | number {
  return typeof value === "string" ? value.trim() : Math.round(value);
}

const a = parseInput("  hi  "); // typed as string
const b = parseInput(4.7);      // typed as number — not string | number
// Callers see only the specific overloads; the combined signature is
// just the implementation's own internal contract, never exposed`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Rest parameters and object parameters both type cleanly",
          body: "function sum(...nums: number[]): number types a variable-length argument list. For functions that take several optional settings, destructuring an object parameter — function search({ query, limit = 10 }: SearchOptions) — reads far better than five positional arguments and types just as easily.",
        },
        {
          kind: "example",
          heading: "Higher-order functions: typing a function that returns a function",
          body: "Once you're comfortable with (n: number) => number as a function type, composing them is direct — a function that builds and returns another function types the outer signature to whatever the inner one takes and returns, and each level gets checked independently.",
          language: "typescript",
          code: `function multiplyBy(factor: number): (n: number) => number {
  return (n) => n * factor;
}

const double = multiplyBy(2);
double(5); // 10 — TypeScript knows double is (n: number) => number

const triple = multiplyBy(3);
triple("5"); // Error — triple only accepts a number`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "this inside a regular function isn't typed by default",
          body: "A regular function declaration doesn't know what this will be until it's actually called — call it as a method and this is the object it was called on; call it detached from that object and this is undefined in strict mode. TypeScript can catch a wrong this usage if you annotate it explicitly as a fake first parameter, function greet(this: User) { ... }, which is removed at the call site and only used for checking. Arrow functions sidestep the whole question by capturing this from their enclosing scope at definition time instead, which is why they're the default choice for callbacks and class fields.",
        },
        {
          kind: "terminal",
          heading: "An inferred return type widening further than you meant it to",
          description: "Skipping the explicit return type here lets a second, unintended return path slip an undefined into the inferred type — the kind of bug an explicit return type would have caught immediately.",
          lines: [
            { text: "npx tsc lookup.ts --noEmit" },
            { text: "lookup.ts:9:3 - error TS2322: Type 'string | undefined' is not assignable to type 'string'.", output: true },
            { text: "", output: true },
            { text: "9   const label: string = describeStatus(order.status);", output: true },
            { text: "          ~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in lookup.ts:9" , output: true },
            { text: "# describeStatus had no explicit return type — a missing switch case silently returned undefined" },
          ],
        },
        {
          kind: "bullets",
          heading: "Common mistakes when typing functions",
          intro: "These show up constantly in real code review, not just in tutorials.",
          bullets: [
            "Skipping the explicit return type on a function with more than one return statement — inference can quietly produce a wider union than you intended, like string | undefined leaking out of a function you meant to always return a string.",
            "Reaching for a generic when a plain union or concrete type would do — save <T> for cases where the input and output types are genuinely linked, not just because it looks more advanced.",
            "Annotating a parameter that's already fully inferred from context, like the callback passed to .map — legal, just noisy, and one more thing to keep in sync if the array's type ever changes.",
            "Reaching for overloads where a single parameter typed as a union would cover the same cases with less code and one implementation to maintain instead of several.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Function overloads and default parameters solve different problems",
          body: "It's tempting to reach for overloads the moment a function behaves differently depending on what's passed in, but most of the time a default parameter or an optional field is the simpler fix. Overloads earn their keep specifically when the return type itself changes shape based on the input type — parseInput(string) returning string versus parseInput(number) returning number is a real case for it. If the return type stays the same no matter what's passed, a union parameter or a default value is almost always the better call, and it's one implementation instead of several to keep in sync.",
        },
      ],
    },
    {
      title: "Generics: Types That Take Parameters",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Generics: Types That Take Parameters",
          subheading:
            "Generics feel abstract until you see the problem they solve — writing one function that works with many types without giving up type safety.",
        },
        {
          kind: "example",
          heading: "The problem generics solve",
          body: "Without generics, you either write this with `any` (losing all type safety) or write a near-identical function for every type you need it for.",
          language: "typescript",
          code: `function firstElementBad(arr: any[]): any {
  return arr[0];
}

const num = firstElementBad([1, 2, 3]);
num.toUpperCase(); // no error — but this crashes at runtime!`,
        },
        {
          kind: "terminal",
          heading: "It compiles cleanly — then blows up at runtime",
          description: "This is exactly the gap type safety is supposed to close: tsc finds nothing wrong here, but running the compiled JavaScript crashes.",
          lines: [
            { text: "npx tsc bad.ts --noEmit" },
            { text: "(no output — 0 errors)", output: true },
            { text: "node bad.js" },
            { text: "TypeError: num.toUpperCase is not a function", output: true },
            { text: "    at Object.<anonymous> (bad.js:4:1)", output: true },
          ],
        },
        {
          kind: "example",
          heading: "The same function, generic",
          body: "T is a placeholder for \"whatever type gets passed in.\" TypeScript fills it in at the call site and keeps the connection between input and output type.",
          language: "typescript",
          code: `function firstElement<T>(arr: T[]): T {
  return arr[0];
}

const num = firstElement([1, 2, 3]);      // T is inferred as number
num.toUpperCase();                        // Error — correctly caught!

const name = firstElement(["Ada", "Grace"]); // T is inferred as string
name.toUpperCase();                          // fine — TypeScript knows it's a string`,
        },
        {
          kind: "example",
          heading: "Constraining a generic with extends",
          body: "T on its own could be anything, which means you can only do things every possible type supports. extends narrows that down — \"T can be any type, as long as it has at least this shape\" — unlocking safe access to specific fields.",
          language: "typescript",
          code: `function logLength<T extends { length: number }>(value: T): T {
  console.log(value.length); // safe — every T is guaranteed to have .length
  return value;
}

logLength("hello");        // fine — strings have .length
logLength([1, 2, 3]);      // fine — arrays have .length
logLength(42);             // Error — number has no .length property`,
        },
        {
          kind: "example",
          heading: "Multiple type parameters, and generics on a type itself",
          body: "Generics aren't limited to one parameter, or to functions — an interface or type alias can take its own type parameter too, the same way Array<T> and Promise<T> do.",
          language: "typescript",
          code: `function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}

const merged = merge({ name: "Ada" }, { age: 30 });
// typed as { name: string } & { age: number }

interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 42 };
const userBox: Box<User> = { value: { id: "1", name: "Ada", email: "a@x.com" } };`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A generic parameter can have its own default",
          body: "interface ApiResponse<T = unknown> lets you write ApiResponse without a type argument and get a safe fallback (T becomes unknown) instead of an error, while ApiResponse<User> still works exactly as before. It's most useful for generic types that are usually, but not always, given a specific argument.",
        },
        {
          kind: "terminal",
          heading: "This time tsc catches it before node ever runs",
          description: "Same mistake, generic version — the exact bug from the previous slide is now a compile error instead of a runtime crash.",
          lines: [
            { text: "npx tsc good.ts --noEmit" },
            { text: "good.ts:4:5 - error TS2339: Property 'toUpperCase' does not exist on type 'number'.", output: true },
            { text: "", output: true },
            { text: "4 num.toUpperCase();", output: true },
            { text: "      ~~~~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in good.ts:4", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Where you'll actually see generics",
          bullets: [
            "Built-in collections: Array<T>, Map<K, V>, Promise<T> — you've likely used these without naming them as generics.",
            "API response wrappers: type ApiResponse<T> = { data: T; error: string | null } — one type shape reused for every endpoint's specific data.",
            "Reusable utility functions, like the firstElement example — anything that operates the same way regardless of the type inside it.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "You'll read generics far more than you'll write them",
          body: "Most day-to-day TypeScript work is using generic types other code already defines — useState<User>(), Promise<Invoice>, Array<string> — rather than writing your own generic functions. Recognizing the pattern matters more early on than mastering every generic feature.",
        },
        {
          kind: "example",
          heading: "keyof plus a generic constraint gives you safe, dynamic property access",
          body: "Array indexing already narrows automatically to the right value type based on the array's element type. The same idea works for objects: constraining a generic key parameter to keyof T means the compiler knows exactly which value type comes back for whichever key you actually pass in, and rejects a key that doesn't exist on T at all, at compile time, before the property lookup ever runs.",
          language: "typescript",
          code: `function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Ada", age: 30 };
const age = getProp(user, "age");   // typed as number, not "any property"
getProp(user, "email");             // Error — "email" is not a key of typeof user`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A generic parameter used only once isn't doing its job",
          body: "The whole point of a generic is connecting two or more places in a signature — an input type to an output type, or one parameter to another. function wrap<T>(value: T): { value: T } genuinely needs T twice to describe that relationship. function logMessage<T>(message: T): void, where T shows up exactly once and is never constrained, isn't buying you anything a plain unknown or a concrete string wouldn't — it's a common sign of reaching for a generic out of habit rather than because two things actually need to stay linked.",
        },
        {
          kind: "example",
          heading: "Generic classes work the same way as generic functions",
          body: "A class can take its own type parameter too, most commonly for a container that needs to hold one specific type of thing consistently across every method — a typed cache, a queue, a simple in-memory store. The parameter is declared once on the class and every method that touches T stays in sync automatically.",
          language: "typescript",
          code: `class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  get size() { return this.items.length; }
}

const numbers = new Stack<number>();
numbers.push(5);
numbers.push("6"); // Error — this Stack<number> only accepts numbers`,
        },
        {
          kind: "terminal",
          heading: "A constraint violation, caught right at the call site",
          description: "The extends constraint on logLength from earlier isn't just documentation — it's enforced the moment you call the function with something that doesn't qualify.",
          lines: [
            { text: "npx tsc lengths.ts --noEmit" },
            { text: "lengths.ts:9:11 - error TS2345: Argument of type 'number' is not assignable to", output: true },
            { text: "  parameter of type '{ length: number }'.", output: true },
            { text: "", output: true },
            { text: "9   logLength(42);", output: true },
            { text: "              ~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in lengths.ts:9", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Variance: why a generic's type parameter isn't always freely substitutable",
          intro: "This is one of the more advanced corners of generics, but it explains errors that otherwise look inexplicable once a codebase leans on generics heavily.",
          bullets: [
            "Arrays are covariant in TypeScript — a Dog[] is assignable where an Animal[] is expected, on the theory that anything you'd read out of it is safely treated as an Animal. This is technically unsound (someone could push a Cat into what the caller believes is a Dog[]), but TypeScript allows it anyway because forbidding it would make everyday array code far more annoying to write.",
            "Function parameters behave more strictly, and in the opposite direction — a callback expecting a narrower type generally can't be substituted where a wider one is expected, because the function body might rely on members only the wider type guarantees.",
            "In practice this rarely needs a name to work with day to day — it mostly explains that occasional generic error where a type that \"should\" be assignable isn't, and the compiler's message about incompatible call signatures is really this concept surfacing without saying so directly.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Conditional types: a type-level if/else",
          body: "T extends U ? X : Y at the type level picks between two types depending on whether T is assignable to U — the type-system equivalent of a ternary. Most day-to-day TypeScript never needs to write one directly, but a huge share of the built-in utility types (Exclude, Extract, ReturnType, Awaited) are conditional types under the hood, and recognizing the shape helps when a library's type definition or an error message shows you one directly instead of a friendlier named alias.",
        },
        {
          kind: "bullets",
          heading: "A quick way to read an unfamiliar generic signature",
          intro: "Library type definitions can look intimidating at first — Array.prototype.reduce's real signature has three overloads and a generic parameter. A consistent approach cuts through most of it.",
          bullets: [
            "Find each generic parameter's declaration (<T>, <U>) before reading the parameter list — it tells you what's a placeholder versus a concrete, fixed type.",
            "Trace where each placeholder shows up across the parameters and the return type — that mapping is the entire point of the signature, and usually the whole story.",
            "Ignore extends constraints on a first pass; they narrow what's allowed to call it with, but the input-to-output relationship is usually clear without them.",
            "Hover the call site in your editor rather than the generic definition — most editors show the generic already resolved to the concrete types for that specific call, which reads far easier than the abstract version.",
            "If it still doesn't click, write a tiny throwaway call with a concrete type and read what your editor infers — seeing one resolved example is often faster than parsing the generic definition in your head.",
          ],
        },
      ],
    },
    {
      title: "Unions and Narrowing",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Unions and Narrowing",
          subheading:
            "\"Narrowing\" is how TypeScript figures out which member of a union you're actually dealing with at a given point in your code — and it's central to writing real TypeScript.",
        },
        {
          kind: "example",
          heading: "typeof narrows a union",
          body: "Inside each branch of the if, TypeScript already knows the specific type — you get full autocomplete for string methods in one branch, number methods in the other.",
          language: "typescript",
          code: `function formatId(id: string | number): string {
  if (typeof id === "string") {
    return id.toUpperCase(); // TypeScript knows id is a string here
  }
  return id.toFixed(0); // and knows it's a number here
}`,
        },
        {
          kind: "example",
          heading: "Discriminated unions: the pattern behind clean state modeling",
          body: "Giving each variant a shared, literal field (here, kind) lets TypeScript narrow the whole object based on a single check — this is one of the most useful patterns in everyday TypeScript.",
          language: "typescript",
          code: `type LoadState =
  | { kind: "loading" }
  | { kind: "success"; data: string[] }
  | { kind: "error"; message: string };

function render(state: LoadState) {
  switch (state.kind) {
    case "loading":
      return "Loading...";
    case "success":
      return state.data.join(", "); // .data only exists here — and TS knows it
    case "error":
      return state.message; // .message only exists here
  }
}`,
        },
        {
          kind: "diagram",
          heading: "Narrowing a discriminated union",
          description: "state.kind is checked once, and every branch below narrows to only the fields that variant actually has.",
          steps: [
            { label: "state: LoadState", detail: "Could be any of the three variants" },
            { label: "switch (state.kind)", detail: "TypeScript narrows based on this one check" },
            { label: "case \"loading\"", detail: "state has no other fields here" },
            { label: "case \"success\"", detail: "state.data is now known to exist" },
            { label: "case \"error\"", detail: "state.message is now known to exist" },
          ],
        },
        {
          kind: "example",
          heading: "Exhaustiveness checking: let the compiler catch a forgotten case",
          body: "Add a fourth LoadState variant six months from now, and this default case stops compiling — assigning state (now impossible to be one of the known variants, so its type is never) to a never-typed variable is only valid if every case was actually handled above.",
          language: "typescript",
          code: `function render(state: LoadState) {
  switch (state.kind) {
    case "loading":
      return "Loading...";
    case "success":
      return state.data.join(", ");
    case "error":
      return state.message;
    default:
      const _exhaustive: never = state; // errors if a case was missed
      throw new Error(\`Unhandled state: \${_exhaustive}\`);
  }
}`,
        },
        {
          kind: "example",
          heading: "Custom type guards: functions that narrow for you",
          body: "A function whose return type is value is SomeType (rather than plain boolean) teaches TypeScript that a true result narrows its argument — useful when the check is too complex for typeof or in alone.",
          language: "typescript",
          code: `interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(animal: Cat | Dog): animal is Cat {
  return typeof (animal as Cat).meow === "function";
}

function speak(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // narrowed to Cat here, based on the guard's result
  } else {
    animal.bark(); // narrowed to Dog by elimination
  }
}`,
        },
        {
          kind: "bullets",
          heading: "Other everyday narrowing tools",
          bullets: [
            "in — check whether a property exists: if (\"email\" in user).",
            "instanceof — check a class instance: if (error instanceof Error).",
            "Truthy checks narrow out null/undefined: if (user) { user.name /* safe here */ }.",
            "Array.isArray(value) narrows unknown or a union down to an array type.",
          ],
        },
        {
          kind: "example",
          heading: "Narrowing an optional, nullable field combines naturally with union narrowing",
          body: "A field typed as string | null | undefined narrows the same way any other union does — a truthy check, optional chaining, or the nullish coalescing operator each rule out null and undefined in a way TypeScript tracks through the rest of the branch.",
          language: "typescript",
          code: `interface Profile { bio?: string | null }

function summarize(profile: Profile): string {
  if (profile.bio) {
    return profile.bio.slice(0, 100); // narrowed: string here, null/undefined ruled out
  }
  return profile.bio?.slice(0, 100) ?? "No bio yet";
}`,
        },
        {
          kind: "example",
          heading: "Assertion functions: a narrowing sibling to type guards",
          body: "A type guard (value is SomeType) narrows only inside an if. An assertion function narrows for the rest of the enclosing block once it's called, without needing to wrap the following code in a branch — useful for validating input at the top of a function and then writing the rest of it as if the check already happened.",
          language: "typescript",
          code: `function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Expected a string");
  }
}

function shout(value: unknown) {
  assertIsString(value);
  return value.toUpperCase(); // narrowed to string for the rest of this function
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Narrowing on an object's property is more fragile than narrowing a local variable",
          body: "TypeScript narrows based on control flow it can directly see — an if check on a value, followed immediately by code in that same branch. Narrowing a local variable (const status = getStatus(); if (status === \"active\") { ... }) is rock solid. Narrowing a property reached through an object (if (user.status === \"active\") { ... }) is more fragile — call another function in between the check and the use, and TypeScript can't prove that function didn't mutate user.status, so it may widen the type back out. Destructuring the field into its own local variable first sidesteps the issue entirely.",
        },
        {
          kind: "terminal",
          heading: "What a forgotten case in a discriminated union actually looks like",
          description: "Add a fourth LoadState variant and forget to update the switch, and the exhaustiveness check from two slides ago turns that gap into a compile error instead of a silent runtime gap.",
          lines: [
            { text: "npx tsc render.ts --noEmit" },
            { text: "render.ts:9:11 - error TS2322: Type '{ kind: \"stale\"; data: string[] }' is not", output: true },
            { text: "  assignable to type 'never'.", output: true },
            { text: "", output: true },
            { text: "9     const _exhaustive: never = state;", output: true },
            { text: "            ~~~~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in render.ts:9" , output: true },
            { text: "# Translation: a new \"stale\" variant exists but no case handles it yet" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Narrowing is why unions are usually better than a single loose type",
          body: "A common instinct when a value could take a few different shapes is to type it as one broad, permissive type — everything optional, or a plain Record<string, unknown> — and check what's actually there with ad hoc conditionals as needed. A union of specific variants, paired with narrowing, is almost always the better trade: instead of remembering yourself which fields are safe to read in which situation, the compiler tracks that for you at every single call site, and it's impossible to forget a check the type system already knows is required. The extra minute spent defining the variants up front routinely saves far more time later, the first time someone new touches that code without the full mental model in their head.",
        },
        {
          kind: "bullets",
          heading: "Narrowing across control flow structures beyond if/else",
          intro: "Narrowing isn't limited to a simple if — TypeScript tracks it through most of the control flow constructs you'd expect it to.",
          bullets: [
            "A guard clause that returns or throws narrows for the rest of the function, not just inside a block: if (typeof id !== \"string\") return; leaves id narrowed to string for every line after it, with no surrounding braces needed.",
            "&& and || narrow too — user && user.isActive only evaluates the right side once user is already known to be truthy, and TypeScript reflects that in the type it infers for the whole expression.",
            "A while loop's condition narrows its body exactly like an if's does: while (node !== null) { node.value } is safe inside the loop, because TypeScript knows the loop wouldn't be running otherwise.",
            "Reassigning a variable to a new value re-triggers narrowing based on that new value — narrowing tracks the current, most specific state of a variable through your code, not a single fact frozen at declaration time.",
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Types are erased at runtime — they exist purely to catch mistakes before code ships.",
            "Let inference work for you; annotate mainly at function boundaries.",
            "interface and type both describe object shapes — pick one house style and move on.",
            "Generics let one function or type work correctly across many types, without any.",
            "Narrowing (typeof, in, discriminated unions) is how you safely work with values that could be more than one type.",
          ],
        },
      ],
    },
    {
      title: "Utility Types: Reshaping Types You Already Have",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Utility Types: Reshaping Types You Already Have",
          subheading:
            "Once you've defined a type once, TypeScript gives you tools to derive new shapes from it — instead of hand-writing a slightly different copy every time you need one.",
        },
        {
          kind: "example",
          heading: "Partial and Required",
          body: "Partial<T> makes every field optional — ideal for an \"update\" function where a caller only sends the fields that changed. Required<T> does the reverse.",
          language: "typescript",
          code: `interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

function updateUser(id: string, changes: Partial<User>) {
  // changes might be just { name: "New Name" } — every field is optional here
}

type CompleteUser = Required<User>;
// { id: string; name: string; email: string; age: number } — age is no longer optional`,
        },
        {
          kind: "example",
          heading: "Pick and Omit",
          body: "Pick<T, Keys> keeps only the fields you name; Omit<T, Keys> keeps everything except the fields you name. Both derive a new type from User without retyping it.",
          language: "typescript",
          code: `type UserPreview = Pick<User, "id" | "name">;
// { id: string; name: string }

type NewUserInput = Omit<User, "id">;
// { name: string; email: string; age?: number }
// id is assigned by the server, so callers creating a user shouldn't supply it`,
        },
        {
          kind: "example",
          heading: "Record types a lookup table",
          body: "Record<Keys, ValueType> is the standard way to type an object used as a dictionary — every key in the union must be present, with a value of the given type.",
          language: "typescript",
          code: `type RolePermissions = Record<"admin" | "editor" | "viewer", string[]>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete"],
  editor: ["read", "write"],
  viewer: ["read"],
  // missing a key, or adding one not in the union, is a compile error
};`,
        },
        {
          kind: "example",
          heading: "Exclude and Extract work on unions, not object fields",
          body: "Pick and Omit select which keys of an object survive. Exclude and Extract do the equivalent job for a union of values instead — pulling members out of, or filtering members into, a set of alternatives.",
          language: "typescript",
          code: `type Status = "pending" | "active" | "cancelled" | "archived";

type ActiveOnly = Exclude<Status, "cancelled" | "archived">;
// "pending" | "active" — those two members removed from the union

type FinishedOnly = Extract<Status, "cancelled" | "archived">;
// "cancelled" | "archived" — only the members that match are kept

// A common real use: pulling one case out of a discriminated union
type SuccessState = Extract<LoadState, { kind: "success" }>;
// { kind: "success"; data: string[] }`,
        },
        {
          kind: "example",
          heading: "Parameters<T> mirrors ReturnType<T> for the argument list",
          body: "Just as ReturnType<typeof fn> derives a function's output type, Parameters<typeof fn> derives its argument list as a tuple — useful for wrapping a function without retyping its signature by hand.",
          language: "typescript",
          code: `function createUser(name: string, age: number): User {
  return { id: crypto.randomUUID(), name, age } as User;
}

type CreateUserArgs = Parameters<typeof createUser>;
// [name: string, age: number]

function logAndCreate(...args: CreateUserArgs): User {
  console.log("Creating user with:", args);
  return createUser(...args); // args is guaranteed to match createUser's signature
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "satisfies checks a value against a type without widening it",
          body: "const config: Record<string, number> = { a: 1 } gives config the broad Record type — you lose the fact that it specifically has key a. const config = { a: 1 } satisfies Record<string, number> checks the same constraint, but config keeps its precise inferred type ({ a: number }), so config.a still autocompletes correctly afterward. Prefer satisfies over an explicit annotation whenever you want validation without losing the specific shape.",
        },
        {
          kind: "example",
          heading: "NonNullable strips null and undefined out of a union",
          body: "Some values are typed as possibly null or undefined earlier in a pipeline. After a validation step confirms a value is actually present, NonNullable<T> gives you a type reflecting what the value now actually is, instead of leaving null and undefined listed as possibilities everywhere downstream that no longer applies.",
          language: "typescript",
          code: `type MaybeUser = User | null | undefined;
type ConfirmedUser = NonNullable<MaybeUser>;
// User — null and undefined removed from the union

function requireUser(user: MaybeUser): ConfirmedUser {
  if (!user) throw new Error("Expected a user");
  return user; // narrowed to User here, which matches ConfirmedUser
}`,
        },
        {
          kind: "example",
          heading: "ReturnType<typeof fn> derives a type from a function you already wrote",
          body: "Retyping a function's return shape by hand is exactly the kind of thing that drifts out of sync the first time someone edits the function and forgets the duplicate definition. ReturnType<typeof fn> reads the shape straight off the function itself, so the two can never disagree.",
          language: "typescript",
          code: `function createInvoice(customerId: string, total: number) {
  return { id: crypto.randomUUID(), customerId, total, createdAt: new Date() };
}

type Invoice = ReturnType<typeof createInvoice>;
// { id: string; customerId: string; total: number; createdAt: Date }

type CreateInvoiceArgs = Parameters<typeof createInvoice>;
// [customerId: string, total: number] — the two derived types stay in lockstep`,
        },
        {
          kind: "example",
          heading: "Awaited<T> unwraps a Promise, including a nested one",
          body: "Awaited<T> mirrors what the await keyword does at the type level — it's what lets you combine it with ReturnType to get exactly what calling and awaiting an async function actually resolves to, in one expression.",
          language: "typescript",
          code: `async function getUser(id: string): Promise<User> { /* ... */ return {} as User; }

type Result = Awaited<ReturnType<typeof getUser>>;
// User — both the Promise wrapper and the function wrapper unwrapped`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Utility types reshape a compile-time type — they do nothing at runtime",
          body: "Omit<User, \"password\"> guarantees the compiler won't let code treat a value typed that way as having a password field. It does not remove a password field from an actual object at runtime — if you build the value by spreading a real User that has one, the password is still sitting right there in memory and in JSON.stringify output. Actually stripping a field requires a real runtime operation, like destructuring it out; the type only controls what the compiler will let you access, not what data is physically present.",
        },
        {
          kind: "terminal",
          heading: "Picking a field that doesn't exist",
          description: "Pick and Omit still check their key arguments against the real type — a typo in the key list is caught immediately, not discovered later when a field turns up missing.",
          lines: [
            { text: "npx tsc preview.ts --noEmit" },
            { text: "preview.ts:3:25 - error TS2344: Type '\"prise\"' does not satisfy the constraint", output: true },
            { text: "  'keyof User'.", output: true },
            { text: "", output: true },
            { text: "3 type UserPreview = Pick<User, \"id\" | \"prise\">;", output: true },
            { text: "                          ~~~~~~~~~~~~~~~", output: true },
            { text: "", output: true },
            { text: "Found 1 error in preview.ts:3" , output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "A few more worth recognizing",
          bullets: [
            "Readonly<T> — every field becomes read-only; assigning to it after creation is a compile error.",
            "ReturnType<typeof someFunction> — pulls out a function's return type without retyping it, so it can't drift out of sync if the function changes.",
            "These compose freely: Partial<Pick<User, \"name\" | \"email\">> is a fully valid type — \"an object with just name and email, both optional.\"",
            "When a derived type built from several nested utility types gets hard to read, that's often a signal the source interface is doing too much — sometimes the fix is splitting the original type rather than adding a sixth layer of Pick and Omit around it.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "You rarely need to memorize the full list",
          body: "There are a couple dozen built-in utility types, but Partial, Pick, Omit, and Record cover the large majority of real usage. When you catch yourself about to hand-write a slightly modified copy of an existing type, that's usually the moment to reach for one of these instead — it keeps both types tied together, so an edit to the original doesn't quietly fall out of sync.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "You can write your own utility type once the built-ins run out",
          body: "The built-in utility types are just type aliases with a generic parameter — nothing magic about them. When a shape keeps showing up across a codebase and no built-in quite matches, defining your own (type Nullable<T> = T | null, or a small mapped type) is completely normal, and it's often the cleanest way to name a pattern your team reaches for constantly, the same way Partial and Pick name patterns the TypeScript team decided were common enough to ship.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Partial<T> and Required<T> flip every field between optional and required at once.",
            "Pick<T, Keys> narrows to specific fields; Omit<T, Keys> excludes specific fields — both avoid retyping a near-duplicate.",
            "Record<Keys, ValueType> types a dictionary object, and enforces that every key in the union is actually present.",
            "Readonly<T>, Extract<T, U>, NonNullable<T>, and Awaited<T> extend the same pattern to immutability, union filtering, and promise unwrapping.",
            "Utility types compose — deriving a type from another is almost always better than maintaining two independent, near-identical ones.",
          ],
        },
      ],
    },
    {
      title: "Practice: Deriving Types with Utility Types",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Deriving Types with Utility Types",
          subheading:
            "Six exercises using Partial, Omit, Pick, Record, Readonly, Extract, and Required to derive new types from a couple of base shapes, instead of hand-writing near-duplicates every time a new view of the data shows up.",
        },
        {
          kind: "diagram",
          heading: "The mental model behind every exercise here",
          description: "Every one of these exercises follows the same shape: start from one type you've already defined honestly, then derive whatever narrower or wider view you actually need for a specific job.",
          steps: [
            { label: "1. A base type", detail: "The full, honest shape of the data — Product, AppEvent, ProductDraft" },
            { label: "2. A utility type", detail: "Pick, Omit, Partial, Required, Readonly, Record, or Extract applied to it" },
            { label: "3. A derived type", detail: "Exactly the shape one function or one view actually needs — nothing hand-duplicated" },
            { label: "4. One source of truth", detail: "Edit the base type, and every derived type that depends on it updates or breaks loudly" },
          ],
        },
        {
          kind: "bullets",
          heading: "Before you start",
          intro: "A few habits that make these exercises — and real utility-type usage — go faster.",
          bullets: [
            "Read the base interface first and decide, in plain English, what the derived type should actually contain before reaching for a specific utility type — the English description usually maps directly onto Pick, Omit, Partial, or some combination.",
            "When a shape needs two operations (some fields removed, the rest made optional), nest the utility types rather than inventing a new named type for the intermediate step — Partial<Omit<T, \"id\">> is the whole answer, not two separate types.",
            "If you can't express the shape with a single nested utility type, that's a real signal too — sometimes the honest fix is a hand-written type or an intersection (&) instead of forcing a utility type where it doesn't fit.",
          ],
        },
        {
          kind: "practice",
          heading: "A Type-Safe updateProduct Function",
          prompt:
            "Given this Product interface and an existing products lookup, write an updateProduct function that accepts a product's id and a changes object containing any subset of the other Product fields (never id itself), and returns the merged result.\n\ninterface Product {\n  id: string;\n  name: string;\n  price: number;\n  inStock: boolean;\n}\n\ndeclare const products: Record<string, Product>;",
          hint: "You need every Product field optional except id shouldn't be a valid key on changes at all — Partial<Omit<Product, \"id\">> expresses exactly that.",
          solution: `function updateProduct(id: string, changes: Partial<Omit<Product, "id">>): Product {
  const existing = products[id];
  return { ...existing, ...changes }; // existing first, changes overwrite just the given fields
}

updateProduct("p1", { price: 19.99 }); // fine — only price changes
updateProduct("p1", { id: "p2" });     // Error — "id" isn't a valid key on the changes type`,
        },
        {
          kind: "practice",
          heading: "A Narrowed Type for a Product Card",
          prompt:
            "Using the same Product interface, define a type ProductCard containing only the fields a product list card needs to display: name, price, and inStock. Then write a function toCard(product: Product): ProductCard that builds one from a full Product.",
          hint: "Pick<Product, \"name\" | \"price\" | \"inStock\"> gives you exactly those three fields without retyping them by hand.",
          solution: `type ProductCard = Pick<Product, "name" | "price" | "inStock">;

function toCard(product: Product): ProductCard {
  const { name, price, inStock } = product; // pull out just what the card needs
  return { name, price, inStock };
}`,
        },
        {
          kind: "practice",
          heading: "A Complete Lookup Table for Order Status",
          prompt:
            "There are three possible order statuses: \"pending\", \"shipped\", \"delivered\". Define a type StatusLabels mapping each status to a human-readable string, then a statusLabels object satisfying it. TypeScript should error if a status is missing or misspelled.",
          hint: "Record<\"pending\" | \"shipped\" | \"delivered\", string> forces the object to have exactly those three keys — no more, no fewer.",
          solution: `type OrderStatus = "pending" | "shipped" | "delivered";
type StatusLabels = Record<OrderStatus, string>;

const statusLabels: StatusLabels = {
  pending: "Order received",
  shipped: "On its way",
  delivered: "Delivered",
  // Error if any key here is missing, or if an extra key like "canceled" is added
};`,
        },
        {
          kind: "practice",
          heading: "A Safe, Read-Only Snapshot for Client Rendering",
          prompt:
            "Product objects get passed into a rendering function that should only ever read from them — never mutate the object it was given. Define a type ProductSnapshot that is a read-only version of the full Product interface (every field still present, none removed, but none of them assignable), then write a function renderProduct(product: ProductSnapshot): string that returns a formatted string like \"Widget — $19.99\".",
          hint: "Readonly<T> wraps every field of an existing type as readonly, without changing which fields exist at all — layer it directly over Product rather than retyping the fields.",
          solution: `type ProductSnapshot = Readonly<Product>;

function renderProduct(product: ProductSnapshot): string {
  return \`\${product.name} — $\${product.price.toFixed(2)}\`;
}

function badRender(product: ProductSnapshot) {
  product.price = 0; // Error — price is readonly on ProductSnapshot
}`,
        },
        {
          kind: "practice",
          heading: "Extracting One Variant From a Union of App Events",
          prompt:
            "Given this discriminated union of application events, define a type PurchaseEvent representing only the purchase variant, and write a function logPurchase(event: PurchaseEvent): string that reads its amount field.\n\ntype AppEvent =\n  | { kind: \"login\"; userId: string }\n  | { kind: \"logout\"; userId: string }\n  | { kind: \"purchase\"; userId: string; amount: number };",
          hint: "Extract<T, U> pulls out exactly the union members that match the shape U — Extract<AppEvent, { kind: \"purchase\" }> keeps only the variant with that literal kind.",
          solution: `type PurchaseEvent = Extract<AppEvent, { kind: "purchase" }>;
// { kind: "purchase"; userId: string; amount: number }

function logPurchase(event: PurchaseEvent): string {
  return \`User \${event.userId} spent $\${event.amount.toFixed(2)}\`;
}

function handleEvent(event: AppEvent) {
  if (event.kind === "purchase") {
    logPurchase(event); // already narrowed to PurchaseEvent here — matches what Extract derived
  }
}`,
        },
        {
          kind: "practice",
          heading: "A Draft-to-Submission Conversion With Required",
          prompt:
            "A product draft form lets fields get filled in over time, so every field on ProductDraft is optional except id, which is assigned once when the draft is first created:\n\ninterface ProductDraft {\n  id: string;\n  name?: string;\n  price?: number;\n  inStock?: boolean;\n}\n\nWrite a function submitDraft(draft: ProductDraft): Product that throws a runtime error listing what's missing if any field besides id hasn't been filled in yet, and otherwise returns a value TypeScript accepts as a complete Product.",
          hint: "Required<Omit<ProductDraft, \"id\">> & Pick<ProductDraft, \"id\"> describes a fully filled-in draft — check for missing fields at runtime first, then build a value that actually satisfies that stricter type.",
          solution: `type CompleteDraft = Required<Omit<ProductDraft, "id">> & Pick<ProductDraft, "id">;

function submitDraft(draft: ProductDraft): Product {
  const { name, price, inStock } = draft;
  if (name === undefined || price === undefined || inStock === undefined) {
    throw new Error("Draft is missing required fields before it can be submitted");
  }
  const complete: CompleteDraft = { id: draft.id, name, price, inStock };
  return complete; // satisfies Product — every field is now present and correctly typed
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "If you found yourself hand-writing a type here, look again",
          body: "Every one of these six exercises has a version that works by defining a brand-new interface from scratch and just retyping the fields you want — and every one of those versions is a maintenance liability the moment the base type changes. If your first instinct on a real project is to write out a fresh type rather than derive it from something that already exists, that's worth noticing as a habit to break, not just a stylistic preference. The check is simple: before defining a new type, ask whether it's actually a subset, a superset, or a transformation of a type you already have. Almost always, one of Partial, Required, Pick, Omit, Record, Readonly, or Extract already describes exactly that relationship — and reaching for it means the two types genuinely can't drift apart, because one is generated from the other by the compiler itself, not just by convention or good intentions from whoever wrote it first.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Partial<Omit<T, \"id\">> is the standard shape for an update input — everything optional except the identifier, which shouldn't be editable at all.",
            "Pick<T, Keys> narrows a large interface down to exactly what one specific view needs, without duplicating field definitions that can drift out of sync.",
            "Record<Keys, ValueType> forces an object to cover every key in a union exactly once — a missing or misspelled key is a compile error, not a runtime surprise.",
            "Readonly<T> and Extract<T, U> extend the same idea to immutability and to narrowing a union down to one variant, without hand-writing either shape.",
            "Required<Omit<T, \"id\">> & Pick<T, \"id\"> is the standard shape for \"every field must now be filled in, except the identifier, which was already fixed at creation.\"",
            "All of these compose with each other and with plain object types — deriving a type is almost always better than hand-writing a near-duplicate that can silently drift out of sync with the original.",
          ],
        },
      ],
    },
    {
      title: "Knowledge Check",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Knowledge Check",
          subheading:
            "Five questions across the whole course — from any vs. unknown through generics, narrowing, and the utility types you just covered.",
        },
        {
          kind: "quiz",
          heading: "any vs. unknown",
          question: "Why is unknown usually a safer choice than any for a value of uncertain type?",
          options: [
            "unknown forces you to narrow the type (e.g. with typeof) before you can use it, while any turns off checking entirely",
            "unknown lets you call any method on the value, but any does not",
            "unknown is faster at runtime than any",
            "unknown and any are the same behavior under two names, chosen by style preference",
          ],
          correctIndex: 0,
          explanation:
            "any disables type checking for that value completely — code that's actually wrong can compile fine. unknown says \"this could be anything\" but requires you to check what it actually is (typeof, instanceof, etc.) before TypeScript will let you use it as anything specific.",
        },
        {
          kind: "quiz",
          heading: "interface vs. type",
          question: "Which of the following can interface NOT directly express, unlike type?",
          options: ["Extending another object shape", "An optional field", "A union of several distinct shapes (A | B)", "A method signature"],
          correctIndex: 2,
          explanation:
            "interface describes the shape of a single object (and can extend another interface), but it can't express a union of alternatives. type Status = \"pending\" | \"active\" | \"cancelled\" has no interface equivalent — that's the main case where type is the only option.",
        },
        {
          kind: "quiz",
          heading: "Generic Inference",
          question:
            "Given function first<T>(arr: T[]): T { return arr[0]; }, what is the inferred return type of first([\"a\", \"b\"])?",
          options: ["T (the generic placeholder itself)", "any", "string[]", "string"],
          correctIndex: 3,
          explanation:
            "TypeScript infers T from the argument — [\"a\", \"b\"] is a string[], so T becomes string for this call. The function's declared return type is T, but with T resolved to string, so the actual inferred type you get back is string, not the placeholder or the array type.",
        },
        {
          kind: "quiz",
          heading: "Discriminated Union Narrowing",
          question:
            "Given this LoadState type and function, why does state.data.length compile without error inside the if block?\n\ntype LoadState =\n  | { kind: \"loading\" }\n  | { kind: \"success\"; data: string[] }\n  | { kind: \"error\"; message: string };\n\nfunction describe(state: LoadState) {\n  if (state.kind === \"success\") {\n    return state.data.length;\n  }\n  return 0;\n}",
          options: [
            "TypeScript allows accessing any property on any object type by default",
            "The if check narrowed state to the branch of the union where kind is \"success\", the only branch with a data field",
            "data is optional on all three branches, so TypeScript allows accessing it anywhere",
            "TypeScript skips property checks entirely inside if statements",
          ],
          correctIndex: 1,
          explanation:
            "Checking state.kind === \"success\" narrows state's type inside that block to just the { kind: \"success\"; data: string[] } branch — the only one of the three with a data field — so TypeScript knows .data.length is safe there.",
        },
        {
          kind: "quiz",
          heading: "Reading a Utility Type",
          question: "What does Partial<Omit<Product, \"id\">> describe?",
          options: [
            "An object with every Product field required except id, which is removed entirely",
            "An object with every Product field optional, except id, which is removed entirely",
            "An object with every Product field optional, including id",
            "An object identical to Product, but read-only",
          ],
          correctIndex: 1,
          explanation:
            "Omit<Product, \"id\"> first produces Product without the id field at all. Partial<...> then makes every remaining field (name, price, inStock) optional. id isn't optional on this type — it's simply not a valid key on it.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Types are erased at compile time — they exist purely to catch mistakes before code runs, never to change runtime behavior.",
            "Prefer unknown over any when a value's type isn't known yet; it forces a check before you can use it as anything specific.",
            "interface and type both describe object shapes; only type can express unions, tuples, and other non-object shapes directly.",
            "Generics let one function or type work correctly across many types without any; discriminated unions plus narrowing are how you safely branch on which variant of a union you actually have.",
            "Utility types — Partial, Pick, Omit, Record, and others — derive new types from ones you've already defined instead of hand-duplicating them.",
          ],
        },
      ],
    },
  ],
};
