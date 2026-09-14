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
          kind: "terminal",
          heading: "Confirming it in the Python REPL",
          description: "Typing the same assignments straight into python3 shows exactly what the comments above claim.",
          lines: [
            { text: "python3" },
            { text: ">>> name = \"Ada\"", output: true },
            { text: ">>> age = 30", output: true },
            { text: ">>> height = 1.7", output: true },
            { text: ">>> type(name)", output: true },
            { text: "<class 'str'>", output: true },
            { text: ">>> type(age)", output: true },
            { text: "<class 'int'>", output: true },
            { text: ">>> type(height)", output: true },
            { text: "<class 'float'>", output: true },
          ],
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
        {
          kind: "example",
          heading: "Converting between types explicitly",
          body: "Python won't silently convert types for you the way some looser languages do — adding a string and a number with + raises a TypeError instead of guessing what you meant. When you actually need to convert, the built-in constructors do it explicitly: int(), float(), str(), and bool().",
          language: "python",
          code: `age = 30
message = "Age: " + str(age)   # must convert explicitly
# "Age: " + age would raise: TypeError: can only concatenate str (not "int") to str

num = int("42")        # 42
num2 = int("42.5")     # ValueError: invalid literal for int() with base 10: '42.5'
pi = float("3.14")      # 3.14
flag = bool("")          # False — empty string is falsy
flag2 = bool("False")    # True — any non-empty string is truthy, even the word "False"`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Floats are approximations, not exact decimals",
          body: "Under the hood, a Python float is a 64-bit binary floating-point number, and most decimal fractions simply can't be represented exactly in binary — the same way 1/3 has no exact, finite decimal form. That's why 0.1 + 0.2 evaluates to 0.30000000000000004 instead of 0.3. This isn't a Python bug — it's IEEE 754, the floating-point standard nearly every mainstream language uses. int, by contrast, has no fixed size limit in Python; it grows as large as memory allows, with no overflow. For money or anything that needs exact decimal arithmetic, reach for the decimal module instead of float.",
        },
        {
          kind: "terminal",
          heading: "Seeing float imprecision firsthand",
          description: "This isn't a hypothetical — try it in any Python REPL and you'll get the same result every time.",
          lines: [
            { text: "python3" },
            { text: ">>> 0.1 + 0.2", output: true },
            { text: "0.30000000000000004", output: true },
            { text: ">>> 0.1 + 0.2 == 0.3", output: true },
            { text: "False", output: true },
            { text: ">>> round(0.1 + 0.2, 2) == 0.3", output: true },
            { text: "True", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Checking a type the idiomatic way",
          intro: "type() works, but it's rarely the tool experienced Python developers reach for first.",
          bullets: [
            "isinstance(value, int) is the standard way to check a type — prefer it over type(value) == int, since isinstance also correctly recognizes subclasses of the type you're checking for.",
            "isinstance accepts a tuple for an either/or check in one call: isinstance(value, (int, float)).",
            "Python's philosophy leans toward EAFP — \"Easier to Ask Forgiveness than Permission.\" Idiomatic code often tries the operation and catches the exception if it fails, rather than checking every precondition up front (LBYL, \"Look Before You Leap\"). You'll see this pattern constantly once you reach try/except later in this course.",
            "None has its own type, NoneType, and the idiomatic check is is None, not == None — is compares identity rather than equality, which is what you actually want when checking against a singleton like None.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Every value is an object, even the \"primitive\" ones",
          body: "There's no separate category of primitive types the way some languages draw one — an int, a str, even a function, is an object with its own methods. That's why (5).bit_length() and \"hello\".upper() both work: they're regular method calls on regular objects, not special syntax. It's a small mental shift from languages that treat numbers and strings as bare values, but it's why so much of Python feels consistent once it clicks — one calling convention, everywhere.",
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
          heading: "Slicing pulls out a sub-range without a loop",
          body: "list[start:stop] grabs everything from start up to, but not including, stop. Leave either side blank to mean \"from the beginning\" or \"to the end.\" Slicing works identically on strings and tuples, not just lists.",
          language: "python",
          code: `letters = ["a", "b", "c", "d", "e", "f"]

print(letters[1:4])   # ["b", "c", "d"] — index 4 is excluded
print(letters[:3])    # ["a", "b", "c"] — from the start
print(letters[3:])    # ["d", "e", "f"] — to the end
print(letters[-2:])   # ["e", "f"] — last two, via negative indexing
print(letters[::2])   # ["a", "c", "e"] — every second item
print(letters[::-1])  # ["f", "e", "d", "c", "b", "a"] — a fast way to reverse`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Assigning a list doesn't copy it",
          body: "original = [1, 2, 3]; copy = original just gives copy a second name for the exact same list in memory — mutate one and the other changes too, because there's only one list. This trips up a lot of people coming from languages that copy on assignment by default. To get an actual, independent copy, use original.copy(), list(original), or a slice of the whole thing, original[:]. For a list containing other mutable objects (a list of lists, say), even those only copy one level deep — that's a \"shallow\" copy, and the nested lists are still shared. A true independent copy of nested data needs copy.deepcopy().",
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
          kind: "example",
          heading: "Looking up a key that might not exist",
          body: "user[\"nickname\"] raises a KeyError the instant the key isn't there — fine when you're certain it exists, a crash waiting to happen when you're not. .get() sidesteps the problem entirely by returning a default instead of raising.",
          language: "python",
          code: `user = {"name": "Ada", "age": 30}

print(user["nickname"])          # KeyError: 'nickname'
print(user.get("nickname"))      # None — no crash
print(user.get("nickname", "N/A"))  # "N/A" — your own default

if "email" in user:               # check before accessing, if you need to branch
    print(user["email"])
else:
    print("No email on file")`,
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
          kind: "example",
          heading: "Unpacking works on any of the three",
          body: "Instead of pulling items out by index one at a time, you can assign several variables at once from anything ordered — the pattern shows up constantly in idiomatic Python, including looping over a dict's .items().",
          language: "python",
          code: `point = (3, 7)
x, y = point
print(x, y)  # 3 7

first, *rest = [10, 20, 30, 40]
print(first)  # 10
print(rest)   # [20, 30, 40] — * collects "everything else" into a list

users = {"ada": 30, "grace": 39}
for name, age in users.items():
    print(f"{name} is {age}")`,
        },
        {
          kind: "bullets",
          heading: "List and dict methods worth memorizing early",
          bullets: [
            "list.append(x) adds one item to the end; list.extend(other_list) adds every item from another list — a common mix-up, since append(other_list) would nest the whole list as one item instead.",
            "list.insert(0, x) inserts at a specific position; list.pop() removes and returns the last item (or list.pop(0) for the first); list.index(x) finds where a value lives; list.count(x) counts how many times it appears.",
            "sort() sorts a list in place and returns None — a common bug is writing my_list = my_list.sort(), which silently sets my_list to None. sorted(my_list) returns a new sorted list instead, leaving the original untouched.",
            "dict.keys(), dict.values(), and dict.items() give you the keys, values, or (key, value) pairs — all three stay in insertion order in modern Python, and all three update live if the dict changes.",
            "dict.setdefault(key, default) gets a key's value, inserting default first if the key isn't already there — handy for building up a dict of lists without checking existence every time.",
            "dict.update(other_dict) merges another dict in, overwriting any keys that already exist.",
          ],
        },
        {
          kind: "example",
          heading: "The pattern you'll see everywhere: a list of dicts",
          body: "Real data — a CSV loaded into Python, a JSON API response — almost always lands as a list of dicts, each one a record. Comfort navigating this shape is arguably the single most useful practical skill from this lesson.",
          language: "python",
          code: `orders = [
    {"id": 1, "customer": "Ada", "total": 42.50},
    {"id": 2, "customer": "Sam", "total": 18.00},
    {"id": 3, "customer": "Ada", "total": 91.25},
]

# Total revenue across every order
total_revenue = sum(order["total"] for order in orders)  # 151.75

# All orders placed by a specific customer
ada_orders = [order for order in orders if order["customer"] == "Ada"]
# [{"id": 1, ...}, {"id": 3, ...}]

# Building a lookup dict from a list — id becomes the key
by_id = {order["id"]: order for order in orders}
print(by_id[2]["customer"])  # "Sam"`,
        },
        {
          kind: "terminal",
          heading: "A tuple actually enforces its immutability",
          description: "Unlike a list, trying to change a tuple in place fails immediately and loudly — which is exactly the point.",
          lines: [
            { text: "python3" },
            { text: ">>> coords = (40.7, -74.0)", output: true },
            { text: ">>> coords[0] = 41.0", output: true },
            { text: "Traceback (most recent call last):", output: true },
            { text: "TypeError: 'tuple' object does not support item assignment", output: true },
            { text: ">>> coords_list = [40.7, -74.0]", output: true },
            { text: ">>> coords_list[0] = 41.0  # a list allows this without complaint", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Picking between them",
          body: "Reach for a list when you have an ordered collection you'll add to or change. Reach for a dict when you're looking things up by name. Reach for a tuple when you have a small, fixed group of values that belong together and shouldn't change — like a function returning both a result and a status.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "Lists are ordered and mutable, indexed from 0, with negative indexes counting from the end and slicing (list[a:b]) pulling out a sub-range.",
            "Assigning a list to a new variable doesn't copy it — use .copy(), list(x), or x[:] when you actually need an independent copy.",
            "Dicts map keys to values; use .get(key, default) instead of user[key] whenever the key might not be present, to avoid an unhandled KeyError.",
            "Tuples are immutable and enforce it at runtime — trying to reassign an item raises a TypeError, which is the whole point of choosing one.",
            "Unpacking (x, y = point) works across all three ordered types and is the idiomatic alternative to indexing item by item.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "A fourth structure worth knowing about: set",
          body: "It's not in this lesson's title, but it's worth a mention since it rounds out the picture: a set is an unordered collection of unique values, written {1, 2, 3} or built with set(). Its superpower is fast membership checks and set algebra — my_set & other_set for the intersection, my_set | other_set for the union, my_set - other_set for the difference. Reach for one whenever \"does this list contain duplicates\" or \"what's in both of these collections\" is the actual question, rather than filtering a list by hand. set(my_list) is also the fastest idiomatic way to deduplicate a list, though it won't preserve the original order — for that, dict.fromkeys(my_list) does the same deduplication while keeping insertion order intact.",
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
          kind: "example",
          heading: "while loops, break, and continue",
          body: "while keeps running as long as its condition holds — useful when you don't know the number of iterations up front, unlike for over a known range. break exits the loop immediately; continue skips straight to the next iteration without finishing the current one.",
          language: "python",
          code: `attempts = 0
while attempts < 3:
    guess = input("Guess the number: ")
    attempts += 1
    if guess == "42":
        print("Correct!")
        break   # exit the loop early — no need to keep asking
else:
    print("Out of attempts")   # runs only if the loop wasn't broken out of

for n in range(10):
    if n % 2 == 0:
        continue   # skip even numbers, don't print them
    print(n)   # 1, 3, 5, 7, 9`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "for and while can both have an else clause — really",
          body: "This surprises almost everyone the first time they see it: a for or while loop can be followed by an else block, which runs only if the loop finished normally — that is, it never hit a break. It's the cleanest way to express \"search for something, and if you never find it, do this instead,\" without a separate found = False flag variable to track manually. If the loop does break, the else is skipped entirely, which is exactly the point.",
        },
        {
          kind: "example",
          heading: "Conditional expressions: an if/else that fits in one line",
          body: "When you're choosing between two values to assign, rather than running different blocks of code, a conditional expression (sometimes called a ternary) is more idiomatic than a full four-line if/else.",
          language: "python",
          code: `age = 20
category = "adult" if age >= 18 else "minor"
# equivalent to:
# if age >= 18:
#     category = "adult"
# else:
#     category = "minor"

scores = [55, 72, 90]
labels = ["pass" if s >= 60 else "fail" for s in scores]
# ["fail", "pass", "pass"] — combined with a list comprehension`,
        },
        {
          kind: "bullets",
          heading: "A few more control flow habits worth knowing",
          bullets: [
            "Chained comparisons read naturally: 0 <= age < 18 means exactly what it looks like, unlike languages that require 0 <= age and age < 18 written out separately.",
            "and and or short-circuit — the second operand of x and y is never evaluated if x is already falsy, which is commonly used for a safe default: name = user_input or \"Guest\".",
            "The walrus operator := (added in Python 3.8) assigns inside an expression: while (line := f.readline()): process(line) — avoids calling readline() twice, once to check and once to use.",
            "pass is a no-op statement for a block that's syntactically required but intentionally empty, like a class or function body you haven't written yet.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "No switch statement (until recently)",
          body: "Older Python has no switch/case — you'd use if/elif chains, or a dict mapping values to functions. Python 3.10 added match/case, which handles this more cleanly, but if/elif is still the more universally supported and common pattern for straightforward branching.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "if/elif/else reads close to English, and chained comparisons (0 <= age < 18) let you skip the and most other languages require.",
            "for iterates values directly; while runs until a condition turns false — reach for while when the number of iterations isn't known up front.",
            "break exits a loop immediately; continue skips to the next iteration; a loop's else clause runs only if it finished without hitting a break.",
            "A conditional expression (x if cond else y) is the idiomatic one-line alternative to a short if/else that's only choosing between two values.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "any() and all() replace a surprising number of manual loops",
          body: "any(condition for item in items) is True the moment one item satisfies the condition; all(...) requires every item to. Both short-circuit — any() stops checking as soon as it finds a match, all() stops as soon as it finds a failure — so they're both correct and efficient over a large or even infinite iterable, where a hand-written loop with a found = True flag is more code for the identical result. any(score < 60 for score in scores) reads as \"is there a failing score\" far more directly than the loop-and-flag version does, and both accept a generator expression directly, with no square brackets needed.",
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
        {
          kind: "example",
          heading: "*args and **kwargs in a real call",
          body: "*args collects any number of extra positional arguments into a tuple; **kwargs collects extra keyword arguments into a dict. You'll see both constantly in library and framework code that needs to accept a flexible, unpredictable set of inputs.",
          language: "python",
          code: `def summarize(title, *scores, **meta):
    print(f"{title}: scores = {scores}")
    for key, value in meta.items():
        print(f"  {key}: {value}")

summarize("Quiz 1", 90, 85, 77, graded_by="Ada", curve=5)
# Quiz 1: scores = (90, 85, 77)
#   graded_by: Ada
#   curve: 5

# The reverse also works — "unpacking" existing collections into a call:
values = [90, 85, 77]
extra = {"graded_by": "Ada", "curve": 5}
summarize("Quiz 1", *values, **extra)   # identical result`,
        },
        {
          kind: "example",
          heading: "lambda: a small, unnamed function for one-off use",
          body: "lambda creates a function inline, without def or a name — useful for a short piece of logic you need to hand to another function, like a sort key, and don't need to reuse anywhere else. Anything more than one expression should be a real def function instead; lambda can't hold statements, only a single expression.",
          language: "python",
          code: `people = [("Ada", 36), ("Sam", 24), ("Grace", 39)]

# sorted() takes a key function — lambda is the idiomatic way to supply a small one
by_age = sorted(people, key=lambda person: person[1])
# [("Sam", 24), ("Ada", 36), ("Grace", 39)]

# Equivalent named function, for comparison — more typing for something used once
def get_age(person):
    return person[1]
by_age = sorted(people, key=get_age)`,
        },
        {
          kind: "bullets",
          heading: "Scope: where a variable is visible",
          intro: "Python resolves names using a rule usually abbreviated LEGB: Local, Enclosing, Global, Built-in — it checks each in that order.",
          bullets: [
            "A variable assigned inside a function is local to it by default — it doesn't exist outside, and doesn't overwrite a same-named variable at module level.",
            "A function can read a global variable without any special syntax, but assigning to it inside the function creates a new local variable instead — unless you explicitly declare global count first.",
            "Reaching for the global keyword to mutate module-level state from inside a function is usually a sign the function should take a parameter and return a value instead — it's rarely the cleanest option.",
            "A nested function can \"close over\" a variable from its enclosing function, remembering it even after the outer function has returned — this is a closure, and it's how decorators are built.",
          ],
        },
        {
          kind: "terminal",
          heading: "Watching the local-vs-global trap in the REPL",
          description: "Assigning to a name inside a function creates a local variable, even if a global with the same name already exists — this is the behavior the bullets above describe.",
          lines: [
            { text: "python3" },
            { text: ">>> total = 100", output: true },
            { text: ">>> def reset():", output: true },
            { text: "...     total = 0   # this creates a NEW local variable, doesn't touch the global", output: true },
            { text: "...     print(total)", output: true },
            { text: "... ", output: true },
            { text: ">>> reset()", output: true },
            { text: "0", output: true },
            { text: ">>> total   # the global is completely unaffected", output: true },
            { text: "100", output: true },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Functions should do one thing, and their name should say what",
          body: "A function called process_data that also sends an email and logs to a file is doing three things, and every one of them makes it harder to test, reuse, and reason about in isolation. If you find yourself reaching for \"and\" to describe what a function does, it's usually a sign to split it into smaller functions, each with a name specific enough that you could guess its return value without reading the body.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Type hints and docstrings: optional, but worth the habit",
          body: "def greet(name: str, times: int = 1) -> str: adds type hints — they're not enforced at runtime (Python happily runs greet(42) without complaint), but tools like mypy, and every modern editor's autocomplete, use them to catch mistakes before the code ever runs. A docstring — a string literal as the very first line inside a function — documents what it does, and shows up automatically when someone calls help(greet) or hovers over the function in an editor. Neither is required to make code work, but both are standard practice on any function that isn't purely throwaway.",
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "def name(params): defines a function; default values make parameters optional, and keyword arguments make multi-parameter calls self-documenting.",
            "*args and **kwargs let a function accept a flexible number of positional and keyword arguments — the same * and ** also unpack existing collections into a call.",
            "lambda is for a short, throwaway, single-expression function, most often as a sort key or a callback — anything longer belongs in a proper def.",
            "A variable assigned inside a function is local by default; watch for the mutable-default-argument trap, and prefer returning values over mutating globals.",
            "Type hints and a docstring aren't enforced by Python itself, but they're the difference between a function a teammate (or future you) can use confidently and one they have to read line by line to understand.",
          ],
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
        {
          kind: "diagram",
          heading: "What super().__init__ sets up before anything else",
          description: "SavingsAccount reuses Account's constructor instead of duplicating it — this is the call order when SavingsAccount(\"Grace\", 1000, 0.03) runs.",
          steps: [
            { label: "SavingsAccount.__init__ called", detail: "owner, balance, rate passed in" },
            { label: "super().__init__(owner, balance)", detail: "Runs Account's constructor first" },
            { label: "self.owner, self.balance set", detail: "Done inside Account.__init__" },
            { label: "self.rate = rate", detail: "Back in SavingsAccount, runs after super() returns" },
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A class attribute is shared by every instance — mutable ones are a trap",
          body: "A variable assigned directly inside the class body, outside any method, becomes a class attribute rather than an instance attribute — and it lives on the class itself, shared by every instance, not copied per object. That's fine for a genuine constant. It's a bug waiting to happen for anything mutable: class Cart: items = [] looks like each cart gets its own empty list, but every Cart instance is actually appending to the exact same shared list, for the same reason a mutable default argument is a trap. Set mutable state inside __init__ instead, where self.items = [] genuinely creates a fresh list per instance.",
        },
        {
          kind: "example",
          heading: "classmethod and staticmethod: methods that don't need a specific instance",
          body: "A normal method always takes self and operates on one instance. A classmethod takes the class itself (cls) instead, and is the standard way to write an alternative constructor. A staticmethod takes neither — it's just a regular function that happens to live inside the class for organizational reasons.",
          language: "python",
          code: `class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    @classmethod
    def from_dict(cls, data):
        # an alternative constructor — builds an Account from a dict shape
        return cls(data["owner"], data["balance"])

    @staticmethod
    def is_valid_balance(amount):
        # doesn't need self or cls — pure logic that belongs near the class
        return amount >= 0

acct = Account.from_dict({"owner": "Ada", "balance": 200})
print(Account.is_valid_balance(-5))  # False`,
        },
        {
          kind: "bullets",
          heading: "The dunder methods you'll actually use",
          intro: "\"Dunder\" (double underscore) methods let your objects work with built-in Python syntax and functions instead of needing custom, one-off methods.",
          bullets: [
            "__init__ — runs on creation, already covered; the one you'll write on almost every class.",
            "__str__ — controls what print(obj) and str(obj) show; aim for something readable to a human.",
            "__repr__ — controls what shows in the REPL and inside a list of objects; aim for something unambiguous, ideally code that could recreate the object. If __str__ is missing, Python falls back to __repr__.",
            "__eq__ — without it, two instances with identical data still compare as not equal, because the default compares identity (are they the same object in memory?), not the values inside them.",
            "__len__ — lets len(obj) work on your own class, if \"how many things does this hold\" makes sense for it.",
          ],
        },
        {
          kind: "terminal",
          heading: "Without __eq__, identical data still isn't \"equal\"",
          description: "This catches people off guard the first time — two Account objects holding the exact same owner and balance are still != unless the class defines __eq__ itself.",
          lines: [
            { text: "python3" },
            { text: ">>> a = Account(\"Ada\", 100)", output: true },
            { text: ">>> b = Account(\"Ada\", 100)", output: true },
            { text: ">>> a == b", output: true },
            { text: "False", output: true },
            { text: ">>> a == a", output: true },
            { text: "True", output: true },
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "A class bundles data (attributes) and behavior (methods); self is the instance a method was called on, passed automatically by Python.",
            "A class attribute is shared across every instance — keep mutable state inside __init__, assigned to self, so each instance gets its own copy.",
            "classmethod builds an alternative constructor from cls; staticmethod is a plain function grouped inside the class for organization, needing neither self nor cls.",
            "Define __eq__ if you want instances with matching data to compare equal — the default compares identity, not values.",
            "Reach for a class when data and behavior clearly belong together and you'll need more than one instance; otherwise a module of functions is often simpler.",
            "Composition — one class holding an instance of another as an attribute — is often a more flexible choice than inheritance for sharing behavior, and worth reaching for by default when the relationship isn't a clean \"is-a\" one.",
          ],
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
          kind: "terminal",
          heading: "Confirming the comprehension result",
          description: "Typed straight into the REPL, the comprehension evaluates to exactly the list the comment above promises.",
          lines: [
            { text: "python3" },
            { text: ">>> numbers = [1, 2, 3, 4, 5, 6]", output: true },
            { text: ">>> [n * n for n in numbers if n % 2 == 0]", output: true },
            { text: "[4, 16, 36]", output: true },
          ],
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
          kind: "example",
          heading: "A generator expression is a comprehension that doesn't build the whole list",
          body: "Swap the square brackets for parentheses and a comprehension becomes a generator expression — it produces items one at a time, on demand, instead of building the entire list in memory up front. For a huge or unbounded source, or when you're just going to sum() or loop over the result once, this is the idiomatic choice.",
          language: "python",
          code: `numbers = range(1_000_000)

# Builds a full 1,000,000-item list in memory just to sum it — wasteful
total = sum([n * n for n in numbers if n % 2 == 0])

# Generator expression — computes each square one at a time, never
# holds more than one value in memory. Same result, far less memory.
total = sum(n * n for n in numbers if n % 2 == 0)`,
        },
        {
          kind: "bullets",
          heading: "String and iteration habits that show up constantly",
          bullets: [
            "\", \".join(words) glues a list of strings together with a separator — far more idiomatic than a manual loop with +=, and much faster on large lists.",
            "\"  hello  \".strip() removes leading/trailing whitespace; \"a,b,c\".split(\",\") turns a delimited string back into a list.",
            "zip(names, ages) pairs up two (or more) iterables element by element — the standard way to loop over two related lists in lockstep instead of indexing both by the same counter.",
            "sorted(items, key=..., reverse=True) is idiomatic over items.sort() when you need the original order preserved, since sorted() returns a new list instead of sorting in place.",
          ],
        },
        {
          kind: "example",
          heading: "Format specs: controlling exactly how a value prints",
          body: "Inside an f-string's {}, a colon introduces a format spec — precision for floats, minimum width for alignment, thousands separators for large numbers. Small detail, but it's the difference between output that looks like a real report and output that looks like a debug dump.",
          language: "python",
          code: `price = 19.9
count = 1250000

print(f"{price:.2f}")        # "19.90" — exactly 2 decimal places
print(f"{count:,}")          # "1,250,000" — thousands separator
print(f"{'Total':<10}{price:>8.2f}")  # left-align label, right-align number
print(f"{0.4567:.1%}")       # "45.7%" — formats as a percentage directly`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "import this",
          body: "Type import this into any Python interpreter and it prints \"The Zen of Python\" — nineteen short design principles the language itself is built around, like \"Explicit is better than implicit\" and \"Readability counts.\" It's not just a joke easter egg; most of what \"idiomatic Python\" means in practice — comprehensions over manual loops where they stay readable, EAFP over deep precondition checks, f-strings over concatenation — traces directly back to those lines.",
        },
        {
          kind: "bullets",
          heading: "PEP 8, briefly",
          intro: "The style guide most of the ecosystem quietly agrees on, beyond the naming convention already covered.",
          bullets: [
            "4 spaces per indentation level, never tabs — most editors will do this automatically once configured for Python.",
            "Lines capped around 79-99 characters depending on the project's own convention; long expressions get wrapped in parentheses rather than trailing off the screen.",
            "Two blank lines between top-level function and class definitions, one blank line between methods inside a class — small, but it's the first thing that makes unfamiliar code feel instantly readable or instantly foreign.",
            "Tools like black and ruff auto-format and lint for most of this, which is why in practice most teams stop debating the details and just let the tool decide.",
          ],
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
          kind: "terminal",
          heading: "Same functions, live in the REPL",
          description: "Calling each one directly shows the print happening and the None being swallowed silently by the prompt.",
          lines: [
            { text: "python3" },
            { text: ">>> get_first_item([1, 2, 3])", output: true },
            { text: "1", output: true },
            { text: ">>> get_first_item([])", output: true },
            { text: "The list is empty", output: true },
            { text: ">>> parse_age(\"30\")", output: true },
            { text: "30", output: true },
            { text: ">>> parse_age(\"thirty\")", output: true },
            { text: "'thirty' isn't a valid number", output: true },
          ],
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
          heading: "One except block can catch several related exception types",
          body: "When two or more exception types should be handled identically, name them together as a tuple rather than duplicating the handler body under separate except blocks. The exception object itself (e) carries useful information beyond its type — str(e) gives the human-readable message, and e.args holds the raw arguments it was constructed with.",
          language: "python",
          code: `def parse_and_lookup(text, lookup):
    try:
        key = int(text)
        return lookup[key]
    except (ValueError, KeyError) as e:
        print(f"Couldn't resolve {text!r}: {type(e).__name__}: {e}")
        return None

parse_and_lookup("abc", {1: "one"})  # ValueError: invalid literal for int()...
parse_and_lookup("5", {1: "one"})     # KeyError: 5`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Exceptions are for the exceptional — not for everyday branching",
          body: "It's tempting, once try/except clicks, to reach for it everywhere instead of a plain if check. Prefer if \"key\" in my_dict: over try: my_dict[\"key\"] except KeyError: when you're checking something cheap and likely to be false — it's clearer to read and doesn't pay the (small but real) cost of raising and unwinding an exception. Reach for try/except when the failure is genuinely the unusual case, or when checking in advance would mean doing the risky work twice — reading a file, say, where the safe check and the real read would otherwise duplicate effort.",
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
          kind: "diagram",
          heading: "The try/except/else/finally flow",
          description: "Only one of except and else ever runs for a given call — but finally runs every time, regardless of which path was taken.",
          steps: [
            { label: "try", detail: "Code that might raise an exception runs first" },
            { label: "except (if raised)", detail: "Runs only when the named exception actually happens" },
            { label: "else (if not raised)", detail: "Runs only when try completed with no exception at all" },
            { label: "finally", detail: "Always runs last, success or failure" },
          ],
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
          kind: "callout",
          tone: "tip",
          heading: "raise ... from e preserves the original cause",
          body: "When you catch one exception and raise a different, more meaningful one in its place, use raise NewError(\"...\") from original_error instead of just raise NewError(\"...\"). Without from, Python still shows both tracebacks chained together automatically whenever a raise happens inside an except block — but from makes the relationship explicit and lets you deliberately suppress it with from None when the original really is just noise. Either way, don't let a caught exception vanish silently; losing the original traceback is one of the more painful things to debug around.",
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "with is finally, generalized",
          body: "The with block from earlier (with open(path) as f:) isn't special-cased for files — it's the general \"context manager\" protocol, and open() is just one object that implements it. Entering the with block calls the object's __enter__; leaving it, whether normally or via an exception, calls __exit__ — which is where the file gets closed. That's exactly the guarantee finally gives you, packaged as something you can define once on a class and reuse everywhere, instead of hand-writing try/finally around every resource that needs cleanup — a database connection, a lock, a temporary directory.",
        },
        {
          kind: "bullets",
          heading: "The built-in exception hierarchy, in brief",
          intro: "Most of the exceptions you'll ever catch inherit from a small set of common ancestors — worth knowing the shape of it.",
          bullets: [
            "Every built-in exception ultimately inherits from BaseException, but you should essentially never catch that directly — it also covers SystemExit and KeyboardInterrupt, which you almost always want to let propagate.",
            "Exception is the practical root for everyday errors; ValueError, TypeError, KeyError, IndexError, and the rest all inherit from it, which is why except Exception as e: is a broad-but-not-total safety net.",
            "Catching a parent class catches every subclass too — except LookupError: silently handles both IndexError and KeyError in one line, since both inherit from it.",
            "A custom exception should inherit from Exception (or a more specific built-in, when one genuinely fits) rather than BaseException, so it behaves like every other error callers already know how to catch.",
          ],
        },
        {
          kind: "summary",
          heading: "What to carry forward",
          bullets: [
            "try/except lets you write the normal path first, then handle specific failures around it.",
            "Name the exception type you're catching — a bare except: hides real bugs along with the ones you meant to catch.",
            "else runs only if the try block succeeded; finally always runs, which makes it the right place for cleanup like closing a file.",
            "raise plus a custom exception class (subclassing Exception) lets your own code signal exactly what went wrong — chain with raise ... from e to preserve the original cause.",
            "with is the general-purpose version of try/finally cleanup, built on the __enter__/__exit__ context manager protocol that open() also uses.",
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
          kind: "callout",
          tone: "tip",
          heading: "How to approach these",
          body: "Each exercise below pairs one of the two skills from this course: spotting when a loop is really a comprehension, and handling the specific way real input goes wrong instead of writing code that assumes it won't. Read the prompt fully before touching the hint — most of the value in a comprehension exercise is in correctly identifying the expression, the iterable, and the condition before you start typing, not in the syntax itself. If your first instinct is a nested comprehension that's hard to read back, that's a signal, not a failure — write the plain loop, get it correct, and only then decide whether compressing it actually improves anything.",
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
          kind: "practice",
          heading: "Flatten a Nested List with a Comprehension",
          prompt:
            "You're given a list of lists — rows from a small dataset. Write a single list comprehension that flattens it into one list, keeping only the values greater than 10:\n\nrows = [[4, 15, 8], [22, 3, 11], [1, 30, 9]]",
          hint: "A comprehension can hold more than one for clause. [item for sublist in rows for item in sublist] flattens rows first, in the same order you'd write nested for loops; add the if condition at the very end to filter the flattened result.",
          solution: `rows = [[4, 15, 8], [22, 3, 11], [1, 30, 9]]

result = [n for sublist in rows for n in sublist if n > 10]
# [15, 22, 11, 30] — reads left to right in the same order as
# for sublist in rows:
#     for n in sublist:
#         if n > 10:
#             result.append(n)`,
        },
        {
          kind: "practice",
          heading: "A Resilient Batch Parser",
          prompt:
            "Write parse_ages(raw) that takes a list of strings meant to represent ages, like [\"30\", \"twenty\", \"45\", \"\"], and returns a tuple of (parsed, errors) — parsed is a list of the successfully converted integers, errors is a list of the original strings that failed to convert. Nothing in the input should be able to crash the function.",
          hint: "Loop over raw, try int(item) inside the loop, and sort each item into one list or the other inside the except block — this is try/except used to triage a whole batch of input, not just guard a single conversion.",
          solution: `def parse_ages(raw):
    parsed = []
    errors = []
    for item in raw:
        try:
            parsed.append(int(item))
        except ValueError:
            errors.append(item)
    return parsed, errors

parse_ages(["30", "twenty", "45", ""])
# ([30, 45], ["twenty", ""]) — bad entries are collected, not dropped silently`,
        },
        {
          kind: "practice",
          heading: "Filter a Dict with a Comprehension, Handling a None Value",
          prompt:
            "You're given scores = {\"ada\": 88, \"sam\": None, \"grace\": 72, \"lee\": 55} — a username mapped to a password-strength score, where None means the check itself failed to run for that user. Write a single dict comprehension that keeps only usernames with a real score of 70 or higher, safely skipping the None entries without raising a TypeError.",
          hint: "A naive score >= 70 comparison against None raises a TypeError, since None and int aren't comparable. The condition needs to check score is not None before comparing it numerically — Python's and short-circuits, so the second check never runs once the first is False.",
          solution: `scores = {"ada": 88, "sam": None, "grace": 72, "lee": 55}

passing = {
    user: score
    for user, score in scores.items()
    if score is not None and score >= 70
}
# {"ada": 88, "grace": 72} — sam is skipped safely, lee is filtered out by the threshold`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A comprehension can't wrap a try/except directly",
          body: "This is a real limitation, not a style preference: [int(x) for x in raw] will crash the whole comprehension the moment one item fails to convert — there's no way to write try/except inside the comprehension's expression itself. You have two honest options: convert first inside a helper function that catches the error and returns a sentinel (like None) instead of raising, then filter or comprehend over the results, or fall back to a plain for loop when the failure handling is really the point of the code, not an afterthought. Reaching for a loop here isn't a failure to be idiomatic — it's the correct call once real error handling is involved.",
        },
        {
          kind: "practice",
          heading: "Validate a Batch of Orders and Raise with Full Context",
          prompt:
            "You're validating a list of order dicts before charging them. Write validate_orders(orders) that raises a custom exception InvalidOrderError (subclassing Exception) naming every order whose 'total' is missing or not a positive number — but only after checking all of them, not just the first bad one found. Use a comprehension to gather the invalid order ids before deciding whether to raise.",
          hint: "Build the list of bad ids with a comprehension: [o[\"id\"] for o in orders if o.get(\"total\", 0) <= 0]. .get with a default of 0 handles a missing key the same way as an explicit zero. If that list isn't empty, raise one exception with all the offending ids included in the message.",
          solution: `class InvalidOrderError(Exception):
    """Raised when one or more orders fail the total > 0 check."""
    pass

def validate_orders(orders):
    bad_ids = [o["id"] for o in orders if o.get("total", 0) <= 0]
    if bad_ids:
        raise InvalidOrderError(f"Orders with invalid totals: {bad_ids}")
    return True

orders = [{"id": 1, "total": 50}, {"id": 2, "total": 0}, {"id": 3, "total": -5}]
validate_orders(orders)
# InvalidOrderError: Orders with invalid totals: [2, 3]`,
        },
        {
          kind: "summary",
          heading: "What a correct solution demonstrates",
          bullets: [
            "A list comprehension's shape is always [expression for item in iterable if condition] — spot those three parts in a loop before trying to compress it, and remember a comprehension can chain more than one for clause to flatten nested data.",
            "A dict comprehension follows the same idea with {key: value for ...} — unpacking a tuple directly in the for clause is a common, idiomatic pairing.",
            "Catching ZeroDivisionError and TypeError separately turns a function that would crash on bad input into one that fails predictably and explains why.",
            "Triaging a batch — sorting good and bad items into separate results instead of stopping at the first failure — is a different, equally common shape than a single try/except guarding one operation.",
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
          kind: "quiz",
          heading: "List vs. Generator Expression",
          question: "Why might sum(n * n for n in range(10_000_000)) be preferable to sum([n * n for n in range(10_000_000)])?",
          options: [
            "The generator version runs on multiple CPU cores automatically",
            "There's no real difference — Python optimizes them identically",
            "The generator version never builds the full 10,000,000-item list in memory, computing and discarding each square one at a time",
            "List comprehensions are not allowed inside a sum() call",
          ],
          correctIndex: 2,
          explanation:
            "Parentheses instead of square brackets turn a comprehension into a generator expression, which yields one value at a time instead of materializing the entire result up front. For something you're only going to iterate once, like feeding straight into sum(), that avoids holding the whole list in memory for no benefit.",
        },
        {
          kind: "quiz",
          heading: "Catching Multiple Exception Types",
          question: "What does except (ValueError, KeyError) as e: do differently from writing two separate except blocks for the same two types?",
          options: [
            "Nothing — they behave identically whenever the handling logic is the same for both types",
            "It only catches ValueError, silently ignoring KeyError",
            "It requires both exceptions to happen at once before the block runs",
            "It's invalid syntax in Python 3",
          ],
          correctIndex: 0,
          explanation:
            "Grouping exception types in a tuple after except is just a shorthand for \"catch any of these the same way\" — it behaves identically to two separate except blocks with the same body, just without repeating that body. Reach for it whenever two or more failure types deserve identical handling.",
        },
        {
          kind: "summary",
          heading: "Course recap",
          bullets: [
            "Types come from values, not declarations, but every value still has one — str, int, float, bool, None — and isinstance() is the idiomatic way to check one.",
            "Lists are ordered and mutable; tuples are ordered and immutable; dicts map keys to values — pick based on whether you need to change it and how you'll look things up, and remember assigning a list doesn't copy it.",
            "Watch for the mutable-default-argument trap — a default like bucket=[] is created once and shared across every call that doesn't override it; the same trap applies to mutable class attributes.",
            "List, dict, and generator expressions compress a simple loop-plus-filter into one readable line — fall back to a plain loop when they'd stop being simple, and reach for a generator when you don't need the whole result held in memory at once.",
            "try/except/else/finally, catching specific exception types (including several at once as a tuple), plus raising your own exceptions with full context, is how idiomatic Python handles failure without crashing on every bad input.",
          ],
        },
      ],
    },
  ],
};
