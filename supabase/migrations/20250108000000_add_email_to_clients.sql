-- Add email column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Add comment
COMMENT ON COLUMN clients.email IS 'Email address for client authentication';

