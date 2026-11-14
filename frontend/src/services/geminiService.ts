/**
 * LURNIX Gemini AI Service Layer
 * 
 * Provides an enterprise-ready interface for contextual pedagogical intelligence.
 * Architecture is cleanly decoupled from UI components.
 * 
 * Future Integration:
 * - Can connect to backend proxy endpoint (e.g. /api/gemini/chat) or Firebase AI Logic
 * - Never expose raw GEMINI_API_KEY on the client bundle
 */

export interface GeminiContextPayload {
  videoId?: string;
  sessionTitle: string;
  courseTopic: string;
  currentTimestamp: number;
  formattedTime: string;
  activeTaskId?: string;
  activeTaskTitle?: string;
  recentNotes?: string[];
  userQuery: string;
  mode?: 'standard' | 'simpler' | 'analogy' | 'step_by_step' | 'hinglish';
  transcriptSlice?: string;
}

export interface GeminiResponse {
  answer: string;
  source: 'mock_local_pedagogy' | 'gemini_api';
  suggestedFollowUps?: string[];
  relatedTimestamp?: number;
}

class GeminiService {
  private apiEndpoint: string = import.meta.env.VITE_AI_PROXY_URL || 'http://localhost:8000/api/chat';

  /**
   * Generates a contextual pedagogical response based on active video timestamp and topic.
   */
  async askTutor(payload: GeminiContextPayload): Promise<GeminiResponse> {
    // If backend proxy endpoint is configured, invoke real Gemini API
    if (this.apiEndpoint) {
      try {
        const payloadToSend = {
          video_id: payload.videoId || 'demo_polymers',
          current_timestamp: payload.currentTimestamp,
          query: payload.userQuery,
          mode: payload.mode || 'standard',
        };
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSend),
        });
        if (response.ok) {
          const data = await response.json();
          const related = data.relatedTimestamp ?? (data.citations && data.citations.length > 0 ? data.citations[0].start_sec : undefined);
          return {
            answer: data.text || data.answer,
            source: 'gemini_api',
            suggestedFollowUps: data.suggestedFollowUps,
            relatedTimestamp: related,
          };
        }
      } catch (err) {
        console.warn('[LURNIX GeminiService] Backend proxy unreachable, using local pedagogical engine:', err);
      }
    }

    // High-fidelity fallback / simulated responses (clearly identified as simulated local pedagogical tutor)
    return this.generateSimulatedTutorResponse(payload);
  }

  private generateSimulatedTutorResponse(payload: GeminiContextPayload): Promise<GeminiResponse> {
    return new Promise((resolve) => {
      const lower = payload.userQuery.toLowerCase();
      const topic = payload.courseTopic || payload.sessionTitle || 'this topic';
      const isChemistry = topic.toLowerCase().includes('chem') || topic.toLowerCase().includes('polymer');
      const isNeural = topic.toLowerCase().includes('neural') || topic.toLowerCase().includes('machine') || topic.toLowerCase().includes('ai');
      const isPhysics = topic.toLowerCase().includes('phys') || topic.toLowerCase().includes('electro') || topic.toLowerCase().includes('mechanic');

      let answer = `That is a great question about ${payload.sessionTitle} at ${payload.formattedTime}! The fundamental concept here connects back to the core principles introduced earlier in the lecture. Focus on how the primary components interact in this segment.`;
      let relatedTimestamp: number | undefined;
      let followUps = [
        `Can you break down the main idea at ${payload.formattedTime}?`,
        `What is the key formula or principle here?`,
        `How does this apply to practical problem solving?`
      ];

      if (isChemistry) {
        if (lower.includes('vulcaniz') || lower.includes('cross') || lower.includes('sulfur')) {
          answer = 'Vulcanization is the treatment of natural rubber with sulfur, creating covalent cross-links between polymer chains to increase elasticity and thermal stability.';
          relatedTimestamp = 180;
        } else if (lower.includes('monomer') || lower.includes('chain')) {
          answer = 'A monomer is a repeating unit that bonds through addition or condensation polymerization to assemble high-molecular-weight polymer chains.';
          relatedTimestamp = 60;
        }
        followUps = [
          'What is the difference between addition and condensation?',
          'How does sulfur cross-linking affect elasticity?',
          'Explain thermoplastic vs thermosetting polymers.'
        ];
      } else if (isNeural) {
        if (lower.includes('gradient') || lower.includes('descent') || lower.includes('loss')) {
          answer = 'Gradient descent iteratively updates model weights in the direction of the negative gradient of the loss function, minimizing prediction error.';
          relatedTimestamp = 320;
        } else if (lower.includes('backprop') || lower.includes('chain')) {
          answer = 'Backpropagation applies the chain rule of calculus to compute loss gradients with respect to each weight, propagating error signals backward from output to input.';
          relatedTimestamp = 720;
        }
        followUps = [
          'How does the learning rate affect gradient descent?',
          'Why is the chain rule critical for backpropagation?',
          'What is the role of activation functions in neural nets?'
        ];
      } else if (isPhysics) {
        if (lower.includes('faraday') || lower.includes('flux') || lower.includes('emf')) {
          answer = "Faraday's law states that the induced electromotive force (EMF) is proportional to the negative rate of change of magnetic flux through the circuit: EMF = -dΦ/dt.";
          relatedTimestamp = 480;
        }
        followUps = [
          "State Lenz's law and its relation to energy conservation.",
          'How does self-inductance differ from mutual inductance?',
          'Explain the operating principle of an AC generator.'
        ];
      } else {
        // Universal academic explanation for any subject (Math, Calculus, Biology, etc.)
        if (lower.includes('help') || lower.includes('quiz') || lower.includes('task')) {
          answer = `For your active checkpoint (${payload.activeTaskTitle || 'Check'}): Review the concept introduced in this section. Think about the fundamental definition and identify what changes vs what stays constant.`;
        } else if (lower.includes('summar') || lower.includes('recap')) {
          answer = `Summary for "${payload.sessionTitle}": We are exploring the core foundations of this topic. The video breaks down the mechanism step by step, demonstrating practical applications.`;
        }
      }

      setTimeout(() => {
        resolve({
          answer,
          source: 'mock_local_pedagogy',
          suggestedFollowUps: followUps,
          relatedTimestamp,
        });
      }, 500);
    });
  }
}

export const geminiService = new GeminiService();

