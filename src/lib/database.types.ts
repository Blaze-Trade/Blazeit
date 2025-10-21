export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      leaderboard_entries: {
        Row: {
          calculated_at: string | null
          id: string
          pnl_percent: number
          portfolio_value: number
          quest_id: string | null
          rank: number
          total_trades: number | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          pnl_percent: number
          portfolio_value: number
          quest_id?: string | null
          rank: number
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          calculated_at?: string | null
          id?: string
          pnl_percent?: number
          portfolio_value?: number
          quest_id?: string | null
          rank?: number
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_participants: {
        Row: {
          blockchain_tx_hash: string | null
          entry_fee_paid: number
          final_rank: number | null
          id: string
          joined_at: string | null
          portfolio_submitted_at: string | null
          prize_won: number | null
          quest_id: string | null
          user_id: string | null
        }
        Insert: {
          blockchain_tx_hash?: string | null
          entry_fee_paid: number
          final_rank?: number | null
          id?: string
          joined_at?: string | null
          portfolio_submitted_at?: string | null
          prize_won?: number | null
          quest_id?: string | null
          user_id?: string | null
        }
        Update: {
          blockchain_tx_hash?: string | null
          entry_fee_paid?: number
          final_rank?: number | null
          id?: string
          joined_at?: string | null
          portfolio_submitted_at?: string | null
          prize_won?: number | null
          quest_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_participants_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_portfolios: {
        Row: {
          created_at: string | null
          current_value: number
          entry_price: number
          id: string
          quantity: number
          quest_id: string | null
          token_id: string | null
          total_cost: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number
          entry_price: number
          id?: string
          quantity?: number
          quest_id?: string | null
          token_id?: string | null
          total_cost?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number
          entry_price?: number
          id?: string
          quantity?: number
          quest_id?: string | null
          token_id?: string | null
          total_cost?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_portfolios_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_portfolios_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_token_snapshots: {
        Row: {
          created_at: string | null
          id: string
          price_at_end: number | null
          price_at_start: number
          quest_id: string
          snapshot_time: string | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_at_end?: number | null
          price_at_start?: number
          quest_id: string
          snapshot_time?: string | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price_at_end?: number | null
          price_at_start?: number
          quest_id?: string
          snapshot_time?: string | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_token_snapshots_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_token_snapshots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          blockchain_quest_id: number | null
          blockchain_tx_hash: string | null
          created_at: string | null
          creator_id: string | null
          current_participants: number | null
          description: string | null
          duration_minutes: number
          end_time: string
          entry_fee: number
          id: string
          max_participants: number | null
          name: string
          prize_pool: number
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          blockchain_quest_id?: number | null
          blockchain_tx_hash?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes: number
          end_time: string
          entry_fee: number
          id?: string
          max_participants?: number | null
          name: string
          prize_pool?: number
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          blockchain_quest_id?: number | null
          blockchain_tx_hash?: string | null
          created_at?: string | null
          creator_id?: string | null
          current_participants?: number | null
          description?: string | null
          duration_minutes?: number
          end_time?: string
          entry_fee?: number
          id?: string
          max_participants?: number | null
          name?: string
          prize_pool?: number
          start_time?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      token_creation_requests: {
        Row: {
          blockchain_address: string | null
          created_at: string | null
          creator_id: string | null
          curve_exponent: number | null
          description: string | null
          id: string
          image_url: string | null
          max_supply: number | null
          mint_limit_per_address: number | null
          name: string
          status: string | null
          symbol: string
          target_supply: number | null
          updated_at: string | null
          virtual_liquidity: number | null
        }
        Insert: {
          blockchain_address?: string | null
          created_at?: string | null
          creator_id?: string | null
          curve_exponent?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          max_supply?: number | null
          mint_limit_per_address?: number | null
          name: string
          status?: string | null
          symbol: string
          target_supply?: number | null
          updated_at?: string | null
          virtual_liquidity?: number | null
        }
        Update: {
          blockchain_address?: string | null
          created_at?: string | null
          creator_id?: string | null
          curve_exponent?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          max_supply?: number | null
          mint_limit_per_address?: number | null
          name?: string
          status?: string | null
          symbol?: string
          target_supply?: number | null
          updated_at?: string | null
          virtual_liquidity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_creation_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          address: string | null
          bonding_curve_active: boolean | null
          change_24h: number
          created_at: string | null
          creator_id: string | null
          decimals: number | null
          description: string | null
          hyperion_pool_address: string | null
          id: string
          initial_reserve_apt: number | null
          is_active: boolean | null
          logo_url: string | null
          market_cap: number
          market_cap_threshold_usd: number | null
          max_supply: number | null
          migration_completed: boolean | null
          migration_timestamp: string | null
          name: string
          price: number
          reserve_balance: number | null
          reserve_ratio: number | null
          social_links: Json | null
          symbol: string
          trading_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bonding_curve_active?: boolean | null
          change_24h?: number
          created_at?: string | null
          creator_id?: string | null
          decimals?: number | null
          description?: string | null
          hyperion_pool_address?: string | null
          id?: string
          initial_reserve_apt?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          market_cap?: number
          market_cap_threshold_usd?: number | null
          max_supply?: number | null
          migration_completed?: boolean | null
          migration_timestamp?: string | null
          name: string
          price?: number
          reserve_balance?: number | null
          reserve_ratio?: number | null
          social_links?: Json | null
          symbol: string
          trading_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bonding_curve_active?: boolean | null
          change_24h?: number
          created_at?: string | null
          creator_id?: string | null
          decimals?: number | null
          description?: string | null
          hyperion_pool_address?: string | null
          id?: string
          initial_reserve_apt?: number | null
          is_active?: boolean | null
          logo_url?: string | null
          market_cap?: number
          market_cap_threshold_usd?: number | null
          max_supply?: number | null
          migration_completed?: boolean | null
          migration_timestamp?: string | null
          name?: string
          price?: number
          reserve_balance?: number | null
          reserve_ratio?: number | null
          social_links?: Json | null
          symbol?: string
          trading_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          blockchain_tx_hash: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          quest_id: string | null
          status: string | null
          token_symbol: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          blockchain_tx_hash?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          quest_id?: string | null
          status?: string | null
          token_symbol?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          blockchain_tx_hash?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          quest_id?: string | null
          status?: string | null
          token_symbol?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_portfolios: {
        Row: {
          average_cost: number
          created_at: string | null
          current_value: number
          id: string
          quantity: number
          token_id: string | null
          total_cost: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_cost: number
          created_at?: string | null
          current_value?: number
          id?: string
          quantity?: number
          token_id?: string | null
          total_cost?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_cost?: number
          created_at?: string | null
          current_value?: number
          id?: string
          quantity?: number
          token_id?: string | null
          total_cost?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_portfolios_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          email: string | null
          id: string
          total_winnings: number | null
          updated_at: string | null
          username: string | null
          wallet_address: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          total_winnings?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          total_winnings?: number | null
          updated_at?: string | null
          username?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      watchlists: {
        Row: {
          created_at: string | null
          id: string
          token_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
