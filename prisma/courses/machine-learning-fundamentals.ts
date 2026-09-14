import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "machine-learning-fundamentals",
  title: "Machine Learning Fundamentals",
  description:
    "What machine learning actually is, how it differs from traditional programming, and the core ideas — training, testing, overfitting, and one worked algorithm — that everything else builds on.",
  category: "Data & AI",
  level: "BEGINNER",
  order: 20,
  lessons: [
    {
      title: "Machine Learning vs. Traditional Programming",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Machine Learning vs. Traditional Programming",
          subheading:
            "Every ML concept builds on one shift: instead of writing the rules, you show the computer examples and let it find the rules itself.",
        },
        {
          kind: "text",
          heading: "Two ways to get a computer to do something",
          body: [
            "In traditional programming, a person writes explicit rules: if the email contains \"viagra\" or \"free money,\" mark it as spam. The computer just executes the rule exactly as written.",
            "In machine learning, a person doesn't write the rule directly. Instead, they give the computer thousands of examples of spam and non-spam emails, and an algorithm figures out which patterns in the text predict spam on its own.",
          ],
        },
        {
          kind: "example",
          heading: "The same problem, two approaches",
          body: "Notice what changed: nobody wrote \"weight the word free by 0.6\" — the model discovered that weighting from data.",
          code: `Traditional rule (a person wrote this):
IF email contains "free money" OR "act now"
   THEN mark as spam

Machine learning (a model learned this from 50,000 labeled emails):
spam_score = 0.6*contains("free") + 0.3*contains("!!!")
             + 0.9*sender_unknown - 0.4*contains("unsubscribe")
IF spam_score > threshold THEN mark as spam`,
        },
        {
          kind: "bullets",
          heading: "When ML is the right tool — and when it isn't",
          intro: "ML earns its complexity when rules are genuinely hard to write by hand.",
          bullets: [
            "Good fit: patterns are real but too complex or numerous for a person to enumerate (image recognition, fraud detection, recommendation).",
            "Good fit: the pattern shifts over time and a system needs to keep adapting to new data.",
            "Poor fit: the rule is simple and stable — a tax bracket calculation doesn't need a model, it needs an if-statement.",
            "Poor fit: you have little to no historical data to learn from — ML needs examples, not just a definition of the problem.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The core trade you're making",
          body: "A hand-written rule is transparent — you can read exactly why it fired. A learned model is a set of statistical patterns extracted from data — often more accurate on complex problems, but harder to fully explain, and only as good as the data it learned from.",
        },
        {
          kind: "bullets",
          heading: "A common mistake: reaching for ML before ruling out simpler options",
          intro:
            "Teams under deadline pressure often jump straight to \"train a model\" when a much cheaper fix would get most of the value.",
          bullets: [
            "Before training anything, ask whether a lookup table, a single threshold, or a handful of if-statements already covers most real cases — a surprising number of \"ML problems\" are rule problems wearing an ML label.",
            "A model is also a standing maintenance commitment: someone has to monitor it, retrain it as real-world data drifts away from what it was trained on, and decide what happens when it's confidently wrong. A rule doesn't silently degrade the way a model trained on stale data does.",
            "The real signal that ML is worth that overhead is that the rule-based version would need constant hand-tuning as new patterns emerge faster than a person can write rules for them — fraud and spam are like this; a shipping-cost calculator generally isn't.",
            "A model that's only marginally more accurate than a simple rule, but far harder to explain to an auditor, a regulator, or a frustrated customer asking \"why was I denied,\" is frequently a net loss even when the accuracy number on a slide looks better.",
          ],
        },
        {
          kind: "example",
          heading: "The maintenance cost hides in plain sight",
          body: "Same spam problem, tracked over three years — the ML version isn't necessarily smarter on day one, but the rule-based version's upkeep cost grows in a way the ML version's doesn't.",
          code: `Rule-based filter, year 1: 40 keyword rules, easy to reason about
Rule-based filter, year 3: 2,200 rules, several contradicting each
  other, nobody remembers why half of them were added

ML filter, year 1: trained on 50,000 labeled emails
ML filter, year 3: retrained monthly on fresh labeled data;
  accuracy holds roughly steady as spammers change tactics,
  without anyone hand-editing a growing rule list`,
        },
        {
          kind: "bullets",
          heading: "Where the \"learning\" actually happens: features and parameters",
          intro:
            "Two words come up constantly once you start actually building a model — worth pinning down precisely rather than leaving fuzzy.",
          bullets: [
            "A feature is one measurable input the model is given — for the spam example, \"contains the word free,\" \"sender is unknown,\" and \"number of exclamation points\" are each separate features, chosen (or engineered) by a person before training even starts.",
            "A parameter (like the 0.6, 0.3, and 0.9 weights in the spam-score formula) is a number the training process sets automatically — nobody hand-picks these; the algorithm searches for the values that best fit the labeled examples it was shown.",
            "This split matters practically: choosing good features is still very much a human judgment call — it's the part of \"machine learning\" that isn't actually done by the machine — while finding the right weights for those features is what the algorithm does on its own.",
            "A model with poorly chosen features can't be fixed by more clever training — no amount of weight-tuning recovers a signal that was never captured as a feature in the first place, which is why real ML work spends so much time on what data to feed the model, not just which algorithm to use.",
          ],
        },
        {
          kind: "summary",
          heading: "The shift in one line",
          bullets: [
            "Traditional programming: rules in, data in, answers out.",
            "Machine learning: data in, answers in (as examples), rules out.",
            "That reversal is why ML needs so much emphasis on the quality of the data it's shown.",
          ],
        },
      ],
    },
    {
      title: "Supervised vs. Unsupervised Learning",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Supervised vs. Unsupervised Learning",
          subheading:
            "Almost every ML problem starts with one question: do you have labeled examples of the right answer, or are you looking for structure nobody's told you about yet?",
        },
        {
          kind: "bullets",
          heading: "Supervised learning: learning from labeled examples",
          intro: "You give the model input/output pairs, and it learns the mapping between them.",
          bullets: [
            "Predicting a number (regression): given square footage, lot size, and location, predict a house's sale price.",
            "Predicting a category (classification): given an email's text, predict spam or not-spam.",
            "The label is the whole point — every training example includes the \"right answer,\" and the model is graded against it.",
            "Most real-world business ML (churn prediction, credit scoring, demand forecasting) is supervised learning.",
          ],
        },
        {
          kind: "bullets",
          heading: "Unsupervised learning: finding structure with no labels",
          intro: "There's no right answer given — the model looks for patterns in the data itself.",
          bullets: [
            "Clustering: grouping customers into segments based on purchase behavior, without anyone pre-defining what the segments should be.",
            "Anomaly detection: flagging a credit card transaction that looks statistically unlike a person's normal spending — with no labeled examples of \"this exact fraud pattern\" to learn from.",
            "Dimensionality reduction: compressing hundreds of correlated features down to a handful that capture most of the real signal.",
            "The output is a description of structure, not a prediction that can be graded against a known right answer.",
          ],
        },
        {
          kind: "example",
          heading: "Same customer data, two different questions",
          body: "The supervised question needs history of what actually happened. The unsupervised question just needs the data itself — nobody has to have labeled anything.",
          code: `Supervised question:
"Given a customer's past purchases and support tickets,
will they cancel next month?" (needs past examples labeled
cancelled / not-cancelled)

Unsupervised question:
"What natural groups exist among our customers?"
(no labels needed — the algorithm proposes the groups)`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A quick test you can apply to any problem",
          body: "Ask: \"if I handed a person 1,000 rows of this data, could they write down the correct answer for each one?\" If yes, you likely have (or can get) labels — treat it as supervised. If the honest answer is there is no single correct answer, we're just looking for patterns, it's unsupervised.",
        },
        {
          kind: "bullets",
          heading: "A common mistake in supervised learning: trusting a flawed proxy label",
          intro:
            "Having a label column doesn't automatically mean it measures what you think it measures.",
          bullets: [
            "\"Will this customer churn?\" often gets trained on a proxy like \"did the subscription lapse,\" which also fires for someone who switched to an annual plan or paused seasonally — the model then learns to predict the proxy, not real churn.",
            "\"Is this a good hire?\" trained on \"got promoted within 2 years\" bakes in whatever biases already shaped past promotion decisions — the model reproduces the pattern in the label, not some objective notion of quality.",
            "Before trusting a labeled dataset, ask specifically how each label was generated, and whether cases exist where the label is technically true but means something different than the question you're actually trying to answer.",
            "This is a bigger source of real-world model failure than most algorithm choices — a perfectly tuned model trained on the wrong label is still answering the wrong question, just very confidently.",
          ],
        },
        {
          kind: "example",
          heading: "One more distinction inside supervised learning: regression vs. classification",
          body: "Both are supervised, but the type of label determines which one you're doing — and picking the wrong framing early on causes real rework later.",
          code: `Regression — the label is a number:
  predict a house's sale price ($214,000)
  predict tomorrow's demand (1,840 units)

Classification — the label is a category:
  predict spam / not-spam
  predict which of 3 support-ticket categories a message belongs to

A model built for one doesn't transfer to the other without
changing its output layer and its evaluation metric — deciding
which type of label you actually have comes before choosing
an algorithm.`,
        },
        {
          kind: "bullets",
          heading: "Semi-supervised learning: a practical middle ground",
          intro:
            "Real datasets are rarely purely one or the other — a common, genuinely useful situation is a little bit of labeled data and a lot more unlabeled data sitting right next to it.",
          bullets: [
            "Labeling is often the expensive, slow part of a project — a person has to review each example and assign the right answer — while collecting more raw, unlabeled data is comparatively cheap.",
            "Semi-supervised learning trains initially on the small labeled set, then uses that partial model to make educated guesses on the unlabeled data, folding the most confident of those guesses back into training as if they were real labels.",
            "This shows up constantly in practice: a support team might hand-label 500 tickets by category, while 50,000 unlabeled tickets sit in the system — semi-supervised techniques can extract real value from that larger pool instead of requiring all 50,000 to be labeled by hand before training can even start.",
          ],
        },
        {
          kind: "example",
          heading: "The same 5,000-ticket dataset, three ways",
          body: "The amount of labeling effort required is the real cost that decides which approach is realistic for a given project.",
          code: `Fully supervised:
  All 5,000 tickets hand-labeled by category before training.
  Most accurate starting point, but the most labeling effort.

Fully unsupervised:
  No tickets labeled at all — clustering proposes groups,
  but nobody has confirmed what each group actually means.
  Fastest to start, but the "categories" need human review
  before they're trustworthy.

Semi-supervised:
  200 tickets hand-labeled (a day's work, not a month's),
  the other 4,800 left unlabeled. The model bootstraps from
  the 200 and extends its guesses to the rest, then only the
  most confident guesses get folded back into training.`,
        },
        {
          kind: "summary",
          heading: "The dividing question",
          bullets: [
            "Supervised: you have labeled outcomes and want to predict them for new cases.",
            "Unsupervised: you have no labels and want to discover structure.",
            "A smaller third category, reinforcement learning, learns from trial-and-error rewards rather than either — common in robotics and game-playing systems, less common in typical business applications.",
          ],
        },
      ],
    },
    {
      title: "The Train/Test Split and Why It Matters",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "The Train/Test Split and Why It Matters",
          subheading:
            "A model that's only ever been graded on the questions it studied from will always look better than it actually is. The train/test split exists to catch that.",
        },
        {
          kind: "text",
          heading: "Why you can't just check performance on the data you trained on",
          body: [
            "If you train a model on 1,000 examples and then check its accuracy on those same 1,000 examples, you're not measuring whether it learned the underlying pattern — you're partly measuring whether it memorized the specific examples.",
            "A model can score close to perfectly on data it has already seen while performing badly on anything new, the same way a student who memorized last year's exact exam questions can ace a re-run of that exam without having learned the subject.",
          ],
        },
        {
          kind: "example",
          heading: "The basic split",
          body: "A common default is 80% of the data for training and 20% held back for testing — the model never sees the test set until final evaluation.",
          language: "python",
          code: `from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    features, labels, test_size=0.2, random_state=42
)

model.fit(X_train, y_train)              # learns only from the training set
accuracy = model.score(X_test, y_test)   # graded on data it never saw`,
        },
        {
          kind: "terminal",
          heading: "The same split, in a live session",
          description:
            "The training score and test score are never the same number — the gap between them (91.2% vs. 84.7% here) is exactly what this lesson is about.",
          lines: [
            { text: "X_train.shape, X_test.shape" },
            { text: "((800, 12), (200, 12))", output: true },
            { text: "model.fit(X_train, y_train)" },
            { text: "LogisticRegression()", output: true },
            { text: "model.score(X_train, y_train)" },
            { text: "0.912", output: true },
            { text: "model.score(X_test, y_test)" },
            { text: "0.847", output: true },
          ],
        },
        {
          kind: "bullets",
          heading: "Refinements worth knowing",
          intro: "A single train/test split is the starting point; two extensions make evaluation more reliable.",
          bullets: [
            "Validation set: a third slice used while tuning a model (e.g., choosing settings), so the test set stays completely untouched until the very end.",
            "Cross-validation: instead of one fixed split, the data is split multiple different ways and the model is trained/tested on each, then results are averaged — this reduces the risk that one lucky (or unlucky) split misrepresents performance.",
            "For time-based data (stock prices, sensor readings), the split has to respect time order — training on the future and testing on the past leaks information a real deployed model would never have had.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Data leakage: the subtle way this goes wrong",
          body: "If any information from the test set — even indirectly, like a normalization step calculated across the full dataset before splitting — influences training, the test score becomes falsely optimistic. Always split first, then do any data preparation that involves calculating statistics from the data, fit only on the training portion.",
        },
        {
          kind: "bullets",
          heading: "A second leakage trap: near-duplicate rows split across train and test",
          intro:
            "This one is easy to miss because nothing about the split itself looks wrong.",
          bullets: [
            "If a dataset has multiple rows per customer (several purchases, several support tickets), a plain random split can put some of a customer's rows in training and others in test — the model effectively \"met\" that customer already, just through a different row.",
            "The fix is a group-aware split: keep every row belonging to the same customer (or same patient, same device) entirely in training or entirely in test, never both.",
            "The same risk shows up with near-duplicate records from copy-pasted data entry, or images that are near-identical crops of the same source photo — a test score built on data the model has effectively already seen looks great and means almost nothing.",
          ],
        },
        {
          kind: "example",
          heading: "Stratified splitting for imbalanced classes",
          body: "A plain random split can accidentally put almost none of the minority class into the test set — stratified splitting keeps the same class ratio in both pieces.",
          language: "python",
          code: `# Fraud dataset: 2% of rows are fraud (imbalanced)
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    features, labels, test_size=0.2,
    stratify=labels, random_state=42
)
# stratify=labels keeps ~2% fraud in both X_train and X_test —
# without it, a small or unlucky split could land a test set
# with almost no fraud examples, making the test score
# meaningless for the case that actually matters.`,
        },
        {
          kind: "bullets",
          heading: "K-fold cross-validation, concretely",
          intro:
            "Cross-validation was named as a refinement above — worth actually walking through what \"average results across multiple splits\" means in practice.",
          bullets: [
            "In 5-fold cross-validation, the data is divided into 5 equal chunks (\"folds\"). The model trains on 4 of them and tests on the 1 held out, five separate times, using a different fold as the test set each time.",
            "The final reported score is the average across all 5 runs — a much more stable estimate than any single split, since every row gets to be in the test set exactly once, and the result isn't at the mercy of one particular lucky or unlucky split.",
            "The tradeoff is cost: 5-fold cross-validation means training the model 5 separate times instead of once, which matters for a model that's expensive or slow to train — a single train/test split is still the reasonable default when training time is a real constraint.",
            "The standard deviation across the 5 fold scores is itself informative — five folds that all score within a point of each other suggest a stable, trustworthy estimate; five folds that swing wildly suggest the model's performance depends heavily on exactly which data it happens to see, which is worth investigating before trusting the average at all.",
          ],
        },
        {
          kind: "example",
          heading: "Five folds, one averaged score",
          body: "Each fold gets its own turn as the test set — the spread across folds, not just the average, is worth reading too.",
          code: `Fold 1 test accuracy: 84.1%
Fold 2 test accuracy: 86.3%
Fold 3 test accuracy: 83.7%
Fold 4 test accuracy: 85.0%
Fold 5 test accuracy: 84.9%

Average: 84.8%   (a single 80/20 split might have landed
anywhere from 83.7% to 86.3% just by chance — the average
across all 5 folds is a far more trustworthy number to report.)`,
        },
        {
          kind: "summary",
          heading: "The one-sentence rule",
          bullets: [
            "Never trust a performance number measured on data the model was trained on.",
            "Hold out real, untouched data, and use that — and only that — for the final judgment.",
          ],
        },
      ],
    },
    {
      title: "Overfitting and Underfitting",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Overfitting and Underfitting",
          subheading:
            "A model that memorizes and a model that's too simple look like opposite problems — but diagnosing which one you have is the same skill either way.",
        },
        {
          kind: "text",
          heading: "Two ways a model can go wrong",
          body: [
            "Overfitting: the model learns the training data too well — including its noise and quirks — and performs great on training data but poorly on new data. It memorized instead of generalizing.",
            "Underfitting: the model is too simple to capture the real pattern at all, so it performs poorly even on the training data it was shown. It never really learned the relationship in the first place.",
          ],
        },
        {
          kind: "bullets",
          heading: "How to spot each one",
          bullets: [
            "Overfitting signature: high accuracy on training data, noticeably lower accuracy on test data — a big gap between the two.",
            "Underfitting signature: mediocre accuracy on both training and test data — the model isn't even doing well on what it studied from.",
            "A useful mental picture: overfitting is a student who memorized every practice question's exact answer key; underfitting is a student who barely studied the subject at all.",
          ],
        },
        {
          kind: "chart",
          heading: "Train vs. test accuracy across the three cases",
          description:
            "The gap between the two bars is the tell: huge for overfitting, small-but-mediocre for underfitting, small-and-high for a good fit.",
          chartType: "bar",
          unit: "%",
          data: [
            { label: "Overfit — train", value: 97 },
            { label: "Overfit — test", value: 74 },
            { label: "Underfit — train", value: 61 },
            { label: "Underfit — test", value: 59 },
            { label: "Good fit — train", value: 89 },
            { label: "Good fit — test", value: 87 },
          ],
        },
        {
          kind: "example",
          heading: "The classic curve-fitting picture",
          body: "Imagine fitting a line through scattered points that roughly trend upward with some noise.",
          code: `Underfit:  a flat, straight line through data that clearly curves
           (too simple — misses the real trend)

Good fit:  a smooth curve that follows the general trend,
           ignoring individual noisy points

Overfit:   a wiggly line that passes through every single point exactly
           (perfect on this data, nonsensical on any new point)`,
        },
        {
          kind: "bullets",
          heading: "What actually fixes each one",
          intro: "The fixes point in opposite directions, which is why correctly diagnosing which one you have matters.",
          bullets: [
            "Fixing overfitting: get more training data, simplify the model, use regularization (a penalty that discourages the model from relying too heavily on any one pattern), or stop training earlier.",
            "Fixing underfitting: use a more expressive model, add more relevant features, or train for longer / with less aggressive simplification.",
            "In both cases, cross-validation (previous lesson) is how you actually detect which problem you have before it costs you in production.",
          ],
        },
        {
          kind: "example",
          heading: "What regularization actually does to the math",
          body: "Regularization adds a penalty term to the error the model is trying to minimize, so it has to \"earn\" the right to rely heavily on any single feature.",
          code: `Plain error (what least squares minimizes):
  error = sum((actual - predicted)^2)

Regularized error (L2 / \"ridge\"):
  error = sum((actual - predicted)^2) + lambda * sum(coefficient^2)

Turning lambda up pushes coefficients toward zero — the model
is penalized for using a feature unless that feature earns its
keep by meaningfully reducing the original error. Too small a
lambda barely helps overfitting; too large a lambda starts
causing underfitting by suppressing real signal too.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A real-world consequence of missing this",
          body: "A home-resale price model trained mainly on data from a hot seller's market can overfit to conditions specific to that period — it learns \"homes near this school district reliably sell 8% over asking\" as if it were a stable rule, when it was really a temporary artifact of low inventory. When the market cools, the model keeps confidently overpaying based on a pattern that no longer holds — a costly failure that a train/test split within the same hot period would never have caught, since both halves shared the same temporary conditions.",
        },
        {
          kind: "text",
          heading: "Learning curves: watching it happen, not just the end state",
          body: [
            "Training accuracy and test accuracy aren't static numbers — tracking both across training iterations (or epochs, for models trained iteratively) reveals overfitting as it happens rather than just as a final verdict. Early on, both curves typically rise together, since the model is still learning genuine signal. At some point, training accuracy keeps climbing while test accuracy flattens or starts to fall — that divergence point is exactly when the model shifts from learning the pattern to memorizing the training set's specific noise.",
          ],
        },
        {
          kind: "example",
          heading: "A learning curve, epoch by epoch",
          body: "Watching the gap widen tells you exactly when to stop, rather than guessing at a fixed number of training iterations in advance.",
          code: `Epoch 1:  train acc 68%   test acc 66%   (both learning)
Epoch 5:  train acc 84%   test acc 81%   (still tracking closely)
Epoch 10: train acc 93%   test acc 86%   (gap starting to open)
Epoch 20: train acc 99%   test acc 79%   (overfitting — test accuracy fell)`,
        },
        {
          kind: "bullets",
          heading: "Early stopping and other overfitting fixes in practice",
          bullets: [
            "Early stopping halts training the moment test (or validation) performance stops improving, even if training accuracy would keep climbing further — it's frequently the cheapest fix available, since it costs nothing extra to implement in most training setups.",
            "Dropout, common in neural networks, randomly disables a fraction of the model's internal connections during each training step — forcing the model to not over-rely on any single connection, a close cousin of the L2 regularization covered earlier.",
            "Data augmentation (for images: rotating, cropping, flipping training examples) manufactures more effective training variety without collecting new data — a practical way to fight overfitting when getting more real labeled data is expensive or slow.",
            "None of these fixes work if the underlying dataset is simply too small for the pattern's real complexity — at some point, more data genuinely is the only fix that helps.",
          ],
        },
        {
          kind: "summary",
          heading: "The bias-variance tradeoff, in plain terms",
          bullets: [
            "A simpler model is more biased (it makes stronger, sometimes wrong, assumptions) but more stable across different data samples.",
            "A more complex model has lower bias but higher variance (it swings more based on exactly which data it happened to see).",
            "Good modeling is finding the point between those two failure modes, not eliminating one entirely.",
          ],
        },
      ],
    },
    {
      title: "How Linear Regression Actually Works",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "How Linear Regression Actually Works",
          subheading:
            "Linear regression is often the first real algorithm people learn — not because it's the most powerful, but because you can trace exactly what it's doing, start to finish.",
        },
        {
          kind: "text",
          heading: "The idea in one sentence",
          body: [
            "Linear regression tries to draw the straight line (or, with more inputs, a flat plane) that best fits a set of points — best meaning it minimizes how far off its predictions are, on average, across all the training examples.",
          ],
        },
        {
          kind: "example",
          heading: "A tiny, concrete example",
          body: "With one input variable, the model is just the equation of a line — the algorithm's whole job is finding the best values for m and b.",
          code: `Predicting house price from square footage:

price = m * square_footage + b

Training data (5 houses):
  1000 sqft -> $200,000
  1500 sqft -> $280,000
  2000 sqft -> $350,000
  2500 sqft -> $410,000
  3000 sqft -> $500,000

After training, the model might find:
  m ≈ 148     (about $148 more per additional sqft)
  b ≈ 55,000  (a baseline value before sqft is factored in)

price ≈ 148 * square_footage + 55,000`,
        },
        {
          kind: "chart",
          heading: "Price rises roughly in a straight line with square footage",
          description: "The same 5 training houses from above — this is the pattern the line is fitted to.",
          chartType: "line",
          unit: "$",
          data: [
            { label: "1000 sqft", value: 200000 },
            { label: "1500 sqft", value: 280000 },
            { label: "2000 sqft", value: 350000 },
            { label: "2500 sqft", value: 410000 },
            { label: "3000 sqft", value: 500000 },
          ],
        },
        {
          kind: "bullets",
          heading: "How the algorithm actually finds m and b",
          intro: "It doesn't guess randomly — it minimizes a specific measure of error.",
          bullets: [
            "For any candidate line, you can measure error as the sum of squared differences between each real price and the line's predicted price — this is why it's called least squares.",
            "Gradient descent is the common method for finding the best line: start with a rough guess for m and b, then repeatedly nudge them in the direction that reduces the total error, a small step at a time.",
            "This process stops once further nudges stop meaningfully reducing the error — at that point, the line is as good a fit as this method can find for this data.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why this simple algorithm is still worth knowing",
          body: "Linear regression is rarely the most accurate model for a hard problem, but its transparency is genuinely valuable — you can look at m (the coefficient) directly and say each extra square foot is worth about $148 in this dataset, which is much harder to say plainly about many more complex models.",
        },
        {
          kind: "example",
          heading: "Extending to multiple features",
          body: "Real problems rarely use just one input — multiple linear regression adds a coefficient per feature, but the underlying idea (a weighted sum, fitted by least squares) doesn't change.",
          code: `price = m1*square_footage + m2*bedrooms + m3*distance_to_downtown + b

After training, the model might find:
  m1 ≈ 140   (price per additional sqft, holding the rest constant)
  m2 ≈ 8,000 (price per additional bedroom)
  m3 ≈ -3,200 (price drop per mile from downtown)
  b  ≈ 40,000

Each coefficient is read "holding everything else fixed" — m1
is smaller here than in the single-feature model because some
of what square footage used to explain alone is now explained
partly by bedroom count instead.`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The trap multiple features introduces: multicollinearity",
          body: "When two features are highly correlated with each other — square footage and bedroom count usually are — the model can't cleanly tell which one deserves credit for the price change, and their individual coefficients can become unstable or even flip sign, even though the model's overall predictions still look fine. The practical fix is checking correlation between input features before training, and dropping or combining redundant ones rather than trusting an individual coefficient at face value when this is present.",
        },
        {
          kind: "bullets",
          heading: "Where a straight line breaks down",
          bullets: [
            "Real relationships are often not straight lines — a decision tree instead asks a series of yes/no questions (e.g., is square footage over 1800? is the location in zip code X?) and can capture patterns a single line can't.",
            "Both approaches still follow everything covered earlier: they're trained on a training split, evaluated on a held-out test split, and can overfit or underfit depending on how complex they're allowed to get.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "R² and residuals: checking a fit, not just trusting it",
          body: "The coefficients tell you the relationship the model found; R² (the coefficient of determination) tells you how much of the actual variation in price that relationship explains — an R² of 0.85 means the model accounts for 85% of the variation in price across the training houses, with the rest left unexplained. A residual (actual price minus predicted price) that's small and randomly scattered across every house is a good sign; residuals that grow systematically larger for bigger houses, or that consistently undershoot houses in one neighborhood, mean the straight-line assumption itself is breaking down for part of the data, not just that a bit more noise remains.",
        },
        {
          kind: "text",
          heading: "The assumptions worth knowing, even briefly",
          body: [
            "Linear regression's math relies on a few assumptions that are easy to skip past: the true relationship is genuinely close to linear, the errors are roughly independent of each other, and the spread of errors stays roughly constant across the range of predictions (homoscedasticity) rather than fanning out wider for larger predicted values.",
            "None of these need to hold perfectly for linear regression to still be useful — but when they're badly violated (a relationship that's actually curved, or errors that balloon for expensive houses), the model's coefficients and its confidence in them become unreliable in ways a plain accuracy or R² number won't obviously reveal. A quick plot of residuals against predicted values is usually enough to catch a serious violation before trusting the model's coefficients too literally.",
          ],
        },
        {
          kind: "summary",
          heading: "The full loop, tied together",
          bullets: [
            "Choose an algorithm (like linear regression) appropriate to the pattern you expect in the data.",
            "Train it on a training split, evaluate it honestly on a test split.",
            "Watch for overfitting (too complex) or underfitting (too simple), and adjust.",
            "The specific algorithm changes; this loop is the shape of nearly every supervised ML project.",
          ],
        },
      ],
    },
    {
      title: "Choosing and Evaluating a Model",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Choosing and Evaluating a Model",
          subheading:
            "Building a model is only half the job — knowing whether it's actually good enough to trust, and for what, is the other half.",
        },
        {
          kind: "text",
          heading: "Why accuracy alone can be misleading",
          body: [
            "Accuracy — the percent of predictions the model got right — sounds like the obvious metric, but it can be dangerously misleading on imbalanced problems. If only 1% of transactions are fraudulent, a model that predicts \"not fraud\" every single time is 99% accurate and completely useless.",
          ],
        },
        {
          kind: "bullets",
          heading: "Two metrics that matter more in practice",
          intro: "For classification problems especially, precision and recall usually tell you more than a single accuracy number.",
          bullets: [
            "Precision: of everything the model flagged as fraud, what fraction actually was fraud? Low precision means a lot of false alarms.",
            "Recall: of all the actual fraud that happened, what fraction did the model catch? Low recall means real fraud is slipping through undetected.",
            "There's usually a tradeoff between the two — making a model flag more cases (raising recall) typically raises false alarms too (lowering precision), and the right balance depends entirely on what a false alarm costs versus what a miss costs.",
          ],
        },
        {
          kind: "example",
          heading: "Reading a confusion matrix",
          body: "This simple table underlies precision and recall — most classification evaluation starts here.",
          code: `                Predicted: Fraud   Predicted: Not Fraud
Actual: Fraud        85 (caught)        15 (missed)
Actual: Not Fraud    40 (false alarm)   9,860 (correct)

Precision = 85 / (85 + 40)  ≈ 68%
Recall    = 85 / (85 + 15)  ≈ 85%`,
        },
        {
          kind: "chart",
          heading: "Precision and recall from the confusion matrix above",
          description:
            "Precision asks how trustworthy a fraud flag is; recall asks how much real fraud gets caught — this model catches more than it accurately flags.",
          chartType: "bar",
          unit: "%",
          data: [
            { label: "Precision", value: 68 },
            { label: "Recall", value: 85 },
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Pick the metric that matches the real cost",
          body: "A spam filter that misses a spam email (low recall) is mildly annoying. A medical screening test that misses a real case (low recall) is far more serious than one that produces some false alarms. Decide what a mistake costs in the real system before deciding which metric to optimize.",
        },
        {
          kind: "bullets",
          heading: "When you genuinely can't pick just one: F1 score, and the threshold behind every classification",
          intro:
            "Most classifiers don't just output \"fraud\" or \"not fraud\" — they output a probability, and a threshold decides where that probability gets rounded to a decision.",
          bullets: [
            "F1 score is the harmonic mean of precision and recall — it's a reasonable single number when both matter roughly equally and you need one metric to compare models, though it still hides which of the two is driving a low score.",
            "Almost every classification model actually outputs a probability (\"73% likely fraud\") — the usual 50% cutoff for calling something \"fraud\" is a choice, not a law, and moving it directly trades precision for recall.",
            "Lowering the threshold (flagging anything over, say, 20% likely fraud) catches more real fraud but also flags more false alarms — raising recall at the direct expense of precision, with no retraining required.",
            "This is often the fastest lever to pull when a stakeholder says \"we need to catch more fraud\" or \"we need fewer false alarms\" — before reaching for a different model entirely, check whether the current model's threshold is simply set wrong for the actual cost tradeoff.",
          ],
        },
        {
          kind: "example",
          heading: "The same model, three thresholds",
          body: "Same underlying model and the same 2,000 transactions — only the cutoff for calling something \"fraud\" changes.",
          code: `Threshold 0.7 (strict): Precision 82%   Recall 61%
Threshold 0.5 (default): Precision 68%   Recall 85%
Threshold 0.3 (loose):   Precision 51%   Recall 94%

Nothing was retrained between these three rows — moving the
threshold from 0.5 to 0.3 traded 17 points of precision for
9 points of recall. Whether that's a good trade depends
entirely on what a missed fraud case costs versus what an
unnecessary manual review costs.`,
        },
        {
          kind: "bullets",
          heading: "For regression problems: the metrics that replace precision and recall",
          intro:
            "Precision, recall, and F1 are classification metrics — a model predicting a number (a price, a demand forecast) needs a different toolkit entirely.",
          bullets: [
            "Mean Absolute Error (MAE) — the average size of the prediction error, in the same units as what's being predicted; an MAE of $12,000 on house price predictions means predictions are off by $12,000 on average, in either direction.",
            "Root Mean Squared Error (RMSE) — similar to MAE, but squares errors before averaging (then takes the square root), which penalizes large individual misses more heavily than MAE does — a model with a few wildly wrong predictions will show a much worse RMSE than MAE relative to a model with consistently middling errors.",
            "R² (introduced in the linear regression lesson) — the fraction of the real variation in the outcome that the model's predictions actually explain, useful as a single overall summary rather than an error size in real units.",
            "Which to lead with depends on the cost structure: RMSE is the right choice when a few very large errors are disproportionately costly (a shipping-demand forecast that's wildly wrong once causes a stockout), while MAE is more honest when every unit of error matters roughly equally regardless of size.",
          ],
        },
        {
          kind: "example",
          heading: "MAE and RMSE disagreeing about which model is better",
          body: "Same two models, same 4 test houses — which one \"wins\" depends on which metric you're reading.",
          code: `Actual prices:     $200k   $250k   $300k   $900k
Model A predicts:  $210k   $240k   $310k   $700k
Model B predicts:  $195k   $260k   $290k   $890k

Model A errors: 10k, 10k, 10k, 200k
Model B errors: 5k,  10k,  10k,  10k

MAE — Model A: (10+10+10+200)/4 = 57.5k
MAE — Model B: (5+10+10+10)/4   = 8.75k

Model B has far lower MAE and RMSE here — it's simply more
accurate across the board, including on the one expensive
outlier house that Model A badly mispriced.`,
        },
        {
          kind: "summary",
          heading: "Closing the loop on the fundamentals",
          bullets: [
            "ML replaces hand-written rules with patterns learned from labeled or unlabeled data.",
            "Always evaluate on data the model hasn't seen, and watch specifically for overfitting versus underfitting.",
            "Choose your evaluation metric based on what a real mistake actually costs — not just whichever number looks highest.",
          ],
        },
      ],
    },
    {
      title: "How K-Means Clustering Actually Works",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "How K-Means Clustering Actually Works",
          subheading:
            "Unsupervised learning found clusters in customer data — this lesson opens up exactly how it does that, using the same trace-it-yourself approach linear regression got.",
        },
        {
          kind: "text",
          heading: "The idea in one sentence",
          body: [
            "K-means groups data into k clusters by repeatedly assigning each point to its nearest cluster center, then moving each center to the average position of the points assigned to it — repeating until the assignments stop changing.",
          ],
        },
        {
          kind: "example",
          heading: "Watching it converge on a tiny dataset",
          body: "Two obvious clusters of customer data (annual purchases, avg order value). k=2, starting centroids picked at random.",
          code: `Step 0 (random start):
  Centroid A = (10, 40)   Centroid B = (60, 90)

Step 1 — assign each point to its nearest centroid:
  Point (12, 45)  -> A        Point (58, 95) -> B
  Point (15, 38)  -> A        Point (65, 88) -> B
  Point (9, 42)   -> A        Point (61, 92) -> B

Step 2 — recompute each centroid as the average of its points:
  Centroid A = (12.0, 41.7)   Centroid B = (61.3, 91.7)

Repeat steps 1-2. Assignments stop changing -> converged.`,
        },
        {
          kind: "diagram",
          heading: "The k-means loop",
          description: "Steps 1 and 2 from the walkthrough above, repeated until convergence.",
          steps: [
            { label: "Pick k centroids", detail: "Chosen at random as a starting point" },
            { label: "Assign points", detail: "Each point joins its nearest centroid" },
            { label: "Recompute centroids", detail: "Move each centroid to the mean of its assigned points" },
            { label: "Repeat", detail: "Until assignments stop changing" },
          ],
        },
        {
          kind: "bullets",
          heading: "Choosing k, and what breaks the algorithm",
          intro:
            "K-means needs the number of clusters, k, decided up front — it doesn't discover that number on its own.",
          bullets: [
            "The elbow method: run k-means for several values of k, plot the total distance from points to their centroid, and look for the point where adding another cluster stops meaningfully reducing that distance.",
            "K-means assumes clusters are roughly round and similarly sized — a genuinely elongated or oddly shaped cluster gets split or merged incorrectly no matter how well you pick k.",
            "The random starting centroids matter: different starting points can converge to different final clusters, which is why most implementations run the algorithm several times and keep the best result.",
            "Features on very different scales (e.g., income in dollars next to age in years) will let the larger-scale feature dominate distance calculations — scaling features first is close to mandatory.",
          ],
        },
        {
          kind: "bullets",
          heading: "When k-means is the wrong tool, and what to reach for instead",
          intro:
            "K-means' round-cluster assumption is a real limitation, not a minor footnote — knowing when to switch algorithms matters as much as knowing k-means itself.",
          bullets: [
            "DBSCAN groups points by density instead of distance-to-a-center, so it naturally handles oddly-shaped clusters and doesn't force every point into a group — points in sparse regions are labeled as noise instead of being crammed into the nearest cluster.",
            "Hierarchical clustering builds a tree of nested clusters rather than a fixed k, which is useful when you genuinely don't know how many groups exist and want to inspect several possible groupings (cutting the tree at different heights) before committing.",
            "Prefer k-means when clusters are roughly round and you have a rough sense of k already — it's fast and scales well to large datasets. Prefer DBSCAN when cluster shape is unknown or irregular and some points genuinely shouldn't belong to any group. Prefer hierarchical clustering when you want to explore multiple possible values of k rather than commit to one upfront.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "A real-world consequence of the round-cluster assumption",
          body: "A retailer ran k-means on customer purchase data expecting to find a small \"high-value, low-frequency\" segment — big spenders who buy rarely. Because that group formed a thin, elongated shape in the data (spend and frequency trading off against each other) rather than a round blob, k-means split it apart and merged pieces of it into two larger, more typically-shaped clusters instead. The segment was real; k-means' shape assumption just couldn't see it. Switching to DBSCAN on the same data recovered it as a distinct, if smaller, group.",
        },
        {
          kind: "bullets",
          heading: "Measuring cluster quality without any labels to check against",
          intro:
            "Since there's no right answer to grade against, evaluating whether k-means found genuinely good clusters needs its own specific tools.",
          bullets: [
            "Inertia (the sum of squared distances from each point to its own centroid) is what k-means directly minimizes during training — lower is tighter, but inertia always decreases as k increases, down to zero when k equals the number of points, so it can't be used alone to pick k.",
            "The silhouette score measures, for each point, how much closer it is to its own cluster than to the next-nearest one, averaged across all points — it ranges from -1 to 1, and unlike inertia, it naturally penalizes picking too many clusters, since points in an unnecessarily split cluster end up nearly as close to the neighboring cluster as their own.",
            "A silhouette score near 0 for a specific point means it sits right on the boundary between two clusters — genuinely ambiguous, not a sign the algorithm made a mistake — while a negative score suggests that point was probably assigned to the wrong cluster entirely.",
            "In practice, the elbow method (on inertia) and the silhouette score are often used together — the elbow narrows down a reasonable range of k values, and silhouette score picks the best one within that range.",
          ],
        },
        {
          kind: "example",
          heading: "Elbow method and silhouette score, side by side",
          body: "Inertia keeps dropping as k grows — silhouette score is what actually signals when adding another cluster stopped helping.",
          code: `k=2:  inertia=8,400   silhouette=0.61
k=3:  inertia=5,100   silhouette=0.58
k=4:  inertia=3,900   silhouette=0.44   <- silhouette drops
k=5:  inertia=3,200   silhouette=0.31   <- keeps dropping
k=6:  inertia=2,700   silhouette=0.26

Inertia alone would tempt you toward a larger k (it never
stops improving). Silhouette score peaks at k=2, meaning the
tightest, most cleanly-separated clustering is actually the
simplest one — k=4, 5, and 6 are technically lower inertia
but describe increasingly overlapping, less meaningful groups.`,
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "Why this counts as unsupervised, concretely",
          body: "Nothing in this process ever looks at a 'correct' cluster label — there isn't one. The algorithm only ever looks at distances between points. That's the practical meaning of 'no labels' from the earlier lesson: success is measured by how tight and separated the resulting clusters are, not by matching a known right answer.",
        },
        {
          kind: "summary",
          heading: "K-means, in short",
          bullets: [
            "It alternates between assigning points to the nearest centroid and moving centroids to the average of their assigned points, until nothing changes.",
            "You choose k; the elbow method gives a principled way to pick it instead of guessing.",
            "Like every model in this course, its output is only as good as the features and scaling it's given.",
          ],
        },
      ],
    },
    {
      title: "Practice: Diagnosing Model Behavior",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Diagnosing Model Behavior",
          subheading:
            "Five scenarios pulled from real project situations — work through each before checking the solution.",
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "How to use this practice",
          body: "Every scenario below hands you numbers, not a description of the problem — the diagnosis has to come from reading the numbers correctly, the same way it would on a real project. Write down your own read before checking the solution; getting the right final answer for the wrong reason is exactly the kind of gap this practice is meant to catch.",
        },
        {
          kind: "practice",
          heading: "Diagnose the gap",
          prompt:
            "A model built to predict customer churn scores 97% accuracy on its training data and 74% accuracy on its held-out test set. The team is proud of the 97% number and wants to ship it. Diagnose what's actually happening, and name two concrete changes you'd make before shipping.",
          hint: "Compare the two numbers, not just the training one — a large train/test gap has a name covered earlier in this course.",
          solution:
            "This is overfitting: the 23-point gap between training and test accuracy means the model memorized patterns specific to the training data (including noise) rather than learning the general relationship. The 97% figure is not a trustworthy estimate of real-world performance — the 74% test figure is much closer to what to expect in production. Two reasonable fixes: (1) simplify the model or add regularization so it's penalized for relying too heavily on any single feature, and (2) get more training data or use cross-validation to confirm 74% is a stable estimate rather than one unlucky split. Shipping based on the 97% number would set the business up for a real-world surprise.",
        },
        {
          kind: "practice",
          heading: "Read the confusion matrix and pick the metric that matters",
          prompt:
            "A hospital's model flags patients for an additional cancer screening test. On 2,000 patients: 40 actually have early-stage cancer. The model flags 60 patients total, correctly catching 36 of the 40 real cases (4 missed) and incorrectly flagging 24 healthy patients. Calculate precision and recall, then decide which one the hospital should prioritize improving and why.",
          hint: "Precision = true positives / all flagged. Recall = true positives / all actual positives. Then think about what a false negative costs here versus a false alarm.",
          solution:
            "True positives = 36, false positives = 24, false negatives = 4. Precision = 36 / (36 + 24) = 36/60 = 60%. Recall = 36 / (36 + 4) = 36/40 = 90%. Recall should be the priority here: a missed case (false negative) means a real cancer goes undetected until it's caught some other way, which is a far more serious cost than a false alarm (an extra, unnecessary follow-up test for a healthy patient). Optimizing further for precision at the expense of recall — flagging fewer people to cut down false alarms — would be the wrong call for this specific application, even though it would make the precision number look better.",
        },
        {
          kind: "practice",
          heading: "Classify the business question",
          prompt:
            "Three real requests land on your desk: (1) 'Predict which of our 50,000 users will cancel their subscription next month.' (2) 'We have no idea what natural segments exist in our user base — find some.' (3) 'Group our support tickets into a manageable number of topics without predefining what those topics are.' For each, say whether it's supervised or unsupervised, and if unsupervised, whether k-means-style clustering is a reasonable fit.",
          hint: "Ask the test question from the supervised/unsupervised lesson: could someone hand-label the right answer for each row today?",
          solution:
            "(1) Supervised — you have historical data on who actually cancelled, so you can train on labeled outcomes (cancelled / not cancelled) and predict for current users. (2) Unsupervised — there's no predefined 'correct' segment for any user, so this is a discovery task; k-means (or a similar clustering method) is a reasonable fit as long as the features used to describe each user are numeric and reasonably scaled. (3) Also unsupervised and also a clustering-shaped problem, though ticket text usually needs to be converted into numeric features first (a step this course doesn't cover in depth) before something like k-means can be applied to it directly.",
        },
        {
          kind: "practice",
          heading: "Diagnose the opposite problem",
          prompt:
            "A different team's churn model scores 61% accuracy on training data and 59% on test data. They assume this small gap means the model is fine and ready to ship, since 'overfitting is when training and test scores are far apart, and ours are close.' Are they right? If not, what's actually wrong, and what's the fix — and specifically, why won't more training data fix it?",
          hint: "A small train/test gap only rules out one of the two failure modes covered in this course. Check what both scores are actually doing, not just the size of the gap between them.",
          solution:
            "They're not right. A small gap does rule out overfitting, but 61% and 59% are both mediocre — the signature of underfitting, not a healthy model. The model isn't even performing well on the data it directly studied from, which means it never captured the real relationship in the first place. More training data specifically won't fix this: underfitting means the model itself is too simple (or missing the right features) to represent the pattern, and feeding a too-simple model more examples of a pattern it structurally can't represent just gives it more data to be equally mediocre on. The actual fixes are a more expressive model, additional or better-engineered features, or training for longer with less aggressive simplification — the same 'increase capacity' direction, not 'add more rows.'",
        },
        {
          kind: "practice",
          heading: "Diagnose a model that looks great and is quietly wrong",
          prompt:
            "A 'good hire' prediction model is trained on the label 'was this employee promoted within 2 years of hire.' It performs well on both training and test data — no overfitting, no underfitting, strong precision and recall. The hiring team wants to deploy it to help screen candidates. What's the actual problem here, and why don't strong train/test metrics catch it?",
          hint: "This isn't a train/test-gap problem at all — revisit what this course said about trusting a label before trusting a model's evaluation metrics.",
          solution:
            "The problem is the label itself, not the model's fit to it. 'Promoted within 2 years' is a proxy for 'good hire,' and it bakes in whatever biases already shaped past promotion decisions — the model is faithfully learning to predict who got promoted historically, which is not the same question as who would actually perform well. Train/test metrics can't catch this because both the training and test sets share the exact same flawed label; the model can score well on 'predicting the proxy' while being confidently wrong about the actual question the hiring team cares about. The fix isn't a modeling technique at all — it's going back to how the label was generated and asking whether it actually measures what the stated business question needs, before trusting any accuracy, precision, or recall number built on top of it. Concretely, before this ships: ask who got promoted historically and why, check whether that pattern is something you'd actually want a hiring model to reproduce going forward, and consider whether a genuinely better label exists — a later performance review score, for instance — even if it's harder to get and means retraining from a smaller, costlier dataset.",
        },
        {
          kind: "practice",
          heading: "Diagnose a metric that's technically true and practically useless",
          prompt:
            "A fraud-detection model is reported as \"99.4% accurate\" in a project update. Digging into the data: 0.5% of all transactions are actually fraudulent, and the model predicts \"not fraud\" for every single transaction it's ever given. Is 99.4% accuracy meaningful here? What should the team report instead, and why?",
          hint: "Compare the model's accuracy number to what a model that does literally nothing — always predicting the majority class — would score on this same data.",
          solution:
            "It's not meaningful — it's actively misleading. A model that always predicts \"not fraud\" on data where 99.5% of transactions genuinely aren't fraud would score 99.5% accuracy by doing zero real work, so a reported 99.4% is barely distinguishable from a model that caught nothing at all. Accuracy on a heavily imbalanced problem rewards the model for agreeing with the majority class, which tells you almost nothing about the thing that actually matters here: whether real fraud gets caught. The team should report precision and recall (and likely a confusion matrix alongside them) instead — recall specifically answers \"of all the actual fraud, how much did we catch,\" which is the number a stakeholder deciding whether this model is worth deploying actually needs to see, not a headline accuracy figure that a do-nothing baseline could nearly match.",
        },
        {
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Spotting overfitting from a train/test gap, and knowing regularization and cross-validation are the levers to pull.",
            "Recognizing underfitting from two mediocre scores rather than a wide gap, and knowing that more data alone doesn't fix it.",
            "Calculating precision and recall from a confusion matrix, and picking the one that matches real-world cost.",
            "Correctly sorting a business question into supervised, unsupervised, or clustering-shaped before ever picking an algorithm.",
            "Recognizing that a flawed proxy label can produce a model with excellent train/test metrics that is still answering the wrong question.",
            "Catching a headline accuracy number that's actually no better than a do-nothing baseline on an imbalanced problem.",
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
            "Five questions across the whole course — the kind of understanding that should survive being asked a different way than the lesson asked it.",
        },
        {
          kind: "quiz",
          heading: "Labels and learning",
          question:
            "A retailer wants to group its stores into a handful of types based on sales patterns, without any predefined categories to match against. What kind of problem is this?",
          options: [
            "Supervised regression, since sales is a number",
            "Supervised classification, since 'store type' is a category",
            "Unsupervised learning, since there's no labeled right answer to learn from",
            "Reinforcement learning, since the retailer will act on the result",
          ],
          correctIndex: 2,
          explanation:
            "The deciding question is whether a labeled 'correct answer' exists for each row today. Here nobody has pre-defined what the store types are, so this is unsupervised (clustering is the typical family of methods for it) — even though the underlying feature, sales, happens to be numeric, and even though the business will eventually act on the output.",
        },
        {
          kind: "quiz",
          heading: "Why the split exists",
          question:
            "A model scores 95% accuracy when evaluated on the exact data it was trained on. Why is this number, by itself, not trustworthy as an estimate of real-world performance?",
          options: [
            "Because 95% is suspiciously close to 100%",
            "Because the model may have partly memorized the training data rather than learned the general pattern",
            "Because accuracy is always the wrong metric to use",
            "Because training data is always smaller than production data",
          ],
          correctIndex: 1,
          explanation:
            "A model graded on data it already saw can score well by memorizing specifics — including noise — rather than by learning something that generalizes. That's exactly why a held-out test set is required: it measures performance on data the model never had a chance to memorize.",
        },
        {
          kind: "quiz",
          heading: "Overfitting vs. underfitting",
          question:
            "A model performs poorly on both its training data and its test data. What does this pattern indicate?",
          options: [
            "Overfitting — it memorized the training set",
            "Underfitting — it's too simple to capture the real pattern",
            "Data leakage between train and test",
            "The test set is too small to trust",
          ],
          correctIndex: 1,
          explanation:
            "Overfitting's signature is a large gap between strong training performance and weak test performance. Poor performance on both sets instead points to underfitting — the model never captured the real relationship even in the data it studied from, usually fixed with a more expressive model or better features, not more data.",
        },
        {
          kind: "quiz",
          heading: "What linear regression is actually minimizing",
          question:
            "When fitting a linear regression line with the least-squares method, what is the algorithm minimizing?",
          options: [
            "The number of points the line passes through exactly",
            "The sum of the squared differences between actual and predicted values",
            "The total number of features used",
            "The time it takes to train the model",
          ],
          correctIndex: 1,
          explanation:
            "Least squares specifically minimizes the sum of squared errors between each real value and the line's prediction for it — squaring makes larger errors count disproportionately more and keeps positive and negative errors from cancelling out. Gradient descent is the common method used to actually search for the m and b values that minimize this.",
        },
        {
          kind: "quiz",
          heading: "Picking centroids",
          question:
            "In k-means clustering, what happens to a cluster's centroid after points are assigned to it in each iteration?",
          options: [
            "It stays fixed at its initial random position for the whole run",
            "It moves to the average position of all points currently assigned to it",
            "It's deleted and a new random centroid is chosen",
            "It moves to the position of the single closest point",
          ],
          correctIndex: 1,
          explanation:
            "Each iteration recomputes every centroid as the average (mean) of the points currently assigned to it, then reassigns points to their now-nearest centroid. The process repeats until assignments stop changing — that's the 'k-means' name itself, referring to the repeated mean recalculation.",
        },
        {
          kind: "summary",
          heading: "The course's core takeaways",
          bullets: [
            "ML replaces hand-written rules with patterns learned from data — supervised when you have labeled outcomes, unsupervised when you're discovering structure.",
            "Always evaluate on a held-out test set; a training-only score is not a real performance estimate.",
            "Overfitting (big train/test gap) and underfitting (weak on both) need opposite fixes — diagnose before you treat.",
            "Linear regression and k-means are both worth knowing not because they're the most powerful models, but because you can trace exactly what each is doing.",
            "Pick your evaluation metric — accuracy, precision, or recall — based on what a real mistake actually costs.",
          ],
        },
      ],
    },
  ],
};
