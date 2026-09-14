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
          kind: "bullets",
          heading: "Composition: how components combine",
          intro: "Real UIs aren't one component — they're many small ones nested inside each other. A few patterns show up constantly:",
          bullets: [
            "Children as a prop: any component can render whatever's nested between its opening and closing tags via `props.children` — this is how generic wrappers (a Card, a Modal, a Layout) stay agnostic about what's actually inside them.",
            "Composition over configuration: instead of one Button component with fifty boolean props trying to handle every possible variant, most React codebases favor composing smaller, more specific pieces — a PrimaryButton that wraps Button with specific styling, rather than one component trying to branch on every case internally.",
            "A tree, not a list: the browser eventually sees one flat DOM, but your source describes a nested tree of function calls — `<Page><Sidebar /><Content><Article /></Content></Page>` — and that nesting is exactly what the render-commit cycle below walks.",
          ],
        },
        {
          kind: "example",
          heading: "Composing with children",
          body: "Any component can accept whatever JSX is nested inside it via the special `children` prop. This is what makes wrapper components reusable without hardcoding what goes inside them.",
          code: `function Card({ children }) {
  return <div className="card">{children}</div>;
}

// <Card><h2>Title</h2><p>Body text</p></Card>
// Card doesn't know or care what's inside it — it just wraps whatever is passed.`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where the virtual DOM fits",
          body: "React keeps a lightweight in-memory representation of the UI, compares it to the previous version when something changes, and only touches the real DOM where something actually differs. This matters for performance, but it's an implementation detail — you almost never need to think about it directly. The mental model that actually matters day to day is simpler: given this state, what should render?",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where class components fit today",
          body: "Older React code and tutorials often use class components — defined with `class Foo extends React.Component`, using `this.state` and lifecycle methods like `componentDidMount` instead of hooks. Function components with hooks (covered starting next lesson) can do everything class components can, are shorter to write and read, and are what virtually all new React code uses today. You'll still run into class components in older codebases, but there's no real reason to write new ones.",
        },
        {
          kind: "diagram",
          heading: "One trip through the render-commit cycle",
          description: "What actually happens between a state change and the screen updating.",
          steps: [
            { label: "State or props change", detail: "e.g. a setCount call schedules an update" },
            { label: "Render", detail: "React calls the component function to get a new UI description" },
            { label: "Diff", detail: "The new description is compared against the previous one (virtual DOM)" },
            { label: "Commit", detail: "Only the real DOM nodes that actually differ get updated" },
          ],
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
            "Comments inside JSX use a JS comment wrapped in curly braces — `{/* like this */}` — not HTML's `<!-- like this -->`, which would render as literal visible text instead of being stripped out.",
          ],
        },
        {
          kind: "example",
          heading: "Rendering a list with .map()",
          body: "JSX has no built-in loop syntax, so a list is rendered by mapping an array to an array of elements — the same plain-JavaScript-expression approach as the conditional rendering below, just applied to arrays instead of booleans.",
          code: `function ItemList({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Why every list item needs a `key`",
          body: "The `key` prop above isn't optional styling — React uses it to match each rendered item to the same item on the next render. Skip it and React falls back to matching by position, which quietly causes real bugs once a list gets reordered, filtered, or has items inserted or removed from the middle (the \"Why Components Re-render\" lesson later in this course covers exactly why).",
        },
        {
          kind: "bullets",
          heading: "A few more syntax details worth knowing",
          bullets: [
            "Spreading an object onto a JSX element applies each of its properties as an attribute at once: `<input {...inputProps} />` is shorthand for listing every property of inputProps individually as `name={inputProps.name} value={inputProps.value}` and so on.",
            "false, null, undefined, and true all render as nothing at all — this is exactly what makes `{condition && <Thing />}` work: when condition is false, React renders nothing rather than the literal word \"false\" appearing on the page.",
            "Self-closing custom components work the same as built-in tags: `<UserAvatar />` is valid whenever a component doesn't need any children passed into it.",
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
          kind: "example",
          heading: "Fragments avoid extra wrapper elements",
          body: "Wrapping siblings in a `<div>` just to satisfy the single-root-element rule adds a real DOM node that wasn't there before — which can break CSS that assumes a specific parent-child relationship, like a table row or a CSS grid expecting direct children. A Fragment (`<>...</>`) groups elements without adding anything to the actual DOM.",
          code: `// Adds an unwanted <div> around each row, breaking a table that expects
// <td> elements to be direct children of <tr>
function TableRow({ label, value }) {
  return (
    <div>
      <td>{label}</td>
      <td>{value}</td>
    </div>
  );
}

// Groups them with no extra DOM node at all
function TableRow({ label, value }) {
  return (
    <>
      <td>{label}</td>
      <td>{value}</td>
    </>
  );
}

// The shorthand <> can't take a key — use the full name when mapping a
// list of fragments
items.map((item) => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </React.Fragment>
));`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Inline styles take an object, not a CSS string",
          body: "The `style` prop takes a JavaScript object with camelCase property names, not a CSS string — `style={{ backgroundColor: 'coral', fontSize: 14 }}`, not `style=\"background-color: coral; font-size: 14px\"`. Numeric values are treated as pixels for most properties. The double curly braces just mean an object literal (inner) inside a JSX expression (outer). Most real projects reach for CSS modules or a CSS-in-JS library instead, but inline styles remain the simplest option when a value is computed dynamically per render.",
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
          kind: "text",
          heading: "Giving props sensible defaults",
          body: [
            "Not every prop needs to be required. A default value keeps a component usable without every caller having to pass every option explicitly: `function Counter({ label = \"Count\", step = 1 })` falls back to those values whenever a caller omits them.",
            "This is plain JavaScript default-parameter syntax applied to a destructured props object — nothing React-specific about it — but it's the idiomatic way a component signals \"this is optional, and here's what happens if you don't set it.\"",
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
          kind: "bullets",
          heading: "Prop drilling, and when it's worth solving",
          intro: "Lifting state up works cleanly for two or three levels of nesting. It gets uncomfortable past that:",
          bullets: [
            "Passing a prop through several intermediate components that don't use it themselves — just to get it to a deeply nested child — is called prop drilling. Every intermediate component now has to know about data it doesn't actually care about.",
            "For a small amount of drilling, it's usually still the right call: explicit data flow, even a little repetitive, is easier to trace through a codebase than a hidden alternative.",
            "For state genuinely needed by many components scattered across the tree (a logged-in user, a theme setting), React's Context API exists specifically to skip the drilling — outside this course's scope, but worth knowing it's the next tool to reach for once lifting state up gets unwieldy.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Don't mirror a prop into state",
          body: "A common early mistake: copying an incoming prop into state with `useState(initialValue)`, intending to keep the two in sync. They immediately diverge — updating the prop later does not update the state you copied from it once, so the component quietly keeps showing stale data unless you add an effect just to resync them, which is fragile and easy to get subtly wrong. If a value can be computed directly from props, compute it during render instead of storing a separate copy in state at all — there's nothing to keep in sync if there was never a second copy.",
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Don't mutate props",
          body: "Reassigning or mutating a prop directly (`props.items.push(x)`, `props.value = 5`) works in JavaScript but breaks React's assumptions — the parent doesn't know the change happened, and React won't reliably re-render to reflect it. If a child needs to change something, it should call a function passed down from the parent, which updates the parent's own state.",
        },
        {
          kind: "text",
          heading: "State colocation: keeping state close to where it's used",
          body: [
            "State doesn't have to live at the top of your component tree just because it's easy to lift there. If only one component (and none of its siblings) ever reads or updates a piece of state, it should live inside that component, not in some distant ancestor \"just in case\" something else needs it later.",
            "Lifting state further up than necessary has a real cost: every state change re-renders the ancestor holding it, and by default every child underneath that ancestor re-renders too (the next lesson covers exactly why). A search input's own typed-but-not-yet-submitted value, a dropdown's open/closed flag, a modal's current tab — these are classic candidates for local state, not global or lifted state, because nothing outside that one component actually cares about them.",
          ],
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
          kind: "example",
          heading: "Functional updates avoid stale state",
          body: "Calling the setter with a function instead of a plain value receives the actual latest state as its argument, rather than whatever value was in scope when the handler was created. This matters most when an update depends on the previous value, especially across a rapid sequence of calls.",
          code: `// Risky if called multiple times before a re-render commits — each call
// closes over the same "count" from when the function was defined:
setCount(count + 1);

// Safer: always operates on the actual latest value, not a captured one
setCount((prevCount) => prevCount + 1);

function addThree() {
  setCount((c) => c + 1);
  setCount((c) => c + 1);
  setCount((c) => c + 1); // this reliably adds 3, the value-based version wouldn't
}`,
        },
        {
          kind: "example",
          heading: "Lazy initial state for an expensive computation",
          body: "Passing a function to useState, instead of a computed value directly, means that function runs exactly once — on the first render — instead of being recomputed and immediately discarded on every subsequent re-render.",
          code: `// expensiveParse() runs on every single render, even though only the first result is ever used
const [data, setData] = useState(expensiveParse(rawInput));

// expensiveParse() runs exactly once, on mount
const [data, setData] = useState(() => expensiveParse(rawInput));`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "React batches state updates",
          body: "Multiple setState calls inside the same event handler are batched into a single re-render rather than one re-render per call — React 18 extended this batching to cover updates inside promises, timeouts, and native event listeners too, not just React's own handlers. This is why the addThree example above causes only one re-render, not three, and why reading a state variable immediately after calling its setter still shows the old value — the update has been scheduled, not applied yet.",
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
          kind: "bullets",
          heading: "Two more useEffect mistakes beyond a missing dependency",
          bullets: [
            "An object or array literal recreated fresh every render (`[{ id }]`, `[items.filter(x => x.active)]`) never equals the previous render's version by reference, so the effect re-runs on every single render — an infinite loop if the effect itself triggers another re-render.",
            "Forgetting a cleanup function for anything that persists past one render — a subscription, an interval, an event listener — leaks it: the component unmounts, but the subscription keeps running and can reference state that no longer exists.",
            "Not every side effect belongs in useEffect at all: something that only needs to happen in direct response to a specific user action (a click, a form submit) belongs in that event handler itself, not in an effect watching for the state that handler happens to set.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "You often don't need an effect at all",
          body: "A surprisingly large share of useEffect bugs come from reaching for an effect where none was needed. If a value can be computed directly from existing props or state, compute it during render — no effect required. If something needs to happen in response to a specific user action, put it directly in that event handler, not in an effect that watches for the state the handler happens to set. Effects exist specifically for synchronizing with something outside React — a server, a subscription, a timer, the DOM — not as a general-purpose \"do this when something changes\" mechanism. React's own docs have an entire page titled \"You Might Not Need an Effect\" for exactly this reason.",
        },
        {
          kind: "example",
          heading: "useLayoutEffect: the rare case useEffect fires too late",
          body: "useEffect runs after the browser has already painted the new frame, which is what you want almost all the time — it doesn't block the screen from updating. useLayoutEffect runs synchronously before the browser paints, which matters only when an effect needs to measure or mutate the DOM in a way that would otherwise cause a visible flicker.",
          code: `// useEffect: the user can briefly see the tooltip in the wrong spot
// before this measurement-and-reposition logic corrects it after paint
useEffect(() => {
  const rect = tooltipRef.current.getBoundingClientRect();
  setPosition(computePosition(rect));
}, []);

// useLayoutEffect: measurement and reposition happen before the browser
// paints, so there's no flicker to begin with
useLayoutEffect(() => {
  const rect = tooltipRef.current.getBoundingClientRect();
  setPosition(computePosition(rect));
}, []);`,
        },
        {
          kind: "bullets",
          heading: "Multiple state variables vs. one object",
          intro: "Calling useState several times for independent values, versus once with an object holding several fields — both work, but they solve different problems:",
          bullets: [
            "Independent `useState` calls when the values genuinely change independently — updating one never needs to know about the others, and you don't accidentally overwrite fields you didn't mean to touch.",
            "One object in state when the values are tightly related and usually updated together (form fields, an x/y coordinate) — but the setter replaces the whole object, so updating one field means spreading the rest: `setValues(prev => ({ ...prev, email: newEmail }))`.",
            "Forgetting to spread the previous object is one of the most common useState bugs: `setValues({ email: newEmail })` silently discards every other field that was in the object before.",
          ],
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
          kind: "bullets",
          heading: "A couple of other common events worth knowing",
          bullets: [
            "onKeyDown fires for every key press and exposes which key via `e.key` — commonly used to submit a search on Enter, or close a modal on Escape.",
            "onBlur fires when a field loses focus — a common place to run validation that would be distracting to show on every single keystroke, like flagging an email field as empty only once someone's actually done typing in it.",
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
          heading: "One handler for many fields",
          body: "Instead of a separate onChange handler per field, a single handler keyed off `e.target.name` scales to any number of fields without repeating the same three lines for each one.",
          code: `function SignupForm() {
  const [values, setValues] = useState({ email: "", password: "" });

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form>
      <input name="email" value={values.email} onChange={handleChange} />
      <input name="password" type="password" value={values.password} onChange={handleChange} />
    </form>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "Checkboxes, radios, and selects work slightly differently",
          bullets: [
            "A checkbox's controlled value is `checked`, not `value`, and its onChange reads `e.target.checked` (a boolean) instead of `e.target.value`.",
            "A `<select>` is controlled the same way as a text input — `value` goes on the select itself, matched against the `value` of whichever `<option>` should be selected.",
            "Radio buttons in the same group share a `name` and are each controlled by comparing their own value against one shared piece of state: `checked={selected === \"option-a\"}` on each radio, driven by a single selected variable.",
          ],
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
          kind: "callout",
          tone: "tip",
          heading: "Client-side validation is a UX nicety, not a security boundary",
          body: "Disabling a submit button until a field looks valid, or showing an inline error while someone types, meaningfully improves the experience — but any request can bypass the browser entirely (curl, a modified request, a malicious client), so the server must independently validate and reject bad data regardless of what the form allowed through. Treat client-side validation as helpful feedback for honest users, not protection against dishonest ones.",
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
        {
          kind: "example",
          heading: "Disabling submit while a request is in flight",
          body: "A form that can be submitted multiple times before the first request finishes is a common source of duplicate orders, duplicate signups, and duplicate anything-with-side-effects. Tracking an `isSubmitting` flag and disabling the button (and ideally the fields) while it's true is a small addition that prevents a real class of bugs.",
          code: `function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitLogin({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}`,
        },
        {
          kind: "bullets",
          heading: "Accessible forms, briefly",
          intro: "A form that only works visually excludes real users. A few habits cost little and matter a lot:",
          bullets: [
            "Every input needs an associated `<label>` — either wrapping the input, or connected via `htmlFor` matching the input's `id`. A placeholder is not a substitute for a label; it disappears the moment someone starts typing.",
            "`aria-invalid` plus an associated error message (referenced via `aria-describedby`) let a screen reader announce a validation error the same way sighted users see a red border and text.",
            "A submit button should be a real `<button type=\"submit\">`, not a `<div>` with an onClick — that's what makes the form submittable by pressing Enter in a field, and reachable via keyboard navigation at all.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Debouncing input before it triggers a network request",
          body: "Wiring a search box's onChange straight to a fetch call sends a request on every keystroke — wasteful, and prone to showing stale results if a slower earlier request resolves after a faster later one. The common fix is debouncing: wait for a short pause in typing (a few hundred milliseconds) before firing the request, using a `setTimeout` set up inside a `useEffect` keyed on the query, with the effect's cleanup clearing that timeout so only the most recent pause actually triggers a fetch.",
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
          kind: "diagram",
          heading: "Why Child re-renders even though nothing changed for it",
          description: "A parent's state change cascades to its children by default, regardless of their own props.",
          steps: [
            { label: "Parent state changes", detail: "setCount(count + 1) runs inside Parent" },
            { label: "Parent re-renders", detail: "React re-runs Parent's function" },
            { label: "Child re-renders too", detail: "Every child re-renders by default when its parent does" },
            { label: "Diff & commit", detail: "The real DOM updates only where the description actually changed" },
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "\"Re-render\" is not the same as \"DOM update\"",
          body: "When a component re-renders, React re-runs its function to get a new description of the UI — that's cheap. It then compares that description to the previous one and only touches the real DOM where something actually changed. So a component can re-render often without causing visible or expensive DOM work; the two are related but distinct, and it's usually not worth optimizing against re-renders until you've confirmed they're actually causing a real performance problem.",
        },
        {
          kind: "example",
          heading: "Changing key remounts a component entirely",
          body: "React matches a component across renders by its key (and position and type). Deliberately changing that key is a common, deliberate trick to force a full reset — React treats the new key as a brand new component instance rather than updating the existing one, so all of that component's own state resets.",
          code: `// Same UserForm component, but a brand new instance — and fresh internal
// state — every time userId changes, instead of updating in place
<UserForm key={userId} userId={userId} />`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why components seem to render twice in development",
          body: "In development, React's StrictMode intentionally renders many components twice in a row to help surface components with impure render logic — side effects happening during render, or mutating something a render shouldn't. This is development-only behavior and does not happen in production, so counting console.log calls while running the dev server can overstate how often a component actually re-renders for real users.",
        },
        {
          kind: "bullets",
          heading: "How to actually observe a re-render, not just reason about it",
          bullets: [
            "A console.log at the top of a component's body (not inside an event handler or effect) logs on every render of that component — the simplest way to check your mental model of when something re-renders against what's actually happening.",
            "React DevTools' Profiler tab records a session and highlights which components rendered and why — props changed, state changed, a parent re-rendered — the practical tool for finding a real, measured re-render problem worth fixing, instead of guessing from reading code.",
          ],
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
          kind: "example",
          heading: "Changing an element's type also resets state, not just changing key",
          body: "It's not just an explicit key change that resets a component's state — swapping which type of element sits in a given spot in the tree does the same thing, since React can't meaningfully preserve state across two entirely different element types occupying the same position.",
          code: `// isEditing flips between an <input> and a <span> occupying the same
// spot — that's two different element types, not one element whose
// content changes, so any local state inside EditableField remounts too
function EditableField({ isEditing, value }) {
  return isEditing ? (
    <input defaultValue={value} />
  ) : (
    <span>{value}</span>
  );
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A subtle case: defining a component inline",
          body: "Defining a component function inside another component's body — instead of at module scope — creates a brand new function (and therefore a brand new component type, from React's perspective) on every single render of the parent. React sees a \"different\" component type at that position each time and remounts it from scratch, discarding any state inside it, rather than updating it in place. This is a real, easy-to-make mistake, not just a style preference: always define components at the top level of a file, never inside another component's function body.",
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
          kind: "chart",
          heading: "RowButton re-renders across 10 unrelated theme toggles",
          description: "Same list of rows, only the theme changes each time — RowButton's props never actually change.",
          chartType: "bar",
          unit: "re-renders",
          data: [
            { label: "Without useCallback", value: 10 },
            { label: "With useCallback + React.memo", value: 0 },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Memoization is not free, and it's not the default you should reach for first",
          body: "Every useMemo and useCallback call costs a comparison and a bit of retained memory, and React.memo costs a props comparison on every parent render. Wrapping everything in memoization by default usually makes code harder to read without measurably helping performance — most components are cheap enough that re-rendering them is a non-issue. Reach for these tools when you've identified a specific, measured slowdown (a large list, an expensive computation, a component that's costly enough that skipping its render actually matters), not as a reflexive habit applied to every component you write.",
        },
        {
          kind: "example",
          heading: "Often a cheaper fix than memoization: restructure instead",
          body: "The expensive-render problem sometimes isn't really a memoization problem at all — it's that an expensive component sits underneath state that changes often. Passing it in as `children` instead means a different, non-re-rendering component creates it, so React doesn't need to re-render it just because a sibling's state changed, with no memoization involved.",
          code: `// ExpensiveChart re-renders every time isOpen toggles, because it's
// created fresh inside Panel's own render function every single time
function Panel() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "Open"}</button>
      {isOpen && <ExpensiveChart />}
    </div>
  );
}

// ExpensiveChart is created once by whoever renders Panel, and passed down
// as children — Panel's own re-renders don't recreate or re-render it at all
function Panel({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "Open"}</button>
      {isOpen && children}
    </div>
  );
}
// <Panel><ExpensiveChart /></Panel>`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A dependency array mistake that silently defeats memoization",
          body: "useMemo and useCallback compare dependency arrays the same way useEffect does — by reference for objects, arrays, and functions. Passing a freshly created object as a dependency (`useMemo(() => x, [{ id }])`) recreates that dependency every render, so the cache never actually hits. The values inside the array need to themselves be stable (primitives, or things already memoized) for the memoization to do anything at all.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Memoization is a hint, not a guarantee",
          body: "useMemo and useCallback are documented as a performance optimization, not a semantic guarantee — React is allowed, in principle, to discard a memoized value and recompute it anyway, for instance under future concurrent-rendering features that trade memory for responsiveness. Never rely on useMemo to skip a computation for correctness reasons, like avoiding a side effect from running — only ever rely on it for performance, and make sure the surrounding code stays correct even on a render where the \"memoized\" value gets recomputed anyway.",
        },
        {
          kind: "text",
          heading: "useMemo isn't only for expensive computations",
          body: [
            "So far useMemo has been about skipping a genuinely slow computation. It has a second common use: keeping an object or array's reference stable across renders when that reference matters downstream — as a dependency of another hook, or as a prop into a memoized child — even when computing the object itself is trivially cheap.",
            "The `sortAndFilter` example earlier in this lesson skips real work. Memoizing a small `{ min, max }` object passed down as a filter-range prop skips nothing computationally, but keeps `React.memo` on the child actually effective — the same trick that made useCallback necessary above applies just as much to plain object and array props.",
          ],
        },
        {
          kind: "example",
          heading: "A cheap object still needs memoizing if its identity matters downstream",
          body: "React.memo compares props by reference, not by deep equality — so even a trivially cheap-to-build object needs useMemo if a memoized child depends on that reference staying the same across renders where its values haven't changed.",
          code: `function Dashboard({ min, max }) {
  // Trivially cheap to compute, but a brand-new object every render —
  // FilterPanel's React.memo will never see it as "the same" range
  const range = { min, max };
  return <FilterPanel range={range} />;
}

// Fixed: same values in, same object reference out, across renders
// where min and max haven't actually changed
function Dashboard({ min, max }) {
  const range = useMemo(() => ({ min, max }), [min, max]);
  return <FilterPanel range={range} />;
}`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Where this is headed: the React Compiler",
          body: "A newer React Compiler (shipped as part of React 19's toolchain) analyzes your component code at build time and inserts equivalent memoization automatically, for components that follow React's rules — meaning manually sprinkling useMemo and useCallback throughout a codebase is increasingly something tooling can do for you rather than something you hand-write everywhere. It doesn't remove the value of understanding what memoization actually does and why — you still need that to reason about a component's behavior, debug a stale-value bug, or work in the many existing codebases the compiler doesn't cover — but it's worth knowing this manual pattern is trending toward becoming largely automatic for compiler-adopting projects.",
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
          kind: "chart",
          heading: "Filter/sort recomputations across 10 filter-panel toggles",
          description: "Toggling showFilters changes state, but not items or query — the computation shouldn't rerun for it at all.",
          chartType: "bar",
          unit: "recomputations of the 10,000-item list",
          data: [
            { label: "Without useMemo", value: 10 },
            { label: "With useMemo([items, query])", value: 0 },
          ],
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
          kind: "practice",
          heading: "4. A context update that re-renders far more than it should",
          prompt:
            "`AppContext` bundles the current user, the theme, and a `notifications` array together in one context value. Every component that reads any part of this context — including `UserBadge`, which only ever reads `user` — re-renders every few seconds whenever a new notification arrives, even though `user` never changes. Explain why this happens and fix it, without removing context or duplicating the notifications logic elsewhere.\n\n```jsx\nconst AppContext = createContext(null);\n\nfunction AppProvider({ children }) {\n  const [user, setUser] = useState(currentUser);\n  const [theme, setTheme] = useState(\"light\");\n  const [notifications, setNotifications] = useState([]);\n\n  useEffect(() => {\n    const unsubscribe = subscribeToNotifications((n) => {\n      setNotifications((prev) => [...prev, n]);\n    });\n    return unsubscribe;\n  }, []);\n\n  const value = { user, setUser, theme, setTheme, notifications };\n  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;\n}\n\nfunction UserBadge() {\n  const { user } = useContext(AppContext);\n  return <span>{user.name}</span>;\n}\n```",
          hint:
            "A context consumer re-renders whenever the context's value changes at all — React has no way to know UserBadge only cares about one field of a bundled object. What changes every time a notification arrives, and does UserBadge actually depend on it?",
          solution:
            "Every consumer of a context re-renders whenever the provider passes a new value, regardless of which specific field that consumer actually reads — React.memo and useMemo don't apply inside a context read the way they do to props. Here, `value` is a brand-new object on every render of AppProvider (including the ones triggered purely by a new notification arriving), so every consumer — UserBadge included — re-renders even though `user` itself never changed. This is a common, easy-to-miss cause of re-render fan-out: one fast-changing piece of state bundled into the same context as several slow-changing ones drags every consumer of the slow-changing ones along with it.\n\nFix: split the single bundled context into separate contexts by how often each piece actually changes, so a component reading only `user` never re-renders because a notification arrived.\n\n```jsx\nconst UserContext = createContext(null);\nconst ThemeContext = createContext(null);\nconst NotificationsContext = createContext(null);\n\nfunction AppProvider({ children }) {\n  const [user, setUser] = useState(currentUser);\n  const [theme, setTheme] = useState(\"light\");\n  const [notifications, setNotifications] = useState([]);\n\n  useEffect(() => {\n    const unsubscribe = subscribeToNotifications((n) => {\n      setNotifications((prev) => [...prev, n]);\n    });\n    return unsubscribe;\n  }, []);\n\n  return (\n    <UserContext.Provider value={{ user, setUser }}>\n      <ThemeContext.Provider value={{ theme, setTheme }}>\n        <NotificationsContext.Provider value={notifications}>\n          {children}\n        </NotificationsContext.Provider>\n      </ThemeContext.Provider>\n    </UserContext.Provider>\n  );\n}\n\nfunction UserBadge() {\n  const { user } = useContext(UserContext); // never re-renders on a new notification now\n  return <span>{user.name}</span>;\n}\n```\nKey decision: the fix is architectural, not a memoization trick — no amount of useMemo or React.memo on UserBadge itself would have helped, since the problem was the shape of the context, not anything UserBadge was doing wrong. Splitting by change frequency (rarely-changing user and theme, separate from frequently-changing notifications) is the general pattern, not just a fix specific to this one case.",
        },
        {
          kind: "chart",
          heading: "UserBadge re-renders across 20 incoming notifications",
          description: "UserBadge never reads notifications at all — with one shared context, it pays for every update anyway.",
          chartType: "bar",
          unit: "re-renders",
          data: [
            { label: "One bundled context", value: 20 },
            { label: "Split by change frequency", value: 0 },
          ],
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "Recognizing that React.memo only helps when the props it compares are reference-stable, and pairing it with useCallback where needed.",
            "Using useMemo for a genuinely expensive computation, with a dependency array limited to what the computation actually reads.",
            "Understanding that `key` controls component identity across renders, not just list rendering — and that index-as-key is specifically dangerous once a list can reorder.",
            "Recognizing that every consumer of a context re-renders on any change to that context's value, regardless of which field it actually reads — and that splitting a context by how often its pieces change is the fix, not a memoization hook.",
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
