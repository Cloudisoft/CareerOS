import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "javascript-fundamentals",
  title: "JavaScript Fundamentals",
  description:
    "The core language underneath every framework — variables, functions, arrays, objects, and how JavaScript actually handles asynchronous work.",
  category: "Programming",
  level: "BEGINNER",
  order: 10,
  lessons: [
    {
      title: "Variables, Values, and Types",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Variables, Values, and Types",
          subheading:
            "Every framework, every library, every bug you'll ever debug in JavaScript sits on top of these basics. Worth getting exactly right.",
        },
        {
          kind: "bullets",
          heading: "Three ways to declare a variable",
          intro: "Only two of them belong in code you write today.",
          bullets: [
            "let — for a variable whose value will change. Block-scoped, meaning it only exists inside the { } it was declared in.",
            "const — for a variable whose binding won't be reassigned. Also block-scoped. Use this by default; reach for let only when you know you'll reassign.",
            "var — the original, function-scoped declaration from before 2015. It ignores block boundaries in ways that cause real bugs. Avoid it in new code; you'll mainly recognize it reading older codebases.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "let and const exist before their line runs, but you can't touch them yet",
          body: "Every let/const in a scope is registered the moment that scope starts — this is why they don't leak like var does. But between the start of the scope and the actual declaration line, referencing the variable throws a ReferenceError instead of quietly returning undefined. That gap is called the \"temporal dead zone,\" and in practice it's a feature, not a bug: it catches the case where you'd otherwise use a variable before it was meant to be set.",
        },
        {
          kind: "example",
          heading: "const doesn't mean \"unchangeable\" — it means \"can't be reassigned\"",
          body: "const locks the binding, not the contents. An array or object declared with const can still have its contents changed — you just can't point the variable at a different value entirely.",
          language: "javascript",
          code: `const total = 10;
total = 12; // TypeError: Assignment to constant variable.

const cart = ["shirt"];
cart.push("shoes"); // fine — the array itself is mutated
cart = ["hat"];      // TypeError — this reassigns the binding`,
        },
        {
          kind: "terminal",
          heading: "Try it in the Node REPL",
          description: "Running the exact example above shows the error, and the mutation, exactly as described.",
          lines: [
            { text: "node" },
            { text: "> const total = 10;", output: true },
            { text: "undefined", output: true },
            { text: "> total = 12;", output: true },
            { text: "Uncaught TypeError: Assignment to constant variable.", output: true },
            { text: "> const cart = [\"shirt\"];", output: true },
            { text: "undefined", output: true },
            { text: "> cart.push(\"shoes\");", output: true },
            { text: "2", output: true },
            { text: "> cart", output: true },
            { text: "[ 'shirt', 'shoes' ]", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "The types you'll use every day",
          bullets: [
            "string — text, in quotes or backticks: \"hello\", 'hello', `hello`.",
            "number — both integers and decimals share one type: 4, -12, 3.14.",
            "boolean — true or false.",
            "undefined — a variable that's been declared but not given a value yet.",
            "null — an intentional \"no value,\" set explicitly by your code.",
            "object — everything structured: plain objects, arrays, functions, dates.",
            "bigint — for integers too large for number to represent safely, written with an n suffix: 9007199254740993n. You'll rarely need it outside cryptography or precise large-number math.",
          ],
        },
        {
          kind: "example",
          heading: "Template literals: strings that build themselves",
          body: "Backtick strings do two things regular quotes can't: interpolate values directly with ${...}, and span multiple lines without \\n. Both matter constantly once you're building real output — error messages, HTML fragments, log lines.",
          language: "javascript",
          code: `const name = "Ada";
const score = 97;

// Old way — clunky string concatenation
const line1 = "Result for " + name + ": " + score + "%";

// Template literal — same result, reads naturally
const line2 = \`Result for \${name}: \${score}%\`;

// Expressions work too, not just variables
const status = \`\${score >= 90 ? "Pass" : "Fail"} (\${score}%)\`;

// And they span multiple lines as written, no \\n needed
const block = \`Name: \${name}
Score: \${score}\`;`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "typeof null is \"object\"",
          body: "This is a decades-old bug baked permanently into the language — typeof null returns \"object\", not \"null\". If you need to check for null specifically, compare directly: value === null. Don't rely on typeof for it.",
        },
        {
          kind: "example",
          heading: "== silently converts types; === doesn't",
          body: "== (\"loose equality\") coerces both sides to a common type before comparing, which produces results most developers find surprising. === (\"strict equality\") never converts — it's false the instant the types differ. Default to === everywhere; reach for == only if you deliberately want the coercion.",
          language: "javascript",
          code: `0 == "0"        // true  — string coerced to number
0 == ""         // true  — empty string coerced to 0
0 == false      // true  — boolean coerced to number
null == undefined // true — a special case, just between these two
null === undefined // false — different types, no coercion

"5" + 3   // "53" — + with a string triggers concatenation
"5" - 3   // 2    — but - forces numeric coercion, no concatenation exists

0 === "0"        // false — different types, no coercion
1 === 1.0        // true  — numbers, no int/float distinction in JS`,
        },
        {
          kind: "example",
          heading: "Primitives are copied by value; objects and arrays by reference",
          body: "Assigning a string, number, or boolean to a new variable copies the value itself — the two variables are completely independent from that point on. Assigning an object or array copies only a reference to it, so both variables end up pointing at the same underlying data, and changing one is visible through the other. This one distinction explains a large share of \"why did my other variable change\" bugs.",
          language: "javascript",
          code: `let a = 5;
let b = a;
b = 10;
console.log(a); // 5 — untouched, b was an independent copy

const obj1 = { count: 5 };
const obj2 = obj1; // obj2 points at the SAME object, not a copy
obj2.count = 10;
console.log(obj1.count); // 10 — obj1 "changed" too, same underlying data

// Function arguments follow the same rule:
function reset(config) {
  config.value = 0; // mutates the caller's object
}
const settings = { value: 99 };
reset(settings);
console.log(settings.value); // 0`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "0.1 + 0.2 !== 0.3 — floating-point math isn't exact",
          body: "JavaScript stores every number as a 64-bit floating-point value (the IEEE 754 standard), and that format can't represent most decimal fractions exactly — the same way 1/3 can't be written exactly in decimal. So 0.1 + 0.2 actually evaluates to 0.30000000000000004, and comparing it to 0.3 with === is false. This isn't a JavaScript quirk; every mainstream language using IEEE 754 floats has the same behavior. In practice: never compare floating-point results with === for equality — check that the difference is smaller than a tiny tolerance instead (Math.abs(a - b) < Number.EPSILON), round for display with toFixed(2), and for money specifically, work in integer cents rather than fractional dollars so rounding errors can't creep in at all.",
        },
        {
          kind: "bullets",
          heading: "Checking a value's type reliably",
          intro: "typeof gets you most of the way, but it has a few well-known blind spots worth memorizing:",
          bullets: [
            "typeof works cleanly for primitives: typeof \"hi\" is \"string\", typeof 4 is \"number\", typeof true is \"boolean\", typeof undefined is \"undefined\".",
            "typeof null is \"object\" — a decades-old bug now permanent in the spec. Check value === null directly instead of relying on typeof for it.",
            "typeof [] is also \"object\" — arrays don't get their own typeof result. Use Array.isArray(value) to actually detect an array.",
            "typeof someFunction is \"function\" — the one case where typeof distinguishes something more specific than a plain \"object\".",
            "For your own classes, instanceof checks the prototype chain: acct instanceof Account is true if Account.prototype appears anywhere in acct's chain.",
          ],
        },
      ],
    },
    {
      title: "Functions and Arrow Functions",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Functions and Arrow Functions",
          subheading:
            "A function is just a named, reusable block of behavior — but JavaScript gives you three different-looking ways to write one, and they're not fully interchangeable.",
        },
        {
          kind: "example",
          heading: "Three ways to write the same function",
          body: "All three of these do the same thing when called as add(2, 3). The differences show up in edge cases, not in this basic form.",
          language: "javascript",
          code: `// Function declaration — hoisted, can be called before its definition
function add(a, b) {
  return a + b;
}

// Function expression — a function stored in a variable
const add2 = function (a, b) {
  return a + b;
};

// Arrow function — shorter syntax, no separate "this"
const add3 = (a, b) => a + b;`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Only one of these three can be called before its definition",
          body: "function declarations are fully hoisted — the whole function, not just the name, is available anywhere in its scope, even above where it's written. Function expressions and arrow functions are not: the variable holding them follows normal let/const or var rules, so calling add2() or add3() before that line throws or gives undefined, not the function itself.",
        },
        {
          kind: "bullets",
          heading: "Arrow function shortcuts worth knowing",
          bullets: [
            "One expression, no braces: (a, b) => a + b — the result is returned automatically.",
            "One parameter, no parens needed: n => n * 2 (though many teams keep the parens for consistency).",
            "Returning an object literal needs extra parens: n => ({ value: n }) — otherwise { looks like a function body, not an object.",
            "Zero parameters still need empty parens: () => Math.random().",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A line break after return can silently return undefined",
          body: "JavaScript automatically inserts a semicolon after return if a newline immediately follows it — so `return\\n{ value: 1 };` actually means `return;` followed by an unreachable object literal, and the function returns undefined instead of the object. This bites regular functions and multi-line arrow bodies alike. The fix is to open the brace or parenthesis on the same line as return, or wrap a multi-line expression in parens: return (\\n  { value: 1 }\\n);",
        },
        {
          kind: "example",
          heading: "IIFEs: a function that runs itself, once, immediately",
          body: "Before block scope existed (before let/const), wrapping code in an Immediately Invoked Function Expression was the standard way to create a private scope. It's rarer now that { } does the same job for let/const, but you'll still see it in older code and in some module/bundler output.",
          language: "javascript",
          code: `(function () {
  const secret = "only exists in here";
  console.log("ran immediately, no separate call needed");
})();

// Arrow function version, equally valid:
(() => {
  console.log("also runs immediately");
})();

// Modern equivalent for "give me a private scope" is usually just:
{
  const secret = "block-scoped, no IIFE needed";
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Default parameters replace a common old pattern",
          body: "Before default parameters existed, people wrote `function greet(name) { name = name || \"friend\"; }`. Now you write `function greet(name = \"friend\") { ... }` directly in the signature — clearer, and it only kicks in when the argument is actually undefined, not for every falsy value.",
        },
        {
          kind: "example",
          heading: "Rest parameters collect the leftover arguments into a real array",
          body: "Before rest parameters, variable-length argument lists relied on the built-in arguments object — array-like, but not a real array, and unavailable in arrow functions at all. Rest parameters fix both problems.",
          language: "javascript",
          code: `// Old way: the arguments object (function-only, not a real array)
function sumOld() {
  let total = 0;
  for (let i = 0; i < arguments.length; i++) total += arguments[i];
  return total; // arguments.map(...) would throw — it has no array methods
}

// Modern way: rest parameters — a genuine array, works in arrow functions too
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3); // 6

const sumArrow = (...numbers) => numbers.reduce((t, n) => t + n, 0);
sumArrow(4, 5); // 9`,
        },
        {
          kind: "bullets",
          heading: "Choosing between the three forms in practice",
          bullets: [
            "Function declarations for top-level, named functions you want hoisted — utilities you might call from code written above them in the same file.",
            "Function expressions when the function is conditional, or needs to be assigned to an object property or reassigned later.",
            "Arrow functions for callbacks (array methods, promise chains, event handlers) and short one-off logic — but avoid them for object methods that need their own `this`.",
          ],
        },
        {
          kind: "bullets",
          heading: "The one real difference: arrow functions and \"this\"",
          intro: "This is the trap that catches people who've only ever used arrow functions:",
          bullets: [
            "A regular function gets its own `this`, determined by how it's called.",
            "An arrow function has no `this` of its own — it uses `this` from whatever scope it was written in.",
            "That makes arrow functions the right choice inside callbacks (like array methods or setTimeout) where you want `this` to keep meaning what it meant outside.",
            "It makes them the wrong choice for object methods that need `this` to refer to the object itself.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Arrow functions don't have their own arguments object either",
          body: "Just like `this`, an arrow function reaches out to the nearest enclosing regular function's arguments object rather than getting one of its own. Writing const f = () => arguments; at the top level throws a ReferenceError. If a function needs arguments, give it rest parameters (...args) instead — they work identically in both function forms and are the modern default regardless.",
        },
        {
          kind: "example",
          heading: "call, apply, and bind: setting this explicitly",
          body: "Regular functions decide this based on how they're called — but three built-in methods let you override that directly. call and apply invoke the function immediately with a chosen this; bind returns a brand-new function permanently locked to that this, which is exactly what you want for a callback or event handler that will be called later, detached from its object.",
          language: "javascript",
          code: `function greet(greeting) {
  return \`\${greeting}, \${this.name}\`;
}

const user = { name: "Ada" };

greet.call(user, "Hello");   // "Hello, Ada" — args passed individually
greet.apply(user, ["Hi"]);   // "Hi, Ada"    — args passed as an array

const boundGreet = greet.bind(user);
boundGreet("Hey");           // "Hey, Ada" — this is now permanently user

// The classic use case: fixing a detached method before passing it on
class Button {
  constructor(label) { this.label = label; }
  handleClick() { console.log(\`\${this.label} clicked\`); }
}
const btn = new Button("Submit");
element.addEventListener("click", btn.handleClick.bind(btn));`,
        },
        {
          kind: "bullets",
          heading: "Pure functions make code easier to test and reason about",
          intro: "A function is \"pure\" when its output depends only on its inputs and it produces no observable side effects. A surprising share of real bugs live in the impure parts:",
          bullets: [
            "Pure: add(2, 3) always returns 5, touches nothing outside itself, and is trivial to unit test — call it a thousand times and get the same answer every time.",
            "Impure: a function that reads outside state, mutates an argument it was passed, calls Date.now() or Math.random(), or logs or writes to a file or network — same input, potentially different output or side effect on every call.",
            "Impure functions aren't wrong — I/O has to happen somewhere — but pushing them to the edges of your code and keeping the logic in between pure makes that logic dramatically easier to test, reuse, and reason about without running it.",
            "map, filter, and the arithmetic examples throughout this course are pure by design; that's part of why they're the everyday default rather than a hand-written loop that mutates as it goes.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Currying: functions that return functions, one argument at a time",
          body: "A curried function takes its arguments one at a time instead of all at once, returning a new function after each one until it finally has enough to produce a result. const add = a => b => a + b; — calling add(2)(3) gives 5, but add(2) alone gives you back a reusable function still waiting for its second argument. That's useful for building specialized versions of a general function on the fly, like multiply(2) becoming a ready-made \"double\" you can pass straight to map.",
        },
      ],
    },
    {
      title: "Arrays and Objects",
      durationMinutes: 9,
      slides: [
        {
          kind: "title",
          heading: "Arrays and Objects",
          subheading:
            "Almost all real data in a JavaScript program is either a list of things (an array) or a bag of named things (an object). Fluency here is fluency in the language.",
        },
        {
          kind: "example",
          heading: "The array methods worth knowing by heart",
          body: "map, filter, and reduce cover the huge majority of everyday array work, and they don't mutate the original array — each returns a new one.",
          language: "javascript",
          code: `const prices = [20, 45, 12, 90];

const withTax = prices.map(p => p * 1.08);
// [21.6, 48.6, 12.96, 97.2]

const overTwenty = prices.filter(p => p > 20);
// [45, 90]

const total = prices.reduce((sum, p) => sum + p, 0);
// 167`,
        },
        {
          kind: "terminal",
          heading: "The same pipeline, run live",
          description: "Pasting the array straight into the Node REPL confirms each method's result without needing to trust the comments.",
          lines: [
            { text: "node" },
            { text: "> const prices = [20, 45, 12, 90];", output: true },
            { text: "undefined", output: true },
            { text: "> prices.map(p => p * 1.08);", output: true },
            { text: "[ 21.6, 48.6, 12.96, 97.2 ]", output: true },
            { text: "> prices.filter(p => p > 20);", output: true },
            { text: "[ 45, 90 ]", output: true },
            { text: "> prices.reduce((sum, p) => sum + p, 0);", output: true },
            { text: "167", output: true },
          ],
        },
        {
          kind: "example",
          heading: "Beyond map/filter/reduce: find, some, every, and the sort() trap",
          body: "These four cover most of what's left. sort() is the one to be careful with — it mutates the original array in place, and its default comparison converts everything to strings, so numbers sort wrong unless you pass a comparator.",
          language: "javascript",
          code: `const users = [{ name: "Ada", age: 30 }, { name: "Grace", age: 25 }];

users.find(u => u.age < 28);      // { name: "Grace", age: 25 } — first match
users.some(u => u.age < 28);      // true — at least one matches
users.every(u => u.age < 28);     // false — not all match
[10, 20, 30].includes(20);        // true

const nums = [10, 1, 21, 2];
nums.sort();
// [1, 10, 2, 21] — sorted as strings: "1" < "10" < "2" < "21" lexically

nums.sort((a, b) => a - b); // [1, 2, 10, 21] — correct numeric sort`,
        },
        {
          kind: "example",
          heading: "Array.from and flat: turning things into arrays, and un-nesting them",
          body: "Array.from converts array-like or iterable values (a NodeList, a Set, a string) into a real array so map/filter/reduce become available. flat and flatMap handle the opposite common annoyance: arrays of arrays.",
          language: "javascript",
          code: `Array.from("abc");            // ["a", "b", "c"]
Array.from({ length: 3 }, (_, i) => i * 2); // [0, 2, 4] — with a mapping fn

const nested = [[1, 2], [3, 4], [5]];
nested.flat();                 // [1, 2, 3, 4, 5] — one level deep
[[1, [2, 3]]].flat(2);         // [1, 2, 3] — pass a depth for deeper nesting

// flatMap = map then flat(1) in one pass — common for "one item becomes many"
const words = ["hello world", "foo bar"];
words.flatMap(s => s.split(" ")); // ["hello", "world", "foo", "bar"]`,
        },
        {
          kind: "example",
          heading: "Set and Map: the other two everyday collections",
          body: "Arrays and objects cover most cases, but two more built-in structures solve specific problems cleanly. A Set stores unique values — adding a duplicate is a silent no-op, which makes deduplication a one-liner. A Map stores key-value pairs like an object, but any value can be a key (not just strings), it remembers insertion order, and it reports its own size directly instead of making you count Object.keys(obj).length.",
          language: "javascript",
          code: `const ids = [1, 2, 2, 3, 3, 3];
const unique = [...new Set(ids)]; // [1, 2, 3] — duplicates gone

const cache = new Map();
cache.set(someObject, "metadata"); // an object AS a key — objects can't do this
cache.set("plain-key", 42);
cache.size;                // 2
cache.get(someObject);     // "metadata"
cache.has("missing-key");  // false

for (const [key, value] of cache) {
  console.log(key, value); // iterates in insertion order, always
}`,
        },
        {
          kind: "terminal",
          heading: "Deduplicating a real array in the REPL",
          description: "The order of first appearance is preserved — a Set doesn't sort anything, it just drops repeats as it sees them.",
          lines: [
            { text: "node" },
            { text: "> const ids = [7, 3, 7, 9, 3, 7];", output: true },
            { text: "undefined", output: true },
            { text: "> [...new Set(ids)];", output: true },
            { text: "[ 7, 3, 9 ]", output: true },
            { text: "> new Set(ids).size;", output: true },
            { text: "3", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "When to reach for Set or Map instead of an array or object",
          bullets: [
            "Set over an array when you need fast membership checks or only care about uniqueness — set.has(x) stays fast as a collection grows, because it doesn't have to scan every element the way array.includes(x) does.",
            "Map over an object when keys aren't simple strings (you need object or function keys), when you need the size directly, or when insertion order matters and you don't want to lean on the quirks of object key ordering.",
            "Object stays the right default for fixed, known shapes — a user record, a config, an API response — where you're reaching for named fields by name, not iterating over an open-ended set of keys.",
          ],
        },
        {
          kind: "bullets",
          heading: "Objects: the everyday shape of data",
          bullets: [
            "Curly braces, key-value pairs: const user = { name: \"Ada\", age: 30 }.",
            "Access with dot notation (user.name) or brackets (user[\"name\"]) — brackets are required when the key is dynamic or not a valid identifier.",
            "Objects can nest arrays and other objects freely — most real-world data (an API response, a form's state) is a tree of these.",
            "Object.keys(), Object.values(), and Object.entries() turn an object into an array you can then map/filter/reduce over.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Optional chaining and nullish coalescing keep nested access safe",
          body: "user?.address?.city reads city only if user and address both exist — it short-circuits to undefined instead of throwing \"Cannot read properties of undefined\" the moment one link in the chain is missing. Pair it with ?? for a default: user?.address?.city ?? \"Unknown\". It also works for optional method calls: user.greet?.() calls greet only if it exists.",
        },
        {
          kind: "example",
          heading: "Destructuring pulls values out by name",
          body: "This is used constantly in real codebases — function parameters, imports, and API responses are almost always destructured rather than accessed field by field.",
          language: "javascript",
          code: `const user = { name: "Ada", age: 30, role: "engineer" };

const { name, role } = user;
console.log(name, role); // "Ada" "engineer"

const numbers = [10, 20, 30];
const [first, second] = numbers;
console.log(first, second); // 10 20

// Common in function signatures:
function printUser({ name, age }) {
  console.log(\`\${name} is \${age}\`);
}`,
        },
        {
          kind: "example",
          heading: "Destructuring defaults, renaming, and skipping",
          body: "Three refinements that come up constantly once destructuring is second nature: a fallback value for a missing field, a different local name than the property has, and skipping array positions you don't need.",
          language: "javascript",
          code: `const config = { host: "localhost" };
const { host, port = 3000 } = config; // port falls back since it's missing

const account = { name: "Ada" };
const { name: accountName } = account; // local variable is accountName, not name

const rgb = [255, 0, 128];
const [red, , blue] = rgb; // skip the middle value entirely
// red = 255, blue = 128`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Spread makes copying and merging painless",
          body: "const updated = { ...user, age: 31 } creates a new object with every field from user, then overwrites age. The same { ...arr } / [...arr] pattern works for arrays. It's the standard way to update state without mutating the original — critical in frameworks like React, but useful everywhere.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Spread only copies one level deep",
          body: "{ ...user } creates a new top-level object, but any nested object or array inside it is still the same reference as the original — mutating updated.address.city would also change user.address.city, because both point at the same nested object. For real independence at every level you need a deep copy: structuredClone(user) (built into modern JS and Node) or JSON.parse(JSON.stringify(user)) for simple, function-free data.",
        },
        {
          kind: "example",
          heading: "Grouping data with reduce (and the newer Object.groupBy)",
          body: "A very common real task — bucket a list of items by some property, like orders by customer — is a natural fit for reduce, and modern JavaScript now ships a method built for exactly this.",
          language: "javascript",
          code: `const orders = [
  { customer: "Ada", total: 40 },
  { customer: "Grace", total: 15 },
  { customer: "Ada", total: 25 },
];

// The classic way, with reduce:
const byCustomer = orders.reduce((groups, order) => {
  (groups[order.customer] ??= []).push(order);
  return groups;
}, {});
// { Ada: [ {total:40}, {total:25} ], Grace: [ {total:15} ] }

// Object.groupBy (widely supported since 2024) does the same thing directly:
const grouped = Object.groupBy(orders, (order) => order.customer);`,
        },
        {
          kind: "example",
          heading: "ES2023 immutable twins: sort, reverse, and splice without mutating",
          body: "sort(), reverse(), and splice() all mutate the array in place, which is surprising when you only meant to read a sorted copy for display. Modern JavaScript ships non-mutating twins for each: toSorted(), toReversed(), toSpliced(), and with() for replacing a single index — every one of them returns a new array and leaves the original untouched.",
          language: "javascript",
          code: `const scores = [30, 10, 20];

const sorted = scores.toSorted((a, b) => a - b);
console.log(sorted); // [10, 20, 30]
console.log(scores); // [30, 10, 20] — untouched, unlike scores.sort()

const updated = scores.with(1, 99);
console.log(updated); // [30, 99, 20]
console.log(scores);  // [30, 10, 20] — still untouched`,
        },
        {
          kind: "chart",
          heading: "Set membership checks scale better than array.includes",
          description: "Relative lookup cost for \"does this collection contain X\" as the collection grows. array.includes scans element by element; Set.has does a constant-time hash lookup regardless of size — the gap widens fast.",
          chartType: "bar",
          unit: "relative cost",
          data: [
            { label: "Array, 1K items", value: 1 },
            { label: "Array, 100K items", value: 90 },
            { label: "Set, 1K items", value: 1 },
            { label: "Set, 100K items", value: 1 },
          ],
        },
        {
          kind: "bullets",
          heading: "Two checks that trip people up",
          bullets: [
            "Arrays are objects too — typeof [1, 2, 3] returns \"object\", not \"array\". To actually test for an array, use Array.isArray(value).",
            "Object.freeze(obj) prevents adding, removing, or reassigning top-level properties, but like spread it's shallow — a frozen object's nested objects can still be mutated.",
            "Comparing two arrays or objects for equal contents (not identity) means writing your own field-by-field check, reaching for a library's isEqual, or using JSON.stringify carefully — there's no built-in deep === for structural equality.",
          ],
        },
      ],
    },
    {
      title: "Control Flow",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Control Flow",
          subheading:
            "How a program decides what to do — and how many times to do it. The syntax is simple; the traps are in what JavaScript considers \"true\" and \"false.\"",
        },
        {
          kind: "bullets",
          heading: "The basics",
          bullets: [
            "if / else if / else — branch on a condition.",
            "A ternary for a single value choice: const label = age >= 18 ? \"adult\" : \"minor\".",
            "switch — clean when you're comparing one value against many exact matches; remember break, or execution falls through into the next case.",
            "for, while — general-purpose loops. for (const item of list) is the everyday way to loop over an array's values.",
          ],
        },
        {
          kind: "example",
          heading: "switch without break falls through to the next case",
          body: "Once a case matches, execution keeps running downward through every case after it until it hits a break — or the end of the switch. This is occasionally useful (grouping cases), but forgetting break by accident is a common bug.",
          language: "javascript",
          code: `function describe(day) {
  switch (day) {
    case "Sat":
    case "Sun":
      return "Weekend"; // return exits early, so no break needed here
    case "Mon":
      console.log("Start of week"); // no break — falls through!
    case "Tue":
      return "Weekday";
    default:
      return "Unknown";
  }
}

describe("Mon");
// logs "Start of week", THEN falls into "Tue" and returns "Weekday" —
// probably not what was intended if "Mon" was meant to be handled alone`,
        },
        {
          kind: "example",
          heading: "Truthy and falsy decide every condition",
          body: "JavaScript doesn't require a boolean in an if — it converts whatever you give it. Exactly six values are falsy; everything else is truthy.",
          language: "javascript",
          code: `// The complete list of falsy values:
false, 0, -0, "", null, undefined, NaN

// Everything else is truthy — including these surprises:
if ("0") { /* runs — non-empty string is truthy */ }
if ([]) { /* runs — an empty array is truthy */ }
if ({}) { /* runs — an empty object is truthy */ }`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The empty-array trap",
          body: "New JavaScript developers often write `if (myArray)` expecting it to check for an empty list, and are surprised when it's true even for []. To check for emptiness, check the length explicitly: if (myArray.length === 0).",
        },
        {
          kind: "example",
          heading: "for...of and for...in loop over completely different things",
          body: "They look similar and get confused constantly. for...of gives you values from an iterable (arrays, strings, Maps) — it's what you want almost always. for...in gives you enumerable property keys, which for an array means index strings, and it also walks up the prototype chain.",
          language: "javascript",
          code: `const colors = ["red", "green", "blue"];

for (const color of colors) {
  console.log(color); // "red", "green", "blue" — the values
}

for (const index in colors) {
  console.log(index); // "0", "1", "2" — string keys, not numbers
}

// for...in on an object works as expected, since objects don't have
// a built-in iteration order the way arrays do:
const user = { name: "Ada", role: "engineer" };
for (const key in user) {
  console.log(key, user[key]); // "name Ada", "role engineer"
}`,
        },
        {
          kind: "bullets",
          heading: "&& and || do double duty",
          intro: "Beyond combining conditions, they're used constantly for short-circuiting:",
          bullets: [
            "a && b returns b if a is truthy, otherwise returns a without evaluating b — used to guard: user && user.name.",
            "a || b returns a if a is truthy, otherwise b — used to fall back to a default: const name = input || \"Guest\".",
            "?? (nullish coalescing) is the safer version of || for defaults — it only falls back on null or undefined, not on every falsy value like 0 or \"\".",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Ternaries are for values, not for actions",
          body: "condition ? doA() : doB() to pick between two side effects compiles fine but reads badly — a ternary should produce a value you assign or return, like const label = age >= 18 ? \"adult\" : \"minor\". If you're not using the result, or either branch has more than one statement's worth of logic, reach for a plain if/else instead.",
        },
        {
          kind: "example",
          heading: "break and continue: exiting or skipping a loop iteration early",
          body: "continue skips the rest of the current iteration and moves straight to the next one; break exits the loop entirely, right where it is. Both work in for, while, and for...of. A labeled loop — an identifier followed by a colon, placed before the loop — lets break or continue target an outer loop from inside a nested one, which a bare break in the inner loop can't do on its own; it only ever exits its own immediate loop.",
          language: "javascript",
          code: `for (const n of [1, 2, 3, 4, 5]) {
  if (n === 3) continue; // skip 3, keep going
  if (n === 5) break;    // stop the loop entirely once we hit 5
  console.log(n);        // logs 1, 2, 4
}

outer: for (const row of matrix) {
  for (const cell of row) {
    if (cell === target) break outer; // exits BOTH loops at once
  }
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "do...while runs its body at least once, then checks",
          body: "A regular while loop checks its condition before the first run, so the body might never execute at all. do { ... } while (condition) flips that order — the body always runs once, and the condition is only checked afterward, to decide whether to run again. It's a smaller tool than for and while, but the right fit anytime the logic itself has to happen before there's anything to check against — a menu that has to be shown once before you know whether the user wants to exit, or a retry loop that has to attempt the operation before it can inspect the result.",
        },
        {
          kind: "bullets",
          heading: "Guard clauses: returning early instead of nesting deeper",
          intro: "The exact same logic can read very differently depending on whether you nest conditions or exit early:",
          bullets: [
            "Nested: if (user) { if (user.isActive) { if (user.hasAccess) { doWork(); } } } — three levels deep before anything actually happens, with the real logic buried at the bottom.",
            "Guard clauses: if (!user) return; if (!user.isActive) return; if (!user.hasAccess) return; doWork(); — each check exits immediately if it fails, and the function's main logic sits at the top level instead of nested three deep.",
            "This isn't only a style preference — deeply nested conditionals are measurably harder to hold in your head, and they're exactly where a misplaced brace or a forgotten else quietly changes what the code actually does.",
          ],
        },
      ],
    },
    {
      title: "Asynchronous JavaScript",
      durationMinutes: 10,
      slides: [
        {
          kind: "title",
          heading: "Asynchronous JavaScript",
          subheading:
            "JavaScript runs on one thread — so anything slow (a network request, a timer) has to happen \"in the background\" without blocking everything else. This is how that actually works, from oldest to newest style.",
        },
        {
          kind: "example",
          heading: "The old way: callbacks",
          body: "A callback is just a function passed in to be run later, when the slow thing finishes. This works, but nesting several of them gets unreadable fast — commonly called \"callback hell.\"",
          language: "javascript",
          code: `getUser(id, (user) => {
  getOrders(user.id, (orders) => {
    getInvoice(orders[0].id, (invoice) => {
      console.log(invoice.total);
      // three levels deep, and this only gets worse
    });
  });
});`,
        },
        {
          kind: "example",
          heading: "Promises: a value that arrives later",
          body: "A Promise represents work that hasn't finished yet. It's either pending, fulfilled (with a value), or rejected (with an error). .then() chains flatten out the nesting callbacks caused.",
          language: "javascript",
          code: `getUser(id)
  .then((user) => getOrders(user.id))
  .then((orders) => getInvoice(orders[0].id))
  .then((invoice) => console.log(invoice.total))
  .catch((error) => console.error("Something failed:", error));`,
        },
        {
          kind: "example",
          heading: "Promise.all runs independent work concurrently instead of one-by-one",
          body: "The .then chain above is sequential by necessity — each step needs the previous one's result. But when several promises don't depend on each other, awaiting them one at a time wastes time. Promise.all starts them all at once and resolves when every one of them has.",
          language: "javascript",
          code: `// Sequential — each request waits for the last one to finish first.
// If each takes 200ms, this takes roughly 600ms total.
const userA = await getUser(1);
const userB = await getUser(2);
const userC = await getUser(3);

// Concurrent — all three requests fire immediately, in parallel.
// Total time is roughly 200ms: as long as the slowest single request.
const [a, b, c] = await Promise.all([getUser(1), getUser(2), getUser(3)]);

// Note: if ANY promise in the array rejects, Promise.all rejects
// immediately with that error — use Promise.allSettled(...) instead
// if you need every result even when some fail.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "forEach doesn't wait for async callbacks — a very common bug",
          body: "items.forEach(async (item) => { await save(item); }) looks like it processes items one at a time, but forEach ignores whatever its callback returns, including a promise. Every callback fires immediately, all at once, and the outer code moves on before any of them finish. For sequential processing, use a plain for...of loop with await inside it; for concurrent processing, use await Promise.all(items.map(item => save(item))) instead.",
        },
        {
          kind: "example",
          heading: "async/await: promises that read like normal code",
          body: "async/await doesn't replace promises — it's syntax built on top of them. An async function always returns a promise, and await pauses that function (not the whole program) until the promise settles.",
          language: "javascript",
          code: `async function loadInvoiceTotal(id) {
  try {
    const user = await getUser(id);
    const orders = await getOrders(user.id);
    const invoice = await getInvoice(orders[0].id);
    return invoice.total;
  } catch (error) {
    console.error("Something failed:", error);
  }
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "An async function always returns a promise — even a plain value gets wrapped",
          body: "return invoice.total inside an async function doesn't hand the caller a number directly — it hands them a promise that resolves to that number. Calling loadInvoiceTotal(id) without await gives you a Promise object, not the total, which is a frequent source of \"why is this [object Promise]\" bugs when someone forgets the await at the call site.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "await only pauses the function it's in",
          body: "While an async function is paused on an await, the rest of your program keeps running — a button click still responds, a timer still fires. This is what \"non-blocking\" means in practice, and it's why a slow API call doesn't freeze an entire page.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A rejected promise with no .catch and no try/catch crashes silently — or loudly",
          body: "In Node, an unhandled promise rejection now terminates the process by default. In a browser, it logs an \"Uncaught (in promise)\" error to the console but the page keeps running. Either way it's a bug you want to see immediately, not discover later — every promise chain needs a .catch, and every await needs to sit inside a try/catch or a function whose caller handles the rejection.",
        },
        {
          kind: "diagram",
          heading: "How the event loop keeps one thread from blocking",
          description: "This is what's actually happening underneath every await — the call stack hands slow work off, and only comes back to it once the stack is clear.",
          steps: [
            { label: "Call stack", detail: "Runs your synchronous code, one frame at a time" },
            { label: "Web API / Node API", detail: "Timers, network requests, file reads run outside the stack" },
            { label: "Callback / microtask queue", detail: "A finished promise's .then callback waits here" },
            { label: "Event loop", detail: "Checks: is the call stack empty yet?" },
            { label: "Back on the call stack", detail: "The queued callback runs only once the stack is empty" },
          ],
        },
        {
          kind: "terminal",
          heading: "Proof that promises jump the queue ahead of setTimeout",
          description: "Promise callbacks (microtasks) always run before timer callbacks (macrotasks), even when the timer is set to 0ms — the microtask queue is drained completely before the event loop even looks at the timer queue.",
          lines: [
            { text: "node ordering.js" },
            { text: "1  // synchronous code runs first, top to bottom", output: true },
            { text: "4  // synchronous code, still running", output: true },
            { text: "3  // Promise.resolve().then(...) — a microtask, runs next", output: true },
            { text: "2  // setTimeout(..., 0) — a macrotask, runs last of all", output: true },
          ],
        },
        {
          kind: "example",
          heading: "Promise.race: a simple timeout for a slow request",
          body: "Promise.race resolves or rejects as soon as the first of its promises settles — the rest keep running but their results are ignored. Racing a real request against a timer that rejects is a common, dependency-free way to add a timeout to something that has no built-in one.",
          language: "javascript",
          code: `function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timed out")), ms)
  );
  return Promise.race([promise, timeout]);
}

try {
  const user = await withTimeout(getUser(id), 3000);
} catch (error) {
  console.error(error.message); // "Timed out" if getUser took over 3s
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "await works outside async functions too, at the top of a module",
          body: "Modern JavaScript modules (ESM) support top-level await — you can await directly in a module's top-level code, no wrapping async function required. It's useful for one-time setup (loading config, opening a connection) that later code in the module depends on. It doesn't work in a CommonJS require()-based file or inside a regular script tag without type=\"module\".",
        },
        {
          kind: "example",
          heading: "AbortController: actually cancelling an in-flight request",
          body: "Promise.race can simulate a timeout, but it doesn't stop the underlying request — the network call keeps running in the background even after your code has stopped waiting on it. AbortController is the real cancellation mechanism: pass its signal into fetch, and calling abort() actually tears down the in-flight request instead of just ignoring its eventual result.",
          language: "javascript",
          code: `const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 3000);

try {
  const response = await fetch("/api/report", { signal: controller.signal });
  clearTimeout(timeoutId);
  const data = await response.json();
} catch (error) {
  if (error.name === "AbortError") {
    console.error("Request timed out or was cancelled");
  } else {
    throw error;
  }
}`,
        },
        {
          kind: "example",
          heading: "for await...of: looping over values that arrive over time",
          body: "Some data doesn't arrive all at once — a paginated API, a streamed file read, a series of messages. An async generator produces values one at a time, each wrapped in a promise, and for await...of awaits each one automatically before moving to the next, so the loop body reads like it's synchronous even though every iteration involves a real wait.",
          language: "javascript",
          code: `async function* fetchAllPages(url) {
  let nextUrl = url;
  while (nextUrl) {
    const response = await fetch(nextUrl);
    const page = await response.json();
    yield page.items;
    nextUrl = page.nextUrl;
  }
}

for await (const items of fetchAllPages("/api/orders")) {
  console.log(\`Got \${items.length} orders in this page\`);
}`,
        },
        {
          kind: "bullets",
          heading: "Five async mistakes that show up constantly in code review",
          bullets: [
            "Awaiting inside a loop when the calls don't depend on each other — turns what could be one round trip's worth of waiting into N sequential round trips. Fire independent calls with Promise.all instead.",
            "Forgetting that .map() with an async callback returns an array of promises, not resolved values — you almost always need Promise.all(items.map(async ...)) wrapped around it, not just the bare map.",
            "Mixing .then() chains with async/await in the same function — pick one style per function; combining both makes the error-handling path genuinely hard to follow.",
            "Swallowing errors with an empty catch block — catch (error) {} hides real failures instead of handling them. At minimum, log what happened.",
            "Assuming await pauses the whole program — it only pauses the async function it's inside of. Every other event handler and timer keeps running exactly as normal while it waits.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Node keeps running until its event loop is empty, not until your code finishes",
          body: "A Node process doesn't exit the instant your top-level code finishes running — it exits once there's genuinely nothing left that could still fire: no pending timers, no open sockets, no promise with something still waiting on it. That's why an unawaited setInterval or a database connection left open can keep a script running long after all your visible code has finished. Calling clearInterval and closing connections explicitly is how you give the process permission to actually exit.",
        },
        {
          kind: "summary",
          heading: "The asynchronous ladder",
          bullets: [
            "Callbacks: functions passed in to run later — simple, but nests badly.",
            "Promises: an object representing a future value, chained with .then()/.catch().",
            "async/await: the same promises, written to read top-to-bottom like synchronous code.",
            "Wrap await calls in try/catch — a rejected promise you don't catch becomes an unhandled error.",
          ],
        },
      ],
    },
    {
      title: "Scope, Closures, and Everyday Traps",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Scope, Closures, and Everyday Traps",
          subheading:
            "A handful of quirks account for a large share of confusing JavaScript bugs. Recognizing them by name is most of the fix.",
        },
        {
          kind: "example",
          heading: "Closures: a function remembers where it was created",
          body: "A closure is a function that keeps access to variables from the scope it was defined in, even after that outer scope has finished running. This is what makes counters, private state, and event handlers with memory possible.",
          language: "javascript",
          code: `function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3 — count persisted between calls`,
        },
        {
          kind: "example",
          heading: "{ } creates a new scope for let/const, but not for var",
          body: "This is the root cause of most scope confusion. let and const are block-scoped — confined to the nearest { }. var ignores block boundaries entirely and is scoped to the nearest function (or the global scope, outside any function).",
          language: "javascript",
          code: `if (true) {
  let blockScoped = "inside";
  var functionScoped = "leaks out";
}

console.log(functionScoped); // "leaks out" — var doesn't respect the if block
console.log(blockScoped);    // ReferenceError — blockScoped doesn't exist here

function example() {
  if (true) {
    var x = 1;
  }
  console.log(x); // 1 — var is visible anywhere in the enclosing function
}`,
        },
        {
          kind: "example",
          heading: "The classic var-in-a-loop bug",
          body: "This is the single most common closure trap. var is function-scoped, so every callback in the loop shares the same i — by the time any of them run, the loop has already finished and i is 3.",
          language: "javascript",
          code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// logs 3, 3, 3 — not 0, 1, 2

// Fix: use let, which creates a fresh binding per iteration
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// logs 0, 1, 2`,
        },
        {
          kind: "terminal",
          heading: "Confirming the var bug for real",
          description: "Save both loops to a file and run it — the timing difference described above is exactly what prints, in exactly this order.",
          lines: [
            { text: "node loop-bug.js" },
            { text: "3", output: true },
            { text: "3", output: true },
            { text: "3", output: true },
            { text: "0", output: true },
            { text: "1", output: true },
            { text: "2", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A closure keeps its variables alive for as long as the closure itself is reachable",
          body: "Normally, a function's local variables are freed once the function returns. But if an inner function that references them escapes — gets returned, stored, or passed as a callback — the JavaScript engine keeps those variables in memory for as long as that inner function might still be called. This is exactly what makes makeCounter work, but it's also a real source of memory leaks: an event listener or long-lived callback that closes over a large object keeps that object alive until the listener itself is removed.",
        },
        {
          kind: "example",
          heading: "WeakMap: private data keyed by object, without blocking garbage collection",
          body: "A closure is one way to keep private state; a WeakMap is another, useful when you want to associate private data with an object from outside its class entirely. Unlike a regular Map, a WeakMap doesn't keep its keys alive — once nothing else references the object, it and its entry are freed together.",
          language: "javascript",
          code: `const privateData = new WeakMap();

class Account {
  constructor(owner, balance) {
    this.owner = owner;
    privateData.set(this, { balance }); // stored outside the instance
  }

  getBalance() {
    return privateData.get(this).balance;
  }
}

const acct = new Account("Ada", 100);
acct.getBalance(); // 100
// privateData has no public way to list its keys, and once acct is no
// longer referenced anywhere, its entry is garbage collected automatically`,
        },
        {
          kind: "example",
          heading: "A practical closure: debounce",
          body: "Debouncing is one of the most common real-world uses of a closure — delay running a function until some time has passed without it being called again, so a search-as-you-type handler doesn't fire an API request on every single keystroke.",
          language: "javascript",
          code: `function debounce(fn, delayMs) {
  let timeoutId; // closed over — persists between calls to the returned function

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

const search = debounce((query) => fetchResults(query), 300);
input.addEventListener("input", (e) => search(e.target.value));
// typing "hello" fires fetchResults only ONCE, 300ms after the last
// keystroke — each new keystroke cancels the previous pending call`,
        },
        {
          kind: "example",
          heading: "The module pattern: a closure used to build a mini public API",
          body: "Before ES modules existed, this was the standard way to give a piece of code private internals and a small public surface — an IIFE that returns only the methods meant to be public, closing over everything else so it stays unreachable from outside.",
          language: "javascript",
          code: `const counterModule = (function () {
  let count = 0; // private — no way to reach this from outside

  function log(message) {
    console.log(\`[counter] \${message}\`); // private helper, not exposed
  }

  return {
    increment() {
      count += 1;
      log(\`incremented to \${count}\`);
      return count;
    },
    getCount() {
      return count;
    },
  };
})();

counterModule.increment(); // logs, returns 1
counterModule.count;       // undefined — never exposed`,
        },
        {
          kind: "bullets",
          heading: "Two more traps worth knowing by name",
          bullets: [
            "Hoisting — function declarations and var are moved to the top of their scope before code runs, but let/const are not initialized until their line executes. Referencing a let before its declaration throws, rather than silently giving undefined.",
            "NaN is never equal to itself — NaN === NaN is false. To check for it, use Number.isNaN(value), never ===.",
            "Comparing objects and arrays with === checks identity, not contents — [1,2] === [1,2] is false because they're two different arrays in memory, even though they look the same.",
          ],
        },
        {
          kind: "example",
          heading: "Comparing objects by contents, not identity",
          body: "There's no built-in deep-equality operator. JSON.stringify is a common quick fix, but it has its own trap: it's sensitive to key order, so two objects with the same data written in a different order compare unequal. For anything beyond a quick script, reach for a tested library instead.",
          language: "javascript",
          code: `const a = { x: 1, y: 2 };
const b = { y: 2, x: 1 }; // same data, different key order

a === b; // false — different objects in memory
JSON.stringify(a) === JSON.stringify(b); // false! key order differs

// A structural check needs to compare keys independently of order,
// which is exactly what libraries like lodash's isEqual(a, b) do —
// worth reaching for once objects nest more than one level deep.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A function declared inside a block is a scoping edge case worth knowing",
          body: "A named function declared inside an if block or other block behaves inconsistently across environments — it's technically block-scoped in modern strict-mode JavaScript, but some engines and older code still hoist it up to the enclosing function, so relying on its visibility outside the block is a portability trap. The safe fix is the one you'd reach for anyway: assign a function expression to a let or const inside the block instead of declaring a named function there, so its scope is unambiguous everywhere it runs.",
        },
        {
          kind: "bullets",
          heading: "Recognizing a closure bug versus a closure feature",
          bullets: [
            "Feature: each call to a factory function like makeCounter or debounce creates a fresh, independent closure — call debounce(...) twice and you get two separate timers that don't interfere with each other at all.",
            "Bug: a loop or event-handler-creation pattern where every closure ends up sharing the same mutable variable instead of getting its own — the var-in-a-loop trap earlier in this lesson is the textbook example, but the same shape shows up any time several closures are meant to be independent but accidentally close over one shared reference instead.",
            "The fix is almost always the same one: give each closure its own binding, either with let inside a loop, or by wrapping the shared logic in a function call that creates a fresh scope per use.",
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Default to const, use let when reassigning, avoid var in new code.",
            "Arrow functions inherit `this`; regular functions get their own — pick based on that, not habit.",
            "map/filter/reduce and destructuring/spread are the daily-driver tools for arrays and objects.",
            "async/await is promises with better readability — always pair it with try/catch.",
            "A closure is a function plus the variables it remembers from where it was defined, and it's the mechanism behind counters, memoization, debounce, and the module pattern alike.",
          ],
        },
      ],
    },
    {
      title: "Classes and the Prototype Chain",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Classes and the Prototype Chain",
          subheading:
            "Every object in JavaScript is built on another object underneath — class syntax is a clean face on that older, prototype-based system.",
        },
        {
          kind: "example",
          heading: "class syntax: a constructor and methods",
          body: "A class bundles data (set up in the constructor) with the methods that operate on it. new creates an instance; the constructor runs automatically.",
          language: "javascript",
          code: `class Account {
  constructor(owner, balance = 0) {
    this.owner = owner;
    this.balance = balance;
  }

  deposit(amount) {
    this.balance += amount;
    return this.balance;
  }

  toString() {
    return \`\${this.owner}'s account: $\${this.balance}\`;
  }
}

const acct = new Account("Ada", 100);
acct.deposit(50);
console.log(acct.toString()); // "Ada's account: $150"`,
        },
        {
          kind: "example",
          heading: "extends and super chain one class onto another",
          body: "A subclass inherits everything the parent has, and super(...) calls the parent's constructor — it must run before the subclass touches `this`.",
          language: "javascript",
          code: `class SavingsAccount extends Account {
  constructor(owner, balance = 0, rate = 0.02) {
    super(owner, balance); // sets up this.owner and this.balance first
    this.rate = rate;
  }

  applyInterest() {
    this.balance += this.balance * this.rate;
    return this.balance;
  }
}

const savings = new SavingsAccount("Grace", 1000, 0.03);
savings.applyInterest();
console.log(savings.balance);            // 1030
console.log(savings instanceof Account); // true`,
        },
        {
          kind: "example",
          heading: "Private fields and static members",
          body: "A # prefix makes a field truly private — unlike the this.balance convention used above, it's completely inaccessible from outside the class, enforced by the language itself, not just a naming convention. static puts a member on the class itself rather than on instances, useful for shared counters or factory-style helpers.",
          language: "javascript",
          code: `class BankAccount {
  #balance; // private — only code inside this class can touch it
  static #accountCount = 0; // private, shared across every instance

  constructor(owner, balance = 0) {
    this.owner = owner;
    this.#balance = balance;
    BankAccount.#accountCount++;
  }

  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }

  static getAccountCount() {
    return BankAccount.#accountCount;
  }
}

const acct = new BankAccount("Ada", 100);
acct.deposit(50);
// acct.#balance;              // SyntaxError — not accessible outside the class
console.log(BankAccount.getAccountCount()); // 1`,
        },
        {
          kind: "example",
          heading: "Getters and setters: methods that read like properties",
          body: "get and set let a method be accessed with property syntax instead of a function call — useful for a computed value, or for validating a value on the way in.",
          language: "javascript",
          code: `class Temperature {
  constructor(celsius) {
    this._celsius = celsius;
  }

  get fahrenheit() {
    return this._celsius * (9 / 5) + 32;
  }

  set fahrenheit(value) {
    this._celsius = (value - 32) * (5 / 9);
  }
}

const temp = new Temperature(100);
temp.fahrenheit;       // 212 — read like a property, no () needed
temp.fahrenheit = 32;
temp._celsius;          // 0 — the setter did the conversion`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Symbol.toPrimitive: control exactly how an instance converts",
          body: "Overriding toString() covers string conversion, but for finer control — different output when an instance is used numerically (+account) versus as a string (`${account}`) — a class can implement [Symbol.toPrimitive](hint) instead. JavaScript checks for that method first, before toString or valueOf, any time it needs to coerce an instance down to a primitive value, which makes it the most precise of the three hooks.",
        },
        {
          kind: "example",
          heading: "Making a class work with for...of",
          body: "for...of only works on values that implement the iterator protocol — a method named [Symbol.iterator] that returns an object with a next() method. Arrays and strings have this built in; give your own class one and for...of, spread, and destructuring all start working on it for free.",
          language: "javascript",
          code: `class Range {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }

  [Symbol.iterator]() {
    let current = this.start;
    const end = this.end;
    return {
      next() {
        return current <= end
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  }
}

for (const n of new Range(1, 3)) {
  console.log(n); // 1, 2, 3
}
[...new Range(1, 3)]; // [1, 2, 3] — spread works too, same protocol`,
        },
        {
          kind: "bullets",
          heading: "What's really happening: prototypes",
          intro:
            "class is syntax sugar over JavaScript's older prototype system — nothing about how objects actually work underneath has changed.",
          bullets: [
            "Every object has a hidden link to another object it inherits from — that chain of links is the \"prototype chain.\"",
            "Methods defined in a class body live once on Account.prototype, not copied onto every instance — creating a thousand accounts doesn't create a thousand copies of deposit.",
            "acct.deposit(50) works because JavaScript checks acct itself first, then walks up to Account.prototype, then further up the chain, until it finds a matching method.",
            "Object.getPrototypeOf(acct) === Account.prototype lets you inspect the link directly; instanceof checks whether a given prototype appears anywhere in that chain.",
          ],
        },
        {
          kind: "example",
          heading: "Object.create: building the prototype chain by hand",
          body: "class and extends are convenient syntax, but underneath, all they really do is wire objects together via Object.create. Calling it directly shows exactly what's happening: it creates a new object whose prototype is set to whatever you pass in — no constructor, no class keyword required.",
          language: "javascript",
          code: `const animalProto = {
  speak() {
    return \`\${this.name} makes a sound\`;
  },
};

const dog = Object.create(animalProto); // dog's prototype IS animalProto
dog.name = "Rex";
dog.speak(); // "Rex makes a sound" — found by walking up to animalProto

Object.getPrototypeOf(dog) === animalProto; // true
// This is essentially what "class Dog {}" plus "extends" does for you,
// just with a constructor and readable syntax layered on top.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A method detached from its instance loses `this`",
          body: "const deposit = acct.deposit; deposit(50); doesn't behave like acct.deposit(50) — a class method's `this` still depends on how it's called, exactly like a regular function's. Passing acct.deposit directly as a callback (button.addEventListener(\"click\", acct.deposit)) is a classic version of this bug. Fix it with acct.deposit.bind(acct), or wrap it in an arrow function: () => acct.deposit(50).",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Classes aren't the only way to bundle state with behavior",
          body: "A closure-based factory function (like makeCounter from the previous lesson) achieves similar goals — private state plus functions that operate on it — without new, this, or prototypes at all. Classes tend to win when you need instanceof checks, inheritance hierarchies, or many instances sharing methods efficiently via the prototype. Factory functions tend to win when you want true privacy without the # syntax, or when this-binding bugs aren't worth the tradeoff. Neither is \"more correct\" — plenty of production codebases lean almost entirely on one or the other.",
        },
        {
          kind: "example",
          heading: "Mixins: composing behavior without a deep inheritance chain",
          body: "extends only gives a class one parent. When behavior genuinely needs to come from more than one source — a class that's both \"serializable\" and \"comparable,\" say — a mixin function that wraps a base class and returns an extended version of it is the common workaround, keeping the inheritance tree flat instead of forcing an awkward multi-level hierarchy just to share two unrelated methods.",
          language: "javascript",
          code: `const Serializable = (Base) => class extends Base {
  toJSON() {
    return { ...this };
  }
};

const Comparable = (Base) => class extends Base {
  equals(other) {
    return JSON.stringify(this) === JSON.stringify(other);
  }
};

class Point {
  constructor(x, y) { this.x = x; this.y = y; }
}

class ComparablePoint extends Comparable(Serializable(Point)) {}

const p = new ComparablePoint(1, 2);
p.toJSON();                          // { x: 1, y: 2 }
p.equals(new ComparablePoint(1, 2)); // true`,
        },
        {
          kind: "bullets",
          heading: "Favor composition over deep inheritance in real codebases",
          intro: "The rule of thumb most working teams eventually settle on:",
          bullets: [
            "A deep inheritance chain (Animal -> Mammal -> Dog -> ServiceDog) couples every level to the ones above it — change a method halfway up, and every subclass below inherits that change whether it wants it or not.",
            "Composition — building an object out of smaller, focused pieces attached or passed in, rather than inherited — tends to age better: swapping one collaborator doesn't ripple through a whole class hierarchy the way changing a shared base class does.",
            "Use extends for a genuine \"is-a\" relationship that's unlikely to change (a SavingsAccount really is an Account, permanently), and composition or mixins for anything closer to \"has-a\" or \"can-do\" (a class that has a logger, or can be serialized).",
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "class is sugar over prototypes — methods live once on the prototype, shared by every instance, not duplicated per object.",
            "extends plus super(...) chains one class's behavior onto another; super(...) must run before a subclass constructor uses this.",
            "instanceof and Object.getPrototypeOf let you inspect the prototype chain directly.",
            "A class method detached from its instance loses this just like any other function — bind it or wrap it in an arrow function before passing it as a callback.",
            "Prefer extends for a true, stable \"is-a\" relationship; reach for composition or a mixin when a class needs behavior from more than one unrelated source.",
          ],
        },
      ],
    },
    {
      title: "Practice: Closures and Classes",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Closures and Classes",
          subheading:
            "Three hands-on exercises — building private state with closures, then the same idea again with classes and inheritance.",
        },
        {
          kind: "practice",
          heading: "Counter with Increment, Decrement, and Reset",
          prompt:
            "Write a function makeCounter(start = 0) that returns an object with three methods: increment() (adds 1, returns the new count), decrement() (subtracts 1, returns the new count), and reset() (sets the count back to start, returns it). The count itself must be private — not reachable except through these methods.",
          hint: "Use a closure: declare count as a local variable inside makeCounter, and have every returned method reference that same variable.",
          solution: `function makeCounter(start = 0) {
  let count = start; // private — only reachable through the methods below

  return {
    increment() {
      count += 1;
      return count;
    },
    decrement() {
      count -= 1;
      return count;
    },
    reset() {
      count = start; // closes over the original "start", not the current count
      return count;
    },
  };
}

const counter = makeCounter(10);
counter.increment(); // 11
counter.increment(); // 12
counter.decrement(); // 11
counter.reset();     // 10 — back to the original start`,
        },
        {
          kind: "practice",
          heading: "Memoize an Expensive Function",
          prompt:
            "Write memoize(fn) that takes a function of one argument and returns a new function with the same behavior, but caches results by argument so repeated calls with the same input skip re-running fn. Assume the argument is always safe to use as a Map key (a number or string).",
          hint: "Store a cache (a Map created inside memoize, outside the returned function) in a closure. Check it before calling fn; store the result after.",
          solution: `function memoize(fn) {
  const cache = new Map(); // private to this memoized function, via closure

  return function (arg) {
    if (cache.has(arg)) {
      return cache.get(arg); // skip recomputation
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

function slowSquare(n) {
  console.log("computing...");
  return n * n;
}

const fastSquare = memoize(slowSquare);
fastSquare(5); // logs "computing...", returns 25
fastSquare(5); // no log — returned straight from the cache`,
        },
        {
          kind: "chart",
          heading: "What memoization actually saves",
          description: "Calling fastSquare(5) twice: the first call has to compute; the second is a cache hit and skips slowSquare entirely.",
          chartType: "bar",
          data: [
            { label: "1st call", value: 1 },
            { label: "2nd call", value: 0 },
          ],
        },
        {
          kind: "practice",
          heading: "A Stack Class, and a Size-Limited Subclass",
          prompt:
            "Write a class Stack with push(item), pop() (removes and returns the top item), and peek() (returns the top item without removing it), backed by an array. Then write LimitedStack extends Stack that takes maxSize in its constructor and overrides push to throw if the stack is already full.",
          hint: "Set up this.items = [] in Stack's constructor. In LimitedStack, call super() then super.push(item) only after checking this.items.length against maxSize.",
          solution: `class Stack {
  constructor() {
    this.items = [];
  }

  push(item) {
    this.items.push(item);
  }

  pop() {
    return this.items.pop();
  }

  peek() {
    return this.items[this.items.length - 1];
  }
}

class LimitedStack extends Stack {
  constructor(maxSize) {
    super(); // sets up this.items before we touch it
    this.maxSize = maxSize;
  }

  push(item) {
    if (this.items.length >= this.maxSize) {
      throw new Error("Stack is full");
    }
    super.push(item); // reuse the parent's logic instead of duplicating it
  }
}

const s = new LimitedStack(2);
s.push("a");
s.push("b");
s.push("c"); // throws: Error: Stack is full`,
        },
        {
          kind: "practice",
          heading: "A Simple Event Emitter (Pub/Sub) With Closures",
          prompt:
            "Write a function createEmitter() that returns an object with on(event, callback) (registers a callback for a named event), off(event, callback) (removes a previously registered callback), and emit(event, ...args) (calls every callback currently registered for that event, passing along any extra arguments). Multiple callbacks can be registered for the same event, and emitting an event with no listeners should just do nothing.",
          hint: "Keep a Map of event name to an array of callbacks, private inside the closure. on pushes onto the array for that event (creating it first if needed); off filters the matching callback out of the array; emit looks up the array and calls each function in it with the given arguments.",
          solution: `function createEmitter() {
  const listeners = new Map(); // event name -> array of callbacks

  return {
    on(event, callback) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    off(event, callback) {
      const callbacks = listeners.get(event);
      if (!callbacks) return;
      listeners.set(event, callbacks.filter((cb) => cb !== callback));
    },
    emit(event, ...args) {
      const callbacks = listeners.get(event) || [];
      for (const callback of callbacks) {
        callback(...args);
      }
    },
  };
}

const emitter = createEmitter();
function onOrder(id) { console.log(\`Order placed: \${id}\`); }

emitter.on("order", onOrder);
emitter.emit("order", 42);   // logs "Order placed: 42"
emitter.off("order", onOrder);
emitter.emit("order", 43);   // nothing logs — listener was removed`,
        },
        {
          kind: "terminal",
          heading: "Testing the emitter live",
          description: "A quick sanity check in the REPL before trusting the solution: register a listener, fire the event, confirm it ran.",
          lines: [
            { text: "node" },
            { text: "> const emitter = createEmitter();", output: true },
            { text: "undefined", output: true },
            { text: "> emitter.on(\"ping\", () => console.log(\"pong\"));", output: true },
            { text: "undefined", output: true },
            { text: "> emitter.emit(\"ping\");", output: true },
            { text: "pong", output: true },
          ],
        },
        {
          kind: "practice",
          heading: "A Rate-Limited Class Using a Timestamp Window",
          prompt:
            "Write a class RateLimiter that takes maxCalls and windowMs in its constructor. It has one method, allow(), which returns true if calling it right now is within the limit — no more than maxCalls calls in the trailing windowMs milliseconds — and false otherwise. Only calls that return true should count toward the limit; a rejected call shouldn't use up any of the allowance.",
          hint: "Keep an array of call timestamps on the instance. Each time allow() runs: filter out any timestamps older than windowMs from right now. If what's left has fewer than maxCalls entries, push the current timestamp onto the array and return true; otherwise return false without recording anything. This is called a \"sliding window\" because the cutoff moves forward with every call instead of resetting on a fixed clock tick.",
          solution: `class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.timestamps = [];
  }

  allow() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);

    if (this.timestamps.length < this.maxCalls) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }
}

const limiter = new RateLimiter(2, 1000); // 2 calls allowed per second
limiter.allow(); // true  — 1st call in this window
limiter.allow(); // true  — 2nd call in this window
limiter.allow(); // false — 3rd call, same window, blocked`,
        },
        {
          kind: "chart",
          heading: "Requests allowed vs. blocked in a 2-per-second window",
          description: "Six rapid calls to allow() within the same second, using the RateLimiter(2, 1000) from the exercise above. 1 = allowed, 0 = blocked.",
          chartType: "bar",
          data: [
            { label: "Call 1", value: 1 },
            { label: "Call 2", value: 1 },
            { label: "Call 3", value: 0 },
            { label: "Call 4", value: 0 },
            { label: "Call 5", value: 0 },
            { label: "Call 6", value: 0 },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Debugging a closure is different from debugging an instance",
          body: "A class instance's state is easy to inspect from outside: log the instance itself, or check acct.balance directly in a debugger's variable panel, even from a completely different part of the codebase. A closure's private variables have no equivalent — count inside makeCounter isn't reachable from outside at all, which is exactly the point, but it also means debugging a misbehaving closure requires setting a breakpoint inside the returned function itself, not inspecting a property from the caller's side. Worth remembering when choosing between the two patterns for something you expect to need to step through often, especially under time pressure during an incident.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where these patterns show up in real code",
          body: "createEmitter is a small version of what Node's built-in EventEmitter, DOM addEventListener, and most pub/sub or message-bus systems do underneath. RateLimiter's timestamp-window approach — often called a \"sliding window\" rate limiter — is a simplified version of what API gateways and login-throttling code use to stop abuse; production versions usually swap the plain array for a more memory-efficient structure at high volume, but the core idea, something remembering recent call times and comparing against a limit, is identical.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "A closure keeps state alive and private across multiple calls without a class — makeCounter, memoize, createEmitter, and debounce all lean on this instead of a global variable.",
            "A Map closed over by a returned function is a common, lightweight cache or registry — no library needed for basic memoization or a pub/sub emitter.",
            "extends plus super.push(...) lets a subclass reuse a parent method's logic instead of copy-pasting it, then add its own check on top.",
            "RateLimiter shows the class version of the same idea: private instance state (this.timestamps) plus a method that reads and updates it — a closure and an instance are two ways to reach the same design.",
            "Rate limiting, event emission, and memoization are three of the most commonly asked take-home and whiteboard exercises in real interviews — recognizing the closure-or-instance shape underneath them matters more than memorizing any one solution verbatim.",
            "Closures and classes are really the same core idea underneath: bundling state together with the only functions allowed to touch it.",
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
            "Seven questions across the whole course — variables, functions, arrays, async, and the scope/class material you just covered. Read each code sample carefully before picking an answer; several of these hinge on a single line.",
        },
        {
          kind: "quiz",
          heading: "const and Mutation",
          question:
            "What does this code log?\n\nconst cart = [\"shirt\"];\ncart.push(\"shoes\");\nconsole.log(cart.length);",
          options: ["1", "2", "TypeError: Assignment to constant variable", "undefined"],
          correctIndex: 1,
          explanation:
            "const locks the binding, not the contents — cart can't be reassigned to a different array, but its existing array can still be mutated. push() adds an item in place, so length becomes 2.",
        },
        {
          kind: "quiz",
          heading: "Arrow Functions and this",
          question:
            "What does this log?\n\nconst obj = {\n  value: 42,\n  logValue: function () {\n    setTimeout(() => {\n      console.log(this.value);\n    }, 0);\n  },\n};\n\nobj.logValue();",
          options: ["42", "undefined", "TypeError: Cannot read properties of undefined", "NaN"],
          correctIndex: 0,
          explanation:
            "The arrow function has no this of its own — it uses this from logValue's scope. logValue was called as obj.logValue(), so this there is obj, and the arrow function inherits that. A regular function passed to setTimeout instead would not keep this pointing at obj.",
        },
        {
          kind: "quiz",
          heading: "await and try/catch",
          question:
            "If getUser(id) rejects, what happens here?\n\nasync function loadInvoiceTotal(id) {\n  try {\n    const user = await getUser(id);\n    const orders = await getOrders(user.id);\n    return orders.length;\n  } catch (error) {\n    return -1;\n  }\n}",
          options: [
            "The function throws an uncaught error and crashes the program",
            "Execution jumps to the catch block, and the function returns -1",
            "getOrders still runs, using undefined as the user",
            "The function hangs indefinitely waiting for getUser",
          ],
          correctIndex: 1,
          explanation:
            "await on a rejected promise throws inside the function, exactly like a synchronous throw would. Since it's inside the try block, control moves straight to catch, which returns -1 — orders is never reached.",
        },
        {
          kind: "quiz",
          heading: "var Inside a Loop",
          question:
            "What does this log?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}",
          options: ["0 1 2", "0 0 0", "3 3 3", "undefined undefined undefined"],
          correctIndex: 2,
          explanation:
            "var is function-scoped, not block-scoped, so all three callbacks share the exact same i. By the time any of them run, the loop has already finished and i is 3. Switching to let creates a fresh binding per iteration and fixes it — 0, 1, 2.",
        },
        {
          kind: "quiz",
          heading: "Where Class Methods Live",
          question:
            "Given class Dog extends Animal { bark() { ... } } and a dozen Dog instances, where does bark actually live in memory?",
          options: [
            "A separate copy is created on every instance, for speed",
            "On Animal.prototype only, copied down into Dog at construction time",
            "Nowhere until first called, then cached per instance",
            "Once, on Dog.prototype, shared by every instance",
          ],
          correctIndex: 3,
          explanation:
            "Methods defined in a class body are placed once on the class's prototype. Every instance shares that single copy via the prototype chain — creating more instances never duplicates the method itself.",
        },
        {
          kind: "quiz",
          heading: "Spread and Nested Objects",
          question:
            "What does this log?\n\nconst user = { name: \"Ada\", address: { city: \"NYC\" } };\nconst updated = { ...user, name: \"Grace\" };\nupdated.address.city = \"LA\";\nconsole.log(user.address.city);",
          options: ["\"NYC\"", "\"LA\"", "undefined", "TypeError"],
          correctIndex: 1,
          explanation:
            "Spread only copies one level deep. updated gets its own top-level name and address properties, but address itself is still the exact same nested object as user.address — mutating updated.address.city also changes it on user, because there's really only one address object in memory, referenced from both places.",
        },
        {
          kind: "quiz",
          heading: "Sequential vs. Concurrent Awaits",
          question:
            "getUser(id) always takes about 200ms. Which of these finishes faster overall?\n\nA:\nconst a = await getUser(1);\nconst b = await getUser(2);\n\nB:\nconst [a, b] = await Promise.all([getUser(1), getUser(2)]);",
          options: [
            "A — awaiting one at a time is always faster for exactly two calls",
            "B — both requests start immediately, finishing in roughly 200ms total instead of 400ms",
            "They take exactly the same time either way",
            "It depends entirely on which one is awaited first",
          ],
          correctIndex: 1,
          explanation:
            "Promise.all starts every promise in its array immediately, so independent async calls run concurrently instead of one waiting on the other to finish first. Version A takes roughly 400ms — 200ms, then another 200ms, one after another. Version B takes roughly 200ms total, bounded by the slower of the two requests, not their sum.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "const prevents reassignment, not mutation — arrays and objects declared with const can still change in place, and spread only copies one level deep.",
            "Arrow functions inherit this from their surrounding scope; regular functions get their own, determined by how they're called — call, apply, and bind exist to override that explicitly.",
            "map/filter/reduce, destructuring, and spread are the daily tools for arrays and objects; Set and Map earn their place when uniqueness, non-string keys, or fast membership checks matter.",
            "async/await is promises with readable syntax — pair every await with try/catch, and reach for Promise.all when independent calls don't need to wait on each other.",
            "A closure is a function plus the variables it remembers, and it's the engine behind debounce, memoization, and private state; classes are sugar over the same prototype system, with methods shared via the prototype chain rather than duplicated per instance.",
          ],
        },
      ],
    },
  ],
};
