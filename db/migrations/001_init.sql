-- 001_init.sql: first schema for the building common-expenses tracker.
-- Rules (see CLAUDE.md):
--   * money is integer cents (bigint), never decimals
--   * payments, payment_months and expenses are never updated or deleted
--   * a corrected row is a new row that points to the original (reverses_id)

-- Blocks UPDATE and DELETE on money tables. TRUNCATE (used only by tests) is not affected.
CREATE FUNCTION forbid_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'rows in % can not be changed or deleted; record a reversal instead', TG_TABLE_NAME;
END
$$;

-- Managers. Created by the platform admin (for now: scripts/seed.ts).
CREATE TABLE managers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  phone       text NOT NULL UNIQUE,                  -- E.164, e.g. +38344123456
  language    text NOT NULL DEFAULT 'sq' CHECK (language IN ('sq', 'mk', 'en')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE buildings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id   uuid NOT NULL REFERENCES managers (id),
  name         text NOT NULL,
  country      text NOT NULL CHECK (country IN ('XK', 'MK', 'AL')),
  currency     text NOT NULL CHECK (currency IN ('EUR', 'MKD', 'ALL')),
  due_day      smallint NOT NULL DEFAULT 15 CHECK (due_day BETWEEN 1 AND 28),
  start_month  date NOT NULL CHECK (EXTRACT(DAY FROM start_month) = 1),  -- first month residents owe
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE apartments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id  uuid NOT NULL REFERENCES buildings (id),
  number       text NOT NULL,
  floor        smallint NOT NULL CHECK (floor >= 0),  -- 0 = ground floor
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, number),
  UNIQUE (id, building_id)                            -- target for composite FKs below
);

CREATE TABLE residents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid NOT NULL REFERENCES apartments (id),
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  phone         text NOT NULL,                        -- E.164
  language      text NOT NULL DEFAULT 'sq' CHECK (language IN ('sq', 'mk', 'en')),
  is_payer      boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  removed_at    timestamptz                           -- set when they move out; row is kept
);
-- A phone number belongs to at most one active resident (it is their login).
CREATE UNIQUE INDEX residents_active_phone ON residents (phone) WHERE removed_at IS NULL;

CREATE TABLE services (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id  uuid NOT NULL REFERENCES buildings (id),
  name         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, name),
  UNIQUE (id, building_id)
);

-- Monthly price of one service for one floor, from valid_from on.
-- A price change is a new row with a later valid_from; old rows are kept.
CREATE TABLE prices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid NOT NULL REFERENCES services (id),
  floor         smallint NOT NULL CHECK (floor >= 0),
  amount_cents  bigint NOT NULL CHECK (amount_cents >= 0),  -- 0 = this floor does not pay
  valid_from    date NOT NULL CHECK (EXTRACT(DAY FROM valid_from) = 1),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, floor, valid_from)
);

CREATE TABLE payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid NOT NULL,
  building_id   uuid NOT NULL,
  method        text NOT NULL CHECK (method IN ('cash', 'card')),
  amount_cents  bigint NOT NULL CHECK (amount_cents >= 0),
  receipt_no    text,                                 -- paper receipt number for cash
  paid_at       timestamptz NOT NULL DEFAULT now(),
  recorded_by   uuid REFERENCES managers (id),        -- null for card payments
  reverses_id   uuid REFERENCES payments (id),        -- set only on a reversal row (Should feature)
  reason        text,                                 -- required on a reversal row
  created_at    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (apartment_id, building_id) REFERENCES apartments (id, building_id),
  UNIQUE (building_id, receipt_no),                   -- a receipt number is used once per building
  UNIQUE (id, apartment_id),
  CHECK (method <> 'cash' OR reverses_id IS NOT NULL OR receipt_no IS NOT NULL),
  CHECK (reverses_id IS NULL OR reason IS NOT NULL)
);
CREATE TRIGGER payments_no_change BEFORE UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- Which months a payment covers. UNIQUE (apartment_id, month) makes paying a month twice impossible.
-- Note: reversals (Should) will need a follow-up migration so a reversed month can be paid again.
CREATE TABLE payment_months (
  payment_id    uuid NOT NULL,
  apartment_id  uuid NOT NULL,
  month         date NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),
  amount_cents  bigint NOT NULL CHECK (amount_cents >= 0),
  PRIMARY KEY (payment_id, month),
  FOREIGN KEY (payment_id, apartment_id) REFERENCES payments (id, apartment_id),
  UNIQUE (apartment_id, month)
);
CREATE TRIGGER payment_months_no_change BEFORE UPDATE OR DELETE ON payment_months
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

CREATE TABLE expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id   uuid NOT NULL,
  service_id    uuid NOT NULL,
  description   text NOT NULL CHECK (length(trim(description)) > 0),
  amount_cents  bigint NOT NULL CHECK (amount_cents > 0),
  paid_on       date NOT NULL,
  invoice_path  text NOT NULL,                        -- invoice is required
  invoice_name  text NOT NULL,
  recorded_by   uuid NOT NULL REFERENCES managers (id),
  reverses_id   uuid REFERENCES expenses (id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (service_id, building_id) REFERENCES services (id, building_id)
);
CREATE INDEX expenses_building ON expenses (building_id, paid_on);
CREATE TRIGGER expenses_no_change BEFORE UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION forbid_change();

-- One-time SMS login codes. Only a hash of the code is stored.
CREATE TABLE login_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,
  code_hash   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  attempts    smallint NOT NULL DEFAULT 0,
  used_at     timestamptz
);
CREATE INDEX login_codes_phone ON login_codes (phone, created_at DESC);

-- Login sessions. Only a hash of the cookie token is stored.
CREATE TABLE sessions (
  token_hash  text PRIMARY KEY,
  user_kind   text NOT NULL CHECK (user_kind IN ('manager', 'resident')),
  user_id     uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
