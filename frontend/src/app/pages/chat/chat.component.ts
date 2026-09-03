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

  // NUEVAS PROPIEDADES PARA EL GENERADOR DE CV
  isGeneratingCv = false;
  cvGeneratorUserId: string | null = null;
  cvGeneratorStep = 0;
  cvGeneratorProgress = 0;
  cvPreviewHtml = '';
  isWaitingForAnswer = false;

  constructor(
    private readonly joblyAiService: JoblyAiService
  ) {
    this.loadSession();

    if (this.messages.length === 0) {
     this.addAssistantMessage(
`Soy Jobly AI 🤖.

Puedo ayudarte a:

 Buscar empleo 💼.
 Crear o mejorar tu CV 📄.
 Prepararte para entrevistas 🎯.
 Resolver dudas sobre programación y tecnología 💻.

Puedes comenzar escribiendo una pregunta o subir tu CV cuando quieras.`
);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.addAssistantMessage(
        'El archivo debe estar en formato PDF.'
      );

      input.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      this.addAssistantMessage(
        'El PDF no puede superar los 5 MB.'
      );

      input.value = '';
      return;
    }

    this.selectedFile = file;

    /*
     * Permite volver a subir el mismo archivo posteriormente.
     */
    input.value = '';

    this.analyzeCv();
  }

  analyzeCv(): void {
    if (!this.selectedFile || this.isAnalyzing) {
      return;
    }

    this.isAnalyzing = true;

    /*
     * Al cambiar el CV se eliminan resultados anteriores.
     */
    this.availableJobs = [];
    this.recommendedJobs = [];
    this.selectedJob = null;

    localStorage.removeItem('jobly_recommended_jobs');
    localStorage.removeItem('jobly_selected_job');

    this.addUserMessage(
      `He subido mi CV: ${this.selectedFile.name}`
    );

    this.addAssistantMessage(
      'Estoy analizando tu CV...'
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
              'Pude leer tu CV, pero no encontré habilidades técnicas conocidas para compararlas con las vacantes.'
            );

            return;
          }

          this.addAssistantMessage(
            `He detectado estas habilidades: ${this.cvSkills.join(', ')}.`
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
            'No pude analizar el CV. Verifica que la API esté activa y que el archivo sea un PDF válido.'
          );
        }
      });
  }

  /*
   * Primero obtiene las vacantes reales de Jobly.
   */
  findRecommendedJobs(): void {
    if (this.isLoadingJobs) {
      return;
    }

    this.isLoadingJobs = true;

    this.addAssistantMessage(
      'Ahora estoy consultando las vacantes de Adzuna y Arbeitnow para encontrar las mejores para ti...'
    );

    this.joblyAiService
      .getJobs()
      .subscribe({
        next: response => {
          this.availableJobs = response.data ?? [];

          if (this.availableJobs.length === 0) {
            this.isLoadingJobs = false;

            this.addAssistantMessage(
              'No encontré vacantes disponibles en este momento.'
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
            'No pude consultar las vacantes de Adzuna y Arbeitnow. Verifica que el endpoint /api/jobs esté funcionando.'
          );
        }
      });
  }

  /*
   * Envía las vacantes reales y las habilidades del CV
   * a FastAPI para calcular compatibilidad.
   */
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
              'No encontré vacantes compatibles con las habilidades detectadas.'
            );

            return;
          }

          this.messages.push({
            role: 'assistant',
            content:
              `Encontré ${this.recommendedJobs.length} vacantes que coinciden mejor con tu perfil:`,
            type: 'jobs',
            jobs: this.recommendedJobs
          });

          this.addAssistantMessage(
            'Selecciona una vacante para analizarla o pregúntame cómo puedes mejorar tu CV.'
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
            'Encontré las vacantes, pero no pude calcular cuáles son las más compatibles.'
          );
        }
      });
  }

  selectJob(job: RecommendedJob): void {
    const fullJob = this.availableJobs.find(
      availableJob =>
        availableJob.slug === job.slug ||
        availableJob.slug === job.id
    );

    if (!fullJob) {
      this.addAssistantMessage(
        'No pude recuperar los datos completos de esta vacante.'
      );

      return;
    }

    this.selectedJob = fullJob;

    localStorage.setItem(
      'jobly_selected_job',
      JSON.stringify(this.selectedJob)
    );

    this.addUserMessage(
      `Quiero analizar la vacante: ${job.title}`
    );

    this.requestChatResponse(
      '¿Qué tan bien encajo en esta vacante?'
    );
  }

  // ============================================
  // MÉTODO PRINCIPAL DE ENVÍO DE MENSAJES
  // ============================================

  sendMessage(): void {
    const message = this.userMessage.trim();

    if (!message || this.isSending) {
      return;
    }

    // Si estamos en modo generación de CV, enviar como respuesta de la entrevista
    if (this.isGeneratingCv && this.isWaitingForAnswer) {
      const cvAnswer = message;
      this.userMessage = '';
      this.sendCvAnswer(cvAnswer);
      return;
    }

    // Flujo normal del chat
    if (
      this.requiresCv(message) &&
      (!this.cvUploaded || this.cvSkills.length === 0)
    ) {
      this.addAssistantMessage(
        '📄 Para responder esa pregunta primero necesito analizar tu CV. Puedes subirlo cuando quieras.'
      );
      return;
    }

    this.userMessage = '';
    this.addUserMessage(message);
    this.requestChatResponse(message);
  }

  sendQuickAction(action: string): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        'Primero sube tu CV para poder analizar tu perfil.'
      );

      return;
    }

    this.addUserMessage(action);
    this.requestChatResponse(action);
  }

  // ============================================
  // MÉTODOS PARA LAS TARJETAS DE BIENVENIDA
  // ============================================

  createCv(): void {
    if (this.isGeneratingCv) {
      return;
    }

    // Generar un ID único para la sesión
    this.cvGeneratorUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    this.isGeneratingCv = true;
    this.isWaitingForAnswer = true;
    
    this.addAssistantMessage('Iniciando el generador de CV...');
    
    this.joblyAiService.startCvGeneration(this.cvGeneratorUserId).subscribe({
      next: (response) => {
        if (response.success) {
          this.addAssistantMessage(response.message);
          
          // Mostrar los botones de opciones si existen
          if (response.buttons && response.buttons.length > 0) {
            // Agregar mensaje con botones de opciones
            this.addAssistantMessage(
              'Selecciona una opción para comenzar: ' + response.buttons.join(' | ')
            );
          }
          
          // Actualizar preview del CV si existe
          if (response.cv_preview) {
            this.cvPreviewHtml = response.cv_preview;
          }
        }
        
        this.saveMessages();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error al iniciar generador de CV:', error);
        this.isGeneratingCv = false;
        this.isWaitingForAnswer = false;
        this.addAssistantMessage('No pude iniciar el generador de CV. Intenta de nuevo más tarde.');
      }
    });
  }

  searchRecommendedJobs(): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        'Primero sube tu CV para poder buscar vacantes compatibles con tu perfil.'
      );

      return;
    }

    if (this.isLoadingJobs) {
      return;
    }

    this.addUserMessage(
      'Buscar vacantes compatibles con mi perfil'
    );

    this.findRecommendedJobs();
  }

  analyzeProfile(): void {
    if (!this.cvUploaded || this.cvSkills.length === 0) {
      this.addAssistantMessage(
        'Primero sube tu CV para que pueda analizar tus habilidades y fortalezas.'
      );

      return;
    }

    this.addUserMessage(
      'Analiza mi perfil profesional'
    );

    this.requestChatResponse(
      'Analiza mi perfil profesional. Resume mis principales habilidades, fortalezas y áreas que debería mejorar.'
    );
  }

  // ============================================
  // NUEVO MÉTODO: REQUIERE CV
  // ============================================

  private requiresCv(message: string): boolean {
    const text = message.toLowerCase();

    const keywords = [
      'analiza mi cv',
      'analizar mi cv',
      'mejorar mi cv',
      'mis habilidades',
      'habilidades detectadas',
      'compatibilidad de mi cv',
      'qué habilidades tengo'
    ];

    return keywords.some(keyword => text.includes(keyword));
  }

  // ============================================
  // NUEVO MÉTODO: ENVIAR RESPUESTA DEL CV
  // ============================================

  sendCvAnswer(answer: string): void {
    if (!this.cvGeneratorUserId || !this.isWaitingForAnswer || this.isSending) {
      return;
    }

    this.isSending = true;
    this.isWaitingForAnswer = false;
    
    this.addUserMessage(answer);
    
    this.joblyAiService.sendCvAnswer(this.cvGeneratorUserId, answer).subscribe({
      next: (response) => {
        this.isSending = false;
        
        if (response.success) {
          // Actualizar progreso y paso
          if (response.step) {
            this.cvGeneratorStep = response.step;
          }
          if (response.progress !== undefined) {
            this.cvGeneratorProgress = response.progress;
          }
          
          // Actualizar preview del CV
          if (response.cv_preview) {
            this.cvPreviewHtml = response.cv_preview;
          }
          
          // Verificar si el CV está completo
          if (response.is_complete) {
            this.isGeneratingCv = false;
            this.addAssistantMessage(response.message || '¡Tu CV ha sido generado exitosamente!');
            this.addAssistantMessage('Puedes descargar tu CV o seguir mejorándolo con mis sugerencias.');
          } else {
            // Mostrar la siguiente pregunta
            this.isWaitingForAnswer = true;
            
            if (response.question) {
              const stepInfo = response.step_name ? ` (${response.step_name})` : '';
              const progressInfo = response.progress !== undefined ? ` - Progreso: ${response.progress}%` : '';
              
              this.addAssistantMessage(`${response.question}${stepInfo}${progressInfo}`);
            }
          }
        }
        
        this.saveMessages();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error al enviar respuesta del CV:', error);
        this.isSending = false;
        this.isWaitingForAnswer = true;
        this.addAssistantMessage('Hubo un error al procesar tu respuesta. Intenta de nuevo.');
      }
    });
  }

  clearChat(): void {
    localStorage.removeItem('jobly_chat_messages');
    localStorage.removeItem('jobly_cv_skills');
    localStorage.removeItem('jobly_recommended_jobs');
    localStorage.removeItem('jobly_selected_job');

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
    
    // Limpiar estado del generador de CV
    this.isGeneratingCv = false;
    this.cvGeneratorUserId = null;
    this.cvGeneratorStep = 0;
    this.cvGeneratorProgress = 0;
    this.cvPreviewHtml = '';
    this.isWaitingForAnswer = false;

    this.userMessage = '';

    this.addAssistantMessage(
`Soy Jobly AI 🤖.

Puedo ayudarte a:

 Buscar empleo 💼.
 Crear o mejorar tu CV 📄.
 Prepararte para entrevistas 🎯.
 Resolver dudas sobre programación y tecnología 💻.

Puedes comenzar escribiendo una pregunta o subir tu CV cuando quieras.`
);
  }

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

          if (response.response === "__SEARCH_JOBS__") {
            this.addAssistantMessage(
              "🔎 Estoy buscando las vacantes más compatibles con tu perfil..."
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
            'No pude responder en este momento. Revisa que la API de Jobly AI esté funcionando.'
          );
        }
      });
  }

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

  private saveMessages(): void {
    localStorage.setItem(
      'jobly_chat_messages',
      JSON.stringify(this.messages)
    );
  }

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