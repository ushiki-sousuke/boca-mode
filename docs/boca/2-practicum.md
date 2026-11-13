# Practicum

## Twelve Refutations of the Procedural Habit in Business Software — in Code

A doctrine that cannot be shown in code is not a doctrine. It is a preference.

❦

Twelve habits that pass for object orientation in business software because they are written with classes, layers, and dependency injection — and the code that refutes each. The code is TypeScript because it reads plainly; nothing here depends on the language.

---

## How to Read This — and the One Test

Every habit below is written with classes, interfaces, repositories, and services. None of them is object-oriented. They are procedures wearing the costume of types, and in business software the costume is especially convincing, because it comes with a layered diagram that looks like architecture.

Modularity and object orientation are independent axes. Modularity governs who may reference whom, and shows itself in the dependency graph. Object orientation governs who decides for whom, and shows itself only when the business changes. A codebase can have a spotless layer diagram and no object orientation at all.

One test separates them.

> Say: can this object still be correct when nobody calls it?

If an invoice is wrong unless the nightly job ran, wrong if it ran twice, wrong unless the service remembered to call `recalculate()` after every payment — it is not a subject. It is a row with a `this` pointer.

A note on scope. Values and terms are under no oath. Asking the price list for a price is not a violation. Asking a subject for its raw state so that you may decide on its behalf is.

Each case has the same shape: the habit, why it is procedural, the refutation, and what disappeared. The last matters most. Good architecture is measured by the machinery it makes unnecessary.

---

## Masʾala I — The Settings Table

> Have you not seen the table of numbers, whose meaning every caller carries away?

The first configuration anyone builds is a table of numbers. It is an improvement over constants in code, and that success is what makes it dangerous.

```ts
// The habit
const settings = await settingsRepo.load()   // { taxRate: 0.10, reducedTaxRate: 0.08, roundingMode: "floor", ... }

// in the invoice service
const tax = Math.floor(subtotal * (item.isFood ? settings.reducedTaxRate : settings.taxRate))
// in the quote service, slightly differently
const tax2 = Math.round(subtotal * settings.taxRate)
```

**Why it is procedural.** The table holds numbers; every caller holds the meaning. The tax formula lives at every call site, and the call sites already disagree about rounding. Change the rule and nothing in the types tells you where.

```ts
// The refutation — the terms answer a question instead of exposing a number
class TaxRule {
  private constructor(private readonly standard: Rate, private readonly reduced: Rate, private readonly rounding: Rounding) {}

  on(line: LineAmount): Money {
    const rate = line.qualifiesForReduced() ? this.reduced : this.standard
    return this.rounding.apply(line.amount.times(rate))
  }
}

// The call site no longer knows the formula
const tax = terms.taxRule(effectiveOn).on(line)
```

**What disappeared.**
- The formula at every call site — there is now exactly one
- Two documents computing tax differently
- The settings table as a bag, split into terms that each answer for one thing

---

## Masʾala II — The Nightly Batch

> By the night and the job that runs in it — twice, or not at all.

Nearly every business system has a job like this, and it silently imposes a contract on the whole system.

```ts
// The habit — runs at 02:00
for (const inv of await invoiceRepo.findOpen()) {
  inv.daysRemaining -= 1
  if (inv.daysRemaining < 0) inv.status = "OVERDUE"
  await invoiceRepo.save(inv)
}
```

**Why it is procedural.** The subtraction assumes the job runs exactly once per day. Run it twice after a failover and every invoice is a day later than it is. Skip a night and they are a day early. The books are now a property of the scheduler.

```ts
// The refutation — remember when, not how much is left
class Invoice {
  private readonly deadline: Deadline          // a value
  private balance: Balance                     // a value: the total and the payments themselves; no running figure (Masʾala VII)

  isOverdue(today: BusinessDate): boolean {
    return !this.balance.isCovered() && this.deadline.hasPassed(today)
  }
}
```

There is no job. Overdue is not a state anyone stores; it is what the invoice answers when asked, on any day, any number of times.

**What disappeared.**
- The nightly job
- The `daysRemaining` and `status = OVERDUE` columns, and their drift
- The runbook entry "if the job fails, run it manually — but only once"
- The class of bug where a re-run shifts every due date

---

## Masʾala III — The Date-and-Amount Check

> They open the invoice, take out its due date, and judge it in its own absence.

The most common Ask in business code, almost never recognised as one.

```ts
// The habit — in the dunning job, the dashboard, the credit check, and the report
if (inv.dueDate < today && inv.paidAmount < inv.totalAmount) {
  sendReminder(inv)
}
```

**Why it is procedural.** The invoice is opened, two of its fields are removed, and its condition is computed by a third party who owns neither. This expression appears in four places. When partial payment within a grace period stops counting as overdue, you must find all four.

```ts
// The refutation — the invoice hands out the answer, never its fields
class Invoice {
  standing(today: BusinessDate): Standing {
    return Standing.of(this.balance, this.deadline, this.terms.grace, today)
  }
}

class Standing {
  // a value: outstanding amount and lateness, judged once
  get isDelinquent(): boolean { /* ... */ }
  get outstanding(): Money { /* ... */ }
}
```

**What disappeared.**
- Four copies of one condition
- Public access to another subject's amounts
- The silent divergence when three copies learn about the grace period and one does not

---

## Masʾala IV — The Switch on a Status or a Kind

> Every kind knows itself. Why then do you speak for it in a switch?

```ts
// The habit
switch (customer.type) {
  case "CORPORATE":  dueDate = endOfNextMonth(invoiceDate); break
  case "INDIVIDUAL": dueDate = addDays(invoiceDate, 14); break
  case "GOVERNMENT": dueDate = addDays(invoiceDate, 30); break
}
```

**Why it is procedural.** The knowledge of what "corporate terms" are lives outside the terms. A new contract type means editing this switch — and every other switch over `customer.type` in invoicing, dunning, reporting, and export.

```ts
// The refutation — each kind of terms knows itself
interface PaymentTerms { dueFor(issued: BusinessDate, calendar: BusinessCalendar): Deadline }

class MonthEndFollowing implements PaymentTerms {
  dueFor(issued, calendar) { return Deadline.on(calendar.lastBusinessDayOf(issued.nextMonth())) }
}
class NetDays implements PaymentTerms {
  constructor(private readonly days: number) {}
  dueFor(issued, calendar) { return Deadline.on(calendar.addBusinessDays(issued, this.days)) }
}

// The customer is bound by terms; nobody switches on what kind it is
const deadline = customer.terms.dueFor(issued, calendar)
```

A new kind of terms is one class and one master entry. Nothing existing is touched — and the kind that alone needs something special (a government contract that pays only after inspection) can have it without a shared field that applies to nothing else.

**What disappeared.**
- The type code and every switch over it, present and future
- "Did I update all the switches?"
- Payment rules hardcoded where the business cannot reach them

---

## Masʾala V — The Service's Script

> They set the script above the order, and the order became a row.

The load-bearing beam of business software, usually the first thing built.

```ts
// The habit
class OrderService {
  async confirm(orderId: string) {
    const order = await orderRepo.find(orderId)
    const customer = await customerRepo.find(order.customerId)
    if (order.status !== "DRAFT") throw new Error("invalid status")
    if (customer.creditUsed + order.total > customer.creditLimit) throw new Error("credit")
    for (const line of order.lines) {
      const stock = await stockRepo.find(line.sku)
      if (stock.qty < line.qty) throw new Error("stock")
      stock.qty -= line.qty
      await stockRepo.save(stock)
    }
    order.status = "CONFIRMED"
    customer.creditUsed += order.total
    await orderRepo.save(order); await customerRepo.save(customer)
  }
}
```

**Why it is procedural.** Control flows downward through a script. The order, the customer, and the stock are opened, read, judged, and written back. None of them decides anything. Every new rule — a hold for unpaid invoices, a minimum order amount, a back-order policy — is another paragraph in this script, and the order of the paragraphs is now a hidden input to the business.

Worse, the script manufactures problems that then require machinery. Halfway through, stock has been decremented and credit has not; a failure leaves the books inconsistent; so compensation steps are written, then a saga, then a status for "partially confirmed."

```ts
// The refutation — the order confirms itself; each party answers for its own part
class Order {
  confirm(by: Customer, from: Warehouse, on: BusinessDate): Confirmation {
    if (this.stage.isConfirmed()) return Confirmation.already(this.number, this.stage.since)   // asked again: the same answer
    if (!this.stage.allowsConfirmation()) return Confirmation.refused("not a draft")

    const credit = by.accepts(this, on)                 // the customer judges from its own commitments; nothing changes
    if (credit.refused) return Confirmation.refused(credit.reason)

    const allocation = from.allocate(this.lines, this.number)   // the stock decides; asked twice, it answers the same
    if (allocation.refused) return Confirmation.refused(allocation.reason)

    this.stage = this.stage.confirmed(on)
    return Confirmation.accepted(this.number, on)
  }
}

class Customer {
  accepts(order: Order, on: BusinessDate): CreditAnswer {
    return this.exposure(on).with(order.total()).judgedBy(this.terms.credit)
    // Exposure is a value: its confirmed, unpaid orders and open invoices — derived, never maintained.
    // The customer does not add the numbers; the exposure does.
  }
}
```

The entry point restores the order, the customer, and the warehouse from the book, tells the order to confirm, and saves what the subjects wrote — inside one transaction, which is the book's guarantee, not a decision.

Notice what is not here. The customer keeps no running "credit used" figure, so there is nothing to increase and nothing to give back when the stock refuses. Its exposure is what its own open commitments say — its confirmed orders not yet paid and its open invoices — and a confirmed order becomes one of them by being confirmed, not by anyone adding it. Because asking the customer changes nothing, it does not matter whether the customer or the stock is asked first, or whether the whole request arrives twice. Credit is the customer's business. Allocation is the stock's. Whether a draft may be confirmed — and whether it already was — is the order's.

**What disappeared.**
- The script, and the significance of its paragraph order
- The running credit-used counter, and every place that adds to it or subtracts from it
- The compensation step, the saga, and the "partially confirmed" status
- Stock arithmetic in the order service
- The "invalid status" check written in every service method that touches orders
- The double-submit bug

---

## Masʾala VI — The Code and Its Master

> They invented a name for what already had one.

```ts
// The habit
if (line.productCode === "A-1042" || line.productCode.startsWith("SVC-")) {
  taxCategory = "EXEMPT"
}
```

And because codes are strings, a code master table follows, then a screen to maintain it, then a check that codes in transactions exist in the master, then a migration when a code is renamed.

**Why it is procedural.** A parallel identity system has been invented and must be maintained by hand. `"A-1042"` means nothing to the compiler, cannot be found by "find references," and carries its meaning only in the heads of the people who wrote the `if`.

```ts
// The refutation — the reference is the identity; the definition knows itself
class Product {                                       // terms: a definition that knows what it is
  constructor(private readonly category: TaxCategory, /* ... */) {}
  taxOn(amount: Money, rule: TaxRule): Money { return rule.charge(this.category, amount) }
}

const tax = line.product.taxOn(line.amount, terms.taxRule(on))
```

The code survives only where the outside world needs a printable key — on the document, in an export. Inside, the line refers to the product, and the product knows what it is.

**What disappeared.**
- Magic strings in business logic
- The "does this code exist" checks
- The class of bug where a renamed code silently stops matching an `if`

---

## Masʾala VII — The Parallel Status Table

> A record of the fact beside the fact. When the two disagree, which will they believe?

```ts
// The habit
await paymentRepo.save(payment)
await invoiceStatusRepo.update(invoiceId, { paid: true, paidAt: now })   // hopefully exactly once
```

Because the status can disagree with the payments, a reconciliation job is written. Because the reconciliation finds differences, a report of differences is written. The subsystem grows and is genuinely well engineered.

**Why it is procedural.** The invoice cannot decide whether it is paid. A table elsewhere records it, and that table can disagree with the payments. Every bug in this subsystem is a disagreement between the record of a fact and the fact.

```ts
// The refutation — paid is what the invoice's own settlements say
class Invoice {
  private balance: Balance                     // a value holding the total and the payments themselves
  isSettled(): boolean { return this.balance.isCovered() }
}
```

Nothing records "paid." There is nothing to fall out of step.

**What disappeared.**
- The status table and its update calls
- The reconciliation job and its report
- The category of defect "paid flag set but payment missing" — now unrepresentable

---

## Masʾala VIII — The Flag Columns

> Sixteen combinations they allowed, and six were lawful.

```ts
// The habit
order.isApproved; order.isCancelled; order.isShipped; order.isInvoiced; order.cancelledAt

// read from four modules, each re-deriving the same conclusion
if (order.isApproved && !order.isCancelled && !order.isShipped) { /* may ship */ }
```

**Why it is procedural.** Four booleans permit sixteen combinations; perhaps six are legal. Shipped and cancelled. Invoiced and not approved. Nothing prevents the other ten, so a validation job is written to find them.

```ts
// The refutation — the stage answers for itself
class Stage {
  private constructor(private readonly kind: "draft" | "approved" | "shipped" | "invoiced" | "cancelled", readonly since: BusinessDate) {}
  static draft(on: BusinessDate) { return new Stage("draft", on) }

  approved(on: BusinessDate): Stage {
    if (this.kind === "approved") return this                  // the second click is not an error; it is already so
    if (this.kind !== "draft") throw Stage.illegal(this, "approve")
    return new Stage("approved", on)
  }
  canShip(): boolean { return this.kind === "approved" }
  /* ... */
}

order.mayShip()   // the order is asked, not inspected
```

Illegal combinations are unrepresentable because they were never independent facts.

**What disappeared.**
- Ten illegal states out of sixteen
- Four copies of the same boolean expression
- Public mutable flags any module could set

---

## Masʾala IX — The Event Bus

> They proclaimed to the crowd what was meant for one.

The most contested case, because a message hub is genuinely useful — for the right traffic.

```ts
// The habit
bus.publish("PaymentReceived", { invoiceId, amount })

// one of several subscribers, at some priority, in some order
on("PaymentReceived", async e => {
  const inv = await invoiceRepo.find(e.invoiceId)
  if (!inv) return                       // it may have been voided
  inv.paidAmount += e.amount
  await invoiceRepo.save(inv)
})
```

**Why it is procedural.** The mechanic itself — a payment settling an invoice — has become a broadcast. Delivery order matters, duplicate delivery must be guarded, identity must be resolved by lookup. "Why is this invoice paid twice" becomes an exercise in tracing the bus.

```ts
// The refutation — say it to the one it concerns
invoice.settle(payment)   // the invoice knows the payments it already holds; delivered twice, it is still one payment
```

**Where the bus is right.** A hub earns its place for traffic that is genuinely a broadcast, where no listener is required for the books to be correct: notifications, analytics, an audit stream, a dashboard that happens to be watching. If the books break when nobody is listening, it was never a broadcast. It was a message to a specific subject.

**What disappeared.**
- The bus, for the mechanic itself
- Duplicate-delivery guards and idempotency keys on the mechanic
- Subscription order and the document that explains it
- The lookup and the "already voided" null check

---

## Masʾala X — The Scoring Formula

> They appointed a judge over desires that could simply have been added.

Prioritising work is where hardcoded arithmetic survives longest.

```ts
// The habit
const priority = daysToDeadline * -2 + contractValue / 100000 + (customer.tier === "A" ? 5 : 0)
```

**Why it is procedural.** The set of things that can matter is fixed by the shape of the expression. Adding "safety-critical work first" or "the client who escalated" means editing the formula everything depends on. The usual remedy is a scoring service that asks each rule for a score and picks the highest — an arbiter, which is a director by another name.

```ts
// The refutation — urgency is a value, so it can simply be added
class Urgency {
  private constructor(readonly weight: number) {}
  static none = new Urgency(0)
  plus(other: Urgency) { return new Urgency(this.weight + other.weight) }
}

interface Concern { urgencyOf(c: Case, today: BusinessDate): Urgency }

class DeadlineNear implements Concern { /* ... */ }
class ValuableContract implements Concern { /* ... */ }

class TriagePolicy {                              // terms: which concerns this business carries
  constructor(private readonly concerns: Concern[]) {}
  urgencyOf(c: Case, today: BusinessDate): Urgency {
    return this.concerns.reduce((u, k) => u.plus(k.urgencyOf(c, today)), Urgency.none)
  }
}
```

A new concern is one class and one entry in the policy. Nothing collects scores, compares them, or chooses a winner. Addition is commutative and associative, so the order in which concerns are evaluated cannot affect the result — a property you can write a test for.

**What disappeared.**
- The formula, and the file everything depended on
- The arbiter that gathers and chooses
- Evaluation order
- The programmer, for the common case — the business composes its policy from entries

---

## Masʾala XI — The Template Branch

> Four mirrors, and each shows a different face.

```ts
// The habit
if (customer.country === "JP") { title = "請求書"; dateFormat = "yyyy/MM/dd"; showSeal = true }
else if (customer.country === "US") { title = "Invoice"; dateFormat = "MM/dd/yyyy"; showSeal = false }
// ...and the same branch again in the PDF exporter, the email, and the CSV
```

**Why it is procedural.** Knowledge of what a Japanese invoice looks like lives outside it, in four branches that will drift until the email and the PDF disagree.

```ts
// The refutation — the document style dresses the document
class DocumentStyle {                               // terms
  constructor(private readonly title: string, private readonly dates: DateFormat, private readonly seal: boolean) {}
  dress(doc: DocumentSurface) { doc.title(this.title); doc.dates(this.dates); if (this.seal) doc.seal() }
}
```

The style receives the surface as an argument; it never takes ownership of the document. A new country is a new master entry. No code is written.

**What disappeared.**
- Every branch on country, present and future
- The drift between the PDF and the email
- The ticket "please add Korea"

---

## Masʾala XII — The Validation Job

> They let the forbidden exist, then went searching for it by night.

The most flattering to its author.

```ts
// The habit — runs nightly, emails a report
for (const c of await contractRepo.findAll()) {
  if (c.endDate < c.startDate) report(c, "end before start")
  if (c.quantity < 0) report(c, "negative quantity")
  if (c.monthlyFee * c.months !== c.totalFee) report(c, "total mismatch")
}
```

**Why it is procedural.** The illegal state is permitted to exist, and a separate procedure looks for it afterwards. Between entry and detection the bad contract is real and may already have been invoiced.

```ts
// The refutation — make the illegal state unrepresentable
class Period {
  private constructor(readonly from: BusinessDate, readonly to: BusinessDate) {}
  static between(from: BusinessDate, to: BusinessDate): Period {
    if (from.isAfter(to)) throw Period.inverted(from, to)   // an inverted period is never constructed
    return new Period(from, to)
  }
  months(): number { /* ... */ }
}

class Contract {
  private constructor(private readonly period: Period, private readonly fee: MonthlyFee) {}
  total(): Money { return this.fee.over(this.period) }    // never stored, so never mismatched
}
```

There is no constructor that produces an inverted period, no quantity below zero, no total that disagrees with its parts. The checks describe conditions that cannot occur. The job is not fixed; it is deleted.

**What disappeared.**
- The validation job and its report
- The window between entering bad data and discovering it
- The illegal states themselves

Procedural architecture detects problems; object-oriented architecture makes them inexpressible.

---

## Self-Examination — Four Commands

Run these against your own repository.

**One — where does the arithmetic live?**

```
grep -rnE "\* *(rate|taxRate)|\.getTotal\(\)|\.getAmount\(\)|daysBetween|addDays" --include=*.ts --include=*.java --include=*.cs .
```

If the hits are in values and terms, the design is sound. If they are in classes named for doing something — a service, a manager, a handler, a job — those classes are taking others' data and computing on their behalf.

**Two — does anything depend on being run in order, or once?**

```
grep -rniE "cron|schedule|nightly|batch|reconcil" .
```

Every job that keeps the books correct is a confession that some subject cannot be correct on its own.

**Three — how many directors are there?**

```
grep -rlnE "class .*(Service|Manager|Handler|Processor|Orchestrator|Coordinator|Engine)" .
```

Renaming them changes nothing. The question is whether anything moves business things that could move themselves.

**Four — the thought experiment.** Delete your service layer in your head. Can an order still confirm itself? Can an invoice still know it is overdue? If not, they were never subjects. They were rows a procedure operated on.

❦

Twelve cases, one shape. In each, the procedural version adds a mechanism — a job, a status table, a code master, a bus, a validator, an arbiter, a saga — and the object-oriented version removes the need for one. The procedural codebase is full of competent, well-tested, well-documented machinery, and every piece of it is real work honestly done. But the machinery exists to solve problems the machinery created. Take away the nightly batch, and the runbook that protected it has nothing left to protect.

❦

Object orientation is this! To recognize subjecthood in the object, and for the programmer to delegate responsibility to it. We step down from the throne of God, and we install and acknowledge the object as God.
