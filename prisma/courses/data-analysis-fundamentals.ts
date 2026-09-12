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
    {
      title: "Statistical Significance and Sample Size: How Confident Should You Be?",
      durationMinutes: 7,
      slides: [
        {
          kind: "title",
          heading: "Statistical Significance and Sample Size: How Confident Should You Be?",
          subheading:
            "Version B beat version A in your A/B test. Before you ship B, there's one more question: could this difference just be noise?",
        },
        {
          kind: "text",
          heading: "What \"statistically significant\" actually means",
          body: [
            "A difference between two groups is statistically significant when it's unlikely to have happened by chance alone, given how much natural variation you'd expect from random sampling. It does not mean the difference is large, or important, or guaranteed to be real — only that random noise is an unlikely explanation for it.",
            "The two numbers that drive this judgment are the size of the observed difference and the sample size behind it. The same 2-point difference can be meaningless noise with 200 visitors and a rock-solid signal with 200,000.",
          ],
        },
        {
          kind: "example",
          heading: "Working through a real A/B test",
          body: "Version A converts 500 of 10,000 visitors (5.0%). Version B converts 560 of 10,000 (5.6%). Is that 0.6-point lift real, or noise?",
          code: `Pooled conversion rate = (500 + 560) / (10,000 + 10,000) = 5.3%

Standard error = sqrt(0.053 * 0.947 * (1/10,000 + 1/10,000))
              ≈ 0.32 percentage points

z-score = (5.6% - 5.0%) / 0.32%  ≈ 1.9

A z-score above ~1.96 is the common threshold for
"significant at 95% confidence." 1.9 falls just short of it —
close, but not quite there.`,
        },
        {
          kind: "bullets",
          heading: "What this result actually tells you",
          bullets: [
            "A z-score of 1.9 doesn't mean \"no effect\" — it means the current data can't yet rule out chance as the explanation, at the usual 95% bar. The honest read is \"promising, not yet proven.\"",
            "The fix for a borderline result like this is almost always more data, not a different formula — running the test longer (or on more traffic) narrows the standard error and makes a real effect easier to detect.",
            "Sample size cuts both ways: with a large enough sample, even a genuinely trivial difference (a 0.1-point lift nobody would care about) can become \"statistically significant\" — significance is not the same question as whether an effect is worth acting on.",
          ],
        },
        {
          kind: "callout",
          tone: "warning",
          heading: "Peeking early inflates false positives",
          body: "Checking a test's results every day and stopping as soon as it looks significant is one of the most common ways teams fool themselves — random noise will cross a significance threshold temporarily just by chance if you check often enough. Decide the sample size (or run time) needed before starting, and don't act on the result until you get there.",
        },
        {
          kind: "summary",
          heading: "Significance, briefly",
          bullets: [
            "Statistical significance asks whether chance is a plausible explanation for a difference — not whether the difference is large or worth acting on.",
            "A bigger sample narrows the noise band around your estimate, which is why small tests produce inconclusive results even when a real effect exists.",
            "Decide your sample size up front and don't stop a test early just because it briefly looks significant.",
          ],
        },
      ],
    },
    {
      title: "Practice: Turning Raw Numbers Into a Decision-Ready Finding",
      durationMinutes: 12,
      slides: [
        {
          kind: "title",
          heading: "Practice: Turning Raw Numbers Into a Decision-Ready Finding",
          subheading:
            "Three exercises spanning cleaning, summarizing, and communicating — the same arc as a real analysis.",
        },
        {
          kind: "practice",
          heading: "Spot the cleaning issues",
          prompt: `You're handed this raw export of support tickets:

ticket_id | customer_email  | priority | opened_date
1001      | j.lee@acme.com  | HIGH     | 2026-02-11
1002      | J.LEE@ACME.COM  | High     | 11/02/2026
1003      |                 | high     | 2026-02-12
1004      | j.lee@acme.com  | HIGH     | 2026-02-11

List every data quality issue you see, and for each one say what you'd do about it before analyzing ticket volume by customer.`,
          hint: "Look row by row for anything that would make the same real-world entity look like different values, plus anything ambiguous.",
          solution:
            "Issues: (1) \"j.lee@acme.com\" and \"J.LEE@ACME.COM\" are the same email in different casing — without standardizing case, this customer would be undercounted as two different customers; fix by lowercasing all emails before grouping. (2) Priority values \"HIGH\" and \"High\" are the same category in inconsistent casing — standardize casing here too. (3) Row 1003 has a missing email — decide whether to investigate the source ticket rather than silently dropping it, since a missing identifier could bias a per-customer analysis if the missingness isn't random. (4) The date format switches between 2026-02-11 (ISO) and 11/02/2026 (ambiguous — could be Nov 2 or Feb 11) — this needs to be resolved by checking the source system's actual format, not guessed, since reading 11/02 the wrong way silently corrupts every date-based analysis. (5) Rows 1001 and 1004 look like an exact duplicate (same email, priority, and date) — check the ticket IDs against a real unique identifier before deciding whether it's a true duplicate or two genuinely separate tickets that happen to share these values.",
        },
        {
          kind: "practice",
          heading: "Mean, median, or both?",
          prompt:
            "Customer support resolution times (in hours) for 8 recent tickets: 2, 3, 3, 4, 4, 5, 6, 41. The 41-hour ticket was a legitimate but unusually complex case, not a data error. Calculate the mean and median, and decide which one (or both) you'd report to leadership as \"typical resolution time,\" with reasoning.",
          hint: "Calculate both first, then think about what a single very large but real value does to each.",
          solution:
            "Mean = (2+3+3+4+4+5+6+41)/8 = 68/8 = 8.5 hours. Median (sorted: 2,3,3,4,4,5,6,41 — average of the 4th and 5th values) = (4+4)/2 = 4 hours. Report the median (4 hours) as \"typical\" — the mean is pulled far upward by the single 41-hour outlier and would badly overstate what a normal ticket actually looks like. But don't report only the median: mention the mean and the outlier alongside it (e.g., \"typical resolution time is 4 hours; one complex case took 41 hours and pulled the average up to 8.5\"), since dropping the outlier from the story entirely would hide a real, legitimate case that leadership may want visibility into.",
        },
        {
          kind: "practice",
          heading: "Write the decision-ready version",
          prompt:
            "Raw finding: \"Customers who used live chat support had a 12% 90-day churn rate versus 19% for customers who only used email support, based on 6,000 customers over the last two quarters. We have not run a controlled experiment.\" Turn this into a decision-ready finding: a plain-language answer, a recommendation, and an honest caveat.",
          hint: "Lead with the answer in plain terms, then recommend an action proportional to how solid the evidence actually is, then name what could be confounding it.",
          solution:
            "Answer: Customers who used live chat churned at roughly two-thirds the rate of email-only customers (12% vs. 19%) over the last two quarters. Recommendation: given this is correlational, not yet proven causal, the right next step is a controlled test — offer live chat proactively to a random subset of customers and compare churn, rather than immediately assuming chat access itself reduces churn and rolling it out company-wide. Caveat: customers who proactively seek out live chat may simply be more engaged or higher-intent to begin with (a confounding variable) — that alone could produce this gap even if chat access changes nothing. This finding justifies running the experiment; it doesn't yet justify skipping straight to a company-wide rollout.",
        },
        {
          kind: "summary",
          heading: "What this practice demonstrates",
          bullets: [
            "Catching formatting inconsistencies, ambiguous dates, and possible duplicates before they quietly bias a per-customer analysis.",
            "Choosing median over mean (or reporting both) when a real but extreme value would otherwise distort the \"typical\" story.",
            "Writing a finding that leads with the answer, recommends a proportional next step, and names the honest limitation — rather than presenting a correlation as if it were already proven causal.",
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
          heading: "Framing a question",
          question:
            "Which of these is the most \"workable\" analysis question, in the sense this course defines it?",
          options: [
            "\"How is the business doing overall?\"",
            "\"Are customers happy with the product?\"",
            "\"Did customers who completed onboarding have lower 90-day churn than those who didn't, over the last two quarters?\"",
            "\"What's interesting in the customer data?\"",
          ],
          correctIndex: 2,
          explanation:
            "A workable question names a specific metric (churn), a specific comparison group (completed onboarding vs. not), and a specific time window (last two quarters) — which tells you exactly what data you need and what result would prove the idea wrong. The others are topics, not falsifiable questions.",
        },
        {
          kind: "quiz",
          heading: "Missing data",
          question:
            "A dataset has a column that's missing for roughly 40% of rows — and those missing rows turn out to be almost entirely customers who signed up in the last 3 months. What's the risk of simply dropping every row with a missing value in that column?",
          options: [
            "There's no risk — dropping incomplete rows is always safe",
            "It would bias the analysis toward older customers, since newer customers are disproportionately being removed",
            "It would bias the analysis toward newer customers",
            "It only matters if more than 50% of rows are affected",
          ],
          correctIndex: 1,
          explanation:
            "Because the missingness isn't random — it's concentrated in newer signups — dropping those rows quietly skews the remaining data toward older customers. Missing-data decisions need to account for whether the missingness itself is random or systematic, not just how much of it there is.",
        },
        {
          kind: "quiz",
          heading: "Mean vs. median",
          question:
            "A dataset of home sale prices in a neighborhood is heavily skewed by a few very expensive mansions. Which statistic best describes a \"typical\" home price there?",
          options: [
            "The mean, because it uses every data point",
            "The median, because it isn't dragged by the few extreme values",
            "Neither — only the standard deviation is meaningful here",
            "The mean and median will be nearly identical either way",
          ],
          correctIndex: 1,
          explanation:
            "The mean is sensitive to every value, so a handful of very expensive mansions pull it well above what a typical home actually costs. The median only depends on the middle-ranked value, so it stays representative even with a skewed, long-tailed distribution like home prices.",
        },
        {
          kind: "quiz",
          heading: "Reading a chart honestly",
          question:
            "A bar chart shows a jump from 51% to 53% with a y-axis running from 50% to 54%. What's the most accurate description of this chart?",
          options: [
            "It's dishonest because the underlying numbers must be wrong",
            "It's technically accurate but visually exaggerates a modest 2-point change",
            "It's the correct way to display any percentage comparison",
            "It's misleading only if the bars are colored differently",
          ],
          correctIndex: 1,
          explanation:
            "Every number on the chart can be correct while the visual impression is still distorted — cropping the y-axis to a narrow range makes a small, real difference look dramatic. The fix is showing the full 0-100% range (or clearly labeling the cropped axis), not changing the underlying data.",
        },
        {
          kind: "quiz",
          heading: "Correlation vs. causation",
          question:
            "Stores with more sales staff also have higher sales. Someone concludes \"hiring more staff increases sales.\" What's the most important thing to check before accepting that conclusion?",
          options: [
            "Whether the correlation coefficient is above 0.5",
            "Whether busier, already-higher-revenue stores might simply be the ones getting more staffing budget in the first place",
            "Whether the data covers a full calendar year",
            "Whether the stores are in the same country",
          ],
          correctIndex: 1,
          explanation:
            "This is a classic confounding-variable risk: it's just as plausible that higher-revenue stores are allocated more staff (the reverse of the assumed direction), not that staffing causes the sales. Without a controlled experiment or a check that accounts for store size and traffic, the causal claim isn't justified by the correlation alone.",
        },
        {
          kind: "summary",
          heading: "The course's core takeaways",
          bullets: [
            "Start with a specific, falsifiable question before touching any data.",
            "Clean deliberately — standardize formats, check real duplicates, and think about whether missing data is random before dropping it.",
            "Match your summary statistic (mean vs. median) and chart type to the actual shape of the data, not habit.",
            "A correlation is a starting point for investigation, not proof of causation — watch for confounders and reverse causation.",
            "Statistical significance tells you whether chance is a plausible explanation, not whether an effect is large or worth acting on.",
            "End every analysis with a plain-language answer, a proportional recommendation, and an honest caveat.",
          ],
        },
      ],
    },
  ],
};
