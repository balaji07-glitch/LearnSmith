# EduForge — AI Learning Pack Studio for Teachers

> **Generate. Check. Review. Approve.**
> An AI-assisted micro-unit studio that converts trusted educational source material and explicit learning objectives into classroom-ready learning packs with built-in educational quality control, provenance, and student-safe publishing.

---

## 🌟 Why EduForge?

Existing AI tools generate educational content as isolated, unverified text that frequently hallucinates unsupported facts, invents curriculum standards, or leaks answers.

**EduForge transforms content generation into a controlled, verifiable engineering pipeline:**
1. **Source Knowledge Boundary**: All claims must cite verified pages and chunks from uploaded textbooks, notes, or PDFs.
2. **Objective Contract**: Every quiz question, practice item, and concept explanation is bound to explicit learning objectives (e.g. `OBJ-01`, `OBJ-02`). No orphan content is permitted.
3. **Automated Quality Engine**: Runs 6 continuous checks before content reaches students (Objective Coverage, Deterministic Answer Key Alignment, Near-Duplicate Token Detection, Answer Leakage, Source Grounding, and Difficulty Calibration).
4. **Controlled Item Regeneration**: Regenerate an individual quiz or practice question without destroying or altering the rest of the learning pack.
5. **Version Lineage**: Every change (AI-generated, AI-regenerated, or Teacher-edited) creates a traceable new version without erasing history.
6. **Student-Safe Publishing**: Student Mode strictly displays approved content, completely stripping AI model identifiers, provenance chunks, internal notes, and answer keys.

---

## 📦 What's Inside a Learning Pack?

Every generated micro-unit produces 5 synchronized, curriculum-aligned assets:

| # | Asset Type | Description |
|---|------------|-------------|
| **1** | **Concept Explanation** | Pedagogically rich explanation calibrated to grade level, highlighting core takeaways, target vocabulary, and verified grounding claims. |
| **2** | **Guided / Worked Example** | Step-by-step inquiry scenario with sequential deduction steps and common student misconception corrections. |
| **3** | **Formative Assessment Quiz** | Multiple-choice questions with objective bindings, source citations, distractor options, and rationales. |
| **4** | **Differentiated Practice** | Tiered challenges featuring **Foundation** (scaffolded recall) and **Extension** (critical inquiry). |
| **5** | **Revision Sheet** | High-yield summary with essential equations, rules, and core scientific relationships. |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Backend**: Node.js, Express, Vite middleware mode in development
- **AI Engine**: NVIDIA's OpenAI-compatible chat completions API, using `meta/llama-3.3-70b-instruct` by default
- **Authentication & Assessment Results**: Supabase Auth with server-verified student submissions and teacher-restricted results
- **PDF Extraction**: `pdfjs-dist` preserving page numbers, paragraphs, and chunks
- **Database Persistence**: JSON relational store for learning-pack data; Supabase Postgres for durable student assessment results
- **Quality Engine**: Deterministic string similarity (token Jaccard), answer-key matrix validation, leakage scanners, and deep semantic evaluation

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- `NVIDIA_API_KEY` (configured in your environment or `.env`; create a key in the NVIDIA API Catalog)
- A Supabase project with Email Auth enabled

### 2. Environment Setup
Create a `.env` file in the project root:
```env
NVIDIA_API_KEY="your-nvidia-api-key"
NVIDIA_MODEL="meta/llama-3.3-70b-instruct"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_TEACHER_EMAILS="teacher@school.edu"
PORT=3000
```

The browser uses the `VITE_SUPABASE_*` values. The server uses the non-`VITE_` Supabase URL, anon key, and service-role key to verify users and write results. **Never expose the service-role key to the browser.**

### 3. Create the assessment-results table
In the Supabase SQL Editor, run:
```sql
create table if not exists public.student_assessment_results (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  assessment_id text not null,
  assessment_title text not null,
  assessment_type text not null check (assessment_type in ('quiz', 'practice')),
  student_name text not null,
  student_email text not null,
  student_id text,
  score integer not null,
  total integer not null,
  submitted_at timestamptz not null default now(),
  constraint valid_assessment_score check (total > 0 and score >= 0 and score <= total)
);

create index if not exists student_assessment_results_unit_submitted_idx
  on public.student_assessment_results (unit_id, submitted_at desc);

alter table public.student_assessment_results enable row level security;
revoke all on public.student_assessment_results from anon, authenticated;
grant select, insert on public.student_assessment_results to service_role;
```

Sign up teacher and student accounts through the app. Add each teacher's confirmed sign-in email to `SUPABASE_TEACHER_EMAILS` (comma-separated) in the hosting provider's server environment variables. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables too, then redeploy. Supabase Email Auth confirmation can be enabled or disabled in the Supabase project settings.

Teachers can open a unit and choose **Student Results**. Student quiz and practice submissions are saved in Supabase and are displayed with student name, ID/email, score, and submission time. Teacher result access requires a valid Supabase session and an email listed in `SUPABASE_TEACHER_EMAILS`.

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Full-Stack Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Acceptance Test & Demo Walkthrough

1. **Dashboard**: Click **Load Demo Unit** to populate the pre-configured *Grade 8 Photosynthesis* unit.
2. **Source Workspace**: Inspect the 3 pages of verified textbook chunks, word counts, and page markers.
3. **Objective Contract**: Review `OBJ-01`, `OBJ-02`, and `OBJ-03`. Modify constraints and witness the invalidation notice with one-click re-auditing.
4. **Learning Pack**: Review the 5 generated assets. Notice the Formative Quiz is marked `NEEDS_REVISION` because Q4 is flagged as a near-duplicate.
5. **Controlled Regeneration**: Click into the Quiz, select **Regenerate Q4**, choose "Duplicate" as the reason, enter `"Make this more application-based"`, and click **Generate New Version**. Only Q4 updates to v2; Q1–Q3 remain untouched!
6. **Approval**: Click **Approve Asset** on the Quiz. The unit status transitions to **Ready**.
7. **Student Mode**: Click **Student Mode** in the header. Notice that all teacher provenance, chunk IDs, AI models, and answer keys are hidden. Students can study the lesson and take the interactive self-check quiz.
8. **Export Center**: Click **Export Pack** to print classroom handouts or copy clean Markdown.

---

## 🛡️ License
Apache-2.0
