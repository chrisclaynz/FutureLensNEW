import { supabaseConfig } from './config.js'

// Supabase Client Setup
const supabase = supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)

// Application State
const state = {
    currentView: 'login',
    participant: null,
    survey: null,
    responses: []
}

// View Management
function renderView() {
    const app = document.getElementById('app')
    app.innerHTML = ''
    
    switch (state.currentView) {
        case 'login':
            renderLoginView(app)
            break
        case 'welcome':
            renderWelcomeView(app)
            break
        case 'survey':
            renderSurveyView(app)
            break
        case 'results':
            renderResultsView(app)
            break
        default:
            renderLoginView(app)
    }
}

// Initial Render
renderView() 