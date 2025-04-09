-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Participants can view their own data" ON participants;
DROP POLICY IF EXISTS "Participants can update their own data" ON participants;
DROP POLICY IF EXISTS "Participants can view their own responses" ON responses;
DROP POLICY IF EXISTS "Participants can insert their own responses" ON responses;
DROP POLICY IF EXISTS "Participants can update their own responses" ON responses;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    json_config JSONB NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passcode TEXT UNIQUE NOT NULL,
    cohort_id UUID REFERENCES cohorts(id),
    survey_id UUID REFERENCES surveys(id),
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id),
    question_key TEXT NOT NULL,
    likert_value INTEGER NOT NULL,
    dont_understand BOOLEAN DEFAULT FALSE,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create policies for participants
CREATE POLICY "Participants can view their own data"
    ON participants
    FOR SELECT
    USING (passcode = current_setting('app.current_passcode', true));

CREATE POLICY "Participants can update their own data"
    ON participants
    FOR UPDATE
    USING (passcode = current_setting('app.current_passcode', true));

-- Create policies for responses
CREATE POLICY "Participants can view their own responses"
    ON responses
    FOR SELECT
    USING (participant_id IN (
        SELECT id FROM participants 
        WHERE passcode = current_setting('app.current_passcode', true)
    ));

CREATE POLICY "Participants can insert their own responses"
    ON responses
    FOR INSERT
    WITH CHECK (participant_id IN (
        SELECT id FROM participants 
        WHERE passcode = current_setting('app.current_passcode', true)
    ));

CREATE POLICY "Participants can update their own responses"
    ON responses
    FOR UPDATE
    USING (participant_id IN (
        SELECT id FROM participants 
        WHERE passcode = current_setting('app.current_passcode', true)
    )); 