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
    {
      title: "Handling Errors: try/except",
      durationMinutes: 8,
      slides: [
        {
          kind: "title",
          heading: "Handling Errors: try/except",
          subheading:
            "Python doesn't make you check for every possible failure up front — it lets you write the normal path first, then wrap specific handling around whatever can actually go wrong.",
        },
        {
          kind: "example",
          heading: "The basic shape: try, then except",
          body: "Code that might fail goes in the try block; the matching except block only runs if that specific error actually happens.",
          language: "python",
          code: `def get_first_item(items):
    try:
        return items[0]
    except IndexError:
        print("The list is empty")
        return None

get_first_item([1, 2, 3])  # 1
get_first_item([])          # prints message, returns None

def parse_age(text):
    try:
        return int(text)
    except ValueError:
        print(f"'{text}' isn't a valid number")
        return None

parse_age("30")      # 30
parse_age("thirty")  # prints message, returns None`,
        },
        {
          kind: "bullets",
          heading: "Catching the right thing, the right way",
          bullets: [
            "Name the exact exception you expect (IndexError, ValueError, KeyError, FileNotFoundError) — it documents exactly what can go wrong, and lets unrelated bugs surface instead of being silently swallowed.",
            "Stack several except blocks to handle different failures differently: except ValueError: ... except TypeError: ....",
            "except Exception as e: catches almost any runtime error and gives you the exception object itself (e) — good for logging, still more targeted than catching literally everything.",
            "A bare except: (no type named at all) catches everything, including a typo'd variable name that raises NameError — avoid it; it turns real bugs into silent no-ops.",
          ],
        },
        {
          kind: "example",
          heading: "else and finally round out the shape",
          body: "else runs only if the try block raised nothing at all; finally always runs, whether or not an exception happened — the standard place for cleanup.",
          language: "python",
          code: `def read_config(path):
    try:
        f = open(path)
    except FileNotFoundError:
        print(f"No config at {path}, using defaults")
        return {}
    else:
        # only reached if open() succeeded — no exception was raised
        contents = f.read()
        f.close()
        return contents
    finally:
        # always runs, success or failure
        print("Finished attempting to read config")`,
        },
        {
          kind: "example",
          heading: "Raising your own exceptions",
          body: "raise lets your own code signal a problem, and a custom exception class (subclassing Exception) documents exactly what went wrong — clearer than reusing a generic one everywhere.",
          language: "python",
          code: `class InsufficientFundsError(Exception):
    """Raised when a withdrawal exceeds the available balance."""
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFundsError(
            f"Cannot withdraw {amount}, balance is only {balance}"
        )
    return balance - amount

try:
    withdraw(100, 150)
except InsufficientFundsError as e:
    print(f"Withdrawal failed: {e}")
# "Withdrawal failed: Cannot withdraw 150, balance is only 100"`,
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "try/except lets you write the normal path first, then handle specific failures around it.",
            "Name the exception type you're catching — a bare except: hides real bugs along with the ones you meant to catch.",
            "else runs only if the try block succeeded; finally always runs, which makes it the right place for cleanup like closing a file.",
            "raise plus a custom exception class (subclassing Exception) lets your own code signal exactly what went wrong.",
          ],
        },
      ],
    },
    {
      title: "Practice: Comprehensions and Exception Handling",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Comprehensions and Exception Handling",
          subheading:
            "Three exercises — turning loops into comprehensions, then handling the kinds of bad input a real function actually has to survive.",
        },
        {
          kind: "practice",
          heading: "Refactor a Loop into a List Comprehension",
          prompt:
            "Refactor this loop into a single list comprehension that builds a list of the even numbers, doubled:\n\nnumbers = [3, 8, 1, 12, 5, 20, 7]\nresult = []\nfor n in numbers:\n    if n % 2 == 0:\n        result.append(n * 2)",
          hint: "The pattern is [expression for item in iterable if condition] — your expression is n * 2, your condition is n % 2 == 0.",
          solution: `numbers = [3, 8, 1, 12, 5, 20, 7]
result = [n * 2 for n in numbers if n % 2 == 0]
# [16, 24, 40] — n * 2 is the expression; n % 2 == 0 filters to evens first`,
        },
        {
          kind: "practice",
          heading: "Build a Dict Comprehension from Tuples",
          prompt:
            "Given a list of (name, score) tuples, write a dict comprehension that maps name to score, including only entries where score is 60 or above:\n\nresults = [(\"Ada\", 92), (\"Sam\", 45), (\"Grace\", 88), (\"Lee\", 59)]",
          hint: "A dict comprehension looks like {key_expr: value_expr for item in iterable if condition} — unpack each tuple as name, score in the for clause.",
          solution: `results = [("Ada", 92), ("Sam", 45), ("Grace", 88), ("Lee", 59)]

passing = {name: score for name, score in results if score >= 60}
# {"Ada": 92, "Grace": 88} — Sam and Lee are filtered out`,
        },
        {
          kind: "practice",
          heading: "A safe_average Function That Doesn't Crash",
          prompt:
            "Write safe_average(numbers) that returns the average of a list of numbers, but returns None (instead of crashing) if the list is empty, and also returns None if the list contains something that isn't a number.",
          hint: "Averaging an empty list raises ZeroDivisionError; summing a list containing a string raises TypeError. Catch both, in the same try block.",
          solution: `def safe_average(numbers):
    try:
        return sum(numbers) / len(numbers)
    except ZeroDivisionError:
        print("Can't average an empty list")
        return None
    except TypeError:
        print("List contains a non-number")
        return None

safe_average([4, 8, 12])   # 8.0
safe_average([])            # prints message, returns None
safe_average([4, "8", 12])  # prints message, returns None`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "A list comprehension's shape is always [expression for item in iterable if condition] — spot those three parts in a loop before trying to compress it.",
            "A dict comprehension follows the same idea with {key: value for ...} — unpacking a tuple directly in the for clause is a common, idiomatic pairing.",
            "Catching ZeroDivisionError and TypeError separately turns a function that would crash on bad input into one that fails predictably and explains why.",
            "Idiomatic Python often means recognizing \"this loop is really a comprehension\" or \"this crash is really a specific, nameable exception\" — not just getting code to run.",
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
            "Five questions across the whole course — types and mutability, classes, comprehensions, and the exception handling you just covered.",
        },
        {
          kind: "quiz",
          heading: "The Mutable Default Argument Trap",
          question:
            "What does the second call return?\n\ndef add_item(item, bucket=[]):\n    bucket.append(item)\n    return bucket\n\nadd_item(\"a\")\nadd_item(\"b\")",
          options: ["['a', 'b']", "['a']", "['b']", "TypeError"],
          correctIndex: 0,
          explanation:
            "The default list [] is created once, when the function is defined — not fresh on every call. Every call that doesn't pass its own bucket shares that same list, so the second call's \"b\" is appended onto what the first call already left behind.",
        },
        {
          kind: "quiz",
          heading: "Tuples vs. Lists",
          question: "Why would you choose a tuple over a list for a function returning (status_code, message)?",
          options: [
            "Tuples are always faster to loop over than lists",
            "Lists cannot hold two different types in Python",
            "Tuples signal the values are a small, fixed, unchanging group, and can't be accidentally mutated afterward",
            "There's no real difference; it's purely stylistic",
          ],
          correctIndex: 2,
          explanation:
            "A tuple's immutability is a signal to readers as much as a restriction — it says \"this is a fixed pairing that belongs together,\" and it rules out a caller accidentally appending to or reordering the result the way they could with a list.",
        },
        {
          kind: "quiz",
          heading: "Reading a Comprehension",
          question: "What does [n for n in range(10) if n % 3 == 0] evaluate to?",
          options: ["[3, 6, 9]", "[0, 3, 6, 9]", "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]", "[1, 2, 4, 5, 7, 8]"],
          correctIndex: 1,
          explanation:
            "range(10) produces 0 through 9. 0 % 3 == 0 is True, so 0 is included along with 3, 6, and 9 — it's easy to forget range starts at 0, not 1, when reading the filtered result.",
        },
        {
          kind: "quiz",
          heading: "What self Actually Is",
          question: "In acct.deposit(50), what determines the value of self inside deposit?",
          options: [
            "self must always be typed out as an argument by the caller",
            "self refers to the Account class itself, not a specific instance",
            "self is optional and can be omitted",
            "self is automatically bound to acct, the instance the method was called on",
          ],
          correctIndex: 3,
          explanation:
            "Python passes the instance a method was called on as its first argument automatically — acct.deposit(50) is really Account.deposit(acct, 50) under the hood, which is why self shows up as a parameter but is never supplied explicitly by the caller.",
        },
        {
          kind: "quiz",
          heading: "The Risk of a Bare except:",
          question: "What's the main risk of writing a bare except: with no exception type named?",
          options: [
            "It only catches exceptions that inherit from ValueError",
            "It's slower than naming a specific exception type",
            "It silently swallows every error, including real bugs like a typo'd variable name, not just the failure you intended to handle",
            "It causes a SyntaxError in Python 3",
          ],
          correctIndex: 2,
          explanation:
            "A bare except: matches literally any exception, including ones you never anticipated — a NameError from a typo, an AttributeError from a bad refactor. That makes a genuine bug in your code look like an expected, already-handled case instead of surfacing as a crash you'd notice.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Types come from values, not declarations, but every value still has one — str, int, float, bool, None.",
            "Lists are ordered and mutable; tuples are ordered and immutable; dicts map keys to values — pick based on whether you need to change it and how you'll look things up.",
            "Watch for the mutable-default-argument trap — a default like bucket=[] is created once and shared across every call that doesn't override it.",
            "List and dict comprehensions compress a simple loop-plus-filter into one readable line — fall back to a plain loop when they'd stop being simple.",
            "try/except/else/finally, plus raising your own exceptions, is how idiomatic Python handles failure without crashing on every bad input.",
          ],
        },
      ],
    },
  ],
};
