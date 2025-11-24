-- Add font customization fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS custom_font_url text,
ADD COLUMN IF NOT EXISTS custom_font_name text;

COMMENT ON COLUMN organizations.font_family IS 'Selected font family (Google Font name or "custom")';
COMMENT ON COLUMN organizations.custom_font_url IS 'URL to custom font file (for enterprise plans)';
COMMENT ON COLUMN organizations.custom_font_name IS 'Display name for custom font';
