import { QuickNotesAPI, MaterialsAPI, EssaysAPI, VocabularyAPI } from './api';
import { QuickNote, Material, Essay, HardCharacter } from '../types';
import { storage, STORAGE_KEYS } from './storage';

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
      const notes = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES);
      if (notes && notes.length > 0) {
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
        storage.local.remove(STORAGE_KEYS.QUICK_NOTES);
      }
    } catch (err: any) {
      errors.push(`Notes: ${err.message}`);
    }

    // 2. 同步素材卡
    try {
      const materials = storage.local.get<Material[]>(STORAGE_KEYS.MATERIALS);
      if (materials && materials.length > 0) {
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
        storage.local.remove(STORAGE_KEYS.MATERIALS);
      }
    } catch (err: any) {
      errors.push(`Materials: ${err.message}`);
    }

    // 3. 同步作文草稿
    try {
      const essays = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS);
      if (essays && essays.length > 0) {
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
        storage.local.remove(STORAGE_KEYS.ESSAYS);
      }
    } catch (err: any) {
      errors.push(`Essays: ${err.message}`);
    }

    // 4. 同步生難字庫
    try {
      const vocabList = storage.local.get<HardCharacter[]>(STORAGE_KEYS.VOCABULARY);
      if (vocabList && vocabList.length > 0) {
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
        storage.local.remove(STORAGE_KEYS.VOCABULARY);
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
    storage.clearGuestData();
  },
};
