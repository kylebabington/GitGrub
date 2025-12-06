/*
  # Add Kitchen Equipment System

  1. New Tables
    - `kitchen_equipment` - Master list of kitchen equipment
      - `id` (uuid, primary key)
      - `name` (text, unique) - Equipment name (e.g., "Stand Mixer")
      - `category` (text) - appliances, cookware, bakeware, tools, utensils
      - `description` (text) - Optional details
      - `image_url` (text) - Optional equipment image
      - `is_common` (boolean) - Common items most kitchens have
      - `created_at` (timestamptz)

    - `recipe_equipment` - Junction table linking recipes to equipment
      - `recipe_id` (uuid, references recipes)
      - `equipment_id` (uuid, references kitchen_equipment)
      - `is_required` (boolean) - Required vs optional equipment
      - `notes` (text) - Alternatives or specifications
      - `created_at` (timestamptz)
      - Primary key on (recipe_id, equipment_id)

  2. Security
    - Enable RLS on both tables
    - Anyone can view equipment
    - Authenticated users can add equipment
    - Recipe owners can manage their recipe's equipment

  3. Indexes
    - Index on equipment category for filtering
    - Index on recipe_equipment for lookups

  4. Pre-loaded Data
    - Common appliances (60+ items)
    - Essential cookware
    - Baking equipment
    - Basic tools and utensils

  5. Notes
    - Equipment can be shared across recipes
    - Track required vs optional equipment
    - Support for equipment alternatives in notes
*/

CREATE TABLE IF NOT EXISTS kitchen_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  image_url text,
  is_common boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_equipment (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  equipment_id uuid REFERENCES kitchen_equipment(id) ON DELETE CASCADE NOT NULL,
  is_required boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (recipe_id, equipment_id)
);

ALTER TABLE kitchen_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment"
  ON kitchen_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create equipment"
  ON kitchen_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view recipe equipment"
  ON recipe_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recipe owners can add equipment to recipes"
  ON recipe_equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_equipment.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipe owners can update recipe equipment"
  ON recipe_equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_equipment.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipe owners can remove equipment from recipes"
  ON recipe_equipment FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_equipment.recipe_id
      AND recipes.created_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_equipment_category ON kitchen_equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON kitchen_equipment(name);
CREATE INDEX IF NOT EXISTS idx_recipe_equipment_recipe ON recipe_equipment(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_equipment_equipment ON recipe_equipment(equipment_id);

INSERT INTO kitchen_equipment (name, category, description, is_common) VALUES
  ('Stand Mixer', 'appliances', 'Electric stand mixer for baking and mixing', false),
  ('Food Processor', 'appliances', 'Multi-purpose food processing appliance', false),
  ('Blender', 'appliances', 'Electric blender for smoothies and purees', true),
  ('Immersion Blender', 'appliances', 'Hand-held blending tool', false),
  ('Slow Cooker', 'appliances', 'Electric slow cooker or crock pot', false),
  ('Instant Pot', 'appliances', 'Electric pressure cooker', false),
  ('Air Fryer', 'appliances', 'Hot air circulation fryer', false),
  ('Rice Cooker', 'appliances', 'Electric rice cooker', false),
  ('Electric Mixer', 'appliances', 'Hand-held electric mixer', false),
  ('Toaster Oven', 'appliances', 'Countertop toaster oven', false),
  ('Microwave', 'appliances', 'Microwave oven', true),
  ('Coffee Maker', 'appliances', 'Electric coffee maker', true),
  ('Electric Kettle', 'appliances', 'Electric water kettle', false),
  ('Waffle Maker', 'appliances', 'Electric waffle iron', false),
  ('Cast Iron Skillet', 'cookware', '10-12 inch cast iron pan', false),
  ('Non-Stick Pan', 'cookware', '10-12 inch non-stick frying pan', true),
  ('Stainless Steel Pan', 'cookware', '10-12 inch stainless steel skillet', false),
  ('Dutch Oven', 'cookware', '5-7 quart enameled cast iron pot', false),
  ('Stock Pot', 'cookware', 'Large 8-12 quart pot', false),
  ('Saucepan', 'cookware', '2-3 quart saucepan with lid', true),
  ('Wok', 'cookware', '14 inch wok or stir-fry pan', false),
  ('Griddle', 'cookware', 'Large flat griddle or plancha', false),
  ('Grill Pan', 'cookware', 'Ridged grill pan', false),
  ('Saute Pan', 'cookware', '3-4 quart saute pan with lid', false),
  ('Roasting Pan', 'cookware', 'Large roasting pan with rack', false),
  ('9x13 Baking Dish', 'bakeware', 'Rectangular baking dish', true),
  ('Sheet Pan', 'bakeware', 'Half sheet baking pan (13x18)', true),
  ('Muffin Tin', 'bakeware', '12-cup muffin pan', false),
  ('Cake Pan', 'bakeware', '9-inch round cake pan', false),
  ('Loaf Pan', 'bakeware', '9x5 inch loaf pan', false),
  ('Pie Dish', 'bakeware', '9-inch pie plate', false),
  ('Springform Pan', 'bakeware', '9-inch springform pan', false),
  ('Cooling Rack', 'bakeware', 'Wire cooling rack', false),
  ('Pizza Stone', 'bakeware', 'Baking stone for pizza and bread', false),
  ('Bundt Pan', 'bakeware', '10-12 cup bundt pan', false),
  ('Chef Knife', 'tools', '8-10 inch chef knife', true),
  ('Paring Knife', 'tools', '3-4 inch paring knife', true),
  ('Serrated Knife', 'tools', 'Bread knife', false),
  ('Cutting Board', 'tools', 'Large cutting board', true),
  ('Mixing Bowls', 'tools', 'Set of mixing bowls', true),
  ('Measuring Cups', 'tools', 'Dry measuring cup set', true),
  ('Measuring Spoons', 'tools', 'Measuring spoon set', true),
  ('Liquid Measuring Cup', 'tools', '2-4 cup glass measuring cup', true),
  ('Kitchen Scale', 'tools', 'Digital kitchen scale', false),
  ('Thermometer', 'tools', 'Instant-read meat thermometer', false),
  ('Vegetable Peeler', 'tools', 'Y-peeler or swivel peeler', true),
  ('Box Grater', 'tools', '4-sided box grater', true),
  ('Microplane', 'tools', 'Fine grater for zest and garlic', false),
  ('Can Opener', 'tools', 'Manual or electric can opener', true),
  ('Colander', 'tools', 'Large colander or strainer', true),
  ('Fine Mesh Strainer', 'tools', 'Fine mesh sieve', false),
  ('Salad Spinner', 'tools', 'Salad spinner for greens', false),
  ('Tongs', 'utensils', 'Kitchen tongs', true),
  ('Spatula', 'utensils', 'Flat turner or fish spatula', true),
  ('Rubber Spatula', 'utensils', 'Flexible silicone spatula', true),
  ('Wooden Spoon', 'utensils', 'Wooden cooking spoon', true),
  ('Slotted Spoon', 'utensils', 'Slotted serving spoon', true),
  ('Ladle', 'utensils', 'Soup ladle', true),
  ('Whisk', 'utensils', 'Wire whisk', true),
  ('Rolling Pin', 'utensils', 'Rolling pin for dough', false),
  ('Pastry Brush', 'utensils', 'Silicone basting brush', false),
  ('Kitchen Shears', 'utensils', 'Heavy duty kitchen scissors', true),
  ('Potato Masher', 'utensils', 'Potato masher', false),
  ('Meat Tenderizer', 'utensils', 'Meat mallet', false),
  ('Garlic Press', 'utensils', 'Garlic press', false),
  ('Mandoline', 'tools', 'Mandoline slicer', false),
  ('Food Mill', 'tools', 'Food mill for pureeing', false),
  ('Mortar and Pestle', 'tools', 'Stone mortar and pestle', false),
  ('Pasta Maker', 'appliances', 'Manual or electric pasta machine', false),
  ('Kitchen Torch', 'tools', 'Culinary torch for creme brulee', false)
ON CONFLICT (name) DO NOTHING;
