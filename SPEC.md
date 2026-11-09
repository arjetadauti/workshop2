# SPEC: Building Common-Expenses Tracker

## 1. Problem

In apartment buildings, common expenses (cleaning the stairs, lighting, repairing the elevator) are collected in cash, door to door. Nobody knows for sure who has paid, how much money is in the cash box, or what it was spent on. This leads to disputes between neighbours.

## 2. Goal

Replace door-to-door cash collection with one simple web link. Every payment is recorded and confirmed, so there is a clear record of who paid what and for which period.

## 3. Users

| Role | Who | What they need |
|---|---|---|
| **Manager** | The person who collects the money. One manager can run **several buildings**. | Set prices, confirm payments, record cash payments, see who has and hasn't paid. |
| **Resident** | Lives in an apartment in a building. | Register their own payments and see their own payment history. |

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

### 5.2 Paying by card (resident registers it)

1. The resident pays by card or bank transfer outside the app.
2. At the moment they pay, the resident registers the payment in the app: amount and period covered.
3. The payment shows as **Pending**.
4. The manager checks the bank account. If the money has arrived, the manager marks it **Confirmed**. If not, the manager marks it **Rejected**.

> The app records payments. It does **not** process card payments itself.

### 5.3 Paying in cash (manager registers it)

1. The resident pays cash directly to the manager. There is no door-to-door collection.
2. The manager gives the resident an **authorized, stamped receipt**.
3. The manager records the payment in the app. It is **Confirmed** right away and shows the receipt number.

### 5.4 Paying in advance

A resident can pay for **1 month, 3 months, or a whole year** at once. The payment is applied to those months, and each one shows as paid.

### 5.5 Payment statuses

`Pending` → `Confirmed` or `Rejected`. Only the manager can confirm or reject.

## 6. Privacy

- A resident sees **only their own** payments and balance.
- A resident can **never** see another resident's name, apartment, payments or debts.
- Only the manager sees all apartments in their buildings.
- A manager sees only the buildings they manage.

## 7. Screens (minimum)

**Resident**
- Log in
- My account: name, apartment, building
- My payments: the months paid, pending and unpaid
- Register a payment (card)

**Manager**
- Log in
- Building list (several buildings)
- Building setup: apartments, floors, services, price for each floor
- Pending payments to confirm or reject
- Record a cash payment and its receipt number
- Payment status for each apartment and month

## 8. Out of scope (for now)

- Processing card or bank payments inside the app
- Installable mobile apps
- Residents seeing other residents' data

## 9. Open questions

These were not decided on paper and are left open on purpose (step 4 will look for the rest):

- **Expenses and transparency:** Residents asked for transparency about *where the money goes*. Can residents see the building's total balance and what it was spent on (expenses, receipts), or only their own payments?
- **Card flow:** Does "pays by card" always happen outside the app, as assumed in 5.2?
