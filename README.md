# TechHire

### Discover opportunities. Build your future.

TechHire is a web platform designed to help students, developers, and technology professionals find relevant job opportunities. The platform combines job searching with artificial intelligence to analyze a user's CV, identify professional skills, recommend relevant job opportunities, and provide conversational assistance.

The project was developed as a final project for Harvard University's CS50x.

---

## About the Project

Finding a suitable job can be difficult when candidates have to review many different job listings and determine which opportunities match their skills and experience.

TechHire addresses this problem by combining job search functionality with CV analysis and artificial intelligence.

Users can explore job opportunities, filter results, upload their CV, obtain an analysis of their technical skills, receive job recommendations based on their profile, and interact with an AI assistant for questions related to programming, technology, job searching, and professional development.

The goal is to provide a single platform where users can move from discovering opportunities to understanding how their professional profile relates to those opportunities.

---

## Main Features

### Job Search

- Search for job opportunities.
- Filter job listings.
- View information about available positions.
- Support for remote, hybrid, and on-site opportunities when this information is available.
- Save interesting opportunities as favorites.

### CV Analysis

Users can upload their CV in PDF format.

The backend processes the document and extracts relevant professional information, including technical skills.

The extracted skills can then be used as context for the recommendation system and AI assistant.

### Job Recommendations

TechHire uses the information obtained from the user's CV to identify job opportunities that may be relevant to their professional profile.

Recommendations are based primarily on the relationship between detected skills and the technologies or requirements associated with available job listings.

### AI Assistant

TechHire includes a conversational AI assistant that can help users with:

- Programming questions.
- Technology concepts.
- Job searching.
- Professional development.
- Questions related to detected CV skills.
- Questions about a selected job opportunity.

The assistant supports both English and Spanish.

### Multilingual Interface

The application supports multiple languages, allowing users to interact with the platform in English or Spanish.

---

## Technologies Used

| Technology | Purpose |
| --- | --- |
| Angular 17 | Frontend application |
| TypeScript | Application logic |
| RxJS | Reactive programming and asynchronous operations |
| Tailwind CSS | User interface and styling |
| Python | Backend development |
| FastAPI | REST API |
| pypdf | PDF text extraction |
| AI service | Conversational assistant and AI-powered processing |
| Job APIs | Job opportunity data |
| Vercel | Frontend deployment |
| Render | Backend deployment |

---

## Project Architecture

TechHire is divided into a frontend and a backend.

```text
techhire-cs50/
│
├── frontend/
│   ├── api/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── shared/
│   │   └── assets/
│   ├── angular.json
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── cv.py
│   │   │   ├── recommendations.py
│   │   │   └── chat.py
│   │   └── services/
│   │       ├── pdf_service.py
│   │       ├── matching_service.py
│   │       └── chat_service.py
│   └── requirements.txt
│
├── README.md
├── DESIGN.md
└── .gitignore
```

---

## How It Works

The main workflow of TechHire is:

```text
User
  │
  ▼
Angular Frontend
  │
  ├── Search jobs
  │
  ├── Upload CV
  │       │
  │       ▼
  │   Backend API
  │       │
  │       ▼
  │   CV Analysis
  │       │
  │       ▼
  │   Detected Skills
  │       │
  │       ▼
  │   Job Recommendations
  │
  └── AI Assistant
          │
          ▼
      AI Backend
```

The frontend communicates with the backend through HTTP requests. The backend is responsible for processing CV files, handling recommendation requests, and managing conversations with the AI assistant.

---

## Backend API

The backend is implemented as a REST API using FastAPI.

Its main responsibilities include:

### CV

The CV endpoint receives a PDF file, extracts its text, and processes the information needed to identify relevant skills.

### Recommendations

The recommendation endpoint receives information about the user's skills and available job opportunities and returns relevant matches.

### Chat

The chat endpoint receives the user's message and relevant context, such as CV skills or a selected job, and generates an AI-assisted response.

The API also provides OpenAPI documentation through FastAPI.

---

## Design Decisions

One of the main design decisions was to separate the frontend from the backend.

Angular is responsible for the user interface, navigation, job search experience, CV upload, recommendations, and chat interface. The backend handles document processing, recommendation logic, and communication with the AI service.

This separation makes the application easier to maintain and allows the frontend and backend to evolve independently.

Another important decision was to use the user's CV as contextual information rather than treating CV analysis as an isolated feature. The extracted skills can influence the recommendations and provide additional context to the AI assistant.

The interface was designed to be simple and focused on the user's main goal: finding relevant employment opportunities.

---

## Installation

### Frontend

Clone the repository:

```bash
git clone https://github.com/Ezequie1Sc/techhire-cs50.git
```

Enter the frontend directory:

```bash
cd techhire-cs50/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The application will be available at:

```text
http://localhost:4200
```

### Backend

Navigate to the backend directory:

```bash
cd ../backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Start the API according to the backend configuration.

---

## Deployment

The frontend is deployed using Vercel.

The backend API is deployed using Render.

The production application communicates with the deployed backend through HTTP requests.

### Live Application

https://techhire-cs50.vercel.app

### Backend API

https://jobly-ai-api.onrender.com

---

## Demo

Live application:

https://techhire-cs50.vercel.app

GitHub repository:

https://github.com/Ezequie1Sc/techhire-cs50

Project video:

[VIDEO URL WILL BE ADDED HERE]

---

## AI Usage

Artificial intelligence tools were used during the development process as development assistance.

AI assistance was used for tasks such as:

- Exploring implementation approaches.
- Debugging and understanding errors.
- Improving parts of the user interface.
- Reviewing code structure.
- Assisting with the implementation of the conversational assistant.
- Reviewing documentation.

The final application, architecture, functionality, and implementation decisions were reviewed and integrated by the project author.

AI-assisted portions of the code are documented through comments where appropriate, following the CS50x final project requirements.

---

## Future Improvements

Possible future improvements include:

- More advanced job recommendation algorithms.
- Additional job sources.
- More detailed CV analysis.
- Improved matching between job requirements and candidate skills.
- Interview preparation features.
- Additional languages.
- User accounts and persistent profiles.

---

## Author

**Orlando Ezequiel Salazar Cruz**

Computer Systems Engineering Student  
Software Developer

GitHub:

https://github.com/Ezequie1Sc

LinkedIn:

https://www.linkedin.com/in/ezequiel-salazar-194975340/

---

## License

This project is distributed under the MIT License.

---

### TechHire — Connecting talent with opportunities.
