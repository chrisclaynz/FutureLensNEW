# **FutureLens MVP Specification (Final Draft)**

## **1\. Overview**

FutureLens is a web-based interactive survey platform enabling participants to explore future-oriented questions, receive personalised feedback, and compare responses within cohorts. The MVP supports both anonymous and identifiable modes, with robust offline handling (via localStorage), straightforward passcode authentication, and custom scoring logic.

**Key Goals**

1. Minimise friction in answering required survey questions.

2. Provide “I Don’t Understand” tracking for question clarity insights.

3. Ensure partial offline functionality and local data backup.

4. Secure data through row-level security (RLS) in Supabase and safe passcode usage.

5. Prepare for expansion into admin dashboards, advanced analytics, role-based management, and more.

---

## **2\. MVP Feature Set**

### **2.1 Supabase Setup**

* **Authentication**

  * **Anonymous Mode**: Users enter a generic survey code to begin.

  * **Identifiable Mode**: Users enter a unique passcode tied to the `participants` table. Plain text is used in the MVP (for simplicity), but collisions are minimised with basic checks (e.g. generating random alphanumeric strings of sufficient length). Future releases will hash passcodes for better security.

  * Passcodes are stored in `participants.passcode`. A check ensures uniqueness at creation to reduce collisions.

* **Database Tables**

  * **`participants`**: Contains passcodes, cohort info, and a reference to the assigned survey.

    * For identifiable cohorts, `participant_id` is the primary key; passcodes are associated with that ID.

  * **`responses`**: Stores all user answers, including the “I Don’t Understand” flag (boolean) per question, with a link to the relevant `participant_id` (for identifiable mode).

  * **`surveys`**: Holds the JSON config for each survey, including statements, continuum alignments, and optional/required flags.

  * **`cohorts`**: Contains a code and human-readable label (e.g. “Cohort 101 – Intro Class”).

* **Security & RLS**

  * **Row Level Security** in Supabase ensures a user can only see or edit their own rows in `responses`.

  * The `/admin` route is protected by role-based checks so it cannot be accessed by simply guessing the path.

  * Session timeout is enforced at 60 minutes. Users will be logged out on inactivity, with token refresh logic described in **Section 2.2.7**.

---

### **2.2 Frontend User Flow**

1. **Login Screen**

   * **Inputs**: Survey code (for anonymous mode) or passcode (for identifiable mode).

   * **Case Insensitivity**: The user can enter upper or lower case; it is normalised.

   * **Error Messaging**: “That code doesn’t match any active surveys” if invalid.

   * If passcode or session is expired, the user must re-enter their passcode.

2. **Welcome/About Screen**

   * **Privacy & Instructions**:

     * A short privacy notice states that no personal data is collected unless the user is in identifiable mode, in which case their responses are associated with a participant record.

     * Explains how to do the survey and clarifies the “I Don’t Understand” checkbox’s purpose:

        “If you do not understand the statement, please check ‘I Don’t Understand’. We still ask you to choose a response if possible, but your feedback here helps us identify unclear questions.”

   * **Begin Button**: Clicking it loads the required survey questions.

3. **Survey Interaction**

   * **Question Display**: One question per page.

   * **Random Order**: Required questions are displayed in a random sequence **once** per user session. This order is saved to `localStorage`, so reloading the page or navigating “Back” does not reshuffle questions.

   * **Answer Selection**:

     * **Likert Scale** of four discrete values: \+2, \+1, \-1, \-2 (no zero).

     * **“I Don’t Understand”**:

       * A checkbox that is stored in `responses` as a boolean.

       * The user still needs to pick one of the four Likert options to proceed.

       * For **identifiable** participants, `participant_id` links the “I Don’t Understand” response to that user, allowing you to see who found it unclear.

   * **Navigation**:

     * “Next” is disabled until a Likert option is selected. “Back” lets the user review or change previous answers.

     * If the user changes an answer, the previous response is overwritten in `responses`.

   * **Offline Handling**:

     * If the network is lost, a banner warns the user.

     * Answers are still stored in `localStorage` to prevent data loss if the browser closes. On reconnect, the app attempts to sync local changes to the database.

     * This partial offline sync logic means data merges to the server once a stable connection is detected, or on navigating to the next page if the connection has returned.

4. **Completion of Required Questions**

   * After the final required question, the user’s responses are posted to the server. A confirmation screen appears.

   * If offline at that moment, a blocking modal requests the user to reconnect or wait until the app can successfully sync.

5. **Results Summary**

   * Once required questions are submitted (and synced), the user sees:

     * **Continuum Overviews**: A short text indicating the user’s overall leaning (negative or positive).

     * Buttons to see more details on each continuum’s alignment page.

     * A *“Compare with My Group”* button (present but disabled in the MVP or shows a minimal version with friendlier language like “See how your views compare” without the word “outlier”).

6. **Optional Questions**

   * **Unlocking**: Only after completing the required set.

   * **One-at-a-Time**: Each optional question on its own screen.

   * **“Save Now” Button**:

     * Allows participants to store partially completed optional answers server-side, so they are not lost if they exit midway.

     * This partial data also syncs with localStorage if offline.

   * **Dynamic Scoring**:

     * Each optional question that’s answered contributes to the continuum average.

     * If a user leaves optional questions incomplete or partially answered (even with some saved), only those answered or saved to the server are counted.

     * **Example**: If a continuum has 8 potential questions (4 required \+ 4 optional) and the user answers 2 optional ones, the continuum’s score is derived from 6 total answered items.

7. **Session Timeout & Token Refresh**

   * The user session lasts 60 minutes of inactivity. If the user is still active, the app silently calls `supabase.auth.getSession()` (or equivalent) to refresh the token.

   * If the refresh fails or the user is inactive, they must log in again (re-enter their passcode or survey code).

   * This prevents abrupt logouts mid-survey for actively engaged users.

8. **Returning Users**

   * If required questions are finished, users are sent directly to the results screen or the optional questions if they have not submitted them yet.

   * If the optional set is partially complete (and some are saved), the user can pick up where they left off.

---

### **2.3 Architecture & Tech Stack**

* **Frontend**

  * Vanilla JS \+ HTML \+ CSS to keep the MVP lightweight, with code modules (`auth.js`, `survey.js`, etc.).

  * A responsive layout for mobile, tablet, and desktop.

  * **LocalStorage** is utilised for:

    1. Persisting the random question order.

    2. Saving answers if offline or if the user closes the browser mid-question.

    3. Staging data for sync with Supabase upon reconnect.

* **Backend**

  * **Supabase** for Auth, Postgres DB, and RLS.

  * Single-page app approach demands server-side checks (RLS) and admin role gating for `/admin`.

  * Potential use of Supabase Edge Functions for more complex scoring or analytics in the future.

---

### **2.4 Scoring Logic**

* **Likert Scale**: \+2 (strong agreement), \+1 (moderate agreement), \-1 (moderate disagreement), and \-2 (strong disagreement).

* **Alignment Field**: If a question is aligned positively to a continuum, a \+2 means high endorsement. If aligned negatively, a \+2 might reduce the continuum score, etc. (depending on your exact formula).

* **Average Calculations**:

  * For each continuum, sum the user’s answered question values, then divide by the number of answered items in that continuum.

  * **Partial Optional Handling**: Only answers that have been saved (either on “Next” or “Save Now”) are counted.

  * **Example**:

    * Suppose the user responds to 5 continuum items as: \+2, \+1, \-1, \+1, \-2 → sum is \+1. The average is \+1 / 5 \= \+0.2, which is a slight positive leaning.

    * If the user only answered 3 out of 5 optional statements, those 3 are included in the sum. The unattempted items are simply not part of the total count.

---

### **2.5 Error Handling**

* **Invalid Login**: “That code doesn’t match any active surveys.”

* **Unanswered Question**: “Please choose an option before continuing.”

* **Offline Save Failure**: Warning banner; localStorage retains data.

* **Submit Failure**: A blocking modal urges a retry.

* **Route Protection**: “Nothing to see here” if unauthorised access to restricted routes.

* **Session Timeout**: 60 min. The system tries to refresh the token for active users.

---

### **2.6 Security**

* **Supabase RLS**: Each user can only access their own `responses`.

* **Passcodes**:

  * Plain text for MVP, ensuring each passcode is unique on creation to reduce guessability or collisions.

  * Future releases will hash them.

* **Survey Codes**: Generic but do not expose previous results.

* **Admin Panel**:

  * Located at `/admin`, accessible only if user role \= “admin” (checked via Supabase).

  * Session ends after 60 minutes of admin inactivity.

---

## **3\. Deployment & Privacy**

1. **Deployment**

   * Initially on a Hostinger site, then under a subdomain of a larger platform.

   * Uses the same Supabase instance that other apps share, so environment variables and configuration must be carefully managed.

2. **Data Ownership & GDPR-Like Privacy**

   * A basic privacy statement on the welcome screen clarifies that data is stored for educational analysis.

   * For anonymous mode, no personally identifiable info is collected (just the passcode/survey code).

   * Identifiable mode ties responses to a participant’s record but still doesn’t store personal info beyond the passcode (unless the admin or teacher enters more).

   * If expanding to stricter jurisdictions, more detailed notices and user data rights (download, deletion requests) will be needed.

---

## **4\. Future Feature Sets (Post-MVP)**

1. **Admin Panel for Cohort Insights**

   * Secure role-based login at `/admin`.

   * Select a cohort to view average, standard deviation, and response counts per continuum.

   * Friendlier language than “outlier,” e.g. “Your views differ from the group average.”

2. **Group Comparison for Students**

   * Allows each user to see how they compare with their cohort’s average.

   * Could show standard deviation or distribution.

3. **Reflection Prompts**

   * Optional free-text fields for deeper insight on results pages.

4. **Teacher-Facing Comparison Dashboard**

   * More detailed distribution graphs (dot plots, histograms).

   * Possibly restricted to teacher roles only.

5. **Role-Based Admin Access**

   * Differing levels: Admin vs. Teacher, restricting data or functionalities by role.

6. **Printable/PDF Results**

   * “Print or Save as PDF” functionality with minimal styling.

7. **Gamified Completion Messages**

   * Congratulatory badges for finishing optional questions or achieving certain scores.

8. **Multi-Language Support**

   * JSON-based text replaced by language-specific configs.

   * Potential toggles for te reo Māori or others.

9. **CSV Upload of Users & Cohort Data**

   * Bulk assignment of passcodes with collision checks.

   * Immediate feedback on duplicate passcodes or invalid format.

10. **Cohort Expiry Management**

    * Deactivate older or unpaid cohorts for new responses.

11. **Analytics Dashboard**

    * More advanced metrics: completion rates, device breakdown, optional question engagement.

12. **Cross-Cohort Comparison Tool**

    * Visual or tabular comparisons across multiple cohorts.

---

## **5\. Testing Plan**

### **5.1 Manual QA**

* **Login Flow**: Check anonymous vs. identifiable passcodes.

* **Question Order Consistency**: Refresh or revisit to confirm random sequence is preserved in localStorage.

* **“I Don’t Understand”**: Verify that the flag is stored for each question. For identifiable users, confirm the `participant_id` is recorded.

* **Required Question Navigation**: Confirm “Next” remains disabled until an answer is selected.

* **Offline Simulation**:

  * Turn off network mid-survey.

  * Confirm that localStorage holds partial responses.

  * Reconnect and ensure server sync occurs automatically or upon navigating “Next.”

* **Optional Questions**:

  * Check the new “Save Now” button.

  * Verify partial scoring if only some optional items are answered.

* **Results Accuracy**: Confirm correct continuum averages with partial data.

* **Session Timeout**:

  * Wait 60 minutes of inactivity to confirm forced logout.

  * Attempt active usage to confirm token refresh works.

* **Mobile & Tablet**: Confirm responsiveness.

### **5.2 Admin Testing (Post-MVP)**

* **Secure /admin**: Confirm role-based blocking.

* **Cohort Insights**: Validate correct average, standard deviation.

* **Logout**: Confirm 60-minute session logic.

---

## **6\. Additional Notes & Final Clarifications**

1. **Exact Passcode Generation**

   * For the MVP, passcodes can be generated using a random function that produces a sufficiently long alphanumeric string to reduce guessability.

   * Uniqueness is enforced on the DB side, so collisions prompt a re-generation.

   * Future versions will hash passcodes in the database for security compliance.

2. **Offline Sync Logic**

   * The front end keeps in-progress answers in localStorage.

   * Once the user reconnects, the app pushes any unsynced answers to the DB. If a conflict arises (e.g. user changed the same answer while connected?), the most recent local action overwrites.

   * This approach is minimal but sufficient for an MVP. Advanced versioning or conflict resolution could be considered later.

3. **Token Refresh Mechanism**

   * To prevent abrupt logouts, the app periodically checks `supabase.auth.getSession()`. If the token is near expiry and the user is active, Supabase issues a new token.

   * If token refresh fails, the user is prompted to re-log in.

4. **Data Privacy**

   * For now, only passcodes and responses are stored. In identifiable mode, the link from passcode → participant record can reveal group membership but not personal details unless the admin explicitly enters them.

   * A future requirement may add advanced privacy or GDPR compliance if storing actual personal details.

