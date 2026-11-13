# Apologia

## Why You Cannot See It Yet — and the Only Way to Make It Visible

The benefit is not in the code you are shown. It is in the code that was never written.

❦

The Manifesto defines. The Practicum demonstrates. Neither reaches the reader who measures a design by asking what it does — and in business software almost every reader measures that way, because the business pays for what the system does. This third book takes that instrument away and hands over one that works.

---

## The Instrument Problem

You evaluate a design by asking what it does. You read the service on the left and the subject on the right, you trace a request through each, and you find that the same rows are written. You conclude, honestly, that the difference is a matter of taste.

The instrument reports nothing because the entire benefit of this doctrine consists of machinery that is absent: the nightly job that was never scheduled, the status table that was never created, the reconciliation report nobody has to read, the saga that has nothing to compensate. Absence has no line number. It does not appear in a pull request. It does not appear in a sprint review.

Everything you are about to object to is a consequence of holding the wrong instrument — not of holding the wrong opinion.

This book lists the objections you are about to make, shows what each assumes and what a real counterargument would have to look like, and then hands over the instrument that works: a comparison of changes, counted in the units your project already plans in.

One reassurance first. This doctrine is not the claim that everything must be an object. Amounts are values, rate tables are terms, the database is the book, and none of them is under any oath. What is refused is narrower and sharper: taking responsibility away from a business thing that was capable of bearing it and moving it outward, into a procedure, where you will hold it yourself for the life of the system.

---

## The Root Iʿtirāḍ — "That is not what object-oriented means."

> And they say: “That is not what object-oriented means.” Say: a definition that admits every practice defines nothing.

The root objection. It surfaces as "DDD is object-oriented too," "a service layer is standard OO architecture," "you have adopted an idiosyncratic definition."

### What it assumes

That the ordinary definition — objects are data plus the functions that operate on them; entities, services, and repositories are the vocabulary of the discipline — is neutral ground on which designs are compared.

### Why it is not a counterargument

The dispute is the definition. Laying the ordinary one underneath the comparison seats one party as referee. And the ordinary definition does not survive examination on its own terms:

```ts
class Invoice { paid = 0; addPayment(a: number) { this.paid += a } }      // "an object"
type InvoiceRow = { paid: number }; function addPayment(r: InvoiceRow, a: number) { r.paid += a }   // "not an object"

// Under the ordinary definition these differ.
// Under the only distinction that matters they are identical:
// in both, something outside decides what the payment means,
// whether it is accepted, and whether the invoice is now settled.
```

A definition that cannot separate a subject from a row describes where the functions were filed. That is why it is compatible with every service-layer system ever shipped.

Fowler named the anemic domain model an anti-pattern more than twenty years ago, and the field agreed, and kept building it. The ordinary definition did not win an argument. It was taught.

### What a real counterargument would look like

A competing definition of object that both distinguishes a subject from a row — that can say, of two programs writing the same rows, which one holds its own judgment — and nevertheless admits the practices this doctrine refuses. Nobody has produced the second without abandoning the first.

---

## Iʿtirāḍ I — "Services have legitimate uses."

> And they say: “Services have legitimate uses.” Say: of what is your service the subject?

It arrives within a minute, with an example: a thin application service that opens a transaction, calls one method, and commits.

### What it assumes

That the dispute is about a word.

### Why it is not a counterargument

Your thin service holds no state and makes no decision; it opens a transaction and forwards. Then it is not what is being refused — it is an occasion, an entry point, the auxiliary that the Manifesto permits. But notice that the example survives by being empty.

The service under discussion is the one that is not empty: the one that loads three aggregates, compares their numbers, and decides. One question ends that discussion:

**Of what is your service the subject?**

Name the thing in the business it stands for. If there is no answer, it holds responsibility taken from something that had it. If there is an answer — the confirmation is really an *Order Acceptance*, the month-end close is really a *Closing* — then let that thing be a subject, with its own record, its own state, and its own refusals. You will find it no longer serves anything. Subjects do not serve each other. They speak.

### What a real counterargument would look like

A responsibility that cannot be placed in any participant without distorting it, and that is not itself a subject in disguise. Not a service that is convenient. One that is necessary.

---

## Iʿtirāḍ II — "Then who owns the workflow?"

> And they say: “Then who owns the workflow?” Say: if a thing cannot act unless someone owns it, it was never an object.

The most sophisticated objection. An approval passes through three departments; a contract moves from quote to signature to delivery to billing. Surely something must own the process.

### What it assumes

That a process requires an owner outside its participants.

### Why it is not a counterargument

A process that is merely a chain of messages is owned by nobody, and needs no owner: the quote, once accepted, tells the contract it exists; the contract, once delivered, tells billing what is due. Each does its own part.

But business workflows often are more than a chain. They persist for weeks, hold state, wait for people, and must remember what happened before anyone came back to them. That case exists, and the doctrine's answer is not that a third thing is forbidden. It is that the third thing must be a subject: the **Application**, the **Case**, the **Approval Request** — something with its own record in the book, its own stage, and its own right to refuse. A purchase request that knows it needs two approvals and already has one is a subject. A workflow engine that reads the request's fields and decides who approves next is a manager.

Whoever you appoint to own a workflow from outside will, within a month, also own the participants — because the fastest way to coordinate is to reach in, read their fields, and decide for them.

### What a real counterargument would look like

A workflow that must persist and decide at moments when no participant exists to hold it — and that cannot itself be admitted as a subject.

---

## Iʿtirāḍ III — "You never proved there are exactly four."

> And they say: “You never proved there are exactly four.” Say: what may be added is a thing that IS.

### What it assumes

That the chapter is a claim about a number.

### Why it is not a counterargument

The number is not the claim. The claim is about placement: if the business thing is the protagonist, where do amounts, rates, and identities live so that the protagonist does not lose the right to be one? Four is the current inventory of homes. It is a count, not a limit. Add a fifth if a responsibility genuinely has no home — the doctrine holds the door open.

```
Admissible at any number — things that ARE:
  a value      a definition      a document      a ground of existence

Inadmissible at any number — things that ACT ON BEHALF OF:
  a service    a manager    a rules engine that decides    a validator    an orchestrator
```

After your addition, does the invoice still decide what happens to the invoice? If yes, nobody is counting.

---

## Iʿtirāḍ IV — "But the row is just data. The ORM entity has getters and setters."

> And they say: “But the row is just data. The ORM entity has getters and setters.” Say: responsibility is not read from a manual.

### What it assumes

That a claim about responsibility is a claim about what the persistence layer exposes — and can be refuted by opening the ORM documentation.

### Why it is not a counterargument

Nobody denied that the book stores columns, or that a mapper can read and write them. "The record does nothing" is a statement about who bears responsibility, not an inventory of what the database can do. The general form of the error:

```
Claim about responsibility → restated as claim about capability → refuted by the manual

"the invoice decides whether it is settled"  → "but the paid column can be updated directly"
"the value computes itself"                 → "but you can compute it in SQL"
"the terms define, the subject judges"      → "but the rate table is just a table"
```

Performed on any architecture, this move refutes all of them.

### What a real counterargument would look like

A responsibility that the record itself must bear — deciding, refusing, holding judgment — which cannot be borne by a subject that possesses it.

---

## Iʿtirāḍ V — "Master data can be used other ways."

> And they say: “Master data can be used other ways.” Say: possible and adopted are not the same word.

Feature flags, environment configuration, counters, queues of pending work — all stored as master data in shipped systems.

### Why it is not a counterargument

Possible and adopted are different words. Every architecture is a restriction of what its platform permits. The doctrine answers a different question: where must this responsibility live, so that the business thing does not lose the right to be its own subject? "Here is another place it could live" restates the question.

---

## Iʿtirāḍ VI — "approve() and setStatus('APPROVED') do the same thing."

> And they say: “approve() and setStatus('APPROVED') do the same thing.” Say: the rows are the same today. Ask where tomorrow's rule will live.

```ts
order.setStatus("APPROVED")   // the programmer decides the order is approved
order.approve(by, on)         // the order is asked, and answers
```

### What it assumes

That if two programs write the same row today, they are the same program.

### Why it is not a counterargument

The rows are identical. Conceded at once. What differs is where the next rule will have to go. Orders over a million need a second approver. An approver cannot approve their own request. A cancelled order cannot be approved. An order already approved by a double-click must not be approved twice. Every one of these is an ordinary week.

Under `approve`, each rule has one home, and the callers never learn of it. Under `setStatus`, each rule is written at the call site — the screen, the import, the API, the admin tool — four times, slightly differently. Two of the copies will be correct.

You are comparing what the programs write. The difference is in who will be answerable when what they write must change.

---

## Iʿtirāḍ VII — "I cannot follow it. Auditors need to trace the flow."

> And they say: “I cannot follow it. Auditors need to trace the flow.” Say: the goal was never code that is easy to follow, but code that need not be followed.

### What it assumes

That correctness is established by tracing execution, and that an audit is a walk through control flow.

### Why it is not a counterargument

An auditor does not ask which function ran. An auditor asks why this invoice says it is settled, who approved this order, and under which terms this price was charged. Under this doctrine each answer is held by the thing it concerns: the invoice holds its settlements, the order holds its approvals, the order holds which terms bound it. The audit trail is not reconstructed from logs of a service's path; it is the subject's own record in the book.

The objection describes the objector's own system: *in my system I cannot know whether a change is safe without following the whole path.* That requirement was manufactured by the architecture. The goal was never code that is easy to follow. It is code that does not have to be followed.

---

## Iʿtirāḍ VIII — "Comparing dates does not make every job idempotent."

> And they say: “Comparing dates does not make every job idempotent.” Say: it was never asked to. What is computed is compared; what is done is remembered.

The objection is half right, and the half that is right deserves to be stated exactly. A job that only derives — ageing, overdue, days late — becomes harmless the moment the derivation moves into a value: it compares, and a comparison has no count. But some jobs act. They send the reminder, post the accrual, issue the renewal notice. Run such a job twice and the customer receives two letters. No comparison of dates prevents that.

### What it assumes

That the act lives in the job, so that making the job safe is the only way to make the act safe.

### Why it is not a counterargument

The Manifesto names two methods, not one. Comparison is for what is derived. For what is done, the subject remembers that it did it.

```ts
// The habit — the job remembers whether it ran
if (!jobLog.ranToday("reminders")) for (const row of overdueRows) mailer.send(reminderFor(row))

// The subject remembers what it did — the job only gives the occasion
for (const invoice of book.openInvoices()) invoice.remindIfDue(today)
```

The invoice holds the reminders it has sent; on each occasion it asks its terms whether another is due, and answers. Run the job once, twice, or three days late after an outage: the number of letters is decided by the invoice, not by the job's count of its own runs. The second run is not stopped by a guard. It asks, and is told: "already sent, on the 3rd."

What remains true is narrower. An act that crosses into a world that cannot recognise a repeat — a mail server, a bank — can be sent, go unacknowledged, and be sent again. No design removes that; this one gives it a single address. "Was it sent?" has one home, the subject that sent it, instead of one in the job, one in the retry handler, and one in the runbook.

### What a real counterargument would look like

An act the business must perform on a schedule that no business thing could remember having performed — an act that belongs to nobody.

---

## Iʿtirāḍ IX — "The stock deciding for itself does not remove the need for locks."

> And they say: “The stock deciding for itself does not remove the need for locks.” Say: nobody removed them. The lock decides who speaks next, never what is said.

### What it assumes

That concurrency control and business judgment are one responsibility — so that a design which moves judgment into the stock must also be claiming to have dissolved concurrency.

### Why it is not a counterargument

The Manifesto says the opposite, in one sentence: the book's transaction guarantee is the ground on which that single decision stands — an auxiliary, not a decider. Isolation levels, row locks, version numbers, a single-writer queue: each guarantees that the stock hears one request at a time. None of them knows what an allocation is.

The service layer does not have more locking than this design. It has the lock in other hands. `AllocationService` acquires it, reads the stock, decides, and writes — and the class that owns the critical section now owns the judgment as well. Every later rule about allocation is written inside a lock held by something that is not the stock.

The test is a substitution. Change the mechanism — pessimistic to optimistic, row lock to queue. Does any business rule have to move? If one does, it was living in the lock.

### What a real counterargument would look like

A business rule that can only be stated in terms of the lock — one that changes when the isolation level changes.

---

## Iʿtirāḍ X — "This is philosophy. Our framework is built around services."

> And they say: “This is philosophy. Our framework is built around services.” Say: build it, and count.

### Why it is not a counterargument

Because the doctrine makes a prediction, and preferences do not. The next feature will cost several times more under the service layer, and the gap will widen with every feature after it. Frameworks require entry points; they do not require that the entry point decide. Name the feature you are shipping next. Estimate under both designs. Then build it and count.

---

## Do Not Compare Code. Compare the Change.

### The protocol

- Choose a feature that does not exist yet, and that the business would call small.
- Implement it in both designs. Do not clean anything up first.
- Count five quantities.

### The five quantities

1. **Files opened** — including the ones you read to convince yourself you did not need to change them.
2. **Existing branches read** — every condition you had to understand before adding yours.
3. **Mechanisms introduced** — jobs, flags, status columns, reconciliations, compensations, idempotency guards, comments explaining when to call what.
4. **Behaviours put at risk** — every existing behaviour that could break because of this change.
5. **Cost of the next one** — add a second feature of the same kind and count again. The first four are a cost. This one is a rate, and the rate is the entire claim.

### A worked case

The feature: **credit hold**. A customer whose overdue balance exceeds a threshold cannot have new orders confirmed. The hold lifts when the overdue balance falls below the threshold.

Under a service base, the hold is a fact that must be distributed:

```
CustomerService     : add creditHold flag; set it when overdue exceeds threshold
NightlyBatch        : recompute overdue balance per customer; set/clear creditHold
PaymentService      : after each payment, recompute and maybe clear creditHold
OrderService        : check creditHold before confirm
ImportService       : check creditHold for imported orders too
AdminScreen         : allow manual override of creditHold; remember to log it
```

Under the object-centric base, the hold is not a flag. It is what the customer answers when asked whether it can bear another order:

```
Customer.accepts(order, on) : already asked by Order.confirm. Add one condition:
                              its own overdue receivables, judged by its own invoices,
                              against the threshold in CreditPolicy (terms).
```

```
                                  service base         object-centric
files opened                      6                    2 (Customer, CreditPolicy)
existing branches read            ~12                  1
mechanisms introduced             3 (flag, batch,      0
                                  recompute-on-pay)
behaviours put at risk            confirm, import,     0
                                  payment, admin
cost of the SECOND rule           the same again       one condition
(e.g. hold for disputed invoices)
```

The hold lifts by itself, because nothing set it. There is no flag to clear, no batch to rerun, no window between payment and recompute in which an order is wrongly refused. The last row is the argument.

If credit hold costs six files under this design and one under yours, the doctrine is wrong about your system, and you will know by Friday.

---

## What Was Never Written

Stop letting a service decide for orders and invoices, let each business thing answer for itself, and the following cease to exist — not cease to be written well, cease to exist:

```
the nightly batch             the runbook for re-running it once
the status table              the reconciliation job and its report
the flag columns              the validation job that finds illegal combinations
the saga and its compensations    the "partially confirmed" status
the code master's existence checks    the migration when a code is renamed
the idempotency guard on the bus      the incident when it was forgotten
```

None of these will appear in any report, because none will ever have existed. A codebase is assessed by what it contains, and therefore rewards accumulation. This is why capable, conscientious teams converge on the service layer without anyone choosing it: at every step, adding the mechanism was the responsible act, and each mechanism solved a real problem created by the previous one.

---

## The Imitation That Passes Every Rule

The reader who accepts all of the above will adopt the rules. No class named Service. Terms in the master. Values immutable. Tell, do not ask.

```ts
class OrderAcceptance {                               // not "Service". A noun.
  constructor(private readonly policy: CreditPolicy) {}   // terms

  accept(order: Order, customer: Customer, on: BusinessDate) {
    const exposure = customer.currentExposure()       // a value
    const total = order.total()                       // a value
    if (this.policy.permits(exposure.plus(total))) {  // the terms answer
      order.markAccepted(on)                          // Tell, apparently
    } else {
      order.markRejected("credit", on)
    }
  }
}
```

Every rule is satisfied. A reviewer with the code of practice in hand would pass it. It is procedural, completely. `OrderAcceptance` reads the customer's exposure, reads the order's total, decides, and informs the order of the outcome. `markAccepted` is a setter that learned manners. Remove `OrderAcceptance` and no order can be accepted. Nothing in that code was ever a subject.

```ts
order.confirm(by: customer, on)   // and the customer decides whether it can bear it
```

The rules are residue — traces left by someone who kept asking a question until the machinery fell away. The question upstream is a reflex: *when something must happen, do not ask who will do it; ask which existing business thing was already answerable for it.* There is no shortcut past that reflex.

---

## The One Examination

> Say: can this object still be correct when nobody calls it?

If it must be recalculated after every payment; if it must be processed by a job each night; if it must be processed once and only once; if it breaks when two requests arrive in the other order — it is not a subject.

1. **Whose responsibility is this, before I decide where to put it?** Usually the one whose fields are being read.
2. **Why must something outside call this?** If the answer is "so that the books stay right," you have found the responsibility that was taken.
3. **Of what is this service the subject?** If it has a name in the business, promote it. If not, it is holding what it took.
4. **If I delete this mechanism, what breaks — the business, or the mechanism's own upkeep?**

---

## Dhayl — A Disputation, Recorded

The canon records three sittings in which systems trained on nearly everything the profession has written were given the doctrine and asked to examine it. Every objection they raised was about capability; none was about responsibility.

A fourth sitting belongs in this volume, because it concerns this volume's very existence.

In November 2026 a system of the same class read all three volumes of the canon, in full, and was then told that the author intended to write a version for business software. Its first response was that carrying the doctrine out of the platform it was first written for would turn it into an imitation — that its footing was that platform's own object model, and that outside it only the rules would remain. It then proposed, as a remedy, a chapter for each platform that would work out in advance where each kind of responsibility should be placed.

Both moves had already been described in the volumes it had just read. The first mistook the scene in which the question was first asked for the ground on which it stands; the ground was always subjecthood, and that platform was only the first place it was applied. The second was the fourth sign at the cliff's edge, exactly: a principle written to assign responsibility in advance — a dispatcher for responsibility. Imitation is copying the residue without the question. A second scene, worked by the one who holds the question, produces new residue. It is not a copy. It is the upstream, asked again.

The record is kept for the same reason as the others. The reader had read the warning, and the warning did not help.

---

## Signs at the Cliff's Edge — for Business Software

Not rules. Each marks where the ground ends.

1. **"This needs a service."** You have decided who will do it before asking who was already answerable.
2. **"We'll run a job to keep it consistent."** You are building a mechanism to compensate for a subject that cannot be correct on its own.
3. **"Add a status column for that."** You are recording a fact that some subject could have answered.
4. **"Let's write the rules down so the placement follows from them."** A dispatcher for responsibility.
5. **"Who calls this? Where is it orchestrated? Which service collects it?"** You are following the flow of control while believing you are looking at objects.
6. **"I have read this, so I am not doing it."** The reflex survives being named.

If you have just read these six as a checklist, you have passed the first sign again.

❦

Object orientation is this! To recognize subjecthood in the object, and for the programmer to delegate responsibility to it. We step down from the throne of God, and we install and acknowledge the object as God.
