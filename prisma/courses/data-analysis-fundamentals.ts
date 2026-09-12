import type { CourseSeed } from "../course-types";

export const course: CourseSeed = {
  slug: "data-analysis-fundamentals",
  title: "Data Analysis Fundamentals",
  description:
    "How to frame a real data question, clean messy real-world data, pick statistics and charts that don't mislead, and avoid the correlation-versus-causation trap that quietly derails a lot of analysis.",
  category: "Data & AI",
  level: "BEGINNER",
  order: 21,
  lessons: [
    {
      title: "Framing the Question Before You Touch the Data",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Framing the Question Before You Touch the Data",
          subheading:
            "The most common data-analysis mistake happens before a single number is calculated: starting to explore data without a clear question driving it.",
        },
        {
          kind: "text",
          heading: "Why \"let's just look at the data\" usually fails",
          body: [
            "Opening a spreadsheet or dashboard with a vague goal like \"see what's interesting\" tends to produce either nothing useful, or worse, a pattern that looks meaningful purely by chance — with enough columns to scan, some coincidental correlation is almost guaranteed to show up.",
            "A specific, falsifiable question changes the whole process: it tells you which data you actually need, which comparisons matter, and — crucially — what result would prove the idea wrong.",
          ],
        },
        {
          kind: "bullets",
          heading: "What a good question looks like",
          intro: "Compare a vague starting point to a workable one:",
          bullets: [
            "Vague: \"How are sales doing?\" Workable: \"Did sales in the Northeast region grow faster than the company average over the last two quarters?\"",
            "Vague: \"Are customers happy?\" Workable: \"Did customers who used the onboarding checklist have a lower 90-day churn rate than those who didn't?\"",
            "A workable question names a specific metric, a specific comparison group, and a specific time window.",
          ],
        },
        {
          kind: "bullets",
          heading: "Before pulling any data, write down",
          bullets: [
            "What decision this analysis is actually meant to support — if the answer wouldn't change any decision, it's worth questioning why you're doing the analysis.",
            "What you'd expect to see if your hypothesis were true, in concrete numbers, before you look — this catches you if you unconsciously reinterpret results to fit what you wanted to find.",
            "What data would actually answer the question, and whether you realistically have access to it at the quality you need.",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The expensive version of skipping this step",
          body: "A team that jumps straight into a dashboard often produces an answer to a question nobody asked, presented confidently enough that it gets acted on anyway. Fifteen minutes spent writing the actual question down first is cheap insurance against that.",
        },
        {
          kind: "summary",
          heading: "Before you open the data",
          bullets: [
            "Write the specific question, not a general topic.",
            "Note what decision the answer would inform.",
            "Write down your expectation before looking, so you can tell a real finding from a story you talked yourself into.",
          ],
        },
      ],
    },
    {
      title: "Cleaning Messy Real-World Data",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Cleaning Messy Real-World Data",
          subheading:
            "Real data is never as clean as a tutorial dataset — and how you handle its mess quietly determines whether your final numbers mean anything.",
        },
        {
          kind: "bullets",
          heading: "The usual suspects",
          intro: "Almost every real dataset has some combination of these problems.",
          bullets: [
            "Missing values — a field left blank, or filled with a placeholder like \"N/A,\" \"0,\" or \"-1\" that looks like real data but isn't.",
            "Duplicates — the same customer or transaction appearing twice, often from a system export bug or a merge of two data sources.",
            "Inconsistent formatting — \"NY,\" \"New York,\" and \"ny\" all meaning the same state; dates stored as both MM/DD/YYYY and DD/MM/YYYY in the same column.",
            "Outliers that are actually errors — an age of 150, a negative price, a timestamp from the year 1900 — versus outliers that are real (a genuinely enormous single order).",
          ],
        },
        {
          kind: "example",
          heading: "The same problem, before and after",
          body: "Notice this isn't about deleting rows blindly — it's about deciding, deliberately, what each irregularity actually means.",
          code: `Raw:
customer_state | order_total | order_date
"NY"            | 42.50       | 03/14/2024
"new york"      | -5.00       | 2024-03-15
"NY"            | 42.50       | 03/14/2024   <- exact duplicate
"N/A"           | 118.00      | 14/03/2024   <- ambiguous date format

Cleaned:
customer_state | order_total | order_date
"NY"            | 42.50       | 2024-03-14
"NY"            | 5.00        | 2024-03-15   <- sign error corrected after checking source
                (duplicate row removed)
(missing state row flagged for follow-up, not silently dropped)`,
        },
        {
          kind: "bullets",
          heading: "Deciding what to do with missing values",
          intro: "There's no single right answer — the right choice depends on why the data is missing.",
          bullets: [
            "If a value is missing completely at random and rare, dropping that row is often fine.",
            "If a whole column is missing for a meaningful subgroup (e.g., a field only newer customers have), dropping rows can quietly bias the analysis toward older customers — investigate before deleting.",
            "Filling in a missing value with the column's average is a reasonable default for some analyses and actively misleading for others (it can understate real variation) — know which case you're in before doing it automatically.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The mistake that's easy to make under time pressure",
          body: "Silently dropping every row with any issue is the fastest way to clean data and one of the easiest ways to bias it — if the rows with problems aren't random (say, they're disproportionately from one region's data feed), you've quietly changed what the remaining data represents.",
        },
        {
          kind: "summary",
          heading: "A cleaning checklist worth reusing",
          bullets: [
            "Check for duplicates using a real unique identifier, not just \"looks the same.\"",
            "Standardize formats (dates, categories, units) before doing any calculation across them.",
            "Decide deliberately, and document, how missing values and likely-error outliers were handled — don't just delete and move on.",
          ],
        },
      ],
    },
    {
      title: "Descriptive Statistics That Actually Matter",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Descriptive Statistics That Actually Matter",
          subheading:
            "Mean, median, and spread aren't just formulas to compute — each one answers a slightly different question, and picking the wrong one can quietly mislead.",
        },
        {
          kind: "text",
          heading: "Mean vs. median: not interchangeable",
          body: [
            "The mean (average) is sensitive to every value, including extreme ones. The median (the middle value when sorted) only cares about the value in the middle position — extreme values barely move it.",
            "This difference matters most whenever a dataset has a long tail — a few very large or very small values pulling the mean away from what a typical case actually looks like.",
          ],
        },
        {
          kind: "example",
          heading: "A concrete case where they disagree",
          body: "The mean here is dragged upward by one very high earner — it describes almost no one in the group accurately.",
          code: `Household incomes in a small neighborhood (9 households):
$45k, $48k, $50k, $52k, $55k, $58k, $60k, $62k, $620k

Mean   = ($45k + ... + $620k) / 9 ≈ $116.7k
Median = $55k   (the middle value)

The median is a far better description of a "typical" household
here — the mean is distorted by a single outlier.`,
        },
        {
          kind: "bullets",
          heading: "When each one is the right choice",
          bullets: [
            "Use the median when data likely has outliers or a skewed distribution: income, home prices, response times, hospital wait times.",
            "Use the mean when data is roughly symmetric and every value should count equally: exam scores in a large class, measurement error in a controlled experiment.",
            "Reporting both, plus a measure of spread (like the range or standard deviation), tells a much more honest story than either number alone.",
          ],
        },
        {
          kind: "bullets",
          heading: "Spread matters as much as the center",
          intro: "Two datasets can share the same mean and look completely different.",
          bullets: [
            "Standard deviation describes how tightly values cluster around the mean — a small standard deviation means most values are close to typical; a large one means real values vary a lot.",
            "Two products with the same average customer rating (say, 4.0) can tell very different stories: one where almost everyone rates it 4, and one where ratings are split evenly between 5s and 3s — the second is more polarizing even with an identical average.",
          ],
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "A habit worth building",
          body: "Whenever you report a single summary number — a mean, a median, an average conversion rate — ask whether the underlying data has a long tail or unusual spread that the single number is hiding. If you're not sure, look at the distribution before presenting the summary.",
        },
        {
          kind: "summary",
          heading: "Descriptive stats, briefly",
          bullets: [
            "Mean is sensitive to outliers; median usually isn't — pick based on whether the data has a long tail.",
            "A center number without a spread number is an incomplete picture.",
            "When a summary statistic surprises you, check the underlying distribution before trusting it.",
          ],
        },
      ],
    },
    {
      title: "Choosing the Right Chart",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "Choosing the Right Chart",
          subheading:
            "The right chart makes a pattern obvious in two seconds. The wrong chart — even with correct data — can hide or actively misrepresent the same pattern.",
        },
        {
          kind: "bullets",
          heading: "Match the chart to the question",
          intro: "The most common visualization mistake is picking a chart type out of habit rather than for what it needs to show.",
          bullets: [
            "Comparing a few categories → bar chart. It's the most reliably readable way to compare discrete quantities.",
            "Showing a trend over time → line chart. Bars work too for a small number of time points, but a line makes a trend's direction immediately visible.",
            "Showing the relationship between two numeric variables → scatter plot. This is also the chart that makes it easiest to spot outliers and rough correlation strength.",
            "Showing parts of a whole → a simple bar chart of proportions is usually more readable than a pie chart once there are more than 3-4 categories — pie slices are genuinely hard to compare precisely by eye.",
          ],
        },
        {
          kind: "bullets",
          heading: "Distortions that are easy to introduce by accident",
          bullets: [
            "A bar chart's y-axis that doesn't start at zero can make a small difference look dramatic — a change from 51% to 53% can look like a doubling if the axis is cropped to 50-54%.",
            "Too many categories crammed into one chart (a pie chart with 15 slices, a line chart with 20 overlapping series) — beyond a handful, a chart stops communicating and starts requiring a legend to decode, which usually means it's the wrong chart for the data.",
            "Dual y-axes on the same chart, comparing two different metrics with different scales — these are frequently misread as showing a stronger relationship than actually exists, because the two scales were chosen independently.",
          ],
        },
        {
          kind: "example",
          heading: "Same data, honest vs. misleading",
          body: "Both charts describe an identical 2-point change — only the axis choice makes one look dramatic.",
          code: `Honest:      y-axis 0% to 100%
  Q1: 51%  [||||||||||||||||||||||||||        ]
  Q2: 53%  [||||||||||||||||||||||||||||      ]
  (looks like what it is: a modest change)

Misleading:  y-axis 50% to 54%
  Q1: 51%  [||||            ]
  Q2: 53%  [||||||||||||||||]
  (the exact same 2-point change looks like a huge jump)`,
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "The audience test",
          body: "Before finalizing a chart, ask: could someone glancing at this for five seconds walk away with a wrong impression, even though every number on it is technically correct? If the honest answer is yes, the chart — not the data — needs to change.",
        },
        {
          kind: "summary",
          heading: "Chart choice, in short",
          bullets: [
            "Pick the chart type based on the question (comparison, trend, relationship, composition), not out of habit.",
            "Watch axis scaling — it's the single easiest way a technically accurate chart misleads.",
            "If a chart needs a long explanation to be read correctly, it's usually the wrong chart.",
          ],
        },
      ],
    },
    {
      title: "Correlation vs. Causation: The Practical Trap",
      durationMinutes: 6,
      slides: [
        {
          kind: "title",
          heading: "Correlation vs. Causation: The Practical Trap",
          subheading:
            "Two things moving together is real data. Whether one is causing the other is a completely separate question — and conflating the two is one of the most common, costly analysis mistakes.",
        },
        {
          kind: "text",
          heading: "Why this trap is so easy to fall into",
          body: [
            "Correlation is genuinely useful and easy to measure — it's a real, calculable relationship between two variables. Causation, that one variable actually produces a change in the other, is a much stronger claim that correlation alone can never fully prove.",
            "The trap isn't noticing a correlation — that's just good observation. The trap is skipping straight from \"these move together\" to \"so if I change one, the other will change too\" without checking whether that jump is actually justified.",
          ],
        },
        {
          kind: "example",
          heading: "A classic case: ice cream and drowning",
          body: "Ice cream sales and drowning incidents both rise in summer — they're correlated. Neither causes the other; a third factor (hot weather, more people swimming) drives both.",
          code: `Ice cream sales (monthly)     Drowning incidents (monthly)
Jan: low                      Jan: low
Jun: high                     Jun: high
Aug: highest                  Aug: highest

Correlation: strong and real.
Causal claim ("ice cream causes drowning"): absurd.
Actual driver: a third variable — summer weather —
raises both independently.`,
        },
        {
          kind: "bullets",
          heading: "Common shapes this trap takes at work",
          intro: "The ice cream example is obvious; the workplace version is usually much subtler.",
          bullets: [
            "Reverse causation: \"customers who contact support more often churn more\" might not mean support quality is bad — it might mean already-unhappy customers reach out more, in which case fixing support alone won't fix churn.",
            "A confounding variable: \"stores with more staff have higher sales\" could mean staffing drives sales, or simply that busier, higher-revenue stores get more staffing budget in the first place.",
            "Coincidence at scale: with enough metrics tracked over enough time, some will correlate strongly by pure chance — this is more likely, not less, the more variables you're scanning across.",
          ],
        },
        {
          kind: "bullets",
          heading: "What actually helps establish causation",
          bullets: [
            "A controlled experiment (an A/B test), where the only difference between two groups is the thing you're testing — this is the strongest evidence available in most business settings.",
            "A plausible mechanism: can you explain, in concrete steps, how one thing would actually cause the other, not just that they move together?",
            "Checking whether the relationship holds after accounting for an obvious confounding variable (e.g., comparing stores of similar size and traffic, not just staffing level alone).",
          ],
        },
        {
          kind: "callout",
          tone: "insight",
          heading: "The honest phrasing to use in practice",
          body: "When you find a real correlation without solid causal evidence, say exactly that: X and Y are correlated; we haven't established that changing X would change Y. That sentence is more useful — and more honest — than an overconfident causal claim that turns out to be wrong once acted on.",
        },
        {
          kind: "summary",
          heading: "Keeping the two separate",
          bullets: [
            "A correlation is a real, measurable pattern — it's a starting point for investigation, not an answer on its own.",
            "Always ask if a third factor could be driving both variables before assuming one causes the other.",
            "When you can't run a controlled test, say the relationship is correlational, plainly — don't round it up to causal.",
          ],
        },
      ],
    },
    {
      title: "From Data to a Decision",
      durationMinutes: 5,
      slides: [
        {
          kind: "title",
          heading: "From Data to a Decision",
          subheading:
            "An analysis that's technically correct but never changes a decision hasn't actually done its job yet — the last step is making the finding usable.",
        },
        {
          kind: "bullets",
          heading: "What separates a finding from a decision-ready finding",
          intro: "A number is not the same thing as an answer to the original question.",
          bullets: [
            "State the answer to the original question first, in plain language — not the methodology, not the chart, the actual answer.",
            "Say what you'd recommend doing about it, even if the recommendation is \"gather more data before acting\" — leaving that step out puts the burden of interpretation entirely on the reader.",
            "Name the honest limitations: sample size, time window, anything that could make the finding less solid than it looks at first glance.",
          ],
        },
        {
          kind: "example",
          heading: "The same finding, two ways",
          body: "The second version is shorter, clearer, and actually answers the question the analysis was meant to support.",
          code: `Weak: "Analysis of Q1-Q2 checkout data shows a correlation
coefficient of 0.34 between page load time and cart
abandonment across 40,000 sessions, with load time
distributed from 0.8s to 6.2s..."

Better: "Pages that load in under 2 seconds have roughly
half the cart-abandonment rate of pages over 4 seconds.
Recommendation: prioritize load-time fixes on the checkout
page specifically, where this effect is strongest.
Caveat: this is correlational — we haven't yet run a
controlled test to confirm load time is the actual cause."`,
        },
        {
          kind: "callout",
          tone: "tip",
          heading: "Lead with the answer, not the process",
          body: "Most audiences want the conclusion first, with the methodology available if someone asks, not the other way around. A report that opens with here's what we found and what we'd do about it gets read and acted on far more often than one that opens with here's how we approached the data.",
        },
        {
          kind: "summary",
          heading: "Closing the loop on the fundamentals",
          bullets: [
            "Start with a specific, falsifiable question — before touching the data.",
            "Clean deliberately and document what you did, rather than silently dropping anything messy.",
            "Choose the right summary statistic and chart for the actual shape of your data.",
            "Keep correlation and causation separate, and end with a plain-language answer and recommendation, not just a number.",
          ],
        },
      ],
    },
  ],
};
