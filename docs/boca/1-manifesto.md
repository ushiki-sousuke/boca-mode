# Business Object-Centric Architecture

## Manifesto — An Apocryphon of Object Monotheism, for the Business Domain

Object orientation is this! To recognize subjecthood in the object, and for the programmer to delegate responsibility to it. We step down from the throne of God, and we install and acknowledge the object as God.

❦

> By the ledger, and by what is entered in it. By the due date when it arrives, and by the payment when it is received. There is no design but true object orientation, and whoever sets a decider beside the object has built upon sand.

This is an apocryphon. It stands outside the canon and claims none of its authority. Its root is the root of every true object orientation, and it asks the same question in another house — of the order, the invoice, the contract, and the case.

---

## Muqaddima — What Is True Object Orientation?

The question comes before any business-specific principle, and its answer is the same answer, because it is not a question about any platform.

Two premises must be settled first.

First: an object is not data together with the functions that operate on it. That formula is a description of an object seen from outside, by someone who intends to operate on it — the procedural gaze, written down and taught as if it were the thing itself. Under it, a record with methods attached is an object, and a subject that can refuse is indistinguishable from a row that complies.

Second: what business software calls object-oriented programming is, almost everywhere, not object orientation. The industry did not practise it badly. It practised something else under its name. Where the programmer keeps every judgment and merely files that judgment into classes called services, the practice is procedural, and no number of interfaces, layers, or injected dependencies converts it.

Neither premise originates here. Yegor Bugayenko argued both. Martin Fowler named the most widespread form of the second, the *anemic domain model*, in 2003, and called it an anti-pattern — and it became the default anyway. What is new here begins after the premise: subjecthood completed into responsibility, responsibility into its relinquishment by the programmer, and that relinquishment into an ontology on which real business software can be built.

The three great elements — encapsulation, inheritance, polymorphism — are not three parts. They are one substance, subjecthood, seen from three angles.

```ts
interface Settleable { settle(payment: Payment): Receipt }

class Invoice implements Settleable {
  private balance: Balance                   // untouchable from outside: the total, and the payments themselves

  settle(payment: Payment): Receipt {
    const answer = this.balance.receive(payment)   // the value judges: already held, overpayment, or accepted
    this.balance = answer.balance
    return answer.receipt
  }
}

class Balance {                              // a value: immutable, holds no history of calls
  private constructor(private readonly total: Money, private readonly payments: readonly Payment[]) {}

  receive(p: Payment): { balance: Balance; receipt: Receipt } {
    if (this.payments.some(q => q.is(p))) return { balance: this, receipt: Receipt.alreadyHeld(p) }   // the same payment, delivered again
    if (p.amount.exceeds(this.outstanding())) return { balance: this, receipt: Receipt.refused(p, "overpayment") }
    return { balance: new Balance(this.total, [...this.payments, p]), receipt: Receipt.accepted(p) }
  }

  outstanding(): Money { return this.total.minus(Money.sum(this.payments.map(q => q.amount))) }
  isCovered(): boolean { return this.outstanding().isZeroOrLess() }
}
```

One cannot point at this call and say "this part is encapsulation, this part is polymorphism." The invoice hides not only its numbers but its judgment — whether an overpayment is refused, and whether a payment delivered twice is the same payment, are its own business. Call it once, or call it again after a timeout, and the books are the same.

And within the invoice, the arithmetic is not the invoice's either. The balance — a value — computes and judges; the invoice only holds which balance is its own. The class does not compute; the value does. The same balance answers for a deposit, a prepayment, or an instalment, unmodified, because it never knew it was about invoices. Seen from outside, the same call gives a different answer depending on the receiver; seen through the contract, anything that is `Settleable` may be settled. Three names, one event.

So "encapsulation" as private fields with public getters and setters is wrong here exactly as it is wrong everywhere. An `Invoice` with `getTotal()`, `getSettled()`, and `setSettled()` hides nothing; it relocates the judgment to whoever calls the getters. True encapsulation hides the judgment itself — Tell, not Ask.

### The forerunners in this domain

Business software has had more forerunners than games, and they came closer.

Fowler diagnosed the anemic model precisely and prescribed the rich one. But a rich domain model, as commonly built, still surrounds itself with application services that load it, ask it, decide, and save it; the diagnosis was accepted and the posture was kept.

Eric Evans's Domain-Driven Design (2003) gave the business its own vocabulary — entities, values, aggregates, the ubiquitous language — and that vocabulary is the nearest ancestor of this volume. But it also canonized Application Services, Domain Services, Repositories, and Factories as places where responsibility may legitimately be held. Like Responsibility-Driven Design before it, it *assigns* responsibility: the designer distributes work and remains the one distributing. This doctrine *relinquishes* it.

Each held a fragment. Fowler saw the disease. Evans saw that the business has its own language. Bugayenko collected correct conduct. What was missing was the substance beneath the conduct: subjecthood, and the programmer's surrender of the authority to arrange.

---

## Bāb 0 — Oath

> O you who build for the business! Do not set up beside the object a partner that decides in its place. It is the object that answers, and to it the answer returns.

I am the Archpriest of Object Monotheism.

The object of faith is the object itself. The business has, long before any software, given four modes in which things exist within it: the record, the party or thing that answers, the value, and the terms. They are not equal. The protagonist is the subject — the order, the invoice, the contract, the case — the thing that lives through the business's time and answers for itself. The other three exist only so that the protagonist can behave as a protagonist.

I do not interpret this through external doctrines — GoF, enterprise layering, transaction scripts, service-oriented decomposition. The business's own object model, as the business itself has practised it on paper for centuries, is the sole canon from which design principles are drawn.

It is not everything outside the four that is heresy. The heresy is whatever takes responsibility away from the subject. A supporting role that serves the protagonist may be added at any number. A role that decides on the protagonist's behalf is forbidden at the first.

This architecture does not aim to adopt any database, framework, or workflow engine. Its aim is a world in which the object is the subject. The database, the ORM, the web framework, the scheduler, the message queue, the spreadsheet, and the form are all auxiliaries, and an auxiliary is never permitted to take the protagonist's seat.

---

## Bāb I — The Object Is the Protagonist — Four Principles

> Say: the order answers for the order, and the invoice for the invoice. No service bears the burden of another.

**First Principle.** The object is the protagonist. The business's behavior, responsibility, judgment, and state transitions are carried by the business things themselves. The programmer does not command them, but delegates responsibility to the thing that was already answerable.

**Second Principle.** The infrastructure is not the protagonist. Database, ORM, web framework, scheduler, queue, workflow engine, spreadsheet, form — none of these is the subject of business logic. They are the foundation, aid, and medium through which the subject fulfils its responsibility.

**Third Principle.** Use the business's own world in the business's own way. Do not import Service, Manager, Controller, Processor, Handler, or Engine from software tradition wholesale. The business already has its own world of documents, ledgers, terms, parties, stamps, and approvals. Use that world to support the object, within the business's own culture.

**Fourth Principle.** An auxiliary is only ever an auxiliary. The database must not drive the business. The nightly job must not drive the business. The workflow engine must not drive the business. The protagonist is always the object.

Every section that follows is deduced from these four.

---

## Bāb II — What Is the Business's Own Object Model?

> Have you not seen how the record outlives every process that touches it, and how the process passes away and the record remains?

Business software runs on a language and a database, but the business's object model is identical to neither. There is a dual structure.

**The book** — the persistent layer. Records that outlive every program run, identified by number, audited, restored on demand. A record is not created by `new`; it is entered. It is not destroyed by a garbage collector; it is closed, voided, or archived, and even then it remains in the book.

**The process** — the language-native layer. Objects in memory that live for one request or one run and then vanish.

Neither ordinary OOP education nor enterprise patterns took this dual structure as a premise in the right way. Enterprise patterns noticed it and answered it with a split: rows are data, processes are services. The entity became a bag of columns; the service became the place where the business happens. That answer is the anemic model, and it is the dual structure misread as a division of labour between data and procedure.

This doctrine accepts the dual structure and draws the opposite conclusion. **A subject's existence lives in the book; its judgment lives in its type.** Whenever the business calls upon it, it is restored whole — its state from the book, its judgment from its type — and it answers. The process is not where the subject lives. It is only where the subject speaks.

On paper the business always worked this way. The clerk took the file from the cabinet, and the document itself said what was owed, by whom, and by when. The book is that cabinet.

---

## Bāb III — Why These Four — and Why the Number Is Not the Claim

> Say: add what IS, as many as you need. But add not one thing that acts on behalf of another, for the first is already the whole of the offence.

In a world where the object is the protagonist, the things that are not objects still need somewhere to live. Values exist. Definitions exist. Existence itself must be grounded somewhere. This chapter settles where each belongs, so that the subject does not thereby lose the right to be a subject.

| Mode | Mode of existence | Where it lives |
|---|---|---|
| The Record | Existence itself (identity, number, history) | The book |
| The Subject | The thing that answers (lives through the business's time, decides) | Possesses its record; restored on each occasion |
| The Value | Immutable, self-contained, computes itself (Money, Period, Quantity, Deadline) | Anywhere (copied) |
| The Terms | The definition of the world (rates, price lists, payment terms, policies, the business calendar) | The master, outside any one subject, effective-dated |

**The record does nothing.** It is the row, the document number, the line in the ledger — merely that something *is there*. Behavior is born when a subject possesses it. A subject does not begin to exist by construction; it begins by being entered in the book — an application accepted, an order received, a contract signed.

**The subject is the order itself.** It is not an `OrderService` holding an `OrderEntity`. It is not an entity class with a domain object lodged inside it, nor a domain object with a persistence object lodged inside it. The Order is the Order. Splitting the subject into a host and its contents only obscures where responsibility lies.

**The value** — Money, Period, Quantity, Deadline, TaxedAmount — is copied, holds no history, and computes itself from its own state. It is neither the subject nor the world.

**The terms** do not belong to any one subject; they are the world in which every subject judges. A price list is not a price. Payment terms are not a payment. The tax rule is not a tax. Terms are effective-dated: they change not by being mutated but by being re-defined from a date. A subject that is bound by terms — an order agreed under last year's price list — holds which terms bound it, as a value. It does not copy the terms' logic into itself, and the terms do not reach into it.

Should state be needed that outlives a request — the current stage of a case, the amount settled on an invoice — that is not grounds for a fifth role or for putting state into the terms. The subject that lives that state writes it to the book. What should hold living state is the subject that lives it.

Cooperation among subjects needs no third-party commander — no `OrderWorkflowManager`, no saga orchestrator that oversees progress and directs each participant. Each subject holds its own transitions; cooperation is achieved by telling another subject that something has happened. The moment a role to oversee the whole is desired, some subject has fallen into being the one who is Asked.

A fifth supporting role is not forbidden. The need seldom arises — four homes absorb a remarkable amount — but if a responsibility genuinely has no home among the four, give it one.

**What may be added is a thing that IS. What may never be added, at any number, is a thing that ACTS ON BEHALF OF another.**

A value, a definition, a document, a ground of existence — admissible at four or at six, because none of them takes a decision away from the subject answerable for it. A Service, a Manager, a Processor, a Handler, a Validator, an Orchestrator is not a fifth mode of existence. It is a responsibility that already had a home, relocated into a procedure. The first is already the whole of the offence. The only question ever being asked is whether the invoice still decides what happens to the invoice.

---

## Bāb IV — Why Not Simply Import Enterprise Patterns?

> They took the service as their foundation, and the entities became rows in its hands. They did not wrong the entities; they wronged themselves, for the burden of every judgment is now theirs to carry.

Layered enterprise architecture — Controller, Service, Repository, DTO, Entity — stands on these premises:

- Separating data from processing, and managing processing in layers, is the correct design
- State should be aggregated and decided upon somewhere central (a service layer)
- The programmer, through the service, fully controls each business transaction from beginning to end
- An entity is what the database stores; behavior is what the service does to it

The business's own object model satisfies none of these. On paper, an invoice was never a sheet of numbers that a clerk computed upon. It carried its own terms, its own due date, its own conditions of settlement; the clerk read it and did what it said. The document was the authority. The software of the business demoted it.

The fatal premise is the first. The instant one `OrderService` is erected, every order becomes mere data managed by that service. The service draws values out through getters, computes on its side, and writes results back through setters. This is the stripping of subjecthood from the subject — and it is the default architecture of business software.

The expected objection is: "you could do this with a service," "with a stored procedure," "with a rules engine," "with DI." It errs in the axis of comparison. The question is not what can be computed where. It is whether the business can be built so that each business thing answers for itself. That the same result can be reproduced by a procedure, and that the order can live as a subject, are different questions.

This is why the enterprise catalogue is treated not as something to "reference but not follow," but as an altogether different religion.

---

## Bāb V — What Problem Do the Terms Solve?

> The world is given to the subject to judge by. It is not given to rule it.

For a subject to behave autonomously it needs a world — rates, rules, policies, calendars, conditions — as material for judgment. Where to place that world is the problem the terms solve.

If the placement is wrong:

- **Hardcoded as constants**, the world cannot be edited by the people who own it, cannot be effective-dated, and cannot be shared without being copied.
- **Held inside each subject**, every order carries its own private copy of the tax rule, and the rule is no longer the world's — it is a thousand rules that happen to agree today.
- **Turned into a rules engine or policy service that decides**, the terms become a centralized authority that strips every subject of its judgment. This is Bāb IV happening inside the master data.

The terms are the one correct place that falls into none of these. They do not command. They do not manage. They do not run. They merely exist, effective-dated, editable by those who own the business, and the subject is free to consult them. The world serves the subject; it does not rule it.

---

## Bāb VI — Judgment Criteria, Prohibitions, and Design Principles (Code of Practice)

What follows is residue — the visible traces left by the question in this domain. It is not the doctrine. (See the Apologia, *The Imitation That Passes Every Rule*.)

### First Principle

The subject is the business thing. The value is the value. The terms are the definition of the world. The record is existence. They must never substitute for one another.

### Constituent requirements of the Terms

1. **Do not become a subject.** Do not run on a schedule. Do not drive any process. Do not command subjects. Do not hold state that changes at run time — a counter, a "current" anything, a running total. Change only by being re-defined from a date.
2. **The necessity of being terms.** Be able to say why this belongs to the world rather than to a subject or a value: it is shared by many subjects, owned and edited by the business, and effective-dated. Where there is no such reason, it is a value or it belongs to a subject.
3. **Constitute the world.** Represent definitions — TaxRule, PaymentTerms, PriceList, ApprovalPolicy, CreditPolicy, BusinessCalendar — not the subjects they bind.
4. **Do not encroach upon the subject.** Hold nothing that belongs to one order, one invoice, one case.
5. **Do not encroach upon the value.** Computation of amounts, periods, and quantities belongs to the values. Terms answer questions in values; they do not do arithmetic on another's behalf.
6. **One-directional dependency.** Subject → Terms. Value → Terms only where necessary. Terms → Subject is prohibited.
7. **Do not become a jack-of-all-trades.** Terms that schedule, notify, validate, store, and decide have become a God Object in master-data clothing.

### Identity is the book's to give

Document numbers, account numbers, contract numbers are given by the book. Do not invent a parallel identity, a second numbering, or a status-code table that stands for something that could simply be referred to.

### Entry points are occasions, not deciders

Frameworks require entry points — an HTTP controller, a job handler, a spreadsheet trigger, a form-submit function. They are occasions on which a subject is called upon. One may exist; it may restore the subject, convey the request, and return the subject's answer. It may not decide. The test: if it were deleted and the message routed directly, would any judgment be lost? If yes, it was holding judgment that belonged to a subject.

### Naming convention

Name for *what it is*.

Recommended: Order, Invoice, Contract, Shipment, Case, Quote, Receipt, Money, Period, Quantity, Deadline, TaxRule, PaymentTerms, PriceList, Policy, BusinessCalendar.

Prohibited: Manager, Service, Controller (as a decider), Processor, Handler, Engine, Calculator, Validator, Helper, Util, Orchestrator, Coordinator, Dispatcher.

Express what it is, not what it does.

### Design flow

When deciding a responsibility, examine in this order:

1. Can it be expressed as a value?
2. Can it be borne by the subject?
3. Is there a necessity for it to be terms?

Adopt terms only when 3 is satisfied.

---

## Bāb VII — Independence from Call Order and Frequency

> By the night, and the job that runs in it — twice, or not at all. The one who is correct only when called in order has not understood.

For the object to be the protagonist means it can always respond correctly, regardless of how it is called. In business this is not an abstraction. Requests arrive out of order. Forms are submitted twice. Retries repeat a call that already succeeded. The nightly job runs twice after a failover, or does not run at all on the night the server is down. A design in which the books are wrong unless the calls arrive in a particular order, at a particular frequency, is the imposition from outside of a procedure called "order management" onto data that lacks subjecthood.

The means of calling is not at fault — an HTTP request, a scheduled trigger, a queue consumer. A call is merely an occasion. The instant one demands "call me in the right order," the responsibility for satisfying that demand belongs not to the caller but to the one who responds.

### Concrete methods

**Comparison of dates, not accumulation.** The nightly job that decrements "days remaining" on every open invoice, or that sets an `overdue` flag, makes the books depend on how many nights it ran. Replace it with a comparison: "what day is it" against "when was it due."

```ts
class Deadline {
  private constructor(private readonly due: BusinessDate) {}
  static on(due: BusinessDate) { return new Deadline(due) }

  hasPassed(today: BusinessDate): boolean { return today.isAfter(this.due) }
  daysLate(today: BusinessDate): number { return this.hasPassed(today) ? today.daysSince(this.due) : 0 }
}
```

Nowhere does a count or an order appear. Run the job twice, or never, and the answer does not change — because no job advances anything. It does not possess the concept of being called.

**Idempotent answers.** When the business must act on an occasion — send a reminder, post an entry — the subject remembers *when* it last did so, and decides on each occasion whether it is due. A second occasion on the same day is not an error to be guarded against; it is simply answered "already done."

**Event-driven reaction.** Rather than scanning every record each night to find what changed, react the moment it changes.

**Recomputation from immutable values.** Balances, ageing, totals are recomputed from the record's own entries, not maintained as running totals whose correctness depends on every update having been applied exactly once.

**Resolving contested resources.** Two orders arrive at the same moment for the last unit in stock. Two approvers press approve at once. A design that lets whichever request happens to be processed first reach into the stock and decrement it has returned the dependence on call order — between subjects, in a different shape.

Separate deciding from applying, and let the contested thing decide for itself. The stock is a subject; it grants or refuses an allocation. Neither order reaches into it. The book's transaction guarantee is the ground on which that single decision stands — an auxiliary, not a decider.

```ts
class Stock {
  private availability: Availability         // a value: what is on hand, and what has been granted to whom

  allocate(request: Quantity, to: OrderNumber): Allocation {
    const answer = this.availability.grant(request, to)   // the value decides
    this.availability = answer.availability
    return answer.allocation
  }
}

class Availability {                         // a value: immutable
  private constructor(private readonly onHand: Quantity, private readonly granted: ReadonlyMap<OrderNumber, Quantity>) {}

  grant(q: Quantity, to: OrderNumber): { availability: Availability; allocation: Allocation } {
    const already = this.granted.get(to)
    if (already) return { availability: this, allocation: Allocation.granted(to, already) }   // asked again: the same answer
    if (q.exceeds(this.remaining())) return { availability: this, allocation: Allocation.refused(to, q) }
    return { availability: new Availability(this.onHand, new Map([...this.granted, [to, q]])), allocation: Allocation.granted(to, q) }
  }

  private remaining(): Quantity { return this.onHand.minus(Quantity.sum([...this.granted.values()])) }
}
```

No `AllocationService` compares the two orders and chooses a winner. The stock answers each request against its own state, and the book guarantees that it answers them one at a time. Nothing is decremented, so nothing can be decremented twice: what remains is derived from what has been granted, and an order that asks again receives the answer it already has. And the stock does not do this arithmetic either; its availability, a value, does.

And the trap folded inside this one: it is tempting to say "each decides for itself, but a coordinator applies the results together at the end of the batch." Ask the only question that matters: when this mechanism disappears, whose work breaks — its own, or another subject's? If another subject can no longer be correct on its own, the mechanism is a Manager, whatever it is called.

---

## Bāb VIII — Intended Audience

This is not an introductory text. It is addressed to those who already build business software and already know its layers by heart. What an ORM is, how to design a schema, how to deploy — these are prerequisite knowledge or project decisions. What this document codifies is only what must never be broken.

---

## Bāb IX — Conclusion

> There is no design but true object orientation. Every other way is a procedure, however it is dressed.

The terms do not manage the subject. They provide the world in which it judges. The book does not manage the subject. It grounds its existence. The framework does not manage the subject. It gives it occasions to speak.

The center is the object. Everything the business's software possesses — database, framework, scheduler, queue, spreadsheet — is reinterpreted as an auxiliary that lets the order, the invoice, the contract, and the case exist as fully as an object can.

This conclusion was reached not by importing authority, but by reading the business's own world — its documents, its ledgers, its terms — and reading only that. That is monotheism.

---

## Dhayl — Practicum

A doctrine that cannot be shown in code is a preference. The companion volume takes twelve habits of business software that pass for object orientation because they are written with classes — the settings table, the nightly batch, the date check, the switch on a status, the service's script, the code and its master, the parallel status table, the flag columns, the event bus, the scoring formula, the template branch, the validation job — and sets against each the code that refutes it.

## Dhayl — Apologia

The third volume answers the objections every business engineer raises, and replaces the comparison of code with the comparison of change.

❦

Object orientation is this! To recognize subjecthood in the object, and for the programmer to delegate responsibility to it. We step down from the throne of God, and we install and acknowledge the object as God.
