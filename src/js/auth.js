import { supabaseConfig } from './config.js';

export const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);

export async function handleLogin(code, isAnonymous) {
    // Clear any existing authentication state
    localStorage.removeItem('participant')
    
    try {
        if (isAnonymous) {
            console.log('Attempting anonymous login with code:', code)
            
            // For anonymous mode, check survey_codes table
            const { data: surveyData, error: surveyError } = await supabase
                .from('survey_codes')
                .select('survey_id, cohort_id')
                .eq('code', code)
                .single()

            if (surveyError) {
                console.error('Survey code lookup error:', surveyError)
                return { success: false, error: 'Invalid survey code' }
            }

            if (!surveyData) {
                console.log('No survey data found for code:', code)
                return { success: false, error: 'Invalid survey code' }
            }

            console.log('Found survey data:', surveyData)

            // Create anonymous participant
            const { data: participantData, error: participantError } = await supabase
                .from('participants')
                .insert({
                    survey_id: surveyData.survey_id,
                    cohort_id: surveyData.cohort_id,
                    is_anonymous: true,
                    anonymous_id: `anon_${Date.now()}`,
                    metadata: {}
                })
                .select('id, survey_id, cohort_id, is_anonymous, anonymous_id')
                .single()

            if (participantError) {
                console.error('Participant creation error:', participantError)
                return { success: false, error: 'Failed to create anonymous participant' }
            }

            console.log('Created participant:', participantData)

            const participantWithTimestamp = {
                ...participantData,
                timestamp: Date.now(),
                is_anonymous: true
            }

            localStorage.setItem('participant', JSON.stringify(participantWithTimestamp))
            return { success: true, data: participantWithTimestamp }
        } else {
            // For identifiable mode, check participants table
            const { data: participant, error: participantError } = await supabase
                .from('participants')
                .select('id, passcode, survey_id, cohort_id, role, is_anonymous')
                .eq('passcode', code)
                .single()

            if (participantError || !participant) {
                return { success: false, error: 'Invalid passcode' }
            }

            // Update last login time
            const { error: updateError } = await supabase
                .from('participants')
                .update({ last_login: new Date().toISOString() })
                .eq('id', participant.id)

            if (updateError) {
                console.error('Failed to update last login time:', updateError)
            }

            const participantWithTimestamp = {
                ...participant,
                timestamp: Date.now(),
                is_anonymous: false
            }

            localStorage.setItem('participant', JSON.stringify(participantWithTimestamp))
            return { success: true, data: participantWithTimestamp }
        }
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'An error occurred during login' }
    }
}

export function isAuthenticated() {
    try {
        const participantData = localStorage.getItem('participant')
        if (!participantData) {
            console.log('No participant data found')
            return false
        }

        const participant = JSON.parse(participantData)
        
        // Check if participant data is recent (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        if (!participant.timestamp || participant.timestamp < oneHourAgo) {
            console.log('Participant data is stale, clearing...')
            localStorage.removeItem('participant')
            return false
        }

        // For anonymous users, check required fields
        if (participant.is_anonymous) {
            if (!participant.anonymous_id || !participant.survey_id || !participant.cohort_id) {
                console.log('Invalid anonymous participant data structure, clearing...')
                localStorage.removeItem('participant')
                return false
            }
        } else {
            // For identifiable users, only check essential fields
            if (!participant.id || !participant.passcode) {
                console.log('Invalid identifiable participant data structure, clearing...')
                localStorage.removeItem('participant')
                return false
            }
        }

        return true
    } catch (e) {
        console.error('Error checking authentication:', e)
        localStorage.removeItem('participant')
        return false
    }
}

export function logout() {
    localStorage.removeItem('participant');
    // Redirect to login page
    window.location.href = '/';
} 