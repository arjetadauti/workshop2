# SPEC: Building Common-Expenses Tracker

## 1. Problem

In apartment buildings, common expenses (cleaning the stairs, lighting, repairing the elevator) are collected in cash, door to door. Nobody knows for sure who has paid, how much money is in the cash box, or what it was spent on. This leads to disputes between neighbours.

## 2. Goal

Replace door-to-door cash collection with one simple web link. Every payment is recorded and confirmed, so there is a clear record of who paid what and for which period. Every expense is recorded too, so all residents can see the building's balance and what the money was spent on.

## 3. Users

| Role | Who | What they need |
|---|---|---|
| **Manager** | The person who collects the money. One manager can run **several buildings**. | Set prices, record cash payments, record expenses, see who has and hasn't paid. |
| **Resident** | Lives in an apartment in a building. | Pay in the app, see their own payment history, and see the building's balance and expenses. |

Elderly residents who can't use the link still pay in cash to the manager and get a stamped receipt (see 5.3). The manager records the payment for them.

## 4. Access

- A **simple web link** that works in a phone or computer browser. It is **not** an app to install.
- Each resident has a personal account with **first name, last name and apartment number**.
- Each account belongs to one apartment in one building.

## 5. Payments

### 5.1 Pricing

- Charges are **monthly**.
- There is a **separate price for each floor**, set per service. Example: the ground floor does not pay for the elevator.
- Services (for example cleaning, lighting, elevator) are set by the manager for each building.

### 5.2 Paying by card (integrated payment)

1. The resident chooses the period to pay (see 5.4) and the app shows the amount.
2. The card payment form opens **inside the app**. The resident pays without leaving it.
3. If the payment succeeds, it is recorded as **Confirmed** automatically.
4. If the payment fails, nothing is recorded as paid, and the resident sees an error and can try again.

### 5.3 Paying in cash (manager registers it)

1. The resident pays cash directly to the manager. There is no door-to-door collection.
2. The manager gives the resident an **authorized, stamped receipt**.
3. The manager records the payment in the app. It is **Confirmed** right away and shows the receipt number.

### 5.4 Paying in advance

A resident can pay for **1 month, 3 months, or a whole year** at once. The payment is applied to those months, and each one shows as paid.

### 5.5 Payment statuses

- A card payment is either `Confirmed` (it succeeded) or `Failed` (it was not recorded as paid).
- A cash payment is `Confirmed` when the manager records it with a receipt number.

## 5A. Expenses and building balance

### 5A.1 Recording expenses

- The manager records every expense for a building with:
  - **what** it was for (for example "Elevator repair" or "Stair cleaning, March")
  - the **amount**
  - the **date** it was paid
- Expenses are kept for each building separately.

### 5A.2 What every resident of the building can see

- **Total balance** of the building: all confirmed payments received minus all expenses.
- **List of all expenses**: what each was for, how much it cost and when it was paid.
- Totals only. Residents never see which apartment paid what (see 6).

## 6. Privacy

- A resident sees **only their own** payments.
- A resident can **never** see another resident's name, apartment, payments or debts.
- The building's total balance and its expense list are shared with all of the building's residents (5A.2). These show totals only, never anyone's personal data.
- Only the manager sees all apartments in their buildings.
- A manager sees only the buildings they manage.

## 7. Screens (minimum)

**Resident**
- Log in
- My account: name, apartment, building
- My payments: the months paid and unpaid
- Pay (card, in the app)
- Building balance and expense list

**Manager**
- Log in
- Building list (several buildings)
- Building setup: apartments, floors, services, price for each floor
- Record a cash payment and its receipt number
- Record an expense (what for, amount, date)
- Building balance and expense list
- Payment status for each apartment and month

## 8. Out of scope (for now)

- Installable mobile apps
- Residents seeing other residents' data

## 9. Decisions log

- **Transparency** (answered in red): residents see the building's total balance and every expense, with what it was for and when it was paid.
- **Card payments** (answered in red): integrated. The payment form opens inside the app, and the manager no longer checks the bank by hand.
