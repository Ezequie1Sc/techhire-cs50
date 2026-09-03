import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ============================================================
// ANÁLISIS DE CV
// ============================================================

export interface CvAnalysisResponse {
  success: boolean;
  filename: string;
  text: string;
  skills: string[];
}

// ============================================================
// EMPLEOS
// ============================================================

export interface Job {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

export interface JobResponse {
  data: Job[];

  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };

  meta?: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

// ============================================================
// RECOMENDACIONES
// ============================================================

export interface RecommendedJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  company_name: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
  compatibility: number;
  strengths: string[];
  missing_skills: string[];
  detected_skills: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  recommended_jobs: RecommendedJob[];
}

// ============================================================
// CHAT
// ============================================================

export interface ChatResponse {
  success: boolean;
  response: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================
// SERVICIO
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class JoblyAiService {

  private readonly aiApiUrl = 'https://jobly-ai-api.onrender.com';

  private readonly jobsApiUrl = '/api/jobs';

  constructor(
    private readonly http: HttpClient
  ) {}

  // ==========================================================
  // OBTENER EMPLEOS
  // ==========================================================

  getJobs(): Observable<JobResponse> {
    return this.http.get<JobResponse>(this.jobsApiUrl);
  }

  // ==========================================================
  // ANALIZAR CV
  // ==========================================================

  analyzeCv(file: File): Observable<CvAnalysisResponse> {

    const formData = new FormData();

    formData.append('file', file);

    return this.http.post<CvAnalysisResponse>(
      `${this.aiApiUrl}/cv/analyze`,
      formData
    );
  }

  // ==========================================================
  // OBTENER RECOMENDACIONES
  // ==========================================================

  getRecommendations(
    cvSkills: string[],
    jobs: Job[]
  ): Observable<RecommendationsResponse> {

    return this.http.post<RecommendationsResponse>(
      `${this.aiApiUrl}/recommendations/`,
      {
        cv_skills: cvSkills,
        jobs
      }
    );
  }

  // ==========================================================
  // CHAT CON JOBLY AI
  // ==========================================================

  sendMessage(
    message: string,
    history: ChatHistoryMessage[],
    cvSkills: string[],
    job: Job | null = null
  ): Observable<ChatResponse> {

    return this.http.post<ChatResponse>(
      `${this.aiApiUrl}/chat/`,
      {
        message,
        history,
        cv_skills: cvSkills,
        job
      }
    );
  }
}