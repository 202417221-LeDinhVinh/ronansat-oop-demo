# RonanSAT v2 REST API Documentation

This document describes all REST API endpoints implemented in RonanSAT v2, following our layered Object-Oriented Architecture. All route handlers in Next.js App Router are thin delegation wrappers passing requests into BaseController instances instantiated by the Container.

---

## 1. Authentication

### Register Student
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None (Public)
- **Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "User registered successfully",
    "userId": "673..."
  }
  ```

### Login / Session
Managed by NextAuth credentials provider at `/api/auth/callback/credentials`.

---

## 2. Tests & Questions

### List All Tests
- **Method**: `GET`
- **Path**: `/api/tests`
- **Auth**: None (Public)
- **Response** (`200 OK`):
  ```json
  {
    "tests": [
      {
        "_id": "673...",
        "title": "SAT Practice Test #1",
        "timeLimit": 134,
        "difficulty": "medium",
        "sections": [
          { "name": "Reading and Writing", "module": 1, "questionsCount": 27, "timeLimit": 32 },
          { "name": "Reading and Writing", "module": 2, "questionsCount": 27, "timeLimit": 32 },
          { "name": "Math", "module": 1, "questionsCount": 22, "timeLimit": 35 },
          { "name": "Math", "module": 2, "questionsCount": 22, "timeLimit": 35 }
        ],
        "questionsCount": 98,
        "createdAt": "2026-11-16T..."
      }
    ]
  }
  ```

### Get Test Details
- **Method**: `GET`
- **Path**: `/api/tests/[id]`
- **Auth**: None (Public)
- **Response** (`200 OK`):
  ```json
  {
    "test": {
      "_id": "673...",
      "title": "SAT Practice Test #1",
      "timeLimit": 134,
      "difficulty": "medium",
      "sections": [...],
      "questions": ["673..."]
    }
  }
  ```

### Get Questions for a Test
- **Method**: `GET`
- **Path**: `/api/questions?testId=<testId>&section=<optional>&module=<optional>`
- **Auth**: None (Public)
- **Response** (`200 OK`):
  ```json
  {
    "questions": [
      {
        "_id": "673...",
        "testId": "673...",
        "section": "Reading and Writing",
        "module": 1,
        "questionText": "Which choice completes the text with the most logical and precise word or phrase?",
        "passage": "...",
        "choices": ["anachronism", "ephemeral", "hackneyed", "fastidious"],
        "questionType": "multiple_choice",
        "difficulty": "medium",
        "points": 10,
        "domain": "Craft and Structure",
        "skill": "Words in Context",
        "imageUrl": null
      }
    ]
  }
  ```

### Get Question Explanation
- **Method**: `GET`
- **Path**: `/api/questions/[id]/explanation`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "explanation": "<p><strong>Step-by-step breakdown:</strong> ...</p>"
  }
  ```

---

## 3. Practice & Attempts

### Start a New Attempt
- **Method**: `POST`
- **Path**: `/api/attempts/start`
- **Auth**: Required (`student` or `admin`)
- **Body**:
  ```json
  {
    "testId": "673...",
    "mode": "full_length" // or "sectional"
    // "sectionalSubject": "Reading and Writing", (optional if sectional)
    // "sectionalModule": 1 (optional if sectional)
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "attemptId": "673...",
    "attempt": {
      "_id": "673...",
      "userId": "673...",
      "testId": "673...",
      "mode": "full_length",
      "status": "in_progress",
      "startedAt": "2026-11-16T..."
    }
  }
  ```

### Record an Answer
- **Method**: `POST`
- **Path**: `/api/attempts/[id]/answer`
- **Auth**: Required (Owner of attempt)
- **Body**:
  ```json
  {
    "questionId": "673...",
    "answer": "B" // or SPR free-response text e.g. "28" or "5/2"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "recorded": true,
    "isCorrect": true
  }
  ```

### Submit an Attempt
- **Method**: `POST`
- **Path**: `/api/attempts/[id]/submit`
- **Auth**: Required (Owner of attempt)
- **Body**: `{}`
- **Response** (`200 OK`):
  ```json
  {
    "message": "Attempt submitted successfully",
    "attemptId": "673...",
    "score": {
      "total": 1540,
      "sectionScores": {
        "readingAndWriting": 770,
        "math": 770
      },
      "rawCorrectCounts": {
        "readingAndWriting": 52,
        "math": 43,
        "total": 95
      },
      "totalQuestions": 98,
      "isSectional": false
    }
  }
  ```

---

## 4. Results

### List Student Results
- **Method**: `GET`
- **Path**: `/api/results`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "results": [
      {
        "_id": "673...",
        "testId": "673...",
        "userId": "673...",
        "mode": "full_length",
        "score": 1540,
        "sectionBreakdown": { "readingAndWriting": 770, "math": 770 },
        "answersCount": 98,
        "date": "2026-11-14T..."
      }
    ]
  }
  ```

### Get Result Details (Review Mode)
- **Method**: `GET`
- **Path**: `/api/results/[id]`
- **Auth**: Required (Owner or Admin)
- **Response** (`200 OK`):
  ```json
  {
    "result": {
      "_id": "673...",
      "testId": { "_id": "673...", "title": "SAT Practice Test #1" },
      "score": 1540,
      "sectionBreakdown": { "readingAndWriting": 770, "math": 770 },
      "rawCorrectCounts": { "readingAndWriting": 52, "math": 43, "total": 95 },
      "answers": [
        {
          "questionId": {
            "_id": "673...",
            "questionText": "...",
            "choices": [...],
            "correctAnswer": "...",
            "explanation": "..."
          },
          "userAnswer": "A",
          "isCorrect": true
        }
      ]
    }
  }
  ```

### Single-Payload Submission (V1 Engine Compatibility)
- **Method**: `POST`
- **Path**: `/api/results`
- **Auth**: Required (`student` or `admin`)
- **Body**:
  ```json
  {
    "testId": "673...",
    "isSectional": false,
    "answers": [
      { "questionId": "673...", "userAnswer": "A" }
    ]
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "result": {
      "_id": "673...",
      "testId": "673...",
      "score": 1520,
      "sectionBreakdown": { "readingAndWriting": 760, "math": 760 }
    }
  }
  ```

---

## 5. Error Log

### Get Deduplicated Error Log
- **Method**: `GET`
- **Path**: `/api/error-log?section=<>&domain=<>&skill=<>&reason=<>&status=<>`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "entries": [
      {
        "_id": "673...",
        "userId": "673...",
        "timesMissed": 2,
        "reason": "Careless",
        "note": "Re-read equations with signs carefully.",
        "status": "open",
        "lastAttemptedAt": "2026-11-15T...",
        "resolvedAt": null,
        "testTitle": "SAT Practice Test #1",
        "question": {
          "_id": "673...",
          "questionText": "In the given equation, k is a constant...",
          "questionType": "spr",
          "acceptedAnswers": ["28"],
          "explanation": "..."
        }
      }
    ],
    "totalCount": 1
  }
  ```

### Update Mistake Classification / Note / Status
- **Method**: `PATCH`
- **Path**: `/api/error-log/[id]`
- **Auth**: Required (Owner of entry)
- **Body**:
  ```json
  {
    "reason": "Concept gap",
    "note": "Review quadratic formula vertex properties.",
    "status": "resolved"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Error log entry updated",
    "entry": {
      "_id": "673...",
      "reason": "Concept gap",
      "note": "Review quadratic formula vertex properties.",
      "status": "resolved"
    }
  }
  ```

### Retry Mistake Question Inline
- **Method**: `POST`
- **Path**: `/api/error-log/[id]/retry`
- **Auth**: Required (Owner of entry)
- **Body**:
  ```json
  {
    "answer": "28"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "isCorrect": true,
    "status": "resolved",
    "timesMissed": 2
  }
  ```

---

## 6. Statistics

### Get Performance Analytics Snapshot
- **Method**: `GET`
- **Path**: `/api/statistics`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "statistics": {
      "totalTestsTaken": 7,
      "highestScore": 1540,
      "latestScore": 1540,
      "averageScore": 1465,
      "questionsAnswered": 420,
      "scoreTrend": [
        { "attemptId": "...", "testTitle": "SAT Practice Test #1", "date": "2026-10-05", "score": 1420, "mode": "full_length" }
      ],
      "sectionAccuracy": [
        { "section": "Reading and Writing", "correct": 182, "total": 216, "percentage": 84 },
        { "section": "Math", "correct": 178, "total": 204, "percentage": 87 }
      ],
      "strongestSkills": [
        { "domain": "Algebra", "skill": "Linear equations in one variable", "accuracy": 96, "questionsAnswered": 28 }
      ],
      "weakestSkills": [
        { "domain": "Advanced Math", "skill": "Nonlinear functions", "accuracy": 68, "questionsAnswered": 25 }
      ],
      "activityHeatmap": [
        { "date": "2026-10-05", "count": 1 }
      ]
    }
  }
  ```

---

## 7. Vocabulary & Spaced Repetition

### Get Decks
- **Method**: `GET`
- **Path**: `/api/vocab/decks`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "decks": [
      {
        "_id": "673...",
        "title": "Essential SAT Vocabulary (Core 30)",
        "description": "Must-know words frequently appearing in SAT Reading & Writing passages.",
        "isSystem": true,
        "totalCards": 30,
        "dueCount": 6
      }
    ],
    "totalDueToday": 18
  }
  ```

### Create Custom Deck
- **Method**: `POST`
- **Path**: `/api/vocab/decks`
- **Auth**: Required (`student` or `admin`)
- **Body**:
  ```json
  {
    "title": "My Personal Difficult SAT Words",
    "description": "Words I missed in practice passages."
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "deck": {
      "_id": "673...",
      "title": "My Personal Difficult SAT Words",
      "description": "Words I missed in practice passages.",
      "isSystem": false
    }
  }
  ```

### Get Deck Cards & Study State
- **Method**: `GET`
- **Path**: `/api/vocab/decks/[id]`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "deck": { "_id": "...", "title": "...", "dueCount": 5 },
    "cards": [
      {
        "_id": "673...",
        "word": "Ephemeral",
        "partOfSpeech": "adjective",
        "definition": "Lasting for a very short time; fleeting.",
        "exampleSentence": "The blossoms of cherry trees are famous for their ephemeral spring beauty.",
        "box": 2,
        "isDue": true
      }
    ]
  }
  ```

### Update Custom Deck
- **Method**: `PUT`
- **Path**: `/api/vocab/decks/[id]`
- **Auth**: Required (Owner or Admin)
- **Body**: `{ "title": "New Title", "description": "New Desc" }`

### Delete Custom Deck
- **Method**: `DELETE`
- **Path**: `/api/vocab/decks/[id]`
- **Auth**: Required (Owner or Admin)

### Add Card to Deck
- **Method**: `POST`
- **Path**: `/api/vocab/decks/[id]/cards`
- **Auth**: Required (Owner or Admin)
- **Body**:
  ```json
  {
    "word": "Circumlocution",
    "partOfSpeech": "noun",
    "definition": "The use of many words where fewer would do.",
    "exampleSentence": "He used circumlocution to avoid direct answers."
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "card": {
      "_id": "673...",
      "word": "Circumlocution",
      "box": 1
    }
  }
  ```

### Update Card
- **Method**: `PUT`
- **Path**: `/api/vocab/cards/[id]`
- **Auth**: Required (Owner or Admin)

### Delete Card
- **Method**: `DELETE`
- **Path**: `/api/vocab/cards/[id]`
- **Auth**: Required (Owner or Admin)

### Get Due Cards for Today
- **Method**: `GET`
- **Path**: `/api/vocab/due`
- **Auth**: Required (`student` or `admin`)
- **Response** (`200 OK`):
  ```json
  {
    "dueCards": [...],
    "dueCount": 18
  }
  ```

### Submit Leitner Review Step
- **Method**: `POST`
- **Path**: `/api/vocab/cards/[id]/review`
- **Auth**: Required (`student` or `admin`)
- **Body**:
  ```json
  {
    "grade": "good" // "again" | "hard" | "good" | "easy"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "cardId": "673...",
    "box": 3,
    "nextReviewDate": "2026-11-23T...",
    "intervalDays": 7,
    "reviewCount": 3
  }
  ```

---

## 8. Admin Management (`admin` Role Required)

### Overview Metrics
- **Method**: `GET`
- **Path**: `/api/admin/metrics`
- **Auth**: Admin only (`403 Forbidden` if student)
- **Response** (`200 OK`):
  ```json
  {
    "metrics": {
      "usersCount": 2,
      "testsCount": 2,
      "questionsCount": 196,
      "attemptsCount": 7
    }
  }
  ```

### Tests CRUD
- **Create**: `POST /api/admin/tests`
- **Update**: `PUT /api/admin/tests/[id]`
- **Delete**: `DELETE /api/admin/tests/[id]`

### Questions CRUD
- **Create**: `POST /api/admin/questions`
  Supports both MCQ (`choices`, `correctAnswer`) and SPR (`acceptedAnswers`).
- **Update**: `PUT /api/admin/questions/[id]`
- **Delete**: `DELETE /api/admin/questions/[id]`

### Users & Role Management
- **List Users**: `GET /api/admin/users`
- **Change Role**: `PATCH /api/admin/users/[id]/role`
  Body: `{ "role": "admin" }` or `{ "role": "student" }`

### System Vocab Decks CRUD
- **Create**: `POST /api/admin/vocab/decks`
- **Update**: `PUT /api/admin/vocab/decks/[id]`
- **Delete**: `DELETE /api/admin/vocab/decks/[id]`

---

## 9. User Profile & Settings

- `GET /api/user/settings`: Returns current user details.
- `PUT /api/user/settings`: Updates user name.
- `POST /api/user/password`: Updates password.
- `GET /api/user/stats`: Returns tests taken, highest score, error logs count to review.
