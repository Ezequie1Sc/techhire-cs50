import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- INTERFACES EXISTENTES ---
export interface CvAnalysisResponse {
  success: boolean;
  filename: string;
  text: string;
  skills: string[];
}

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

export interface ChatResponse {
  success: boolean;
  response: string;
}

// --- NUEVA INTERFAZ PARA EL HISTORIAL DEL CHAT ---
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- NUEVAS INTERFACES PARA LA CREACIÓN DEL CV (ENTREVISTA) ---
export interface CvGeneratorStartResponse {
  success: boolean;
  type: 'welcome';
  message: string;
  buttons: string[];
  cv_preview: string;
}

export interface CvGeneratorAnswerResponse {
  success: boolean;
  is_complete?: boolean;          // Solo aparece si terminó
  message?: string;               // Mensaje de finalización
  step?: number;                  // Número de paso actual (1 a 8)
  step_name?: string;             // Nombre del paso (ej: "Educación")
  progress?: number;              // Porcentaje de avance (ej: 50)
  question?: string;              // La pregunta que debe mostrar el chat
  placeholder?: string;           // Texto de placeholder para el input
  cv_preview: string;             // HTML del CV estilo Harvard actualizado
}

@Injectable({
  providedIn: 'root'
})
export class JoblyAiService {
  private readonly aiApiUrl = 'https://jobly-ai-api.onrender.com'; 

  private readonly jobsApiUrl = '/api/jobs';

  constructor(private readonly http: HttpClient) {}

  // --- MÉTODOS EXISTENTES ---

  getJobs(): Observable<JobResponse> {
    return this.http.get<JobResponse>(this.jobsApiUrl);
  }

  analyzeCv(file: File): Observable<CvAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CvAnalysisResponse>(
      `${this.aiApiUrl}/cv/analyze`,
      formData
    );
  }

  getRecommendations(
    cvSkills: string[],
    jobs: Job[]
  ): Observable<RecommendationsResponse> {
    return this.http.post<RecommendationsResponse>(
      `${this.aiApiUrl}/recommendations/`,
      { cv_skills: cvSkills, jobs }
    );
  }

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

  // --- NUEVOS MÉTODOS PARA CREACIÓN DE CV (ENTREVISTA CON IA) ---

  /**
   * Inicia el proceso de creación de CV.
   * @param userId Un identificador único para mantener la sesión (ej: un UUID o timestamp + random).
   */
  startCvGeneration(userId: string): Observable<CvGeneratorStartResponse> {
    return this.http.post<CvGeneratorStartResponse>(
      `${this.aiApiUrl}/cv-generator/start`,
      { user_id: userId }
    );
  }

  /**
   * Envía la respuesta del usuario y obtiene la siguiente pregunta + el CV actualizado.
   * @param userId El mismo identificador único usado en startCvGeneration.
   * @param answer La respuesta que escribió el usuario en el input.
   */
  sendCvAnswer(userId: string, answer: string): Observable<CvGeneratorAnswerResponse> {
    return this.http.post<CvGeneratorAnswerResponse>(
      `${this.aiApiUrl}/cv-generator/answer`,
      { user_id: userId, answer: answer }
    );
  }
}