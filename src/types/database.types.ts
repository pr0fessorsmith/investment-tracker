export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          category: 'broker' | 'strategy' | 'sector' | 'custom'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          category?: 'broker' | 'strategy' | 'sector' | 'custom'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          category?: 'broker' | 'strategy' | 'sector' | 'custom'
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: 'buy' | 'sell'
          shares: number
          price: number
          date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: 'buy' | 'sell'
          shares: number
          price: number
          date: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          type?: 'buy' | 'sell'
          shares?: number
          price?: number
          date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transaction_tags: {
        Row: {
          transaction_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          transaction_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          transaction_id?: string
          tag_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_portfolio_positions: {
        Args: {
          user_uuid: string
        }
        Returns: {
          symbol: string
          total_shares: number
          avg_price: number
          total_invested: number
          transaction_count: number
          first_purchase_date: string
          last_transaction_date: string
        }[]
      }
      create_default_tags_for_user: {
        Args: {
          user_uuid: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
