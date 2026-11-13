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
  sessionTitle: string;
  courseTopic: string;
  currentTimestamp: number;
  formattedTime: string;
  activeTaskId?: string;
  activeTaskTitle?: string;
  recentNotes?: string[];
  userQuery: string;
}

export interface GeminiResponse {
  answer: string;
  source: 'mock_local_pedagogy' | 'gemini_api';
  suggestedFollowUps?: string[];
  relatedTimestamp?: number;
}

class GeminiService {
  private apiEndpoint: string = import.meta.env.VITE_AI_PROXY_URL || '';

  /**
   * Generates a contextual pedagogical response based on active video timestamp and topic.
   */
  async askTutor(payload: GeminiContextPayload): Promise<GeminiResponse> {
    // If backend proxy endpoint is configured, invoke real Gemini API
    if (this.apiEndpoint) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          return {
            answer: data.text || data.answer,
            source: 'gemini_api',
            suggestedFollowUps: data.suggestedFollowUps,
            relatedTimestamp: data.relatedTimestamp,
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
      let answer = `That is an excellent inquiry for the "${payload.sessionTitle}" session at timestamp ${payload.formattedTime}! In polymer chemistry, the relationship between molecular chain arrangement and bulk physical properties governs material durability and elasticity.`;
      let relatedTimestamp: number | undefined;

      if (lower.includes('vulcaniz') || lower.includes('cross') || lower.includes('sulfur')) {
        answer = 'Vulcanization is the chemical treatment of natural polyisoprene (rubber) with elemental sulfur. By creating covalent sulfur disulfide cross-links between adjacent polymer strands, it restrains chain slippage, rendering the elastomer significantly more rigid, elastic, and heat-resistant.';
        relatedTimestamp = 180;
      } else if (lower.includes('monomer') || lower.includes('chain') || lower.includes('repeat')) {
        answer = 'A monomer is a reactive low-molecular-weight molecule (such as ethylene, styrene, or amino acids) capable of bonding with other monomers through addition or condensation polymerization to assemble high-molecular-weight polymer chains.';
        relatedTimestamp = 60;
      } else if (lower.includes('synthetic') || lower.includes('natural') || lower.includes('cellulose')) {
        answer = 'Natural polymers originate biologically (e.g., cellulose in plant cell walls, starch, proteins, and DNA). In contrast, synthetic polymers (e.g., nylon-6,6, polyethylene, Teflon) are synthesized through industrial chemical engineering from petrochemical monomers.';
        relatedTimestamp = 120;
      } else if (lower.includes('thermoplastic') || lower.includes('thermosetting') || lower.includes('melt')) {
        answer = 'Thermoplastics consist of linear or branched chains held by intermolecular van der Waals forces that can be repeatedly melted, reshaped, and recycled. Thermosetting polymers feature irreversible 3D covalent cross-linked networks that decompose rather than melt upon heating.';
        relatedTimestamp = 240;
      } else if (lower.includes('quiz') || lower.includes('task') || lower.includes('help')) {
        answer = `Regarding your current task checkpoint (${payload.activeTaskTitle || 'Understanding Check'}): Focus on whether covalent bonds link repeating subunits into continuous macromolecules. Repeating subunits are the defining hallmark of all polymers!`;
      } else if (lower.includes('summar') || lower.includes('recap')) {
        answer = 'Key Lecture Summary: Polymers are macromolecules comprised of repeating monomer subunits. Material elasticity and thermal resistance are determined by linear vs cross-linked architectures. Understanding addition vs condensation reactions unlocks synthetic engineering.';
      }

      setTimeout(() => {
        resolve({
          answer,
          source: 'mock_local_pedagogy',
          suggestedFollowUps: [
            'What is the difference between addition and condensation?',
            'How does sulfur cross-linking affect elasticity?',
            'Explain thermoplastic vs thermosetting polymers.'
          ],
          relatedTimestamp,
        });
      }, 750);
    });
  }
}

export const geminiService = new GeminiService();
