export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisory_sessions: {
        Row: {
          assessment_id: string | null
          company: string | null
          created_at: string | null
          duration_minutes: number | null
          founder_email: string
          founder_name: string
          id: string
          notes: string | null
          payment_status: string | null
          risk_level: string | null
          scheduled_at: string | null
          session_type: string | null
          session_value: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          company?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          founder_email: string
          founder_name: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          risk_level?: string | null
          scheduled_at?: string | null
          session_type?: string | null
          session_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          company?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          founder_email?: string
          founder_name?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          risk_level?: string | null
          scheduled_at?: string | null
          session_type?: string | null
          session_value?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisory_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "founder_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      autopsy_reports: {
        Row: {
          advisor_notes: string | null
          assessment_id: string | null
          blind_spots: string[] | null
          company: string | null
          created_at: string | null
          executive_summary: string | null
          failure_mode: string | null
          founder_email: string | null
          founder_name: string
          id: string
          recovery_path: string | null
          risk_score: number | null
          root_causes: string | null
          status: string | null
          timeline_to_collapse: string | null
          updated_at: string | null
        }
        Insert: {
          advisor_notes?: string | null
          assessment_id?: string | null
          blind_spots?: string[] | null
          company?: string | null
          created_at?: string | null
          executive_summary?: string | null
          failure_mode?: string | null
          founder_email?: string | null
          founder_name: string
          id?: string
          recovery_path?: string | null
          risk_score?: number | null
          root_causes?: string | null
          status?: string | null
          timeline_to_collapse?: string | null
          updated_at?: string | null
        }
        Update: {
          advisor_notes?: string | null
          assessment_id?: string | null
          blind_spots?: string[] | null
          company?: string | null
          created_at?: string | null
          executive_summary?: string | null
          failure_mode?: string | null
          founder_email?: string | null
          founder_name?: string
          id?: string
          recovery_path?: string | null
          risk_score?: number | null
          root_causes?: string | null
          status?: string | null
          timeline_to_collapse?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autopsy_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "founder_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          founder_email: string | null
          founder_name: string | null
          id: string
          note: string | null
          priority: string | null
          session_id: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          session_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          founder_email?: string | null
          founder_name?: string | null
          id?: string
          note?: string | null
          priority?: string | null
          session_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "founder_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "advisory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_assessments: {
        Row: {
          answers: Json | null
          blind_spots: string[] | null
          case_code: string | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string
          founder_health_score: number | null
          id: string
          insight: string | null
          lead_source: string | null
          name: string | null
          primary_failure_mode: string | null
          risk_level: string | null
          risk_score: number | null
          sector: string | null
          stage: string | null
          user_agent: string | null
        }
        Insert: {
          answers?: Json | null
          blind_spots?: string[] | null
          case_code?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          founder_health_score?: number | null
          id?: string
          insight?: string | null
          lead_source?: string | null
          name?: string | null
          primary_failure_mode?: string | null
          risk_level?: string | null
          risk_score?: number | null
          sector?: string | null
          stage?: string | null
          user_agent?: string | null
        }
        Update: {
          answers?: Json | null
          blind_spots?: string[] | null
          case_code?: string | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          founder_health_score?: number | null
          id?: string
          insight?: string | null
          lead_source?: string | null
          name?: string | null
          primary_failure_mode?: string | null
          risk_level?: string | null
          risk_score?: number | null
          sector?: string | null
          stage?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          company: string | null
          created_at: string | null
          id: string
          order_index: number | null
          published: boolean | null
          quote: string
          updated_at: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          published?: boolean | null
          quote: string
          updated_at?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          company?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          published?: boolean | null
          quote?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
