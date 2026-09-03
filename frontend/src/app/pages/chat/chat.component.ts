import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Job,
  JoblyAiService,
  RecommendedJob
} from '../../core/services/jobly-ai.service';

import { TranslationService } from '../../core/i18n/translation.service';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'jobs';
  jobs?: RecommendedJob[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  messages: ChatMessage[] = [];

  userMessage = '';

  cvSkills: string[] = [];
  availableJobs: Job[] = [];
  recommendedJobs: RecommendedJob[] = [];

  selectedJob: Job | null = null;
  selectedFile: File | null = null;

  isAnalyzing = false;
  isLoadingJobs = false;
  isSending = false;
  cvUploaded = false;

  constructor(
    private readonly joblyAiService: JoblyAiService,
    public readonly translation: TranslationService
  ) {
    this.loadSession();

    if (this.messages.length === 0) {
      this.addAssistantMessage(
        this.isSpanish
          ? `Soy Jobly AI 🤖.

Puedo ayudarte a:

Buscar empleo 💼.
Analizar tu CV 📄.
Encontrar vacantes compatibles con tu perfil 🎯.
Resolver dudas sobre programación y tecnología 💻.
Prepararte para entrevistas y mejorar tu perfil profesional 🚀.

Puedes comenzar escribiendo una pregunta o subir tu CV cuando quieras.`
          : `I'm Jobly AI 🤖.

I can help you:

Find jobs 💼.
Analyze your CV 📄.
Find job opportunities that match your profile 🎯.
Answer questions about programming and technology 💻.
Prepare for interviews and improve your professional profile 🚀.

You can start by asking a question or uploading your CV whenever you want.`
      );
    }
  }

  // =========================================================
  // IDIOMA
  // =========================================================

  private get isSpanish(): boolean {
    return this.translation.currentLanguage === 'es';
  }

  // =========================================================
  // SUBIR CV
  // =========================================================

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.addAssistantMessage(
        this.isSpanish
          ? 'El archivo debe estar en formato PDF.'
          : 'The file must be in PDF format.'
      );

      input.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.addAssistantMessage(
        this.isSpanish
          ? 'El PDF no puede superar los 5 MB.'
          : 'The PDF cannot exceed 5 MB.'
      );

      input.value = '';
      return;
    }

    this.selectedFile = file;

    // Permite volver a seleccionar el mismo archivo.
    input.value = '';

    this.analyzeCv();
  }

  // =========================================================
  // ANALIZAR CV
  // =========================================================

  analyzeCv(): void {
    if (!this.selectedFile || this.isAnalyzing) {
      return;
    }

    this.isAnalyzing = true;

    // El nuevo CV reemplaza los resultados anteriores.
    this.availableJobs = [];
    this.recommendedJobs = [];
    this.selectedJob = null;

    localStorage.removeItem('jobly_recommended_jobs');
    localStorage.removeItem('jobly_selected_job');

    this.addUserMessage(
      this.isSpanish
        ? `He subido mi CV: ${this.selectedFile.name}`
        : `I uploaded my CV: ${this.selectedFile.name}`
    );

    this.addAssistantMessage(
      this.isSpanish
        ? 'Estoy analizando tu CV...'
        : 'I am analyzing your CV...'
    );

    this.joblyAiService
      .analyzeCv(this.selectedFile)
      .subscribe({
        next: response => {
          this.isAnalyzing = false;
          this.cvUploaded = true;

          this.cvSkills = response.skills ?? [];

          localStorage.setItem(
            'jobly_cv_skills',
            JSON.stringify(this.cvSkills)
          );

          if (this.cvSkills.length === 0) {
            this.addAssistantMessage(
              this.isSpanish
                ? 'Pude leer tu CV, pero no encontré habilidades técnicas conocidas para compararlas con las vacantes.'
                : 'I could read your CV, but I could not find known technical skills to compare with the available jobs.'
            );

            return;
          }

          this.addAssistantMessage(
            this.isSpanish
              ? `He detectado estas habilidades: ${this.cvSkills.join(', ')}.`
              : `I detected these skills: ${this.cvSkills.join(', ')}.`
          );

          this.findRecommendedJobs();
        },

        error: error => {
          console.error(
            'Error al analizar el CV:',
            error
          );

          this.isAnalyzing = false;

          this.addAssistantMessage(
            this.isSpanish
              ? 'No pude analizar el CV. Verifica que la API esté activa y que el archivo sea un PDF válido.'
              : 'I could not analyze the CV. Make sure the API is active and that the file is a valid PDF.'
          );
        }
      });
  }

  // =========================================================
  // OBTENER VACANTES
  // =========================================================

  findRecommendedJobs(): void {
    if (this.isLoadingJobs) {
      return;
    }

    this.isLoadingJobs = true;

    this.addAssistantMessage(
      this.isSpanish
        ? 'Ahora estoy consultando las vacantes para encontrar las mejores oportunidades para ti...'
        : 'I am now checking available jobs to find the best opportunities for you...'
    );

    this.joblyAiService
      .getJobs()
      .subscribe({
        next: response => {
          this.availableJobs = response.data ?? [];

          if (this.availableJobs.length === 0) {
            this.isLoadingJobs = false;

            this.addAssistantMessage(
              this.isSpanish
                ? 'No encontré vacantes disponibles en este momento.'
                : 'I could not find any available jobs at the moment.'
            );

            return;
          }

          this.requestRecommendations();
        },

        error: error => {
          console.error(
            'Error al obtener las vacantes:',
            error
          );

          this.isLoadingJobs = false;

          this.addAssistantMessage(
            this.isSpanish
              ? 'No pude consultar las vacantes. Verifica que el servicio de empleos esté funcionando.'
              : 'I could not retrieve the available jobs. Make sure the job service is working.'
          );
        }
      });
  }

  // =========================================================
  // CALCULAR RECOMENDACIONES
  // =========================================================

  private requestRecommendations(): void {
    this.joblyAiService
      .getRecommendations(
        this.cvSkills,
        this.availableJobs
      )
      .subscribe({
        next: response => {
          this.isLoadingJobs = false;

          this.recommendedJobs =
            response.recommended_jobs ?? [];

          localStorage.setItem(
            'jobly_recommended_jobs',
            JSON.stringify(this.recommendedJobs)
          );

          if (this.recommendedJobs.length === 0) {
            this.addAssistantMessage(
              this.isSpanish
                ? 'No encontré vacantes compatibles con las habilidades detectadas.'
                : 'I could not find jobs compatible with the skills detected in your CV.'
            );

            return;
          }

          this.messages.push({
            role: 'assistant',
            content: this.isSpanish
              ? `Encontré ${this.recommendedJobs.length} vacantes que coinciden mejor con tu perfil:`
              : `I found ${this.recommendedJobs.length} jobs that best match your profile:`,
            type: 'jobs',
            jobs: this.recommendedJobs
          });

          this.addAssistantMessage(
            this.isSpanish
              ? 'Selecciona una vacante para analizarla o pregúntame cómo puedes mejorar tu perfil profesional.'
              : 'Select a job to analyze it or ask me how you can improve your professional profile.'
          );

          this.saveMessages();
          this.scrollToBottom();
        },

        error: error => {
          console.error(
            'Error al calcular recomendaciones:',
            error
          );

          this.isLoadingJobs = false;

          this.addAssistantMessage(
            this.isSpanish
              ? 'Encontré las vacantes, pero no pude calcular cuáles son las más compatibles.'
              : 'I found the jobs, but I could not calculate which ones are the best match.'
          );
        }
      });
  }

  // =========================================================
  // ANALIZAR UNA VACANTE
  // =========================================================

  selectJob(job: RecommendedJob): void {
    const fullJob = this.availableJobs.find(
      availableJob =>
        availableJob.slug === job.slug ||
        availableJob.slug === job.id
    );

    if (!fullJob) {
      this.addAssistantMessage(
        this.isSpanish
          ? 'No pude recuperar los datos completos de esta vacante.'
          : 'I could not retrieve the complete information for this job.'
      );

      return;
    }

    this.selectedJob = fullJob;

    localStorage.setItem(
      'jobly_selected_job',
      JSON.stringify(this.selectedJob)
    );

    this.addUserMessage(
      this.isSpanish
        ? `Quiero analizar la vacante: ${job.title}`
        : `I want to analyze this job: ${job.title}`
    );

    this.requestChatResponse(
      this.isSpanish
        ? '¿Qué tan bien encajo en esta vacante?'
        : 'How well do I fit this job?'
    );
  }

  // =========================================================
  // ENVIAR MENSAJE
  // =========================================================

  sendMessage(): void {
    const message = this.userMessage.trim();

    if (!message || this.isSending) {
      return;
    }

    /*
     * Algunas preguntas necesitan que primero exista
     * un CV analizado.
     */
    if (
      this.requiresCv(message) &&
      (!this.cvUploaded || this.cvSkills.length === 0)
    ) {
      this.addAssistantMessage(
        this.isSpanish
          ? '📄 Para responder esa pregunta primero necesito analizar tu CV. Puedes subirlo cuando quieras.'
          : '📄 I need to analyze your CV first to answer that question. You can upload it whenever you want.'
      );

      return;
    }

    this.userMessage = '';

    this.addUserMessage(message);

    this.requestChatResponse(message);
  }

  // =========================================================
  // ACCIONES RÁPIDAS
  // =========================================================

  sendQuickAction(action: string): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        this.isSpanish
          ? 'Primero sube tu CV para poder analizar tu perfil.'
          : 'First upload your CV so I can analyze your profile.'
      );

      return;
    }

    this.addUserMessage(action);

    this.requestChatResponse(action);
  }

  // =========================================================
  // TARJETA: BUSCAR VACANTES
  // =========================================================

  searchRecommendedJobs(): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        this.isSpanish
          ? 'Primero sube tu CV para poder buscar vacantes compatibles con tu perfil.'
          : 'First upload your CV so I can find job opportunities that match your profile.'
      );

      return;
    }

    if (this.isLoadingJobs) {
      return;
    }

    this.addUserMessage(
      this.isSpanish
        ? 'Buscar vacantes compatibles con mi perfil'
        : 'Find jobs that match my profile'
    );

    this.findRecommendedJobs();
  }

  // =========================================================
  // TARJETA: ANALIZAR PERFIL
  // =========================================================

  analyzeProfile(): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        this.isSpanish
          ? 'Primero sube tu CV para que pueda analizar tus habilidades y fortalezas.'
          : 'First upload your CV so I can analyze your skills and strengths.'
      );

      return;
    }

    this.addUserMessage(
      this.isSpanish
        ? 'Analiza mi perfil profesional'
        : 'Analyze my professional profile'
    );

    this.requestChatResponse(
      this.isSpanish
        ? 'Analiza mi perfil profesional. Resume mis principales habilidades, fortalezas y áreas que debería mejorar.'
        : 'Analyze my professional profile. Summarize my main skills, strengths and areas I should improve.'
    );
  }

  // =========================================================
  // PREGUNTAS QUE REQUIEREN CV
  // =========================================================

  private requiresCv(message: string): boolean {
    const text = message.toLowerCase();

    const keywords = this.isSpanish
      ? [
          'analiza mi cv',
          'analizar mi cv',
          'mejorar mi cv',
          'mis habilidades',
          'habilidades detectadas',
          'compatibilidad de mi cv',
          'qué habilidades tengo',
          'que habilidades tengo',
          'analiza mi perfil',
          'analizar mi perfil'
        ]
      : [
          'analyze my cv',
          'analyze my resume',
          'improve my cv',
          'improve my resume',
          'my skills',
          'detected skills',
          'cv compatibility',
          'resume compatibility',
          'what skills do i have',
          'analyze my profile'
        ];

    return keywords.some(
      keyword => text.includes(keyword)
    );
  }

  // =========================================================
  // RESPUESTA DEL CHAT IA
  // =========================================================

  private requestChatResponse(
    message: string
  ): void {
    if (this.isSending) {
      return;
    }

    this.isSending = true;

    this.joblyAiService
      .sendMessage(
        message,
        this.messages
          .filter(m => m.type === 'text')
          .slice(-6)
          .map(m => ({
            role: m.role,
            content: m.content
          })),
        this.cvSkills,
        this.selectedJob
      )
      .subscribe({
        next: response => {
          this.isSending = false;

          if (
            response.response === '__SEARCH_JOBS__'
          ) {
            this.addAssistantMessage(
              this.isSpanish
                ? '🔎 Estoy buscando las vacantes más compatibles con tu perfil...'
                : '🔎 I am looking for the jobs that best match your profile...'
            );

            this.findRecommendedJobs();

            return;
          }

          this.addAssistantMessage(
            response.response
          );
        },

        error: error => {
          console.error(
            'Error al enviar el mensaje:',
            error
          );

          this.isSending = false;

          this.addAssistantMessage(
            this.isSpanish
              ? 'No pude responder en este momento. Revisa que la API de Jobly AI esté funcionando.'
              : 'I could not respond at the moment. Make sure the Jobly AI API is working.'
          );
        }
      });
  }

  // =========================================================
  // LIMPIAR CHAT
  // =========================================================

  clearChat(): void {
    localStorage.removeItem(
      'jobly_chat_messages'
    );

    localStorage.removeItem(
      'jobly_cv_skills'
    );

    localStorage.removeItem(
      'jobly_recommended_jobs'
    );

    localStorage.removeItem(
      'jobly_selected_job'
    );

    this.messages = [];

    this.cvSkills = [];
    this.availableJobs = [];
    this.recommendedJobs = [];

    this.selectedJob = null;
    this.selectedFile = null;

    this.cvUploaded = false;

    this.isAnalyzing = false;
    this.isLoadingJobs = false;
    this.isSending = false;

    this.userMessage = '';

    this.addAssistantMessage(
      this.isSpanish
        ? `Soy Jobly AI 🤖.

Puedo ayudarte a:

Buscar empleo 💼.
Analizar tu CV 📄.
Encontrar vacantes compatibles con tu perfil 🎯.
Resolver dudas sobre programación y tecnología 💻.
Prepararte para entrevistas y mejorar tu perfil profesional 🚀.

Puedes comenzar escribiendo una pregunta o subir tu CV cuando quieras.`
        : `I'm Jobly AI 🤖.

I can help you:

Find jobs 💼.
Analyze your CV 📄.
Find job opportunities that match your profile 🎯.
Answer questions about programming and technology 💻.
Prepare for interviews and improve your professional profile 🚀.

You can start by asking a question or uploading your CV whenever you want.`
    );
  }

  // =========================================================
  // MENSAJES
  // =========================================================

  private addUserMessage(
    content: string
  ): void {
    this.messages.push({
      role: 'user',
      content,
      type: 'text'
    });

    this.saveMessages();
    this.scrollToBottom();
  }

  private addAssistantMessage(
    content: string
  ): void {
    this.messages.push({
      role: 'assistant',
      content,
      type: 'text'
    });

    this.saveMessages();
    this.scrollToBottom();
  }

  // =========================================================
  // GUARDAR SESIÓN
  // =========================================================

  private saveMessages(): void {
    localStorage.setItem(
      'jobly_chat_messages',
      JSON.stringify(this.messages)
    );
  }

  // =========================================================
  // CARGAR SESIÓN
  // =========================================================

  private loadSession(): void {
    try {
      const savedMessages =
        localStorage.getItem(
          'jobly_chat_messages'
        );

      const savedSkills =
        localStorage.getItem(
          'jobly_cv_skills'
        );

      const savedRecommendedJobs =
        localStorage.getItem(
          'jobly_recommended_jobs'
        );

      const savedSelectedJob =
        localStorage.getItem(
          'jobly_selected_job'
        );

      if (savedMessages) {
        this.messages =
          JSON.parse(savedMessages);
      }

      if (savedSkills) {
        this.cvSkills =
          JSON.parse(savedSkills);

        this.cvUploaded =
          this.cvSkills.length > 0;
      }

      if (savedRecommendedJobs) {
        this.recommendedJobs =
          JSON.parse(savedRecommendedJobs);
      }

      if (savedSelectedJob) {
        this.selectedJob =
          JSON.parse(savedSelectedJob);
      }
    } catch (error) {
      console.error(
        'No se pudo cargar la sesión:',
        error
      );

      localStorage.removeItem(
        'jobly_chat_messages'
      );

      localStorage.removeItem(
        'jobly_cv_skills'
      );

      localStorage.removeItem(
        'jobly_recommended_jobs'
      );

      localStorage.removeItem(
        'jobly_selected_job'
      );
    }
  }

  // =========================================================
  // SCROLL
  // =========================================================

  private scrollToBottom(): void {
    setTimeout(() => {
      const container =
        this.messagesContainer?.nativeElement;

      if (container) {
        container.scrollTop =
          container.scrollHeight;
      }
    });
  }
}