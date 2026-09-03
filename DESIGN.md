# TechHire — Design Document

## 1. Overview

TechHire is a web-based job search platform that combines employment opportunities with CV analysis, job recommendations, and an AI conversational assistant.

The project is divided into two main parts:

- **Frontend:** Angular 17 application responsible for the user interface and interaction.
- **Backend:** Python REST API responsible for CV processing, recommendations, and communication with the AI service.

This separation allows each part of the application to have a clear responsibility and makes the system easier to maintain and extend.

---

## 2. Application Architecture

The general architecture is:

```text
+-----------------------+
|       User            |
+-----------+-----------+
            |
            v
+-----------------------+
|   Angular 17          |
|   Frontend             |
|                        |
| - Job Search           |
| - Filters              |
| - Favorites            |
| - CV Upload            |
| - Recommendations      |
| - AI Chat              |
+-----------+------------+
            |
          HTTP
            |
            v
+-----------------------+
|   Backend REST API    |
|                        |
| - CV Analysis          |
| - Recommendations      |
| - Chat                 |
+-----------+------------+
            |
            +------------------+
            |                  |
            v                  v
+------------------+   +------------------+
| Job APIs         |   | AI Service       |
+------------------+   +------------------+
```

The frontend does not directly implement the CV processing or AI logic. Instead, it communicates with the backend through HTTP requests.

---

## 3. Frontend Design

The frontend was implemented using Angular 17 and TypeScript.

The application is organized into reusable components, pages, models, and services. This organization keeps presentation logic separated from application and communication logic.

The main responsibilities of the frontend are:

- Displaying available job opportunities.
- Searching and filtering jobs.
- Displaying job details.
- Managing favorite opportunities.
- Uploading CV files.
- Displaying CV analysis results.
- Displaying recommended jobs.
- Providing the conversational AI interface.
- Supporting English and Spanish.

Angular services are used for communication with external APIs. This prevents individual UI components from having to implement HTTP communication independently.

RxJS is used where asynchronous streams and HTTP responses need to be handled.

---

## 4. Backend Design

The backend provides a REST API that acts as the bridge between the Angular application and external services.

The backend is responsible for:

- Receiving CV files.
- Extracting text from PDF documents.
- Identifying relevant skills.
- Processing job recommendation requests.
- Handling AI chat requests.
- Providing contextual information to the AI assistant.

The backend is separated into routers and services so that API endpoints and processing logic are not unnecessarily coupled.

The main API areas are:

```text
routers/
├── cv.py
├── recommendations.py
└── chat.py
```

Services contain the processing logic required by these routes.

---

## 5. CV Analysis Flow

CV analysis is designed as a multi-step process.

```text
PDF CV
  |
  v
Upload
  |
  v
Backend
  |
  v
PDF text extraction
  |
  v
Skill identification
  |
  v
Detected skills
  |
  +--------------------+
  |                    |
  v                    v
Recommendations     AI context
```

The frontend sends the uploaded CV to the backend. The backend processes the PDF and extracts relevant text.

The resulting information is used to identify technical skills. These skills become useful context for the recommendation functionality and, when appropriate, the AI assistant.

This design makes CV analysis useful beyond simply displaying a list of extracted skills.

---

## 6. Job Recommendation Design

The recommendation functionality connects the user's professional profile with available job opportunities.

The general process is:

```text
Detected CV Skills
        |
        v
Job Requirements / Technologies
        |
        v
Matching Process
        |
        v
Relevant Opportunities
```

The purpose of this process is not to replace the user's decision, but to reduce the amount of manual searching required.

The recommendations are presented as job opportunities that have a relevant relationship with the user's detected skills.

---

## 7. AI Assistant Design

The AI assistant is implemented as a conversational feature within the frontend.

The frontend sends the user's message to the backend. When additional context is relevant, the request can also contain information such as detected CV skills or a selected job.

The backend builds the appropriate context and communicates with the AI service.

The general flow is:

```text
User message
     |
     v
Angular Chat
     |
     v
Backend Chat Endpoint
     |
     v
Context + Conversation History
     |
     v
AI Service
     |
     v
AI Response
     |
     v
Angular Chat
```

The assistant supports both English and Spanish. The application also uses explicit language context so that the assistant can respond in the language requested by the user.

The assistant is intended for questions about programming, technology, employment, professional development, CV-related information, and selected job opportunities.

---

## 8. State and Data Flow

The application follows a client-server data flow.

For job search:

```text
Job API
   |
   v
Backend / API service
   |
   v
Angular service
   |
   v
Job components
   |
   v
User interface
```

For CV analysis:

```text
User
 |
 v
CV upload component
 |
 v
Angular service
 |
 v
Backend CV endpoint
 |
 v
Analysis result
 |
 v
Frontend result view
```

For chat:

```text
User
 |
 v
Chat component
 |
 v
Chat service
 |
 v
Backend
 |
 v
AI service
 |
 v
Chat response
 |
 v
Chat component
```

Keeping these flows explicit makes the application easier to debug and maintain.

---

## 9. Internationalization

TechHire supports English and Spanish.

The frontend uses a translation service to provide localized interface text. The language selection also affects the text displayed by the chat interface.

The backend uses the language context of the user's message and conversation to help maintain the appropriate response language.

This was important because the application is intended for users in different linguistic contexts.

---

## 10. Design Decisions

### Separation of frontend and backend

Angular handles presentation and user interaction, while Python handles server-side processing. This separation avoids placing document processing and AI communication directly inside the browser.

### Reusable services

API communication is implemented through Angular services. This allows multiple components to use the same communication logic without duplicating HTTP code.

### CV as contextual information

The CV is not treated only as a document to analyze. The extracted skills can also provide context for recommendations and AI interactions.

### Focused user interface

The interface prioritizes the main employment workflow: discover opportunities, understand the user's profile, find relevant jobs, and obtain assistance.

### Responsive design

Tailwind CSS is used to create a responsive interface that can adapt to desktop and mobile screen sizes.

---

## 11. Deployment

The frontend is deployed on Vercel and the backend is deployed on Render.

The production frontend communicates with the deployed backend using HTTP requests.

```text
User
 |
 v
Vercel
 |
 | HTTPS
 v
Render
 |
 +---- Job APIs
 |
 +---- AI Service
```

This deployment model allows the frontend and backend to be hosted independently.

---

## 12. Limitations

The current version has several limitations.

- Job availability depends on external job APIs.
- CV analysis depends on the quality and structure of the uploaded PDF.
- AI responses may not always be perfect and should be treated as assistance rather than professional advice.
- Recommendation quality depends on the information available in the CV and job listings.
- The application does not attempt to make hiring decisions.

---

## 13. Future Improvements

Potential improvements include:

- More job data sources.
- More sophisticated skill-to-job matching.
- More detailed CV analysis.
- User accounts and persistent profiles.
- Interview preparation tools.
- More advanced career recommendations.
- Additional language support.
- Improved personalization.

---

## 14. AI-Assisted Development

AI tools were used during development as an assistance mechanism.

They were used for activities including debugging, exploring implementation approaches, reviewing code, improving parts of the interface, and assisting with the conversational AI functionality.

The project author reviewed the generated suggestions, adapted them to the application, and made the final implementation and design decisions.

Where required, AI-assisted code is identified through comments in the source code in accordance with the CS50x final project requirements.
