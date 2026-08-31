CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_urls text[] NOT NULL DEFAULT '{}',
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly viewable"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending payment confirmation',
  buyer_name text,
  buyer_contact text,
  payment_method text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;