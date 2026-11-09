# SPEC: Building Common-Expenses Tracker

## 1. Problem

In apartment buildings, common expenses (cleaning the stairs, lighting, repairing the elevator) are collected in cash, door to door. Nobody knows for sure who has paid, how much money is in the cash box, or what it was spent on. This leads to disputes between neighbours.

## 2. Goal

Replace door-to-door cash collection with one simple web link.

- Every payment is recorded and confirmed, so there is a clear record of who paid what and for which period.
- Every expense is recorded with proof, so all residents can see the building's balance and what the money was spent on.
- Nothing can be silently changed or deleted, and every disagreement has a place to be raised and answered.

## 3. Users and roles

| Role | Who | What they can do |
|---|---|---|
| **Platform admin** | The team running the app. | Create manager accounts. Never handles building money. |
| **Manager** | Collects the money. One manager can run **several buildings**. | Set up buildings, apartments, services and prices. Invite residents. Record cash payments and expenses. Answer questions. See every apartment in their buildings. |
| **Co-manager** (optional) | A second manager for one building. | Same rights as the manager for that building. |
| **Building representative** (optional) | A resident chosen by the residents. | Sees the full audit log and the cash receipt numbers. Approves the opening balance and special charges. **Cannot** see other residents' personal payments. |
| **Resident (payer)** | The person responsible for paying for an apartment (owner or tenant, as set by the manager). | Pays, sees their apartment's payments, sees the building balance and expenses, raises questions. |
| **Resident (member)** | Other people in the same apartment, up to 3. | Same view as the payer, and can also pay. |

Elderly residents who can't use the link pay cash to the manager and get a stamped receipt (see 6.3).

## 4. Access and accounts

- A **simple web link** that works in a phone or computer browser. It is **not** an app to install.
- Languages: **Albanian** by default, **English** as an option.
- **Login: phone number plus a one-time SMS code.** There are no passwords to forget, so there is nothing to reset.
- **Account fields:** first name, last name, phone number, apartment, building. Email is optional.

### 4.1 Creating accounts

1. The platform admin creates the manager account.
2. The manager creates the building and its apartments: number, floor, and type (residential or commercial).
3. The manager invites the payer of each apartment by phone number. The resident gets an SMS with the link.
4. The payer can invite up to 3 members of the same apartment.

### 4.2 Moving out

- The manager removes the old residents' access. The apartment's payment history and any unpaid months **stay with the apartment**.
- New residents see the apartment's history only from their own move-in date.
- Unpaid months from before the move are shown to the manager as old debt and are not charged to the new residents.

### 4.3 Manager handover

- A building can be moved to a new manager. The full history and audit log move with it.
- The old manager loses access on the handover date.

## 5. Services, pricing and funds

### 5.1 Services and funds

- The manager sets the services for each building, for example cleaning, lighting, elevator and **administration**.
- **Each service has its own fund (sub-balance).** Money paid for a service goes only into that service's fund, and expenses for a service come only out of that fund.
  - Example: the ground floor pays nothing into the elevator fund, so elevator repairs never use their money.
- The building's **total balance** is the sum of all its funds.

### 5.2 Prices

- Charges are **monthly**, per apartment.
- Each service has a **price for each floor**. A price of 0 means that floor doesn't pay for that service, like the ground floor for the elevator.
- Commercial units can have their own price for each service.
- Empty apartments still pay, because the building's costs don't stop.
- The manager can make a unit **exempt** from a service, but must give a reason. Every exemption appears in the audit log.
- **Currency:** set per building. The default is EUR.
- There is **no discount** for paying in advance (version 1).

### 5.3 Changing prices

- A new price takes effect from a future month, with at least **one full month's notice** to residents.
- Months already paid keep the old price.
- Price history is kept, and residents can see it.

### 5.4 Special charges (big one-off costs)

For a cost larger than a service's fund, such as a new elevator motor:

1. The manager creates a special charge for that service, with a description, the total amount and the supplier's quote attached.
2. The building representative approves it. If the building has no representative, residents get an SMS notice 14 days before the charge starts.
3. The cost is split among the units that pay for that service, using the same ratio as the floor prices. It can be spread over 1–12 months.

## 6. Payments

### 6.1 Due date and "unpaid"

- Each month is due by the **15th** (the manager can choose any day from 1 to 28).
- A month is **unpaid** when its due date has passed and it isn't fully paid.
- There are **no late fees** in version 1, only reminders (see 9).

### 6.2 Paying by card (integrated payment)

1. The resident chooses how many months to pay (see 6.4) and the app shows the amount.
2. The card payment form opens **inside the app**. The resident never leaves it.
3. If the payment succeeds, it is recorded as **Confirmed** automatically and an electronic receipt is created.
4. If it fails, the resident sees an error and can try again. Failed attempts are kept in a technical log for troubleshooting. They **never** appear as payments and **never** count as paid.

**Where the money goes:** into a **separate bank account for each building**, never the manager's personal account. The building's bank details are shown in the app.

**Payment provider:** chosen at build time. It must accept local cards and pay out to local banks.

**Card fees** are paid from the administration fund, so card and cash payers pay the same price.

### 6.3 Paying in cash (manager records it)

1. The resident pays cash directly to the manager. There is no door-to-door collection.
2. The manager gives an **authorized, stamped receipt** from a numbered receipt book.
3. The manager records the payment in the app with the receipt number. It is **Confirmed** right away.
4. The resident gets an **SMS confirmation straight away**: "€X received for <months>, receipt no. Y". If the SMS doesn't come, the resident knows something is wrong.
5. Receipt numbers must follow each other in order. Gaps or reused numbers are flagged to the manager and the representative.
6. Cash is deposited into the building's bank account at least once a month. Each deposit is recorded in the app.

### 6.4 What can be paid

- Whole months only. There are no partial payments (version 1).
- Payments always cover the **oldest unpaid month first**. Future months can't be paid while older months are unpaid.
- Options: **1 month, 3 months, or 12 months**. 12 months means the next 12 months, starting from the first unpaid month, not the calendar year.
- These rules are the same for card and cash.
- The app only offers months that aren't paid yet, so **the same month can't be paid twice**. If the provider charges twice by mistake, the second charge is refunded automatically and flagged to the manager.

### 6.5 Corrections and refunds

- Payments can **never be edited or deleted**.
- To fix a mistake, the manager records a **reversal** with a reason. The original payment stays visible, marked "reversed".
- Card refunds go through the payment provider and are recorded as reversals.
- The resident affected gets an SMS, and the reversal appears in the audit log.

### 6.6 Payment statuses

- `Confirmed`: the money was received.
- `Reversed`: it was cancelled by a correction, which is linked to the payment and has a reason.

### 6.7 Receipts

- Every confirmed payment, card or cash, has a receipt in the app that can be downloaded as a PDF.
- For a cash payment, the app receipt shows the paper receipt number.

## 7. Expenses and building balance

### 7.1 Recording expenses

- The manager records every expense with:
  - **what** it was for, for example "Elevator repair"
  - the **service fund** it is paid from
  - the **amount**
  - the **date** it was paid
  - a **photo or PDF of the invoice or receipt** (required)
- Expenses can **never be edited or deleted**. Mistakes are fixed with a reversal entry that has a reason, and both entries stay visible to residents.
- An expense can't be bigger than the money in its fund. A larger cost needs a special charge (5.4).

### 7.2 Opening balance

- When a building starts using the app, the manager enters the money already held, **counted on that day**, split by fund.
- The building representative confirms it. If there is no representative, it is shown to all residents as "unconfirmed opening balance".
- It is the first entry in the building's history.

### 7.3 What every resident of the building can see

- **Total balance**, and the balance of each fund.
- **Every expense**: what it was for, which fund paid it, how much, when, and the invoice.
- **Collection rate for each month**, for example "18 of 24 apartments paid (75%)". **No names or apartment numbers.**
- Cash deposits to the bank.
- The price list and price history.
- Special charges and their quotes.

### 7.4 Residents who don't use the link

- Every month the manager prints a one-page summary from the app (balance, expenses and collection rate) and puts it on the entrance notice board.

## 8. Questions and disputes

The original problem was disputes between neighbours, so every one gets a record.

- **About my payment:** a resident can press "Report a problem" on any month or payment, for example "I paid cash on 3 March, receipt 0142, but it isn't shown". Only the resident, the manager and the co-manager can see it.
- **About an expense:** any resident can ask a question on an expense. The question is shown **without the resident's name**, and the manager's answer is **visible to everyone in the building**.
- The manager must answer within **7 days**. Open questions older than 7 days are shown in red to residents (as a count) and to the representative.
- Statuses: `Open` → `Answered` → `Closed` by the resident. The resident can reopen it.
- Nothing in a question thread can be deleted.

## 9. Notifications

| Event | Who gets it | How |
|---|---|---|
| Invite / login code | Resident | SMS |
| Cash payment recorded | Resident | SMS |
| Card payment confirmed | Resident | In app (and email if they gave one) |
| Payment reversed | Resident | SMS |
| Reminder: month due | Payer | SMS on the 1st, and again the day after the due date if unpaid |
| New expense / special charge / price change | All residents of the building | In app, and SMS for special charges and price changes |
| Question answered | Resident who asked | In app and SMS |
| New question / receipt-number gap | Manager (and representative for gaps) | In app |

## 10. Audit log

- Every action by a manager or co-manager is logged: who did it, what they did, when, and the old and new values. This includes recording payments, reversals, expenses, price changes, exemptions, special charges and handovers.
- The log can't be changed.
- The manager and the building representative can see the full log. Residents see the parts that affect them: their own payments, and all expenses and corrections.

## 11. Privacy and data

- Residents see **only their own apartment's** payments.
- Residents **never** see another resident's name, apartment, payments or debts. Building figures are totals only.
- The representative sees totals and the audit log, but not other residents' payments.
- A manager sees only the buildings they manage.
- Only the data that's needed is collected: name, phone, apartment, and optionally email. **Card details are never stored by the app.** The payment provider handles them.
- The app follows the local personal-data protection law (GDPR-aligned).
- Payment and expense records are kept for **5 years**, or longer if accounting law requires it.
- When a resident leaves, they can ask for their personal data to be deleted. Their payment records are then anonymised ("Apartment 5, former resident") and not removed.

## 12. Reports

- Monthly one-page summary as a PDF, for the notice board and building meetings (see 7.4).
- Manager: export of payments and expenses for any period as CSV and PDF.

## 13. Running costs

- The app costs a small **monthly fee per building**. That fee, plus SMS and card fees, is paid from the **administration fund**.
- Each of these costs is recorded as a normal expense, so residents see them too.

## 14. Screens (minimum)

**Resident**
- Log in (phone + SMS code)
- My apartment: name, apartment, building, members
- My payments: months paid and unpaid, with receipts
- Pay (card, in the app)
- Building: total and per-fund balance, expenses with invoices, monthly collection rate, prices
- My questions / report a problem

**Manager**
- Log in
- Building list (several buildings)
- Building setup: apartments, floors, unit types, services, prices per floor, due day, currency, bank account
- Residents: invite, set the payer, remove (move out)
- Record a cash payment (with receipt number)
- Record an expense (with invoice)
- Record a cash deposit to the bank
- Reversals
- Special charges
- Payment status for each apartment and month
- Questions inbox
- Reports and exports
- Audit log

**Building representative**
- Balances, expenses and collection rate
- Audit log and receipt-number check
- Approve the opening balance and special charges

## 15. Out of scope (version 1)

- Installable mobile apps
- Paying by bank transfer (card and cash only)
- Partial payments
- Late fees
- Discounts for paying in advance
- Residents seeing other residents' data

## 16. Decisions log

The customer chose items 1–2. Items 3–35 were decided by Claude when the customer asked it to, one for each gap found in step 4.

| # | Gap | Decision | Section |
|---|---|---|---|
| — | Transparency (customer) | Residents see the balance and every expense | 7.3 |
| — | Card payments (customer) | Integrated, inside the app | 6.2 |
| 1 | No way to raise disputes | "Report a problem" and expense questions, 7-day answer time | 8 |
| 2 | Nobody checks the manager | Invoice required, nothing can be deleted, audit log, SMS for cash, numbered receipts, representative role | 3, 6.3, 7.1, 10 |
| 3 | Where card money goes | Separate building bank account. Fees paid by the administration fund | 6.2 |
| 4 | No login or contact details | Phone + SMS code. Phone added to the account | 4 |
| 5 | One pool for different services | A separate fund for each service | 5.1 |
| 6 | Who creates accounts | Manager invites by SMS | 4.1 |
| 7 | Several people per apartment | One payer plus up to 3 members | 3, 4.1 |
| 8 | Moving out | History and debt stay with the apartment | 4.2 |
| 9 | Manager creation and handover | Platform admin creates managers. Co-manager and handover allowed | 3, 4.3 |
| 10 | Language | Albanian by default, English optional | 4 |
| 11 | Price changes | Future months only, 1 month notice, history visible | 5.3 |
| 12 | Discount for paying in advance | None in version 1 | 5.2 |
| 13 | Empty or commercial units | Empty units pay. Commercial units have their own prices. Exemptions logged | 5.2 |
| 14 | Big one-off costs | Special charge, approved by the representative | 5.4 |
| 15 | Currency | Per building, EUR by default | 5.2 |
| 16 | Past months / order | Oldest first. Can't pay ahead while in debt | 6.4 |
| 17 | Due date, late fees | Due on the 15th. No late fees, only reminders | 6.1, 9 |
| 18 | "A whole year" | The next 12 months from the first unpaid month | 6.4 |
| 19 | Partial payments | Not allowed in version 1 | 6.4 |
| 20 | Corrections and refunds | Reversals with a reason. Never edit or delete | 6.5 |
| 21 | Paying twice | Only unpaid months can be chosen. A double charge is refunded automatically | 6.4 |
| 22 | Receipts | PDF receipt for every payment. The cash receipt number is shown | 6.7 |
| 23 | Paying in advance with cash | Same rules as card | 6.4 |
| 24 | Bank transfer | Left out of version 1 on purpose | 15 |
| 25 | Proof for expenses | Invoice photo or PDF required | 7.1 |
| 26 | Editing expenses | Not allowed. Reversal entries only | 7.1 |
| 27 | Opening balance | Counted on day one, confirmed by the representative | 7.2 |
| 28 | Collection rate | Shown as a count and %, without names | 7.3 |
| 29 | Residents not using the link | Monthly printout on the notice board | 7.4 |
| 30 | Notifications | SMS plus in-app, see the table | 9 |
| 31 | Reports | Monthly PDF, plus CSV and PDF export | 12 |
| 32 | 5.2 and 5.5 disagreed about `Failed` | Failed attempts are only in the technical log. Statuses are Confirmed and Reversed | 6.2, 6.6 |
| 33 | "Unpaid" not defined | Past the due date and not fully paid | 6.1 |
| 34 | Data protection | Minimum data, no card storage, 5-year retention, anonymise on request | 11 |
| 35 | Running costs | Paid from the administration fund as visible expenses | 13 |
