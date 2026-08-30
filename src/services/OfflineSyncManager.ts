import { QuickNotesAPI, MaterialsAPI, EssaysAPI, VocabularyAPI, PromptsAPI } from './api';
import { QuickNote, Material, Essay, HardCharacter, PromptItem } from '../types';
import { storage, STORAGE_KEYS } from './storage';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

export const OfflineSyncManager = {
  /**
   * 將訪客在本地累積的所有暫存資料（筆記、素材、作文草稿與歷程、生難字、自訂題目）
   * 一次性安全同步至已登入使用者的 Cloudflare D1 雲端資料庫
   */
  async syncToCloud(): Promise<SyncResult> {
    let syncedCount = 0;
    const errors: string[] = [];

    // 1. 同步隨手筆記 (Quick Notes)
    try {
      const notes = storage.local.get<QuickNote[]>(STORAGE_KEYS.QUICK_NOTES);
      if (notes && notes.length > 0) {
        const tempNotes = notes.filter(
          (n) => n.id.startsWith('temp_') || n.id.startsWith('qn_')
        );

        for (const note of tempNotes) {
          try {
            const created = await QuickNotesAPI.create(note.content);
            if (note.status && note.status !== 'active' && created?.id) {
              await QuickNotesAPI.updateStatus(created.id, note.status);
            }
            syncedCount++;
          } catch (err: any) {
            console.warn('[Sync Note Failed]', err);
          }
        }
        // 清理本機已同步的暫存
        storage.local.remove(STORAGE_KEYS.QUICK_NOTES);
      }
    } catch (err: any) {
      errors.push(`Notes: ${err.message}`);
    }

    // 2. 同步素材卡 (Materials)
    try {
      const materials = storage.local.get<Material[]>(STORAGE_KEYS.MATERIALS);
      if (materials && materials.length > 0) {
        const tempMaterials = materials.filter(
          (m) => m.id.startsWith('temp_') || m.id.startsWith('mat_')
        );

        for (const mat of tempMaterials) {
          try {
            await MaterialsAPI.save({
              title: mat.title,
              story: mat.story,
              people: mat.people,
              time: mat.time || mat.time_desc,
              location: mat.location || mat.location_desc,
              scene: mat.scene || mat.scene_desc,
              dialogue: mat.dialogue || mat.dialogue_desc,
              emotion: mat.emotion || mat.emotion_desc,
              reflection: mat.reflection || mat.reflection_desc,
              themes: mat.themes,
              tags: mat.tags,
              interview_history: mat.interview_history,
              source_quick_note_id: mat.source_quick_note_id,
            });
            syncedCount++;
          } catch (err: any) {
            console.warn('[Sync Material Failed]', err);
          }
        }
        storage.local.remove(STORAGE_KEYS.MATERIALS);
      }
    } catch (err: any) {
      errors.push(`Materials: ${err.message}`);
    }

    // 3. 同步作文草稿與修改歷程 (Essays & Operations)
    try {
      const essays = storage.local.get<Essay[]>(STORAGE_KEYS.ESSAYS);
      if (essays && essays.length > 0) {
        const tempEssays = essays.filter(
          (e) => e.id.startsWith('temp_') || e.id.startsWith('esy_') || e.id.startsWith('essay_')
        );

        for (const essay of tempEssays) {
          try {
            // 讀取該篇作文在本地留存的操作紀錄
            const opsKey = `${STORAGE_KEYS.ESSAY_OPS_PREFIX}${essay.id}`;
            const operations = storage.local.get<any[]>(opsKey, []) || [];

            await EssaysAPI.save({
              prompt_id: essay.prompt_id,
              title: essay.title,
              current_content: essay.current_content,
              word_count: essay.word_count,
              status: essay.status,
              operations,
            });

            // 清除該篇作文的本地歷程暫存
            storage.local.remove(opsKey);
            syncedCount++;
          } catch (err: any) {
            console.warn('[Sync Essay Failed]', err);
          }
        }
        storage.local.remove(STORAGE_KEYS.ESSAYS);
      }
    } catch (err: any) {
      errors.push(`Essays: ${err.message}`);
    }

    // 4. 同步生難字庫 (Vocabulary)
    try {
      const vocabList = storage.local.get<HardCharacter[]>(STORAGE_KEYS.VOCABULARY);
      if (vocabList && vocabList.length > 0) {
        const tempVocab = vocabList.filter(
          (v) => v.id.startsWith('temp_') || v.id.startsWith('voc_') || v.id.startsWith('hc_')
        );

        for (const vocab of tempVocab) {
          try {
            await VocabularyAPI.add(vocab.character_text, vocab.zhuyin);
            syncedCount++;
          } catch (err: any) {
            console.warn('[Sync Vocabulary Failed]', err);
          }
        }
        storage.local.remove(STORAGE_KEYS.VOCABULARY);
      }
    } catch (err: any) {
      errors.push(`Vocabulary: ${err.message}`);
    }

    // 5. 同步自訂題目 (Custom Prompts)
    try {
      const promptList = storage.local.get<PromptItem[]>(STORAGE_KEYS.PROMPTS);
      if (promptList && promptList.length > 0) {
        const tempPrompts = promptList.filter(
          (p) => p.id.startsWith('temp_') || p.id.startsWith('pr_custom_')
        );

        for (const prompt of tempPrompts) {
          try {
            await PromptsAPI.create({
              title: prompt.title,
              raw_text: prompt.raw_text,
              corrected_text: prompt.corrected_text,
            });
            syncedCount++;
          } catch (err: any) {
            console.warn('[Sync Prompt Failed]', err);
          }
        }
        storage.local.remove(STORAGE_KEYS.PROMPTS);
      }
    } catch (err: any) {
      errors.push(`Prompts: ${err.message}`);
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
