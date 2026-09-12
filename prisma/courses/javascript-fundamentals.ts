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
          kind: "bullets",
          heading: "The types you'll use every day",
          bullets: [
            "string — text, in quotes or backticks: \"hello\", 'hello', `hello`.",
            "number — both integers and decimals share one type: 4, -12, 3.14.",
            "boolean — true or false.",
            "undefined — a variable that's been declared but not given a value yet.",
            "null — an intentional \"no value,\" set explicitly by your code.",
            "object — everything structured: plain objects, arrays, functions, dates.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "typeof null is \"object\"",
          body: "This is a decades-old bug baked permanently into the language — typeof null returns \"object\", not \"null\". If you need to check for null specifically, compare directly: value === null. Don't rely on typeof for it.",
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
          tone: "insight",
          heading: "Default parameters replace a common old pattern",
          body: "Before default parameters existed, people wrote `function greet(name) { name = name || \"friend\"; }`. Now you write `function greet(name = \"friend\") { ... }` directly in the signature — clearer, and it only kicks in when the argument is actually undefined, not for every falsy value.",
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
          kind: "callout",
          tone: "tip",
          heading: "Spread makes copying and merging painless",
          body: "const updated = { ...user, age: 31 } creates a new object with every field from user, then overwrites age. The same { ...arr } / [...arr] pattern works for arrays. It's the standard way to update state without mutating the original — critical in frameworks like React, but useful everywhere.",
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
          kind: "bullets",
          heading: "&& and || do double duty",
          intro: "Beyond combining conditions, they're used constantly for short-circuiting:",
          bullets: [
            "a && b returns b if a is truthy, otherwise returns a without evaluating b — used to guard: user && user.name.",
            "a || b returns a if a is truthy, otherwise b — used to fall back to a default: const name = input || \"Guest\".",
            "?? (nullish coalescing) is the safer version of || for defaults — it only falls back on null or undefined, not on every falsy value like 0 or \"\".",
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
          tone: "insight",
          heading: "await only pauses the function it's in",
          body: "While an async function is paused on an await, the rest of your program keeps running — a button click still responds, a timer still fires. This is what \"non-blocking\" means in practice, and it's why a slow API call doesn't freeze an entire page.",
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
          kind: "bullets",
          heading: "Two more traps worth knowing by name",
          bullets: [
            "Hoisting — function declarations and var are moved to the top of their scope before code runs, but let/const are not initialized until their line executes. Referencing a let before its declaration throws, rather than silently giving undefined.",
            "NaN is never equal to itself — NaN === NaN is false. To check for it, use Number.isNaN(value), never ===.",
            "Comparing objects and arrays with === checks identity, not contents — [1,2] === [1,2] is false because they're two different arrays in memory, even though they look the same.",
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
            "A closure is a function plus the variables it remembers from where it was defined.",
          ],
        },
      ],
    },
  ],
};
