import { supabase } from './supabase';

export const questAdminApi = {
  // Start a quest (admin function)
  async startQuest(questId: string) {
    try {
      const { data, error } = await supabase.rpc('start_quest', {
        quest_uuid: questId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // End a quest (admin function)
  async endQuest(questId: string) {
    try {
      const { data, error } = await supabase.rpc('end_quest', {
        quest_uuid: questId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Process quest lifecycle (for scheduled jobs)
  async processQuestLifecycle() {
    try {
      const { data, error } = await supabase.rpc('quest_lifecycle_cron');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
