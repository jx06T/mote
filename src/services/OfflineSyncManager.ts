import { QuickNotesAPI, MaterialsAPI, EssaysAPI, VocabularyAPI } from './api';
import { QuickNote, Material, Essay, HardCharacter } from '../types';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

export const OfflineSyncManager = {
  /**
   * 將本機所有暫存資料一次性同步至雲端 D1 資料庫
   */
  async syncToCloud(): Promise<SyncResult> {
    let syncedCount = 0;
    const errors: string[] = [];

    // 1. 同步隨手筆記
    try {
      const storedNotes = localStorage.getItem('mote_quick_notes');
      if (storedNotes) {
        const notes: QuickNote[] = JSON.parse(storedNotes);
        const tempNotes = notes.filter((n) => n.id.startsWith('temp_') || n.id.startsWith('qn_'));

        for (const note of tempNotes) {
          try {
            await QuickNotesAPI.create(note.content);
            syncedCount++;
          } catch (err) {
            console.warn('[Sync Note Failed]', err);
          }
        }
        // 清理本機已同步的暫存
        localStorage.removeItem('mote_quick_notes');
      }
    } catch (err: any) {
      errors.push(`Notes: ${err.message}`);
    }

    // 2. 同步素材卡
    try {
      const storedMaterials = localStorage.getItem('mote_materials');
      if (storedMaterials) {
        const materials: Material[] = JSON.parse(storedMaterials);
        const tempMaterials = materials.filter(
          (m) => m.id.startsWith('temp_') || m.id.startsWith('mat_')
        );

        for (const mat of tempMaterials) {
          try {
            await MaterialsAPI.save(mat);
            syncedCount++;
          } catch (err) {
            console.warn('[Sync Material Failed]', err);
          }
        }
        localStorage.removeItem('mote_materials');
      }
    } catch (err: any) {
      errors.push(`Materials: ${err.message}`);
    }

    // 3. 同步作文草稿
    try {
      const storedEssays = localStorage.getItem('mote_essays');
      if (storedEssays) {
        const essays: Essay[] = JSON.parse(storedEssays);
        const tempEssays = essays.filter(
          (e) => e.id.startsWith('temp_') || e.id.startsWith('essay_')
        );

        for (const essay of tempEssays) {
          try {
            await EssaysAPI.save({
              prompt_id: essay.prompt_id,
              title: essay.title,
              current_content: essay.current_content,
              word_count: essay.word_count,
              status: essay.status,
            });
            syncedCount++;
          } catch (err) {
            console.warn('[Sync Essay Failed]', err);
          }
        }
        localStorage.removeItem('mote_essays');
      }
    } catch (err: any) {
      errors.push(`Essays: ${err.message}`);
    }

    // 4. 同步生難字庫
    try {
      const storedVocab = localStorage.getItem('mote_vocabulary');
      if (storedVocab) {
        const vocabList: HardCharacter[] = JSON.parse(storedVocab);
        const tempVocab = vocabList.filter(
          (v) => v.id.startsWith('temp_') || v.id.startsWith('hc_')
        );

        for (const vocab of tempVocab) {
          try {
            await VocabularyAPI.add(vocab.character_text, vocab.zhuyin);
            syncedCount++;
          } catch (err) {
            console.warn('[Sync Vocabulary Failed]', err);
          }
        }
        localStorage.removeItem('mote_vocabulary');
      }
    } catch (err: any) {
      errors.push(`Vocabulary: ${err.message}`);
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  },

  /**
   * 登出時清空本機暫存與快取
   */
  clearOfflineData() {
    localStorage.removeItem('mote_quick_notes');
    localStorage.removeItem('mote_materials');
    localStorage.removeItem('mote_essays');
    localStorage.removeItem('mote_vocabulary');
    localStorage.removeItem('mote_prompts');
    localStorage.removeItem('mote_exams');
    localStorage.removeItem('mote_weaknesses');
  },
};
