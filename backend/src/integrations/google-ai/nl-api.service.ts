import { Injectable, Logger } from '@nestjs/common';
import { LanguageServiceClient } from '@google-cloud/language';

// Desteklenen iade kategorileri
export type ReturnCategoryKey =
  | 'SIZE_MISMATCH'
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'QUALITY'
  | 'OTHER';

export interface AnalyzedNote {
  note: string;
  category: ReturnCategoryKey;
  confidence: number;
}

// Entity anahtar kelimelerden kategori eslestirme
const ENTITY_CATEGORY_MAP: Record<string, ReturnCategoryKey> = {
  beden: 'SIZE_MISMATCH',
  ebat: 'SIZE_MISMATCH',
  numara: 'SIZE_MISMATCH',
  kucuk: 'SIZE_MISMATCH',
  buyuk: 'SIZE_MISMATCH',
  dar: 'SIZE_MISMATCH',
  genis: 'SIZE_MISMATCH',
  hasar: 'DAMAGED',
  hasarli: 'DAMAGED',
  kirik: 'DAMAGED',
  ezilmis: 'DAMAGED',
  cizik: 'DAMAGED',
  yanlis: 'WRONG_ITEM',
  farkli: 'WRONG_ITEM',
  baska: 'WRONG_ITEM',
  urun: 'WRONG_ITEM',
  kalite: 'QUALITY',
  beklenti: 'QUALITY',
  kalitesiz: 'QUALITY',
  kotu: 'QUALITY',
  malzeme: 'QUALITY',
};

@Injectable()
export class NlApiService {
  private readonly logger = new Logger(NlApiService.name);
  private readonly client: LanguageServiceClient;

  constructor() {
    // GOOGLE_APPLICATION_CREDENTIALS env degiskeninden otomatik kimlik dogrulama
    this.client = new LanguageServiceClient();
    this.logger.log('NlApiService baslatildi.');
  }

  // Tek bir musteri notunu analiz eder ve kategori dondurur
  async analyzeNote(note: string): Promise<AnalyzedNote> {
    if (!note || note.trim().length < 3) {
      return { note, category: 'OTHER', confidence: 0 };
    }

    // Google NL API Turkce entity analizini desteklemiyor.
    // Sentiment analizi dil bagimsiz calistigi icin onu kullaniyoruz,
    // entity eslestirme icin keyword fallback uyguluyoruz.
    const keywordResult = this.fallbackKeyword(note);

    // Keyword ile kategori bulunamazsa sentiment ile kalite kontrolu yap
    if (keywordResult.category !== 'OTHER') {
      return keywordResult;
    }

    try {
      const [sentimentResult] = await this.client.analyzeSentiment({
        document: {
          content: note,
          type: 'PLAIN_TEXT' as const,
        },
      });

      const score = sentimentResult.documentSentiment?.score ?? 0;
      if (score < -0.5) {
        return { note, category: 'QUALITY', confidence: Math.abs(score) };
      }

      return { note, category: 'OTHER', confidence: 0.3 };
    } catch (error) {
      this.logger.warn('NL API sentiment hatasi, fallback kullaniliyor: ' + (error as Error).message);
      return keywordResult;
    }
  }

  // Birden fazla notu toplu analiz eder
  async analyzeNotes(notes: string[]): Promise<AnalyzedNote[]> {
    const validNotes = notes.filter((n) => n && n.trim().length > 2);
    if (validNotes.length === 0) return [];

    this.logger.log('NL API ile ' + validNotes.length + ' not analiz ediliyor...');

    // NL API rate limiti icin kucuk parcalara bol (500 istek/dk)
    const results: AnalyzedNote[] = [];
    for (const note of validNotes) {
      const analyzed = await this.analyzeNote(note);
      results.push(analyzed);
    }

    this.logger.log('NL API analizi tamamlandi: ' + results.length + ' not islendi.');
    return results;
  }

  // NL API erisim hatasi durumunda keyword fallback
  private fallbackKeyword(note: string): AnalyzedNote {
    const lower = note.toLowerCase();
    if (lower.includes('beden') || lower.includes('kucuk') || lower.includes('buyuk') || lower.includes('dar')) {
      return { note, category: 'SIZE_MISMATCH', confidence: 0.7 };
    }
    if (lower.includes('hasar') || lower.includes('kirik') || lower.includes('cizik')) {
      return { note, category: 'DAMAGED', confidence: 0.7 };
    }
    if (lower.includes('yanlis') || lower.includes('farkli') || lower.includes('baska urun')) {
      return { note, category: 'WRONG_ITEM', confidence: 0.7 };
    }
    if (lower.includes('kalite') || lower.includes('beklenti') || lower.includes('kotu')) {
      return { note, category: 'QUALITY', confidence: 0.7 };
    }
    return { note, category: 'OTHER', confidence: 0.5 };
  }
}
