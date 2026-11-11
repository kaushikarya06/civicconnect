# Civic Complaint Management System --- Project Blueprint

## 1. Project Overview

**Project name:** Civic Complaint Management System\
**Project type:** Full-stack web application\
**Purpose:** Help residents report civic problems in their locality and
let administrators route, track, and resolve those complaints.

The system creates a transparent workflow between citizens and the teams
responsible for maintaining public services.

### Problems addressed

-   Garbage collection not happening
-   Potholes and damaged roads
-   Broken streetlights
-   Water leakage or drainage issues
-   Overflowing drains
-   Damaged public property

## 2. Goals

1.  Make it easy for residents to submit complaints.
2.  Ensure every complaint receives a unique tracking ID.
3.  Help administrators assign complaints to the correct department.
4.  Allow citizens to see progress and status updates.
5.  Give administrators useful summaries of complaint volume and
    resolution performance.

## 3. User Roles

### Citizen

-   Register and log in.
-   Submit a complaint with a title, description, category, location,
    and optional photo.
-   View their submitted complaints.
-   Track complaint status and department updates.
-   Add a comment or clarification when requested.

### Administrator

-   View all complaints.
-   Review complaint details and evidence.
-   Assign complaints to departments.
-   Change priority and status.
-   Add progress notes.
-   View dashboard analytics.
-   Manage categories and department records.

### Department Staff (optional for the first version)

-   View complaints assigned to their department.
-   Update progress.
-   Mark work as completed.
-   Add resolution notes or proof.

**MVP recommendation:** Build Citizen and Administrator roles first. Add
Department Staff after the main workflow works.

## 4. Core Features

### A. Authentication and roles

-   Citizen registration and login.
-   Administrator login.
-   Role-based access: citizens see only their own complaints;
    administrators can see all complaints.
-   Passwords must be securely hashed. Never store plain-text passwords.

### B. Complaint submission

Each complaint should contain:

  Field          Description
  -------------- ----------------------------------------------------
  Complaint ID   Unique system-generated ID
  Title          Short summary of the issue
  Description    Details of the problem
  Category       Garbage, road, streetlight, water, drainage, other
  Location       Address or locality
  Photo          Optional image evidence
  Submitted by   Citizen account
  Submitted at   Date and time
  Status         Current progress
  Priority       Low, medium, high, or urgent
  Department     Assigned department, if assigned

### C. Complaint tracking

Use these statuses:

1.  **Submitted** --- complaint has been received.
2.  **Under Review** --- administrator is checking the complaint.
3.  **Assigned** --- complaint has been assigned to a department.
4.  **In Progress** --- work has started.
5.  **Resolved** --- department reports the issue fixed.
6.  **Rejected** --- complaint is invalid or outside the system's scope;
    a reason is required.
7.  **Reopened** --- citizen or administrator reports that the issue
    remains unresolved.

Keep a status history so users can see what changed, when, and who made
the update.

### D. Admin dashboard

Display:

-   Total complaints
-   New complaints
-   Complaints under review
-   In-progress complaints
-   Resolved complaints
-   Rejected or reopened complaints
-   Complaints by category
-   Complaints by department
-   Recent complaint activity

### E. Search and filters

Administrators should be able to filter by:

-   Status
-   Category
-   Department
-   Priority
-   Date submitted
-   Locality

Citizens should be able to search or filter their own complaints.

## 5. Main Application Workflow

``` text
Citizen registers / logs in
          |
          v
Submits complaint and optional photo
          |
          v
System creates complaint ID
          |
          v
Complaint appears in admin dashboard
          |
          v
Admin reviews complaint
          |
          v
Admin selects department and priority
          |
          v
Department works on the issue
          |
          v
Status and progress notes are updated
          |
          v
Citizen tracks the complaint
          |
          v
Complaint is marked Resolved
```

If the problem is not fixed, the complaint can be reopened with a
reason.

## 6. Suggested Pages

### Citizen-facing pages

  Page                Purpose
  ------------------- ------------------------------------------
  Home                Project introduction and quick links
  Register / Login    Account access
  Citizen Dashboard   Summary of the citizen's complaints
  Submit Complaint    Complaint submission form
  My Complaints       List of submitted complaints
  Complaint Details   Status timeline, department, and updates
  Profile             Basic account details

### Admin-facing pages

  Page                    Purpose
  ----------------------- ----------------------------------------
  Admin Login             Administrator access
  Admin Dashboard         Statistics and recent activity
  All Complaints          Searchable complaint table
  Complaint Details       Review, assign, and update a complaint
  Department Management   Add or edit departments
  Category Management     Manage complaint categories
  Analytics               Charts and performance summaries

## 7. Database Blueprint

A relational database is suitable for this project.

### Table: `users`

  Column          Type / Notes
  --------------- -------------------------
  user_id         Primary key
  full_name       Citizen or staff name
  email           Unique
  password_hash   Secure password hash
  phone           Optional
  role            citizen / admin / staff
  created_at      Registration timestamp

### Table: `departments`

  Column            Type / Notes
  ----------------- ------------------------
  department_id     Primary key
  department_name   Unique department name
  description       Optional

Example departments: Sanitation, Public Works, Electricity, Water
Supply, Drainage.

### Table: `categories`

  Column                  Type / Notes
  ----------------------- -----------------------------
  category_id             Primary key
  category_name           Unique category
  default_department_id   Optional department mapping

### Table: `complaints`

  Column          Type / Notes
  --------------- -----------------------------------------------------
  complaint_id    Primary key
  user_id         Foreign key to users
  category_id     Foreign key to categories
  department_id   Foreign key to departments; nullable until assigned
  title           Short issue summary
  description     Full details
  location        Locality or address
  photo_path      Optional stored image path
  status          Current status
  priority        low / medium / high / urgent
  assigned_by     Admin user ID; nullable
  submitted_at    Submission timestamp
  updated_at      Last update timestamp
  resolved_at     Nullable resolution timestamp

### Table: `complaint_updates`

  Column         Type / Notes
  -------------- ---------------------------
  update_id      Primary key
  complaint_id   Foreign key to complaints
  updated_by     Foreign key to users
  old_status     Previous status
  new_status     New status
  note           Progress note or reason
  created_at     Update timestamp

### Relationships

-   One user can submit many complaints.
-   One category can be used by many complaints.
-   One department can receive many complaints.
-   One complaint can have many status updates.
-   One administrator can assign or update many complaints.

## 8. Suggested Technology Stack

Choose tools that are manageable for a student project. Do not add
complex services before the basic version works.

  Layer                     Suggested option
  ------------------------- ------------------------------------
  Frontend                  HTML, CSS, JavaScript
  UI framework (optional)   React
  Backend                   Python Flask
  Database                  MySQL or IBM Db2
  Charts                    Chart.js
  Image storage             Local uploads folder for prototype
  Version control           Git and GitHub

**Simple alternative:** HTML/CSS/JavaScript + Flask + SQLite is enough
for a first local prototype. If the project requires Db2, use Db2
instead of SQLite and connect through the appropriate Python database
driver.

## 9. Basic API / Backend Routes

Example routes for a Flask-style backend:

  ------------------------------------------------------------------------------
  Method                  Route                          Purpose
  ----------------------- ------------------------------ -----------------------
  POST                    `/api/register`                Register citizen

  POST                    `/api/login`                   Log in

  POST                    `/api/complaints`              Submit complaint

  GET                     `/api/complaints/mine`         Get logged-in citizen's
                                                         complaints

  GET                     `/api/complaints/<id>`         Get complaint details,
                                                         subject to access
                                                         checks

  GET                     `/api/admin/complaints`        Admin list of
                                                         complaints

  PATCH                   `/api/admin/complaints/<id>`   Assign or update
                                                         complaint

  GET                     `/api/admin/analytics`         Dashboard statistics

  GET                     `/api/departments`             List departments

  GET                     `/api/categories`              List categories
  ------------------------------------------------------------------------------

All protected routes must verify the user's identity and role on the
server. Hiding a button in the frontend is not sufficient access
control.

## 10. Interface Layout Ideas

### Citizen dashboard

-   Greeting and a prominent **Report a Problem** button.
-   Four small summary cards: Total, Under Review, In Progress,
    Resolved.
-   A table or card list of recent complaints.
-   Each complaint shows its ID, category, date, status, and location.

### Admin dashboard

-   Summary cards across the top.
-   Complaint status chart.
-   Complaints by category chart.
-   Recent complaints table.
-   Quick filters for status, priority, and department.

Keep the interface clean and readable. Use clear status labels and avoid
overcrowding the dashboard.

## 11. Development Plan

Build in small, testable stages.

### Phase 1 --- Project setup

-   Create the project folder and Git repository.
-   Set up the backend and database connection.
-   Create the database tables.
-   Insert sample departments and categories.

**Done when:** The application connects to the database and can read
sample records.

### Phase 2 --- Citizen functions

-   Build registration and login.
-   Build the complaint form.
-   Save complaints to the database.
-   Build the citizen's complaint list and details page.

**Done when:** A citizen can submit a complaint and see it after logging
in again.

### Phase 3 --- Admin functions

-   Build the admin login and dashboard.
-   Display all complaints.
-   Add department assignment and priority selection.
-   Add status updates and notes.

**Done when:** An administrator can review, assign, and update a
complaint.

### Phase 4 --- Tracking and analytics

-   Add status history.
-   Show a complaint timeline to the citizen.
-   Add dashboard counts and charts.
-   Add search and filters.

**Done when:** Citizens can follow progress and dashboard figures match
the database.

### Phase 5 --- Testing and presentation

-   Test citizen and admin permissions.
-   Test invalid forms and missing fields.
-   Test status transitions.
-   Test image upload restrictions.
-   Add sample data for the demonstration.
-   Prepare screenshots and a short demo script.

## 12. Validation and Security Rules

-   Require title, description, category, and location.
-   Restrict photo file types and file sizes.
-   Generate complaint IDs on the server.
-   Hash passwords securely.
-   Validate all user input on the backend.
-   Use parameterized SQL queries to reduce SQL injection risk.
-   Check ownership before showing a citizen a complaint.
-   Restrict assignment and administrative actions to authorized roles.
-   Record who made each status change.
-   Do not expose personal phone numbers or email addresses publicly.
-   For a real deployment, use HTTPS, secure session handling, backups,
    and an approved process for handling personal data.

## 13. Testing Checklist

-   [ ] Citizen can register and log in.
-   [ ] Duplicate email registration is rejected.
-   [ ] Citizen can submit a valid complaint.
-   [ ] Required fields are validated.
-   [ ] A unique complaint ID is generated.
-   [ ] Citizen can see only their own complaints.
-   [ ] Admin can see all complaints.
-   [ ] Admin can assign a department and priority.
-   [ ] Status updates are saved in the history table.
-   [ ] Citizen can see the latest status and timeline.
-   [ ] Dashboard counts match actual complaint records.
-   [ ] Invalid file uploads are rejected.
-   [ ] Unauthorized users cannot access admin routes.

## 14. Demo Scenario

Use one realistic example during the presentation:

1.  A citizen reports a large pothole near a local market.
2.  The system generates complaint ID `CCMS-0001`.
3.  The administrator reviews it and assigns it to Public Works.
4.  The status changes from Submitted to Under Review, then Assigned.
5.  Department staff updates it to In Progress.
6.  After repair, the complaint is marked Resolved with a note.
7.  The citizen opens the complaint details page and sees the complete
    timeline.
8.  The admin dashboard updates its resolved complaint count.

Use clearly labelled sample data in the demo. Do not imply that a real
municipal department is connected unless an official integration exists.

## 15. Features to Add Later

Only after the MVP is complete:

-   Map-based complaint location.
-   Email or SMS notifications.
-   Duplicate complaint detection.
-   Citizen feedback after resolution.
-   Department response-time reports.
-   Public view of anonymized complaint statistics.
-   Multilingual interface.
-   AI-assisted category suggestion from complaint text or image.

AI should assist with suggestions, not make final decisions about
complaint validity or priority without human review.

## 16. Project Success Metrics

Measure the prototype using sample data:

-   Number of complaints submitted.
-   Percentage assigned to a department.
-   Percentage resolved.
-   Average time from submission to assignment.
-   Average time from submission to resolution.
-   Number of reopened complaints.
-   Complaint volume by category and locality.

Clearly state that these are prototype metrics unless they come from
real operational data.

## 17. Minimum Viable Product (MVP)

The first working version should include only:

1.  Citizen registration and login.
2.  Complaint submission.
3.  Unique complaint ID.
4.  Citizen complaint tracking.
5.  Admin dashboard.
6.  Department assignment.
7.  Status updates with history.
8.  Basic analytics.

**Do not start with maps, AI, SMS, or complex notifications.** Complete
the core complaint-to-resolution workflow first.

## 18. Final Project Summary

The Civic Complaint Management System is a role-based web application
that digitizes the process of reporting and resolving local civic
issues. Citizens can submit and track complaints, while administrators
can review, assign, and monitor them through a dashboard. The system
stores complaint history and provides basic analytics to improve
visibility and accountability.

**Core idea:** Make civic problems easier to report, easier to track,
and harder to ignore.
