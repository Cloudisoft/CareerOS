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
  ],
};
