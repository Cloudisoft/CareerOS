import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "react-fundamentals",
  title: "React Fundamentals",
  description:
    "The component model, JSX, props vs. state, hooks, and the mental model for re-renders — the foundation everything else in React builds on.",
  category: "Web Development",
  level: "INTERMEDIATE",
  order: 13,
  lessons: [
    {
      title: "React and the Component Model",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "React and the Component Model",
          subheading:
            "This course assumes you're comfortable with JavaScript. React itself is a smaller idea than its reputation suggests — the hard part is usually the ecosystem around it, not the core model.",
        },
        {
          kind: "text",
          heading: "What React actually is",
          body: [
            "React is a library for building user interfaces out of components — small, reusable pieces that each describe a chunk of UI. It is not a framework in the way Angular or Next.js are; on its own, React has no opinion about routing, data fetching, or how your project is structured.",
            "The one idea React is built entirely around: your UI is a function of your data. You describe what the interface should look like for a given piece of state, and React handles the work of getting the actual DOM to match that description — you don't hand-write the DOM mutations yourself.",
          ],
        },
        {
          kind: "bullets",
          heading: "Declarative vs. imperative UI",
          intro: "This is the shift that trips up people coming from plain DOM manipulation:",
          bullets: [
            "Imperative (plain JS/jQuery style): \"find this element, change its text, add this class, remove that one\" — you describe the steps to reach the new state.",
            "Declarative (React style): \"here is what the UI should look like right now, given this data\" — you describe the end state, and React figures out the steps.",
            "The payoff: as an app grows, tracking every place that might mutate the DOM by hand becomes unmanageable. Describing UI as a function of state scales much better.",
          ],
        },
        {
          kind: "example",
          heading: "A component, at its simplest",
          body: "A component is just a function that returns a description of UI (JSX, covered next lesson). React calls this function whenever it needs to know what to render.",
          code: `function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Used like an HTML tag elsewhere in the tree:
// <Greeting name="Priya" />`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where the virtual DOM fits",
          body: "React keeps a lightweight in-memory representation of the UI, compares it to the previous version when something changes, and only touches the real DOM where something actually differs. This matters for performance, but it's an implementation detail — you almost never need to think about it directly. The mental model that actually matters day to day is simpler: given this state, what should render?",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "React is a UI library, not a full framework — it renders components, nothing more by default.",
            "Components are functions that return a description of UI based on their inputs.",
            "You describe the desired result (declarative); React handles reconciling the DOM to match it.",
          ],
        },
      ],
    },
    {
      title: "JSX: Syntax, Not Magic",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "JSX: Syntax, Not Magic",
          subheading:
            "JSX looks like HTML living inside JavaScript, which throws people off at first. It's actually just a compact way to write function calls.",
        },
        {
          kind: "example",
          heading: "What JSX compiles to",
          body: "A build tool (Babel, or the compiler built into your framework) turns JSX into plain function calls before your code ever runs in the browser. The JSX is convenience for you — the browser never sees it.",
          code: `// What you write:
const element = <h1 className="title">Hello, {name}</h1>;

// What it compiles to (roughly):
const element = React.createElement(
  "h1",
  { className: "title" },
  "Hello, ",
  name
);`,
        },
        {
          kind: "bullets",
          heading: "The rules that trip people up first",
          bullets: [
            "A component must return a single root element — wrap siblings in a `<div>` or a `<>...</>` fragment.",
            "Use `className` instead of `class`, and `htmlFor` instead of `for` — these are JavaScript, and `class`/`for` are reserved words.",
            "Attributes with multiple words are camelCase: `onClick`, `tabIndex`, `strokeWidth`.",
            "Anything inside curly braces `{}` is a plain JavaScript expression — a variable, a function call, a ternary. Statements like `if` or `for` don't work directly inside JSX; use expressions instead (ternaries, `&&`, array `.map`).",
            "Every tag must be closed, including ones that are self-closing in HTML: `<img />`, `<br />`.",
          ],
        },
        {
          kind: "example",
          heading: "Conditional rendering with expressions",
          body: "Since JSX only accepts expressions, conditional logic gets expressed with ternaries or the `&&` operator rather than an `if` statement inline.",
          code: `function Status({ isOnline, pendingCount }) {
  return (
    <div>
      {isOnline ? <span>Online</span> : <span>Offline</span>}
      {pendingCount > 0 && <span>{pendingCount} pending</span>}
    </div>
  );
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The `&&` trap with the number zero",
          body: "`{pendingCount && <Badge />}` looks safe, but if `pendingCount` is `0`, JavaScript's `&&` returns `0` itself — and React renders that as the literal text \"0\" on the page instead of rendering nothing. Guard with an explicit comparison instead: `{pendingCount > 0 && <Badge />}`.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "JSX compiles down to regular function calls — it's syntax sugar, not a separate language.",
            "Curly braces embed JavaScript expressions, not statements.",
            "Small naming differences (className, camelCase attributes) are the most common early friction, not a sign you're doing something wrong.",
          ],
        },
      ],
    },
    {
      title: "Props vs. State",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Props vs. State",
          subheading:
            "The single most useful distinction in React: what a component is told, versus what a component remembers on its own.",
        },
        {
          kind: "text",
          heading: "Props: input from outside",
          body: [
            "Props are how a parent component passes data down to a child — similar to arguments passed into a function. A component receives props and should treat them as read-only: it never modifies the props it was given directly.",
            "If a value is handed to a component from the outside, and the component itself has no business changing it, that value is a prop.",
          ],
        },
        {
          kind: "text",
          heading: "State: what a component remembers",
          body: [
            "State is data a component owns and can change over time, on its own, in response to something — a click, a timer, data arriving. When state changes, React re-renders that component (and its children) with the new value.",
            "If a value needs to change while the component is on screen, and the component itself is the one deciding when it changes, that's state.",
          ],
        },
        {
          kind: "example",
          heading: "Both, side by side",
          body: "`label` here is a prop — it comes from whoever renders `Counter`. `count` is state — the component owns it and updates it itself.",
          code: `function Counter({ label }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>{label}: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </div>
  );
}

// <Counter label="Clicks" />`,
        },
        {
          kind: "bullets",
          heading: "Lifting state up",
          intro: "A common design question: two sibling components both need the same piece of data. Where should the state live?",
          bullets: [
            "State should live in the closest common ancestor of every component that needs to read or change it.",
            "The parent then passes the value down as a prop, and passes a function down as a prop for children to call when they want to change it.",
            "This is the main pattern for sharing state in React without reaching for an external state library — and for small-to-medium apps, it's often all you need.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Don't mutate props",
          body: "Reassigning or mutating a prop directly (`props.items.push(x)`, `props.value = 5`) works in JavaScript but breaks React's assumptions — the parent doesn't know the change happened, and React won't reliably re-render to reflect it. If a child needs to change something, it should call a function passed down from the parent, which updates the parent's own state.",
        },
      ],
    },
    {
      title: "useState and useEffect",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "useState and useEffect",
          subheading:
            "These two hooks cover the large majority of what components actually need: remembering something, and reacting to a change by doing something outside of rendering.",
        },
        {
          kind: "example",
          heading: "useState, mechanically",
          body: "`useState` returns a pair: the current value, and a function to update it. Calling the setter schedules a re-render with the new value — it doesn't mutate the variable in place.",
          code: `function LikeButton() {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "Liked" : "Like"}
    </button>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "What useEffect is actually for",
          intro: "useEffect handles \"side effects\" — anything that reaches outside of rendering the UI itself:",
          bullets: [
            "Fetching data from a server.",
            "Subscribing to something (a WebSocket, a browser event like resize).",
            "Manually reading or writing to the DOM outside of what JSX already handles.",
            "Setting a timer or interval.",
            "If a piece of logic doesn't fit \"return some UI based on props and state,\" it usually belongs in an effect.",
          ],
        },
        {
          kind: "example",
          heading: "The dependency array controls when it runs",
          body: "The second argument tells React when to re-run the effect. This one dependency array is responsible for more React bugs — and more confusion — than almost anything else in the library, so it's worth reading carefully.",
          code: `useEffect(() => {
  console.log("Runs after every single render");
});

useEffect(() => {
  console.log("Runs once, after the first render only");
}, []);

useEffect(() => {
  console.log("Runs after the first render, and again whenever userId changes");
}, [userId]);`,
        },
        {
          kind: "example",
          heading: "Fetching data, with cleanup",
          body: "Returning a function from an effect gives React a cleanup step — it runs before the effect re-runs, and when the component unmounts. This is how you cancel a stale request or unsubscribe from something.",
          code: `useEffect(() => {
  let cancelled = false;

  async function loadUser() {
    const response = await fetch(\`/api/users/\${userId}\`);
    const data = await response.json();
    if (!cancelled) setUser(data);
  }

  loadUser();

  return () => {
    cancelled = true; // ignore the result if userId changes before this resolves
  };
}, [userId]);`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The missing-dependency trap",
          body: "If an effect uses a variable from the component (a prop, a piece of state) but that variable isn't listed in the dependency array, the effect can run with a stale, outdated value from an earlier render — a bug that's notoriously hard to trace because everything looks correct in the code. The reliable fix is almost always to include every value the effect actually uses in its dependency array, rather than omitting one to control timing.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "useState gives a component memory across renders; calling the setter triggers a re-render.",
            "useEffect handles anything outside of rendering — fetching, subscriptions, timers.",
            "The dependency array controls when an effect re-runs; leaving out a used value is the most common source of hard-to-find bugs.",
          ],
        },
      ],
    },
    {
      title: "Handling Events and Forms",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Handling Events and Forms",
          subheading:
            "React wraps native browser events in its own system, and forms in particular work a little differently than plain HTML — worth knowing before it surprises you.",
        },
        {
          kind: "bullets",
          heading: "Events, briefly",
          bullets: [
            "Event handlers are named with \"on\" plus the event, camelCased: onClick, onChange, onSubmit, onKeyDown.",
            "You pass the function itself as the handler, not the result of calling it: `onClick={handleClick}`, never `onClick={handleClick()}`.",
            "React normalizes browser event differences into a consistent \"synthetic event\" object, so you don't usually need to worry about cross-browser event quirks.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The parentheses mistake everyone makes once",
          body: "`onClick={handleClick()}` calls handleClick immediately during rendering — not when the button is clicked — and then hands React whatever that call returns as the handler (often nothing, so the click does nothing at all). If a handler needs arguments, wrap it: `onClick={() => handleClick(id)}`.",
        },
        {
          kind: "example",
          heading: "A controlled input",
          body: "A \"controlled\" input means React state is the single source of truth for the value — the input displays whatever state says, and every keystroke updates that state.",
          code: `function NameField() {
  const [name, setName] = useState("");

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Your name"
    />
  );
}`,
        },
        {
          kind: "example",
          heading: "A full form submission",
          body: "`preventDefault()` stops the browser's default full-page reload on submit, which is almost never what you want in a React app.",
          code: `function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    submitLogin({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log in</button>
    </form>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "Controlled vs. uncontrolled",
          intro: "Most React forms use controlled inputs, but it's worth knowing the alternative exists:",
          bullets: [
            "Controlled: state drives the input's value, as shown above. Easiest to validate, transform, or react to as the user types.",
            "Uncontrolled: the DOM itself holds the value, and you read it out only when needed (via a ref) — closer to plain HTML forms, less common in typical React code, but sometimes simpler for a form you only read once, like a file upload.",
          ],
        },
      ],
    },
    {
      title: "Why Components Re-render",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Why Components Re-render",
          subheading:
            "\"Why did this re-render, and is it a problem?\" is one of the most common real debugging questions in React. It has a small, learnable set of answers.",
        },
        {
          kind: "bullets",
          heading: "What actually triggers a render",
          bullets: [
            "A component's own state changes (a `useState` setter is called with a new value).",
            "A component's parent re-renders — by default, every child re-renders too, regardless of whether its own props actually changed.",
            "Context a component subscribes to changes (covered in more advanced material, but worth knowing it exists as a trigger).",
          ],
        },
        {
          kind: "example",
          heading: "Parent renders cascade to children by default",
          body: "Clicking the button updates `count` in `Parent`. That alone causes `Child` to re-render too, even though `Child` receives no props at all and has nothing that changed for it.",
          code: `function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      <Child />
    </div>
  );
}

function Child() {
  console.log("Child rendered"); // logs on every Parent click
  return <p>I don't depend on count at all.</p>;
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Re-render\" is not the same as \"DOM update\"",
          body: "When a component re-renders, React re-runs its function to get a new description of the UI — that's cheap. It then compares that description to the previous one and only touches the real DOM where something actually changed. So a component can re-render often without causing visible or expensive DOM work; the two are related but distinct, and it's usually not worth optimizing against re-renders until you've confirmed they're actually causing a real performance problem.",
        },
        {
          kind: "bullets",
          heading: "Two habits that prevent real bugs here",
          bullets: [
            "Give list items a stable, unique `key` prop (an ID, not the array index where the list can reorder) — React uses it to match items across renders, and a wrong key causes state to attach to the wrong item after a reorder or deletion.",
            "Don't create new objects, arrays, or functions inline as props if a child is expensive to re-render and you're trying to avoid it — a new object literal or arrow function is a different reference every render, which defeats memoization techniques even when the actual data hasn't changed.",
          ],
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "A render is triggered by a component's own state changing, or by its parent re-rendering.",
            "Children re-render by default when their parent does, regardless of whether their own props changed.",
            "A re-render is not automatically a DOM update — React only touches the DOM where the description actually differs.",
            "Stable list keys and being deliberate about what's created fresh on every render prevent the most common re-render-related bugs.",
          ],
        },
      ],
    },
    {
      title: "Memoization: useMemo, useCallback, and React.memo",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Memoization: useMemo, useCallback, and React.memo",
          subheading:
            "The last lesson made the case that most re-renders aren't a problem. This one covers what to actually do once you've measured one that is.",
        },
        {
          kind: "text",
          heading: "Three tools, one underlying idea",
          body: [
            "Memoization means caching a result and reusing it instead of recomputing it, as long as its inputs haven't changed. React gives you three flavors of this: useMemo caches a computed value, useCallback caches a function itself, and React.memo caches an entire component's rendered output.",
            "All three exist to answer the same question: given that a component re-rendered, can some of the work inside it be skipped because nothing it depends on actually changed?",
          ],
        },
        {
          kind: "example",
          heading: "useMemo: skipping an expensive recomputation",
          body: "Without useMemo, sortAndFilter would run on every render of this component — including renders triggered by something unrelated, like a theme toggle. With it, the sort only reruns when items or query actually change.",
          code: `function ProductList({ items, query }) {
  const visible = useMemo(
    () => sortAndFilter(items, query), // only reruns when items or query change
    [items, query]
  );

  return (
    <ul>
      {visible.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}`,
        },
        {
          kind: "example",
          heading: "useCallback + React.memo: skipping a child's re-render entirely",
          body: "React.memo makes a component skip re-rendering if its props are shallow-equal to last time. That only works if the props themselves are stable — a new arrow function on every render of the parent would defeat it, which is exactly what useCallback prevents here.",
          code: `const RowButton = React.memo(function RowButton({ onSelect, id }) {
  console.log("RowButton rendered", id);
  return <button onClick={() => onSelect(id)}>Select</button>;
});

function Parent({ items }) {
  const [theme, setTheme] = useState("light");

  // Without useCallback, this is a brand-new function every render,
  // so RowButton's memo comparison always fails and it re-renders anyway.
  const handleSelect = useCallback((id) => {
    console.log("selected", id);
  }, []);

  return (
    <div>
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle theme
      </button>
      {items.map((item) => (
        <RowButton key={item.id} id={item.id} onSelect={handleSelect} />
      ))}
    </div>
  );
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Memoization is not free, and it's not the default you should reach for first",
          body: "Every useMemo and useCallback call costs a comparison and a bit of retained memory, and React.memo costs a props comparison on every parent render. Wrapping everything in memoization by default usually makes code harder to read without measurably helping performance — most components are cheap enough that re-rendering them is a non-issue. Reach for these tools when you've identified a specific, measured slowdown (a large list, an expensive computation, a component that's costly enough that skipping its render actually matters), not as a reflexive habit applied to every component you write.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A dependency array mistake that silently defeats memoization",
          body: "useMemo and useCallback compare dependency arrays the same way useEffect does — by reference for objects, arrays, and functions. Passing a freshly created object as a dependency (`useMemo(() => x, [{ id }])`) recreates that dependency every render, so the cache never actually hits. The values inside the array need to themselves be stable (primitives, or things already memoized) for the memoization to do anything at all.",
        },
        {
          kind: "summary",
          heading: "Recap",
          bullets: [
            "useMemo caches a computed value; useCallback caches a function reference; React.memo skips a component's re-render when its props haven't changed.",
            "React.memo only helps if the props it's comparing are themselves stable — pairing it with useCallback (or a memoized value) for any function or object props is what actually makes it work.",
            "These are targeted fixes for a measured performance problem, not a default to apply everywhere — the comparison and memory overhead isn't free either.",
          ],
        },
      ],
    },
    {
      title: "Practice: Fixing Unnecessary Re-renders",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Fixing Unnecessary Re-renders",
          subheading:
            "Three small, realistic bugs. In each, figure out why the component re-renders (or behaves) more than it should before reaching for a fix.",
        },
        {
          kind: "practice",
          heading: "1. A memoized child that re-renders anyway",
          prompt:
            "`ExpensiveRow` is wrapped in React.memo, but it still re-renders every time `Dashboard`'s unrelated `theme` state changes. Find the bug and fix it.\n\n```jsx\nconst ExpensiveRow = React.memo(function ExpensiveRow({ data, onClick }) {\n  console.log(\"rendering row\", data.id);\n  return <div onClick={() => onClick(data.id)}>{data.label}</div>;\n});\n\nfunction Dashboard({ rows }) {\n  const [theme, setTheme] = useState(\"light\");\n\n  return (\n    <div>\n      <button onClick={() => setTheme(theme === \"light\" ? \"dark\" : \"light\")}>\n        Toggle theme\n      </button>\n      {rows.map((row) => (\n        <ExpensiveRow key={row.id} data={row} onClick={(id) => console.log(id)} />\n      ))}\n    </div>\n  );\n}\n```",
          hint:
            "React.memo does a shallow comparison of props. Look at what's created fresh, as a new reference, on every single render of Dashboard — regardless of what triggered it.",
          solution:
            "The `onClick` prop is a new arrow function literal on every render of Dashboard, so React.memo's shallow comparison always sees a \"changed\" prop and re-renders ExpensiveRow anyway, even though nothing about that row actually changed. Fix: hoist the handler out with useCallback so the same function reference is passed on every render, and derive the id inside the child instead of closing over it in the parent.\n\n```jsx\nfunction Dashboard({ rows }) {\n  const [theme, setTheme] = useState(\"light\");\n\n  const handleClick = useCallback((id) => {\n    console.log(id);\n  }, []);\n\n  return (\n    <div>\n      <button onClick={() => setTheme(theme === \"light\" ? \"dark\" : \"light\")}>\n        Toggle theme\n      </button>\n      {rows.map((row) => (\n        <ExpensiveRow key={row.id} data={row} onClick={handleClick} />\n      ))}\n    </div>\n  );\n}\n```\nKey decision: the fix targets the actual cause (an unstable prop reference) rather than removing React.memo — the memo was correct, the prop passed to it wasn't stable.",
        },
        {
          kind: "practice",
          heading: "2. An expensive computation running on every keystroke",
          prompt:
            "`SearchResults` recomputes a sorted, filtered list from 10,000 items on every render — including every render caused by unrelated state like `showFilters`. Typing in the search box is noticeably laggy. Fix the performance problem without changing what's rendered.\n\n```jsx\nfunction SearchResults({ items, query }) {\n  const [showFilters, setShowFilters] = useState(false);\n\n  const results = items\n    .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))\n    .sort((a, b) => a.name.localeCompare(b.name));\n\n  return (\n    <div>\n      <button onClick={() => setShowFilters(!showFilters)}>Toggle filters</button>\n      {showFilters && <FilterPanel />}\n      <ul>\n        {results.map((item) => (\n          <li key={item.id}>{item.name}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n```",
          hint:
            "The filter/sort only actually needs to rerun when items or query change — toggling showFilters shouldn't trigger it at all. What hook exists specifically to skip recomputing a value when its dependencies haven't changed?",
          solution:
            "Wrap the filter+sort in useMemo with `[items, query]` as its dependency array, so toggling `showFilters` (which changes state but not items or query) no longer reruns it.\n\n```jsx\nfunction SearchResults({ items, query }) {\n  const [showFilters, setShowFilters] = useState(false);\n\n  const results = useMemo(\n    () =>\n      items\n        .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))\n        .sort((a, b) => a.name.localeCompare(b.name)),\n    [items, query]\n  );\n\n  return (\n    <div>\n      <button onClick={() => setShowFilters(!showFilters)}>Toggle filters</button>\n      {showFilters && <FilterPanel />}\n      <ul>\n        {results.map((item) => (\n          <li key={item.id}>{item.name}</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n```\nKey decision: the dependency array only lists the two values the computation actually reads — `showFilters` is deliberately left out, because including it would make the memoization rerun on exactly the render we're trying to skip.",
        },
        {
          kind: "practice",
          heading: "3. List items losing their own state after reordering",
          prompt:
            "Each row in this list has its own \"expanded\" toggle. After the list gets re-sorted (say, alphabetically), users report that the wrong rows appear expanded — the expanded state seems to stay with a position in the list rather than following the item. Find the bug.\n\n```jsx\nfunction ItemList({ items }) {\n  return (\n    <ul>\n      {items.map((item, index) => (\n        <Row key={index} item={item} />\n      ))}\n    </ul>\n  );\n}\n\nfunction Row({ item }) {\n  const [expanded, setExpanded] = useState(false);\n  return (\n    <li onClick={() => setExpanded(!expanded)}>\n      {item.name} {expanded && <p>{item.details}</p>}\n    </li>\n  );\n}\n```",
          hint:
            "The key is `index`, not something tied to the item itself. Think about what React actually uses the key for when a list is reordered rather than just appended to.",
          solution:
            "React uses `key` to match a rendered element to the same element from the previous render, so it knows to reuse (and preserve the state of) that same component instance instead of creating a new one. With `key={index}`, after a re-sort, position 2 is still \"key 2\" even though a completely different item now sits there — so React reuses the Row instance (and its `expanded` state) that used to belong to a different item. Fix: key by the item's own stable identity instead of its position.\n\n```jsx\nfunction ItemList({ items }) {\n  return (\n    <ul>\n      {items.map((item) => (\n        <Row key={item.id} item={item} />\n      ))}\n    </ul>\n  );\n}\n```\nKey decision: the fix is entirely in the key, not in Row itself — `Row` was written correctly all along. This is why array index as a key is a known anti-pattern specifically for lists that can reorder, filter, or have items inserted/removed from the middle.",
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Recognizing that React.memo only helps when the props it compares are reference-stable, and pairing it with useCallback where needed.",
            "Using useMemo for a genuinely expensive computation, with a dependency array limited to what the computation actually reads.",
            "Understanding that `key` controls component identity across renders, not just list rendering — and that index-as-key is specifically dangerous once a list can reorder.",
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
            "Five questions across the whole course — the goal is testing whether the mental models actually stuck, not recalling lesson trivia.",
        },
        {
          kind: "quiz",
          heading: "The component model",
          question:
            "A teammate says React is \"imperative because you write functions that run code.\" What's the most accurate response?",
          options: [
            "They're right — any code with function calls and logic is imperative by definition.",
            "React is declarative: components describe what the UI should look like for given props/state, and React decides how to update the actual DOM to match.",
            "React is neither — it has no real distinction between declarative and imperative styles.",
            "React is imperative only when hooks like useEffect are used, and declarative otherwise.",
          ],
          correctIndex: 1,
          explanation:
            "Declarative vs. imperative is about what you specify, not whether the code has functions or logic. You describe the desired end result (given this data, render this) and React figures out the DOM operations to get there — you never manually target an element and mutate it. That's true of the whole component model, not just parts of it.",
        },
        {
          kind: "quiz",
          heading: "JSX and the zero trap",
          question:
            "Why does `{count && <Badge />}` sometimes render a stray \"0\" on the page instead of rendering nothing?",
          options: [
            "React has a bug with falsy values inside JSX expressions.",
            "`<Badge />` throws an error when count is falsy, and React shows the error inline.",
            "JavaScript's && returns the left operand (0) when it's falsy, and React renders that returned 0 as literal text.",
            "count needs to be explicitly cast to a boolean before it can be used in JSX at all.",
          ],
          correctIndex: 2,
          explanation:
            "`&&` evaluates to its left side if that side is falsy — for `0`, that's the number 0 itself, not `false` or `undefined`. React renders numbers as text, so `0` shows up on the page. `count > 0 && <Badge />` sidesteps this because the left side then evaluates to an actual boolean.",
        },
        {
          kind: "quiz",
          heading: "Props, state, and where shared data should live",
          question:
            "Two sibling components need to read and update the same piece of data. Where should that data live, and how should the siblings interact with it?",
          options: [
            "Each sibling should keep its own copy in local state and sync them with a useEffect that watches the other's value.",
            "In the closest common ancestor's state, passed down to both siblings as props — along with a function, also passed down, that either sibling calls to update it.",
            "As a global variable outside the component tree, so both siblings can read and write it directly without props.",
            "In whichever sibling renders first, passed to the other as a prop only when it changes.",
          ],
          correctIndex: 1,
          explanation:
            "This is \"lifting state up\": state lives in the nearest common ancestor, which passes the value down as a prop and passes an updater function down for children to call. Syncing two separate copies of state with an effect is a common but fragile pattern — it introduces a lag and a place for the two copies to drift out of sync, when a single shared source of truth avoids the problem entirely.",
        },
        {
          kind: "quiz",
          heading: "useEffect's dependency array",
          question:
            "An effect reads a prop called `userId` inside a fetch call, but the dependency array is `[]`. What's the actual consequence?",
          options: [
            "The effect throws a runtime error immediately because userId is referenced but not declared as a dependency.",
            "The effect runs once, on mount, and continues using whatever userId was at that first render — it won't refetch if userId later changes.",
            "React automatically adds userId to the dependency array behind the scenes since it detects it's used inside the effect.",
            "The effect re-runs on every render regardless of the empty array, because fetch calls are always tracked separately.",
          ],
          correctIndex: 1,
          explanation:
            "An empty dependency array means \"run once, after the first render, and never again.\" If the effect closes over `userId`, it keeps using the value from that first render's closure — a classic stale-closure bug. The fix is to include every value the effect actually reads, here `[userId]`, so it re-runs and refetches when that value changes.",
        },
        {
          kind: "quiz",
          heading: "Memoization and re-renders",
          question:
            "A component is wrapped in React.memo, but it still re-renders on every parent render. The most likely cause is:",
          options: [
            "React.memo only works on class components, not function components.",
            "One or more props passed to it are new references each render (an inline object, array, or function), so the shallow prop comparison never matches.",
            "React.memo has no effect unless the component also calls useMemo internally.",
            "The component has too many props for React.memo's comparison to work correctly.",
          ],
          correctIndex: 1,
          explanation:
            "React.memo compares props shallowly (by reference for objects/arrays/functions). If the parent creates a new object, array, or function literal inline on every render and passes it down, that prop looks \"different\" every time even if its contents are identical — defeating the memoization. Stabilizing those props with useMemo/useCallback (or moving the literal outside the component) is what makes React.memo actually skip the re-render.",
        },
        {
          kind: "summary",
          heading: "Course takeaways",
          bullets: [
            "React is declarative: describe the UI for a given state, and let React reconcile the DOM — don't hand-roll DOM mutations.",
            "Props are read-only input from a parent; state is what a component owns and changes itself. Shared data lives in the closest common ancestor.",
            "useEffect handles anything outside of rendering, and its dependency array must include every value the effect actually reads, or it'll run on stale data.",
            "A re-render isn't automatically a DOM update, and a parent re-rendering cascades to children by default — most re-renders aren't worth fighting.",
            "useMemo, useCallback, and React.memo are targeted tools for a measured performance problem, and each depends on prop/dependency references actually being stable to do anything useful.",
            "Stable, identity-based list keys (not array index) are what let React correctly preserve state across reorders.",
          ],
        },
      ],
    },
  ],
};
