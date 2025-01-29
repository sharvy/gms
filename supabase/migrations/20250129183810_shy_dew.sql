/*
  # Garage Management System Schema

  1. New Tables
    - `customers`
      - Basic customer information
    - `vehicles`
      - Vehicle details linked to customers
    - `services`
      - Available service types and prices
    - `jobs`
      - Service jobs/work orders
    - `mechanics`
      - Mechanic information
    - `parts_inventory`
      - Parts tracking
    - `job_parts`
      - Parts used in jobs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  vin text UNIQUE,
  license_plate text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price decimal(10,2) NOT NULL DEFAULT 0,
  estimated_hours decimal(4,2) NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mechanics table
CREATE TABLE mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  specialization text,
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id),
  service_id uuid REFERENCES services(id),
  mechanic_id uuid REFERENCES mechanics(id),
  status text NOT NULL DEFAULT 'pending',
  scheduled_date date,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  total_cost decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Parts Inventory table
CREATE TABLE parts_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  part_number text UNIQUE,
  description text,
  quantity integer NOT NULL DEFAULT 0,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  reorder_point integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job Parts junction table
CREATE TABLE job_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id),
  part_id uuid REFERENCES parts_inventory(id),
  quantity integer NOT NULL DEFAULT 1,
  price_at_time decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Full access to authenticated users" ON customers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON vehicles
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON services
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON mechanics
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON jobs
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON parts_inventory
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Full access to authenticated users" ON job_parts
  FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mechanics_updated_at
    BEFORE UPDATE ON mechanics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_inventory_updated_at
    BEFORE UPDATE ON parts_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();