## **1\. Detailed Step-by-Step Blueprint**

### **1.1 Project Setup and Environment**

1. **Repository & Version Control**

   * Create a new repository (e.g. Git) to host the codebase.

   * Initialise the project structure for a single-page application (SPA) with Vanilla JavaScript, HTML, and CSS.

2. **Supabase Integration**

   * Sign up or log in to Supabase.

   * Create a new project for FutureLens.

   * Note the project’s API URL and public `anon` key, required for client-side authentication.

3. **Database Schema**

   * Within Supabase, create the following tables:

     * **participants**: holds `id`, `passcode` (unique), `cohort_id` (references `cohorts`), `survey_id`, and optional metadata.

     * **responses**: holds `id`, `participant_id`, `question_id` or `question_key`, `likert_value`, `dont_understand` (boolean), and timestamps.

     * **surveys**: holds `id`, `json_config` (storing questions, etc.).

     * **cohorts**: holds `id`, `code`, `label`.

   * In the MVP, store the passcodes in plain text but ensure they are unique.

4. **Row-Level Security (RLS)**

   * Enable RLS on the `participants` and `responses` tables.

   * Create policies ensuring that each user can only select/update/delete their own rows.

   * Set an admin role or policy for administrators to view or edit data.

5. **Frontend Project Structure**

   * Keep it minimal:

     * `index.html`: main entry point, includes references to JS modules.

     * `auth.js`: handles login, passcode checks, session handling.

     * `survey.js`: manages question loading, ordering, storing, and offline sync.

     * `results.js`: displays results and handles partial optional question logic.

     * `admin.js` (for future or post-MVP admin route).

   * Implement a basic router or condition-based view changes (since it’s a small project).

6. **Offline & LocalStorage Logic**

   * Use `localStorage` to store:

     * The current random order of survey questions.

     * Current unsaved or pending answers if offline.

   * When online, sync data with Supabase. If offline, keep saving to `localStorage` until a connection is available.

7. **User Flow and UI**

   * **Login Screen**: Accepts a “survey code” (for anonymous mode) or a “passcode” (for identifiable mode). Normalise case and query Supabase or local data to verify.

   * **Welcome Screen**: Brief instructions and a “Begin” button.

   * **Survey Screen**: One question at a time, 4-point Likert scale, and an “I Don’t Understand” checkbox.

   * **Completion**: Summarise results; if required questions are complete, show partial or full continuum scoring.

   * **Optional Questions**: Appear after required ones. Some new UI to save partial progress or skip.

   * **Results Screen**: Show continuum overviews, optionally compare with group (MVP can keep this minimal).

8. **Scoring Logic**

   * Use a straightforward sum and average approach:

     * Each question has a direction (positive or negative alignment) and a Likert value (+2, \+1, \-1, \-2).

     * Multiply by the question’s direction if needed, or store that factor in the question config so the raw responses can be combined directly.

     * Average by dividing the sum by the number of answered items.

9. **Session Timeout & Refresh**

   * Implement a 60-minute inactivity timer. If the user is active, refresh tokens with `supabase.auth.getSession()` or similar.

   * Expire and prompt for passcode re-entry if refresh fails or user is inactive.

10. **Testing Approach**

    * Adopt test-driven development (TDD) for each feature:

      * For the frontend, consider writing small test files using a basic framework such as Jest or similar (though you can also do simple manual tests if you prefer minimal tooling).

      * For Supabase, test database constraints, policies, and RLS rules in the Supabase dashboard or via small script tests.

---

## **2\. Breaking the Blueprint into Iterative Chunks**

Here’s a high-level breakdown of how we can iteratively implement the project:

1. **Iteration 1: Project and Supabase Setup**

   * Create the repository, initialise the project, and set up basic Supabase config.

2. **Iteration 2: Database Schema & RLS**

   * Define tables (`participants`, `responses`, `surveys`, `cohorts`).

   * Enable RLS and set basic policies.

3. **Iteration 3: Basic Auth & Passcode Verification**

   * Implement a minimal login form in `index.html`.

   * Verify passcodes or survey codes against Supabase.

   * Handle success/failure messages.

4. **Iteration 4: Survey Loading & Question Display**

   * Fetch survey questions from the `surveys` table.

   * Render the first question, handle random ordering, store it in `localStorage`.

5. **Iteration 5: Answer Submission & Offline Sync**

   * Implement the logic for capturing answers, storing them locally, and syncing to Supabase when online.

   * Include the “I Don’t Understand” checkbox.

6. **Iteration 6: Required vs. Optional Questions**

   * Extend the survey to mark certain questions as “required,” track completion, and unlock optional questions afterwards.

7. **Iteration 7: Results Page & Scoring**

   * Calculate per-continuum scores from the user’s answers.

   * Display a summary.

   * Provide minimal group comparison or placeholder.

8. **Iteration 8: Session Timeout & Refresh**

   * Implement the 60-minute inactivity logic.

   * Confirm that active users can continue without interruption.

9. **Iteration 9: Final Polishing & Testing**

   * Conduct manual and automated tests.

   * Ensure RLS and passcodes are working as intended.

   * Confirm no orphaned code or major usability gaps.

---

## **3\. Further Breaking Down Each Iteration**

### **Iteration 1: Project and Supabase Setup**

1. **Set up your repository**.

2. **Install dependencies** (if needed, e.g. Jest for tests).

3. **Create a basic `index.html`** that will load Vanilla JS.

4. **Create a `main.js`** (or `app.js`) that imports the Supabase client.

5. **Write initial tests** to confirm that your environment is set up. e.g. a test that ensures you can import your modules.

### **Iteration 2: Database Schema & RLS**

1. **Create `participants`, `responses`, `surveys`, `cohorts` tables** in Supabase.

2. **Add constraints** (e.g. unique constraint on `passcode`).

3. **Write test scripts** (or do manual queries) to confirm table creation.

4. **Enable RLS** on `participants` and `responses`.

5. **Add policies** so each user can only `select`/`update` where `user_id = auth.uid()`, or based on passcode logic.

### **Iteration 3: Basic Auth & Passcode Verification**

1. **Create a login form** in `index.html`.

2. **Write `auth.js`** with a function `handleLogin()` that:

   * Normalises passcode/survey code input.

   * Queries Supabase to validate it.

   * On success, stores session info (local or Supabase session).

   * On failure, displays error messages.

3. **Test** that correct passcodes work and incorrect ones fail.

### **Iteration 4: Survey Loading & Question Display**

1. **Create a function** `fetchSurvey(surveyId)` to get the questions from the `surveys` table.

2. **Randomise question order** (only required questions for now). Store that order in `localStorage`.

3. **Write a function** `displayQuestion(question)` to show the question text, Likert scale, and “I Don’t Understand” checkbox.

4. **Test** that the questions load from the DB, appear in random order, and display properly.

### **Iteration 5: Answer Submission & Offline Sync**

1. **Implement an event** for the “Next” button that:

   * Saves the user’s current answer (Likert \+ “I Don’t Understand”) locally.

   * If online, tries to sync to Supabase.

   * If offline, stores to `localStorage`.

2. **Implement a sync handler** that checks if local data is unsynced and pushes it to Supabase once the connection is back.

3. **Test** offline behaviour by disabling your network connection:

   * Confirm that answers remain in `localStorage`.

   * Confirm they upload properly when reconnected.

### **Iteration 6: Required vs. Optional Questions**

1. **Define “required” vs. “optional”** in your survey’s JSON config.

2. **Modify the question display** logic to show only required questions first, track completion, then move to optional ones if the user chooses to continue.

3. **Add a “Save Now” button** for optional questions to sync partial data on demand.

4. **Test** that required questions must be completed to see results, optional ones can be partially answered.

### **Iteration 7: Results Page & Scoring**

1. **Create a `calculateScores()`** function that aggregates a user’s answered questions from Supabase (or local if needed).

2. **Display** the overall or continuum-based averages.

3. **Add** a minimal “Compare with My Group” placeholder or a simple average to demonstrate future directions.

4. **Test** correct calculation for various sets of question responses (including partial optional answers).

### **Iteration 8: Session Timeout & Refresh**

1. **Create a function** that monitors user inactivity in the browser (keystrokes or clicks).

2. **Use the Supabase auth** refresh token logic to extend active sessions.

3. **After 60 minutes** with no activity, prompt the user to log in again.

4. **Test** it by artificially waiting or setting a shorter interval for debugging.

### **Iteration 9: Final Polishing & Testing**

1. **Review code** for leftover or commented-out segments that are no longer used.

2. **Do a final pass** on CSS for a minimal responsive layout.

3. **Run** a complete set of tests:

   * Passcode collisions.

   * RLS checks.

   * Offline/online transitions.

   * Required/optional logic.

4. **Deploy** to your desired hosting environment.

5. **Confirm** the entire system runs as expected in staging or production.

---

## **4\. Iterative Prompts for a Code-Generation LLM**

Below are example prompts you could feed to a code-generation LLM (like ChatGPT or similar models), guiding it step by step. Each prompt builds on the previous iteration, and each prompt is tagged in code fencing to keep it clear.

**Note**: Replace placeholders (`PROJECT_NAME`, `YOUR_SUPABASE_URL`, etc.) with your actual details. Also, adapt the TDD steps to your chosen testing framework or environment.

### **Prompt 1: Create Basic Project & Environment**

sql  
CopyEdit  
`You are helping me create a new Vanilla JS project called "FutureLens".`   
`1. Initialise an npm project and create a folder structure:`  
   `- index.html`  
   `- src/`  
     `- app.js`  
     `- auth.js`  
     `- survey.js`  
     `- results.js`  
     `- (optional) test/`  
       `- any_test_files.test.js`  
`2. Provide a sample "index.html" that references app.js and uses a minimal layout for a login form placeholder and a "root" div for dynamic content.`  
`3. Add a short sample test in test/ folder (e.g. using Jest or similar) that just confirms a simple function returns true.`  
`4. Provide instructions for how to run these tests.`

### **Prompt 2: Supabase Integration & Configuration**

sql  
CopyEdit  
`Now integrate Supabase.`   
`1. Install the @supabase/supabase-js client via npm.`  
`2. In app.js, instantiate a Supabase client using the placeholders for URL and anon key:`  
   `const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");`  
`3. Update index.html to include an environment check if needed (like a .env file or similar).`  
`4. Provide a minimal test that confirms we can call supabase.auth.getSession() (mock or real).`  
`5. Explain how to run it and verify it passes.`

### **Prompt 3: Database Schema & Row-Level Security (Automated Creation Script)**

sql  
CopyEdit  
`Please provide a Supabase SQL script (or a JavaScript migration file) that creates the following tables:`  
`1. participants (id, passcode unique, cohort_id, survey_id, inserted_at)`  
`2. responses (id, participant_id, question_key, likert_value, dont_understand, inserted_at)`  
`3. surveys (id, json_config, inserted_at)`  
`4. cohorts (id, code, label, inserted_at)`

`Then enable Row-Level Security and create a policy for the "participants" and "responses" table so that a user can only select or insert rows if they match their authenticated user ID or passcode logic. Provide a mock policy if needed, as for the MVP we might rely on passcodes only.`

`Then give me an updated test script that runs these migrations and checks the tables exist.`

### **Prompt 4: Passcode Auth & Basic Login Flow**

vbnet  
CopyEdit  
`Now let's build basic passcode authentication for the MVP:`  
`1. In auth.js, create a function handleLogin(passcode) that:`  
   `- Normalises case (uppercase/lowercase).`  
   `- Queries the participants table to see if passcode exists. If yes, store participant_id in localStorage or a global state.`  
   `- Returns success/failure.`  
`2. Update index.html to call handleLogin on form submit, then console.log success or error for now.`  
`3. Provide a Jest (or any) test that mocks a supabase call and verifies handleLogin handles success/failure.`  
`4. Return the updated index.html, auth.js, and test file.`

### **Prompt 5: Survey Loading & Randomised Question Display**

vbnet  
CopyEdit  
`Expand the code to load a survey's JSON config once the user is authenticated:`  
`1. In survey.js, create a function fetchSurvey(surveyId) that queries the surveys table for the JSON config.`  
`2. Create a function initSurvey(surveyJson) that:`  
   `- Extracts required questions.`  
   `- Shuffles them randomly.`  
   `- Stores the order in localStorage under something like 'questionOrder'.`  
`3. Create a function displayNextQuestion() that reads the current index from localStorage and renders the question in the DOM.`  
`4. Provide a test that ensures fetchSurvey returns a valid JSON object from the table (mock the supabase call).`  
`5. Show updated code (index.html, survey.js) and how it integrates with auth.js after successful login.`

### **Prompt 6: Submitting Answers & Offline Sync**

vbnet  
CopyEdit  
`Now let's handle answer submission:`  
`1. In survey.js, add a function recordAnswer(questionId, likertValue, dontUnderstand) that saves the response locally first.`   
`2. If the device is online, immediately try to sync with Supabase (responses table). If offline, queue it in localStorage for later sync.`  
`3. Write a function syncResponses() that checks localStorage for unsynced answers and attempts to post them to Supabase.`  
`4. Provide a test that simulates offline mode, sets unsynced answers, then calls syncResponses() once a 'mock online' flag is set, verifying they are posted.`  
`5. Return the updated code in survey.js, plus any helper code in app.js or a new offline.js if that is clearer.`

### **Prompt 7: Required vs. Optional Questions & Partial Completion**

sql  
CopyEdit  
`Extend the survey logic to distinguish between required and optional questions:`  
`1. In initSurvey, separate the question list into requiredQuestions and optionalQuestions.`  
`2. For requiredQuestions, ensure the user must complete them before seeing results.`   
`3. For optionalQuestions, add a "Save Now" button to store partial answers.`  
`4. Provide TDD coverage for a scenario where the user completes required questions, sees results, then later returns to finish optional questions.`   
`5. Return updated survey.js and any references in index.html or results.js.`

### **Prompt 8: Results Page & Scoring**

vbnet  
CopyEdit  
`Now let's calculate and display results:`  
`1. In results.js, create a function calculateScores(participantId) that fetches all responses from Supabase and aggregates them by continuum (or question grouping).`  
`2. Display a summary of each continuum's average.`   
`3. Provide a minimal "Compare with My Group" placeholder if participant is in a known cohort, or just display "Coming soon" message.`  
`4. Write a test that inserts known responses for a participant, calls calculateScores, and checks the returned averages.`   
`5. Show updated results.js and how it's triggered once required questions are complete.`

### **Prompt 9: Session Timeout & Refresh**

sql  
CopyEdit  
`Implement session timeout logic:`  
`1. In auth.js, add a session timer set to 60 minutes. If no user activity (click/mouse/keyboard), sign them out.`  
`2. If user is active, call supabase.auth.getSession() periodically to refresh.`   
`3. Provide a test that mocks a 60-minute inactivity to ensure the user is logged out, and a test that mocks continuous activity to ensure they stay logged in.`  
`4. Return the updated auth.js (or a new session.js if you prefer) and relevant tests.`

### **Prompt 10: Final Polishing & Testing**

vbnet  
CopyEdit  
`Bring everything together:`  
`1. Consolidate code from all modules, ensuring there's no orphaned or unused code.`  
`2. Provide a final pass over index.html to confirm each script is included in the correct order.`  
`3. Show final TDD results or manual tests that cover:`  
   `- RLS access`  
   `- Offline/online transitions`  
   `- Required vs optional logic`  
   `- Session timeout`  
   `- Basic passcode security checks`  
`4. Provide instructions for deployment on a static hosting platform with Supabase as backend.` 

---

## **5\. Final Notes on Right-Sizing Steps**

* The above prompts are broken down into self-contained tasks. Each iteration can be finished and tested before moving on.

* If you find one iteration too large, you can split it further (e.g. separate offline sync from real-time submission).

* Conversely, if an iteration is trivial or your code-generation LLM can handle more scope at once, you can merge them.

* The important principle is to ensure each prompt has a clear objective, tests, and fully functional code before proceeding.

With this plan, you should be able to safely and iteratively build the FutureLens MVP while maintaining best practices for testing, security (via RLS), and offline resilience. Good luck\!

