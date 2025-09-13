-- Create enums for drink products
DO $$ BEGIN
  CREATE TYPE public.drink_measure_type AS ENUM (
    'L','mL','cL','gal','qt','pt','fl.oz','bsp','unit','g','kg','lbs','oz'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.drink_unit_type AS ENUM (
    'bottle','can','keg','bag','box','can(food)','carton','container','package','other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Products table
CREATE TABLE IF NOT EXISTS public.drink_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand_name text,
  category text,
  subcategory text,
  vendor text,
  sku text,
  unit_size numeric(12,4) CHECK (unit_size >= 0),
  measure_type public.drink_measure_type NOT NULL,
  unit_type public.drink_unit_type NOT NULL,
  price numeric(14,4) CHECK (price >= 0),
  case_size integer CHECK (case_size > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, sku)
);

-- Reporting table (1:1 with product)
CREATE TABLE IF NOT EXISTS public.drink_product_reporting (
  product_id uuid PRIMARY KEY REFERENCES public.drink_products(id) ON DELETE CASCADE,
  reporting_unit public.drink_measure_type NOT NULL,
  cost numeric(14,4) CHECK (cost >= 0),
  par numeric(14,4) CHECK (par >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_drink_products
  BEFORE UPDATE ON public.drink_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_timestamp_drink_product_reporting
  BEFORE UPDATE ON public.drink_product_reporting
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_drink_products_business ON public.drink_products(business_id);
CREATE INDEX IF NOT EXISTS idx_drink_products_category ON public.drink_products(business_id, category);
CREATE INDEX IF NOT EXISTS idx_drink_products_subcategory ON public.drink_products(business_id, subcategory);
CREATE INDEX IF NOT EXISTS idx_drink_products_vendor ON public.drink_products(business_id, vendor);
CREATE INDEX IF NOT EXISTS idx_drink_products_sku ON public.drink_products(business_id, sku);
CREATE INDEX IF NOT EXISTS idx_drink_products_name_trgm ON public.drink_products USING gin (name gin_trgm_ops);

-- RLS
ALTER TABLE public.drink_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_product_reporting ENABLE ROW LEVEL SECURITY;

-- Policy: allow users to access rows tied to their businesses
-- Assumes a mapping table public.user_business_roles(user_id uuid, business_id uuid)
DO $$ BEGIN
  CREATE POLICY drink_products_select ON public.drink_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_business_roles ubr
      WHERE ubr.user_id = auth.uid() AND ubr.business_id = drink_products.business_id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY drink_products_modify ON public.drink_products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_business_roles ubr
      WHERE ubr.user_id = auth.uid() AND ubr.business_id = business_id
    )
  )
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_business_roles ubr
      WHERE ubr.user_id = auth.uid() AND ubr.business_id = business_id
    )
  )
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_business_roles ubr
      WHERE ubr.user_id = auth.uid() AND ubr.business_id = business_id
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY drink_product_reporting_all ON public.drink_product_reporting
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.drink_products p
      JOIN public.user_business_roles ubr ON ubr.business_id = p.business_id
      WHERE p.id = drink_product_reporting.product_id AND ubr.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drink_products p
      JOIN public.user_business_roles ubr ON ubr.business_id = p.business_id
      WHERE p.id = drink_product_reporting.product_id AND ubr.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


