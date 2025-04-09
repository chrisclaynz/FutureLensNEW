import { supabaseConfig } from './config.js'
import { handleLogin, isAuthenticated, supabase } from './auth.js'

// Application State
const state = {
    currentView: 'login', // Always start with login view
    participant: null,
    survey: null,
    responses: []
}

// View Management
function renderView() {
    console.log('Rendering view:', state.currentView)
    const app = document.getElementById('app')
    if (!app) {
        console.error('App container not found')
        return
    }
    
    app.innerHTML = ''
    
    // Check authentication state
    if (!isAuthenticated() && state.currentView !== 'login') {
        console.log('Not authenticated, redirecting to login')
        state.currentView = 'login'
        state.participant = null
    }
    
    switch (state.currentView) {
        case 'login':
            console.log('Rendering login view')
            renderLoginView(app)
            break
        case 'welcome':
            console.log('Rendering welcome view')
            renderWelcomeView(app)
            break
        case 'survey':
            console.log('Rendering survey view')
            renderSurveyView(app)
            break
        case 'results':
            console.log('Rendering results view')
            renderResultsView(app)
            break
        default:
            console.log('Rendering default (login) view')
            renderLoginView(app)
    }
}

function renderLoginView(app) {
    console.log('Rendering login view')
    app.innerHTML = `
        <div class="login-container">
            <h2>Welcome to FutureLens</h2>
            <div class="login-options">
                <button class="login-option-btn" id="anonymous-btn">Anonymous Survey</button>
                <button class="login-option-btn" id="identifiable-btn">Identifiable Survey</button>
            </div>
            <div id="code-input-container" style="display: none;">
                <form id="login-form">
                    <div class="input-container">
                        <label id="code-label">Enter Your Code</label>
                        <input type="text" id="code-input" placeholder="Enter your code" required>
                    </div>
                    <button type="submit" class="btn">Start Survey</button>
                </form>
            </div>
        </div>
    `

    // Add event listeners for mode selection
    document.getElementById('anonymous-btn').addEventListener('click', () => {
        const container = document.getElementById('code-input-container')
        const label = document.getElementById('code-label')
        const input = document.getElementById('code-input')
        
        container.style.display = 'block'
        label.textContent = 'Enter Survey Code'
        input.placeholder = 'Enter your survey code'
        input.dataset.mode = 'anonymous'
        
        // Hide the buttons after selection
        document.querySelector('.login-options').style.display = 'none'
    })

    document.getElementById('identifiable-btn').addEventListener('click', () => {
        const container = document.getElementById('code-input-container')
        const label = document.getElementById('code-label')
        const input = document.getElementById('code-input')
        
        container.style.display = 'block'
        label.textContent = 'Enter Passcode'
        input.placeholder = 'Enter your passcode'
        input.dataset.mode = 'identifiable'
        
        // Hide the buttons after selection
        document.querySelector('.login-options').style.display = 'none'
    })

    // Handle form submission
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault()
        const code = document.getElementById('code-input').value
        const isAnonymous = document.getElementById('code-input').dataset.mode === 'anonymous'
        
        const result = await handleLogin(code, isAnonymous)
        if (result.success) {
            state.participant = result.data
            state.currentView = 'welcome'
            renderView()
        } else {
            alert(result.error)
        }
    })
}

function renderWelcomeView(app) {
    app.innerHTML = `
        <div class="container welcome-screen">
            <h1>Welcome to FutureLens</h1>
            <p>Thank you for participating in this survey.</p>
            <button id="start-survey" class="btn">Begin Survey</button>
        </div>
    `

    document.getElementById('start-survey').addEventListener('click', () => {
        state.currentView = 'survey'
        renderView()
    })
}

function renderSurveyView(app) {
    app.innerHTML = `
        <div class="container">
            <h1>Survey</h1>
            <p>Survey content will go here</p>
        </div>
    `
}

function renderResultsView(app) {
    app.innerHTML = `
        <div class="container">
            <h1>Results</h1>
            <p>Results will go here</p>
        </div>
    `
}

// Initialize the application
async function initializeApp() {
    console.log('Initializing app...')
    try {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            console.log('Waiting for DOM to load...')
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve))
        }
        
        console.log('DOM loaded, checking authentication...')
        
        // Always start with login view
        state.currentView = 'login'
        state.participant = null
        
        // Only set to welcome if properly authenticated
        if (isAuthenticated()) {
            console.log('User is authenticated')
            try {
                const participant = JSON.parse(localStorage.getItem('participant'))
                if (participant && participant.id) {
                    console.log('Found valid participant data')
                    state.participant = participant
                    state.currentView = 'welcome'
                }
            } catch (e) {
                console.error('Error parsing participant data:', e)
                // Stay on login view if there's an error
                state.currentView = 'login'
            }
        } else {
            console.log('User is not authenticated')
            // Ensure we're on login view
            state.currentView = 'login'
        }
        
        console.log('Rendering initial view:', state.currentView)
        renderView()
    } catch (error) {
        console.error('Failed to initialize app:', error)
        // Show error message to user
        const app = document.getElementById('app')
        if (app) {
            app.innerHTML = `
                <div class="error-container">
                    <h1>Error</h1>
                    <p>Failed to initialize the application. Please refresh the page.</p>
                </div>
            `
        }
    }
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp)
} else {
    initializeApp()
} 