/*
  # Arduino Remote Control System - Initial Schema

  1. New Tables
    
    ## `devices`
    Stores all Arduino devices/peripherals
    - `id` (uuid, primary key) - Unique device identifier
    - `name` (text) - Device name (e.g., "LED Sala")
    - `pin` (integer) - Arduino pin number
    - `type` (text) - Device type (output, sensor, servo, etc.)
    - `ref_id` (text, unique) - Unique reference ID for commands
    - `status` (boolean) - Current state (on/off)
    - `description` (text) - Optional description
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `user_id` (uuid) - Owner/creator of the device
    
    ## `commands`
    Stores available commands for devices
    - `id` (uuid, primary key) - Unique command identifier
    - `ref_id` (text, unique) - Unique reference ID (e.g., CMD_ON_01)
    - `label` (text) - Human-readable label (e.g., "Ligar LED")
    - `device_id` (uuid) - Foreign key to devices
    - `action` (text) - Action to execute (HIGH, LOW, ANALOG, etc.)
    - `value` (integer) - Optional numeric value for analog commands
    - `created_at` (timestamptz) - Creation timestamp
    
    ## `logs`
    Stores execution history
    - `id` (uuid, primary key) - Unique log identifier
    - `user_id` (uuid) - User who executed the command
    - `command_id` (uuid) - Command that was executed
    - `device_id` (uuid) - Device that was controlled
    - `success` (boolean) - Whether execution was successful
    - `error_message` (text) - Error details if failed
    - `timestamp` (timestamptz) - Execution timestamp
    
  2. Security
    - Enable RLS on all tables
    - Users can read their own devices
    - Users can create/update/delete their own devices
    - Users can execute commands on their own devices
    - Users can read their own logs
    - All commands are logged automatically
    
  3. Important Notes
    - Ref IDs must be unique across the system
    - Device status is updated automatically after command execution
    - All timestamps use UTC timezone
    - Cascading deletes ensure referential integrity
*/

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pin integer NOT NULL CHECK (pin >= 0 AND pin <= 255),
  type text NOT NULL DEFAULT 'output',
  ref_id text UNIQUE NOT NULL,
  status boolean DEFAULT false,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create commands table
CREATE TABLE IF NOT EXISTS commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id text UNIQUE NOT NULL,
  label text NOT NULL,
  device_id uuid REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  value integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  command_id uuid REFERENCES commands(id) ON DELETE SET NULL,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  success boolean DEFAULT true,
  error_message text DEFAULT '',
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_ref_id ON devices(ref_id);
CREATE INDEX IF NOT EXISTS idx_commands_device_id ON commands(device_id);
CREATE INDEX IF NOT EXISTS idx_commands_ref_id ON commands(ref_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for devices updated_at
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for devices
CREATE POLICY "Users can view own devices"
  ON devices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own devices"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
  ON devices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
  ON devices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for commands
CREATE POLICY "Users can view commands for own devices"
  ON commands FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create commands for own devices"
  ON commands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update commands for own devices"
  ON commands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete commands for own devices"
  ON commands FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM devices
      WHERE devices.id = commands.device_id
      AND devices.user_id = auth.uid()
    )
  );

-- RLS Policies for logs
CREATE POLICY "Users can view own logs"
  ON logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs"
  ON logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);