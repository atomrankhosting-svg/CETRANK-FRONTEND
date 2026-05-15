# 🖼️ Image Upload Feature — Complete Implementation Specification

## Table of Contents
1. [Backend API Contract — What Frontend Sends](#1-backend-api-contract)
2. [Image Analysis — Fields Present vs Missing](#2-image-field-analysis)
3. [Frontend Implementation Prompt](#3-frontend-implementation-prompt)

---

## 1. Backend API Contract

The frontend calls `POST /api/v1/get-cutoffs` with this exact JSON body (`CutoffRequest` schema):

```json
{
  "student_name": "string | null",
  "user_gender": "string",              // "Male" or "Female"
  "user_category": "string",            // "OPEN", "OBC", "SC", "ST", "VJ", "NT1", "NT2", "NT3", "SBC", "SEBC"
  "user_minority_list": ["string"],     // e.g. ["Muslim", "Buddhist"] or []
  "user_home_university": "string",     // e.g. "Sant Gadge Baba Amravati University"
  "division": ["string"] | null,        // e.g. ["Amravati", "Nagpur"] or null
  "city": ["string"] | null,            // e.g. ["Yavatmal", "Nagpur"] or null
  "percentile_cet": 0.0,               // MHT-CET percentile (0-100)
  "percentile_ai": 0.0,                // JEE Main percentile (0-100)
  "is_tech": true,                     // Branch preference booleans
  "is_civil": false,
  "is_mechanical": false,
  "is_electrical": false,
  "is_electronic": false,
  "is_other": false,
  "is_ews": false,                     // EWS eligibility
  "location_flexibility": 1            // 1=Strict, 2=Moderate, 3=Flexible
}
```

> [!IMPORTANT]
> Every field above must be present in the final request body. The image provides SOME of them; the rest MUST be collected from the user via a form.

---

## 2. Image Field Analysis

### What the MHT-CET Application Form Image Contains

From the uploaded MHT-CET 2025 Application Form (fe2025.mahacet.org), the following data is clearly visible:

| Field on Image | Value in Sample | Maps to API Field |
|:---|:---|:---|
| Candidate's Full Name | DONGARE OM DILIP | `student_name` |
| Gender | Male | `user_gender` |
| Category | SBC | `user_category` |
| Category for Admission | SBC | (confirms `user_category`) |
| Home University | Sant Gadge Baba Amravati University | `user_home_university` |
| MHT-CET 2025 PCM Total | 86.6827486 | `percentile_cet` |
| JEE Main 2025 Total | 73.0983775 | `percentile_ai` |
| Applied for EWS | No | `is_ews` |
| District (from SSC/HSC) | Yavatmal | _(informational, not directly used)_ |
| Nationality | Indian | _(not needed)_ |
| Candidate Type | Maharashtra - Type A | _(not needed)_ |
| Date of Birth | 27/08/2006 | _(not needed)_ |
| HSC Marks (Physics, Math, Chemistry, CS, English) | Various | _(not needed for list generation)_ |
| Application ID | EN25175248 | _(not needed)_ |
| MHT-CET Roll No | 2517105384 | _(not needed)_ |
| JEE Application No | 250310938136 | _(not needed)_ |

### ✅ Fields EXTRACTABLE from Image (7 fields)

| # | API Field | Extraction Source | Notes |
|:--|:---|:---|:---|
| 1 | `student_name` | "Candidate's Full Name" | Direct extraction |
| 2 | `user_gender` | "Gender" row | Must output exactly `"Male"` or `"Female"` |
| 3 | `user_category` | "Category" row | Must strip any G/L prefix → clean value like `SBC`, `OBC`, `OPEN` |
| 4 | `user_home_university` | "Home University" row | Must match exactly with the backend's university list from `/api/v1/metadata` |
| 5 | `percentile_cet` | "MHT-CET 2025 PCM Details → Total" | The PCM Total score (e.g., `86.6827486`). Use `0.0` if section not present |
| 6 | `percentile_ai` | "JEE (Main) 2025 → Total" | The JEE Total percentile (e.g., `73.0983775`). Use `0.0` if section not present or "Not Appeared" |
| 7 | `is_ews` | "Applied for EWS" row | `true` if "Yes", `false` if "No" |

### ❌ Fields NOT in Image — Must Ask User (8 fields)

| # | API Field | Why Not in Image | UI Input Type |
|:--|:---|:---|:---|
| 1 | `user_minority_list` | Personal/religious info not on form | Multi-select checkbox (options: `Muslim`, `Buddhist`, `Jain`, `Christian`, `Sikh`, `Parsi`, `Jewish`, `Linguistic Minority`, or empty `[]`) |
| 2 | `division` | Location preference, not a form field | Multi-select from `/api/v1/metadata` divisions |
| 3 | `city` | Location preference, not a form field | Multi-select from `/api/v1/metadata` cities (filtered by selected divisions) |
| 4 | `is_tech` | Branch preference | Toggle/Checkbox |
| 5 | `is_civil` | Branch preference | Toggle/Checkbox |
| 6 | `is_mechanical` | Branch preference | Toggle/Checkbox |
| 7 | `is_electrical` | Branch preference | Toggle/Checkbox |
| 8 | `is_electronic` | Branch preference | Toggle/Checkbox |
| 9 | `is_other` | Branch preference | Toggle/Checkbox |
| 10 | `location_flexibility` | Personal preference | Radio/Select (1=Strict, 2=Moderate, 3=Flexible) |

> [!NOTE]
> `user_minority_list` is tricky — the form has a "Minority Candidature Type" field that shows "No" in this sample. If it shows a minority type, extract it. But since it often says "No", the user should be able to override/add minorities.

---

## 3. Frontend Implementation Prompt

> [!CAUTION]
> The prompt below is designed to be given **as-is** to Antigravity for frontend implementation. It is self-contained and references the backend API contract precisely.

---

### 📋 COPY-PASTE PROMPT FOR FRONTEND IMPLEMENTATION

```
FEATURE: Image Upload for MHT-CET Application Form — Alternative Input for College List Generation

CONTEXT:
The frontend currently has a manual form where users enter their details (name, gender, category, 
percentile scores, branch preferences, etc.) to generate a personalized college list via 
POST /api/v1/get-cutoffs. We need to add an ALTERNATIVE input method where the user can upload 
a photo/scan of their MHT-CET 2025 Application Form, and AI extracts the relevant fields 
automatically. The user then only needs to fill in the remaining preference fields before 
generating the list.

═══════════════════════════════════════════════════════════════════════════════
ARCHITECTURE OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

The flow has 4 stages:
1. INPUT METHOD SELECTION — User chooses between "Manual Entry" (existing) or "Upload Application Form" (new)
2. IMAGE UPLOAD & AI EXTRACTION — User uploads image, frontend sends it to a NEW backend endpoint for AI processing
3. REVIEW + COMPLETE MISSING FIELDS — User reviews extracted data, corrects if needed, fills in preferences
4. GENERATE LIST — Same existing POST /api/v1/get-cutoffs call with the combined data

═══════════════════════════════════════════════════════════════════════════════
STAGE 1: INPUT METHOD SELECTION
═══════════════════════════════════════════════════════════════════════════════

Add a toggle/tab/card selector at the TOP of the list generation page with two options:
  - 📝 "Enter Details Manually" (current flow, default)
  - 📸 "Upload Application Form" (new flow)

When user selects "Upload Application Form", show the image upload UI (Stage 2) instead of 
the current manual form. The manual form should still work exactly as before when selected.

Design: Use a visually prominent card-style toggle. The "Upload" option should feel modern and 
inviting — use an upload icon, a dashed-border drop zone, and supporting text like 
"Upload your MHT-CET Application Form and we'll extract your details automatically".

═══════════════════════════════════════════════════════════════════════════════
STAGE 2: IMAGE UPLOAD & AI EXTRACTION
═══════════════════════════════════════════════════════════════════════════════

UI Components:
- A drag-and-drop zone OR file picker button
- Accepted formats: JPEG, PNG, WEBP (max 10MB)
- Show image preview after selection
- "Extract Details" button to trigger AI processing
- Loading state with a spinner/skeleton while AI processes (expect 3-8 seconds)
- Error handling: show clear error if image is unreadable or not a valid application form

BACKEND ENDPOINT TO CREATE:
  POST /api/v1/extract-application-form

  Request: multipart/form-data
    - file: the uploaded image file

  Response (200 OK):
  {
    "success": true,
    "extracted_data": {
      "student_name": "DONGARE OM DILIP",
      "user_gender": "Male",
      "user_category": "SBC",
      "user_home_university": "Sant Gadge Baba Amravati University",
      "percentile_cet": 86.6827486,
      "percentile_ai": 73.0983775,
      "is_ews": false,
      "minority_detected": null   // or a string like "Muslim" if detected
    },
    "confidence": "high"   // "high", "medium", or "low"
  }

  Response (422 / 400):
  {
    "success": false,
    "error": "Could not extract data from the uploaded image. Please ensure it is a clear photo of your MHT-CET Application Form."
  }

IMPORTANT FRONTEND BEHAVIOR:
- After successful extraction, transition to Stage 3 (Review + Missing Fields)
- If confidence is "low" or "medium", show a warning banner:
  "⚠️ Some fields may not have been extracted accurately. Please review carefully."
- Store extracted data in component state (NOT submitted to cutoffs API yet)

═══════════════════════════════════════════════════════════════════════════════
STAGE 3: REVIEW EXTRACTED DATA + COLLECT MISSING FIELDS
═══════════════════════════════════════════════════════════════════════════════

This is the CRITICAL stage. Show a form with TWO sections:

SECTION A — "Extracted from Your Form" (pre-filled, editable):
Show these fields pre-filled from AI extraction. User can edit if AI got something wrong.

  1. Student Name        → text input, pre-filled
  2. Gender              → dropdown ("Male" / "Female"), pre-filled
  3. Category            → dropdown (OPEN, OBC, SC, ST, VJ, NT1, NT2, NT3, SBC, SEBC), pre-filled
  4. Home University     → dropdown (values from GET /api/v1/metadata → universities[]), pre-filled
                           IMPORTANT: The extracted university name must be fuzzy-matched to the 
                           closest value in the metadata list. Use case-insensitive substring match.
  5. MHT-CET Percentile → number input (0-100, up to 7 decimal places), pre-filled
  6. JEE Percentile     → number input (0-100, up to 7 decimal places), pre-filled (0.0 if not appeared)
  7. EWS Eligible       → toggle/checkbox, pre-filled

  Visual: Each field should have a small "✨ AI Extracted" badge next to it to indicate it was
  auto-filled. Fields the user manually changes should lose this badge.

SECTION B — "Your Preferences" (user must fill):
These fields are NOT on the application form and must be collected from the user.

  1. Minority Status     → Multi-select checkboxes
                           Options: Muslim, Buddhist, Jain, Christian, Sikh, Parsi, Jewish, 
                           Linguistic Minority
                           Default: none selected (empty array [])
                           If AI detected "minority_detected" value, pre-check it
                           
  2. Preferred Divisions → Multi-select dropdown
                           Values: from GET /api/v1/metadata → divisions (keys)
                           Optional field (can be null)
                           
  3. Preferred Cities    → Multi-select dropdown  
                           Values: from GET /api/v1/metadata → divisions[selectedDivision] (city arrays)
                           Filter cities based on selected divisions
                           Optional field (can be null)
                           
  4. Branch Preferences  → Checkbox group (select at least one):
                           □ Computer Science / IT (maps to is_tech)
                           □ Electronics & Telecom (maps to is_electronic)
                           □ Civil Engineering (maps to is_civil)
                           □ Mechanical Engineering (maps to is_mechanical)
                           □ Electrical Engineering (maps to is_electrical)
                           □ Other Branches (maps to is_other)
                           
  5. Location Flexibility → Radio group:
                           ○ Strict — Only show colleges in my selected locations (value: 1)
                           ○ Moderate — Include nearby upgraded colleges (value: 2)
                           ○ Flexible — Show all possible upgrades regardless of location (value: 3)
                           Default: 1 (Strict)

═══════════════════════════════════════════════════════════════════════════════
STAGE 4: GENERATE LIST
═══════════════════════════════════════════════════════════════════════════════

A prominent "Generate My College List" button at the bottom.

On click:
1. Validate all required fields are filled:
   - user_gender is set
   - user_category is set  
   - user_home_university is set
   - At least one branch preference is selected
   - At least one of percentile_cet or percentile_ai is > 0
   
2. Construct the CutoffRequest JSON body:
   {
     "student_name": <from extracted/edited>,
     "user_gender": <from extracted/edited>,
     "user_category": <from extracted/edited>,
     "user_minority_list": <from user selection, array of strings or []>,
     "user_home_university": <from extracted/edited>,
     "division": <from user selection or null>,
     "city": <from user selection or null>,
     "percentile_cet": <from extracted/edited, number>,
     "percentile_ai": <from extracted/edited, number>,
     "is_tech": <boolean from branch checkbox>,
     "is_civil": <boolean from branch checkbox>,
     "is_mechanical": <boolean from branch checkbox>,
     "is_electrical": <boolean from branch checkbox>,
     "is_electronic": <boolean from branch checkbox>,
     "is_other": <boolean from branch checkbox>,
     "is_ews": <from extracted/edited, boolean>,
     "location_flexibility": <from radio, integer 1/2/3>
   }

3. POST to /api/v1/get-cutoffs (SAME as manual flow)
4. Display results (SAME as manual flow — reuse existing results display component)

═══════════════════════════════════════════════════════════════════════════════
BACKEND: NEW ENDPOINT TO CREATE
═══════════════════════════════════════════════════════════════════════════════

Create a new endpoint in the FastAPI backend:

FILE: app/routers/image_extract.py (new file)
ROUTE: POST /api/v1/extract-application-form
TAGS: ["Image Extraction"]

Implementation:
1. Accept multipart file upload
2. Validate file type (JPEG/PNG/WEBP) and size (< 10MB)
3. Send image to Gemini AI (vision model) with the following structured prompt:

--- START OF AI EXTRACTION PROMPT ---
You are an expert data extraction system. You are given an image of an MHT-CET 2025 
Application Form (from fe2025.mahacet.org). Extract the following fields and return them 
as a JSON object. Be precise with numbers — preserve all decimal places.

Extract these fields:
1. student_name: The candidate's full name (from "Candidate's Full Name" row)
2. user_gender: "Male" or "Female" (from "Gender" row)
3. user_category: The reservation category WITHOUT any G/L prefix (from "Category" row).
   Valid values: OPEN, OBC, SC, ST, VJ, NT1, NT2, NT3, SBC, SEBC
4. user_home_university: The full university name (from "Home University" row)
5. percentile_cet: The MHT-CET PCM Total score as a decimal number (from "MHT-CET 2025 PCM 
   Details" section, the "Total: PCM" value). Set to 0.0 if section says "Not Appeared" or 
   is absent.
6. percentile_ai: The JEE Main Total score as a decimal number (from "JEE (Main) 2025" 
   section, the "Total:" value). Set to 0.0 if section says "Not Appeared" or is absent.
7. is_ews: true if "Applied for EWS" is "Yes", false if "No"
8. minority_detected: The minority type if "Minority Candidature Type" shows a specific 
   minority (e.g., "Muslim", "Buddhist"). Set to null if it shows "No" or is empty.

Return ONLY a valid JSON object with exactly these 8 keys. No markdown, no explanation.
Example:
{
  "student_name": "DONGARE OM DILIP",
  "user_gender": "Male",
  "user_category": "SBC",
  "user_home_university": "Sant Gadge Baba Amravati University",
  "percentile_cet": 86.6827486,
  "percentile_ai": 73.0983775,
  "is_ews": false,
  "minority_detected": null
}
--- END OF AI EXTRACTION PROMPT ---

4. Parse the AI response as JSON
5. Validate the extracted fields (check types, ranges)
6. Determine confidence level:
   - "high" if all 7 core fields are non-null and percentiles are within 0-100
   - "medium" if 1-2 fields are missing or look suspicious
   - "low" if 3+ fields are missing
7. Return the structured response

REGISTER THE ROUTER in app/main.py:
  from app.routers import image_extract
  app.include_router(image_extract.router, prefix="/api/v1", tags=["Image Extraction"])

═══════════════════════════════════════════════════════════════════════════════
UI/UX DESIGN REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. The image upload flow should feel like a PREMIUM, AI-powered experience
2. Use smooth transitions between stages (slide or fade animations)
3. Show a progress indicator (Step 1 → Step 2 → Step 3 style)
4. The "AI Extracted" badges should have a subtle shimmer/glow animation
5. The drag-and-drop zone should have a pulsing border animation on hover
6. Error states should be clear with red borders and descriptive messages
7. Mobile responsive — camera capture should be available on mobile devices
   (use accept="image/*" capture="environment" on the file input)
8. The "Generate" button should be disabled until all required fields are valid

═══════════════════════════════════════════════════════════════════════════════
EDGE CASES TO HANDLE
═══════════════════════════════════════════════════════════════════════════════

1. User uploads a non-application-form image → Show "This doesn't appear to be a valid 
   MHT-CET Application Form" error
2. Image is blurry/low quality → AI returns partial data → Show "medium"/"low" confidence 
   warning + let user fill in missing fields manually
3. JEE section shows "Appeared for JEE: No" → percentile_ai should be 0.0
4. NEET section present → Ignore it (not relevant)
5. Pharmacy form uploaded → Still extract the common fields, but warn user that pharmacy 
   uses a different endpoint (POST /api/v1/get-pharmacy-cutoffs)
6. University name doesn't exactly match metadata → Use fuzzy matching (Levenshtein or 
   includes-based) to find the closest match from the metadata universities list
7. User wants to re-upload → Allow clearing the current extraction and starting over
```

---

## Summary of Field Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    CutoffRequest Fields (17)                     │
├─────────────────────┬───────────────────────────────────────────┤
│   FROM IMAGE (7)    │         FROM USER INPUT (10)              │
├─────────────────────┼───────────────────────────────────────────┤
│ ✅ student_name      │ ❌ user_minority_list                     │
│ ✅ user_gender       │ ❌ division                               │
│ ✅ user_category     │ ❌ city                                   │
│ ✅ user_home_univ    │ ❌ is_tech                                │
│ ✅ percentile_cet    │ ❌ is_civil                               │
│ ✅ percentile_ai     │ ❌ is_mechanical                          │
│ ✅ is_ews            │ ❌ is_electrical                           │
│                     │ ❌ is_electronic                           │
│                     │ ❌ is_other                                │
│                     │ ❌ location_flexibility                    │
└─────────────────────┴───────────────────────────────────────────┘
```
