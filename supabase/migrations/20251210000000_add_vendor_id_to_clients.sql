-- Add vendor_id column to clients table to link with WhaleTools vendor backend
-- This allows COAs to be uploaded directly to the correct vendor's storage

-- Add the column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS vendor_id UUID;

-- Add comment explaining the column
COMMENT ON COLUMN clients.vendor_id IS 'Links to the vendor ID in the WhaleTools vendor backend (uaednwpxursknmwdeejn)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_vendor_id ON clients(vendor_id);

-- Update existing clients with their vendor IDs
-- Flora Distribution Group LLC
UPDATE clients SET vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf' WHERE id = '8c835b7b-9816-45f1-a376-a53b76633d77';

-- Zarati
UPDATE clients SET vendor_id = '6f6ee18e-7cfe-4617-9372-60d16e3ce553' WHERE id = 'e905482a-5621-4a2e-bcdd-df466fa5e0cf';

-- Zooskies
UPDATE clients SET vendor_id = '2728f5c4-9eb3-4c46-b21b-fc021e5e719e' WHERE id = 'cc507ddc-d92f-47af-8265-082ded19e6f1';

-- Moonwater
UPDATE clients SET vendor_id = '8a53da13-6d91-4105-aa51-6ed68f6b2a77' WHERE id = 'cfa15975-b997-4906-994c-dba6ee53bbdd';

-- Connoisseur Boyz
UPDATE clients SET vendor_id = 'e7b61661-b25a-4152-b83a-030cea9c6c2f' WHERE id = 'bb057cb7-8e74-41ef-95a7-017cf75d3dce';

-- DMV WHALE
UPDATE clients SET vendor_id = '64b4c34e-0dad-449a-91a8-e2e3e8f0f36e' WHERE id = '3339917b-4fc0-4878-a0bb-240b5fd9f31c';

-- Davidson Hemp Co
UPDATE clients SET vendor_id = 'a701dd64-db99-4270-8c02-42cd273c62c4' WHERE id = '6c382b39-7a18-4e17-b9c4-72277786562b';

-- Sampsons Distro LLC
UPDATE clients SET vendor_id = 'ed72bc80-0d83-4067-a733-15998daa8976' WHERE id = '85c4abd6-63be-4e55-8677-25992943a017';

-- CannaBoyz (using existing CannaBoyz vendor ID)
UPDATE clients SET vendor_id = '17de99c6-4323-41a9-aca8-5f5bbf1f3562' WHERE id = 'c11769e2-ac7f-4f13-8da6-89b6345b0183';
