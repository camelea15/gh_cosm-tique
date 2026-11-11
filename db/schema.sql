-- Schéma de la base de données GH Cosmétique (PostgreSQL / Neon).
-- Déjà appliqué sur la base de production. Sert à documenter et à recréer une base locale.

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  name_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  price_retail INT NOT NULL CHECK (price_retail >= 0),
  price_wholesale INT NOT NULL CHECK (price_wholesale >= 0),
  image_url TEXT,
  stock INT CHECK (stock IS NULL OR stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products(category_id) WHERE is_active;

CREATE TABLE wilayas (
  code INT PRIMARY KEY CHECK (code BETWEEN 1 AND 58),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  fee_stopdesk INT NOT NULL CHECK (fee_stopdesk >= 0),
  fee_home INT NOT NULL CHECK (fee_home >= 0)
);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya_code INT NOT NULL REFERENCES wilayas(code),
  commune TEXT,
  address TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('stopdesk','domicile')),
  subtotal INT NOT NULL CHECK (subtotal >= 0),
  delivery_fee INT NOT NULL CHECK (delivery_fee >= 0),
  total INT NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (status IN ('a_verifier','en_attente','confirmee','livree','annulee')),
  has_wholesale BOOLEAN NOT NULL DEFAULT FALSE,
  suspicious_reason TEXT,
  customer_note TEXT,
  admin_note TEXT,
  ip_hash TEXT,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);
CREATE INDEX orders_phone_created_idx ON orders(phone, created_at DESC);
CREATE INDEX orders_ip_created_idx ON orders(ip_hash, created_at DESC);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('detail','gros')),
  unit_price INT NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  line_total INT NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX order_items_order_idx ON order_items(order_id);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX admin_sessions_expires_idx ON admin_sessions(expires_at);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  detail TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log(created_at DESC);

CREATE TABLE rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  bucket TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rate_limit_lookup_idx ON rate_limit_events(bucket, key_hash, created_at DESC);

CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
