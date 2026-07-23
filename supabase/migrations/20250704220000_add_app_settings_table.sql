
-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create RLS policies
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for admin access
CREATE POLICY "Admins can manage app settings" ON app_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default SMTP settings
INSERT INTO app_settings (key, value, description) VALUES
  ('smtp_enabled', 'false', 'Enable SMTP email sending'),
  ('smtp_host', '', 'SMTP server hostname'),
  ('smtp_port', '587', 'SMTP server port'),
  ('smtp_username', '', 'SMTP username'),
  ('smtp_password', '', 'SMTP password'),
  ('smtp_security', 'tls', 'SMTP security type (ssl, tls, none)'),
  ('sender_name', 'AssureAI Support', 'Default sender name'),
  ('sender_email', '', 'Default sender email address'),
  ('company_logo', '', 'Company logo URL for PDF generation')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
