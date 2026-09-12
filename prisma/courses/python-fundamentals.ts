import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "python-fundamentals",
  title: "Python Fundamentals",
  description:
    "A practical first pass at Python — variables and types, the core data structures, control flow, functions, classes, and the idioms that make code read like Python instead of a translation from another language.",
  category: "Programming",
  level: "BEGINNER",
  order: 12,
  lessons: [
    {
      title: "Variables and Types",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Variables and Types",
          subheading:
            "Python doesn't make you declare a type up front — but every value still has one, and knowing them is the difference between code that works and code that guesses.",
        },
        {
          kind: "example",
          heading: "Assignment needs no type keyword",
          body: "There's no let, const, or var — you just assign. The type comes from the value, and can change if you reassign a variable to something else entirely.",
          language: "python",
          code: `name = "Ada"
age = 30
height = 1.7
is_active = True

print(type(name))   # <class 'str'>
print(type(age))    # <class 'int'>
print(type(height)) # <class 'float'>`,
        },
        {
          kind: "bullets",
          heading: "The core built-in types",
          bullets: [
            "str — text: \"hello\" or 'hello' (Python doesn't distinguish quote style).",
            "int — whole numbers, with no size limit imposed by the language itself.",
            "float — decimal numbers: 3.14, -0.5.",
            "bool — True or False (capitalized — this trips up people coming from other languages).",
            "None — Python's explicit \"no value,\" equivalent to null/undefined in other languages.",
          ],
        },
        {
          kind: "example",
          heading: "f-strings are the standard way to build text",
          body: "Prefix a string with f and drop expressions directly inside curly braces. This is the idiomatic way to combine text and values in modern Python.",
          language: "python",
          code: `name = "Ada"
age = 30
print(f"{name} is {age} years old")
print(f"Next year: {age + 1}")`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Whitespace is not a style choice — it's syntax",
          body: "Indentation defines blocks of code in Python — there are no curly braces. Mixing tabs and spaces, or indenting inconsistently, causes an IndentationError or, worse, code that runs but groups differently than it looks like it does. Pick spaces (4 is the convention) and let your editor handle it.",
        },
      ],
    },
    {
      title: "Lists, Dicts, and Tuples",
      durationMinutes: 9,
      slides: [
        {
          kind: "title",
          heading: "Lists, Dicts, and Tuples",
          subheading:
            "Three data structures cover almost everything you'll build with in Python. Knowing which one fits a given problem is a core skill, not a detail.",
        },
        {
          kind: "example",
          heading: "Lists: ordered, and changeable",
          body: "A list holds an ordered sequence of items and can be modified after creation — items added, removed, or changed in place.",
          language: "python",
          code: `fruits = ["apple", "banana", "cherry"]
fruits.append("date")        # ["apple", "banana", "cherry", "date"]
fruits.remove("banana")      # ["apple", "cherry", "date"]
print(fruits[0])              # "apple"
print(fruits[-1])             # "date" — negative indexes count from the end
print(len(fruits))            # 3`,
        },
        {
          kind: "example",
          heading: "Dictionaries: key-value pairs",
          body: "A dict maps keys to values — the everyday structure for anything you'd otherwise call a record or an object.",
          language: "python",
          code: `user = {"name": "Ada", "age": 30, "role": "engineer"}

print(user["name"])          # "Ada"
user["age"] = 31              # update a value
user["email"] = "ada@x.com"   # add a new key

for key, value in user.items():
    print(f"{key}: {value}")`,
        },
        {
          kind: "bullets",
          heading: "Tuples: like a list, but locked",
          bullets: [
            "Written with parentheses instead of brackets: coords = (40.7, -74.0).",
            "Immutable — once created, its items can't be reassigned or added to.",
            "Used for fixed, small groupings where the meaning depends on position, like a coordinate pair or a (name, age) record.",
            "Slightly faster and safer than a list when you're not going to change the contents — the immutability is a signal to readers, not just a restriction.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Picking between them",
          body: "Reach for a list when you have an ordered collection you'll add to or change. Reach for a dict when you're looking things up by name. Reach for a tuple when you have a small, fixed group of values that belong together and shouldn't change — like a function returning both a result and a status.",
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
            "Branching and looping in Python read close to plain English — that's a deliberate design choice, not an accident.",
        },
        {
          kind: "example",
          heading: "if / elif / else",
          language: "python",
          code: `age = 20

if age < 13:
    category = "child"
elif age < 20:
    category = "teen"
else:
    category = "adult"

print(category)  # "adult"`,
        },
        {
          kind: "example",
          heading: "for loops iterate directly over values",
          body: "Python's for loop doesn't count indexes by default — it hands you each item directly. Use enumerate() when you need the index too.",
          language: "python",
          code: `fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)

for index, fruit in enumerate(fruits):
    print(f"{index}: {fruit}")

for n in range(3):     # 0, 1, 2
    print(n)`,
        },
        {
          kind: "bullets",
          heading: "Truthiness and everyday shortcuts",
          bullets: [
            "Falsy values: False, 0, 0.0, \"\" (empty string), [] (empty list), {} (empty dict), None.",
            "if my_list: checks for a non-empty list directly — no need for if len(my_list) > 0:.",
            "in checks membership cleanly: if \"a\" in \"apple\" or if item in my_list.",
            "while loops exist too, but for is far more common in idiomatic Python.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "No switch statement (until recently)",
          body: "Older Python has no switch/case — you'd use if/elif chains, or a dict mapping values to functions. Python 3.10 added match/case, which handles this more cleanly, but if/elif is still the more universally supported and common pattern for straightforward branching.",
        },
      ],
    },
    {
      title: "Functions",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Functions",
          subheading:
            "The same tool from every other language — named, reusable behavior — with a few Python-specific conveniences worth learning early.",
        },
        {
          kind: "example",
          heading: "Defining and calling a function",
          language: "python",
          code: `def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Ada"))              # "Hello, Ada!"
print(greet("Ada", "Hi"))        # "Hi, Ada!"
print(greet(name="Ada", greeting="Hey"))  # named arguments, any order`,
        },
        {
          kind: "bullets",
          heading: "Parameters, defaults, and keyword arguments",
          bullets: [
            "def function_name(params): — no return type or parameter types required (though they can be added, covered in more advanced material).",
            "Default values (greeting=\"Hello\") make a parameter optional.",
            "Arguments can be passed positionally or by keyword (name=\"Ada\") — keyword arguments make calls with several parameters far more readable.",
            "*args collects extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict — you'll see these in library code often.",
          ],
        },
        {
          kind: "example",
          heading: "Functions can return more than one value",
          body: "This isn't a special feature — Python is quietly packing multiple values into a tuple and unpacking them on the other side. It's an extremely common pattern.",
          language: "python",
          code: `def min_max(numbers):
    return min(numbers), max(numbers)

lowest, highest = min_max([4, 1, 9, 2])
print(lowest, highest)  # 1 9`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Mutable default arguments are a classic trap",
          body: "def add_item(item, bucket=[]): looks reasonable but is a real bug — the same list is reused across every call that doesn't pass its own bucket, so items silently pile up between calls. The fix: default to None and create the list inside the function: def add_item(item, bucket=None): bucket = bucket or [].",
        },
      ],
    },
    {
      title: "Intro to Classes",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Intro to Classes",
          subheading:
            "A class bundles data and the behavior that operates on it. You won't need one for every script, but they're everywhere once a program grows past a handful of functions.",
        },
        {
          kind: "example",
          heading: "A minimal class",
          body: "__init__ runs when an object is created and sets up its initial state. self refers to the specific instance a method is being called on — every instance method takes it as its first parameter.",
          language: "python",
          code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def __str__(self):
        return f"{self.owner}'s account: \${self.balance}"

acct = Account("Ada", 100)
acct.deposit(50)
print(acct)  # "Ada's account: $150"`,
        },
        {
          kind: "bullets",
          heading: "The vocabulary",
          bullets: [
            "Class — the blueprint (Account).",
            "Instance — a specific object built from that blueprint (acct).",
            "Attribute — a piece of data stored on an instance (self.owner, self.balance).",
            "Method — a function defined inside a class that operates on an instance (deposit).",
            "self — the instance itself; Python passes it automatically when you call acct.deposit(50), you never pass it explicitly.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "When a class actually earns its place",
          body: "Reach for a class when you have data and behavior that clearly belong together and you'll need more than one instance of it — a bank account, a game character, a parsed request. If you just need to group a few functions that share no real state, a module of plain functions is often simpler and more idiomatically Python.",
        },
        {
          kind: "example",
          heading: "Inheritance, briefly",
          body: "A subclass gets everything the parent class has, and can override or add to it. This is a deep topic — the goal here is just to recognize the syntax.",
          language: "python",
          code: `class SavingsAccount(Account):
    def __init__(self, owner, balance=0, rate=0.02):
        super().__init__(owner, balance)
        self.rate = rate

    def apply_interest(self):
        self.balance += self.balance * self.rate`,
        },
      ],
    },
    {
      title: "Writing Idiomatic Python",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Writing Idiomatic Python",
          subheading:
            "Code that runs and code that reads like Python are two different bars. This lesson is about the second one — the patterns experienced Python developers reach for by habit.",
        },
        {
          kind: "example",
          heading: "List comprehensions replace a lot of manual loops",
          body: "A comprehension builds a new list in one line from an existing iterable. It's usually more readable than the equivalent loop once you're used to reading it — and it's everywhere in real Python code.",
          language: "python",
          code: `numbers = [1, 2, 3, 4, 5, 6]

# The loop version
squares = []
for n in numbers:
    if n % 2 == 0:
        squares.append(n * n)

# The idiomatic version
squares = [n * n for n in numbers if n % 2 == 0]
# [4, 16, 36]`,
        },
        {
          kind: "bullets",
          heading: "A few more habits worth adopting early",
          bullets: [
            "Unpacking: a, b = b, a swaps two values in one line — no temporary variable needed.",
            "enumerate() instead of manually tracking an index in a loop.",
            "with open(\"file.txt\") as f: — the with block guarantees the file is closed even if an error happens inside it.",
            "PEP 8 naming: snake_case for variables and functions, PascalCase for classes — the near-universal Python style convention.",
          ],
        },
        {
          kind: "example",
          heading: "Dict comprehensions follow the same idea",
          language: "python",
          code: `names = ["ada", "grace", "linus"]

name_lengths = {name: len(name) for name in names}
# {"ada": 3, "grace": 5, "linus": 5}`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Don't force a comprehension where a loop reads better",
          body: "A comprehension nested two or three levels deep, or one with a complicated condition, often reads worse than a plain for loop with a clear if inside it. The idiom is meant to improve clarity, not to prove you can fit logic on one line — if it takes longer to parse than a loop would, write the loop.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Types come from values, not declarations — but they're still there, and type() and f-strings help you reason about them.",
            "Lists for ordered, changeable data; dicts for lookups by key; tuples for small, fixed groupings.",
            "Indentation is syntax — be consistent, and let your editor enforce it.",
            "Watch for the mutable-default-argument trap in your own functions.",
            "List and dict comprehensions are idiomatic when they stay simple — fall back to a loop when they don't.",
          ],
        },
      ],
    },
  ],
};
