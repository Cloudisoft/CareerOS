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
          kind: "bullets",
          heading: "Where a straight line breaks down",
          bullets: [
            "Real relationships are often not straight lines — a decision tree instead asks a series of yes/no questions (e.g., is square footage over 1800? is the location in zip code X?) and can capture patterns a single line can't.",
            "Both approaches still follow everything covered earlier: they're trained on a training split, evaluated on a held-out test split, and can overfit or underfit depending on how complex they're allowed to get.",
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
          kind: "callout",
          tone: "tip",
          heading: "Pick the metric that matches the real cost",
          body: "A spam filter that misses a spam email (low recall) is mildly annoying. A medical screening test that misses a real case (low recall) is far more serious than one that produces some false alarms. Decide what a mistake costs in the real system before deciding which metric to optimize.",
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
            "Three scenarios pulled from real project situations — work through each before checking the solution.",
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
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Spotting overfitting from a train/test gap, and knowing regularization and cross-validation are the levers to pull.",
            "Calculating precision and recall from a confusion matrix, and picking the one that matches real-world cost.",
            "Correctly sorting a business question into supervised, unsupervised, or clustering-shaped before ever picking an algorithm.",
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
