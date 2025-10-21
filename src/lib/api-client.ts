// Legacy API client - now redirects to Supabase API
import { supabaseApi } from "./supabase-api";

// This is kept for backward compatibility but now uses Supabase directly
export async function api<T>(path: string): Promise<T> {
  // Parse the endpoint to determine which Supabase API to use
  const endpoint = path.replace("/api/", "");

  try {
    // Route to appropriate Supabase API based on endpoint
    if (endpoint === "tokens") {
      const result = await supabaseApi.tokens.getTokens();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch tokens");
      }
      return result.data as T;
    }

    if (endpoint.startsWith("quests")) {
      if (endpoint === "quests") {
        const result = await supabaseApi.quests.getQuests();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch quests");
        }
        return result.data as T;
      }

      // Handle quest-specific endpoints
      const questMatch = endpoint.match(/^quests\/([^/]+)(?:\/(.+))?$/);
      if (questMatch) {
        const questId = questMatch[1];
        const subPath = questMatch[2];

        if (!subPath) {
          // GET /api/quests/:id
          const result = await supabaseApi.quests.getQuest(questId);
          if (!result.success) {
            throw new Error(result.error || "Quest not found");
          }
          return result.data as T;
        }

        if (subPath === "leaderboard") {
          // GET /api/quests/:id/leaderboard
          const result = await supabaseApi.quests.getQuestLeaderboard(questId);
          if (!result.success) {
            throw new Error(result.error || "Failed to fetch leaderboard");
          }
          return result.data as T;
        }

        // Handle other quest sub-paths as needed
        throw new Error(`Unsupported quest endpoint: ${subPath}`);
      }
    }

    // Handle other endpoints
    throw new Error(`Unsupported endpoint: ${path}`);
  } catch (error: any) {
    throw new Error(error.message || "API request failed");
  }
}
