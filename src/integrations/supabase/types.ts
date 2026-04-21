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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          booked_at: string
          chat_id: string | null
          complaint: string | null
          date: string
          follow_up_sent: boolean
          id: string
          patient_id: string | null
          patient_name: string
          rating: number | null
          status: string
          time: string
        }
        Insert: {
          booked_at?: string
          chat_id?: string | null
          complaint?: string | null
          date: string
          follow_up_sent?: boolean
          id?: string
          patient_id?: string | null
          patient_name: string
          rating?: number | null
          status?: string
          time: string
        }
        Update: {
          booked_at?: string
          chat_id?: string | null
          complaint?: string | null
          date?: string
          follow_up_sent?: boolean
          id?: string
          patient_id?: string | null
          patient_name?: string
          rating?: number | null
          status?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_config: {
        Row: {
          doctor_chat_id: string | null
          doctor_name: string | null
          google_sheet_id: string | null
          id: number
          nurse_chat_id: string | null
          openai_status: boolean | null
          reminder_afternoon: string | null
          reminder_evening: string | null
          reminder_morning: string | null
          sheets_status: boolean | null
          slots_per_day: number | null
          specialty: string | null
          telegram_status: boolean | null
          updated_at: string
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          doctor_chat_id?: string | null
          doctor_name?: string | null
          google_sheet_id?: string | null
          id: number
          nurse_chat_id?: string | null
          openai_status?: boolean | null
          reminder_afternoon?: string | null
          reminder_evening?: string | null
          reminder_morning?: string | null
          sheets_status?: boolean | null
          slots_per_day?: number | null
          specialty?: string | null
          telegram_status?: boolean | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          doctor_chat_id?: string | null
          doctor_name?: string | null
          google_sheet_id?: string | null
          id?: number
          nurse_chat_id?: string | null
          openai_status?: boolean | null
          reminder_afternoon?: string | null
          reminder_evening?: string | null
          reminder_morning?: string | null
          sheets_status?: boolean | null
          slots_per_day?: number | null
          specialty?: string | null
          telegram_status?: boolean | null
          updated_at?: string
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      medical_history: {
        Row: {
          created_at: string
          diagnosis: string | null
          follow_up_status: string
          id: string
          patient_id: string | null
          patient_name: string
          prescriptions: string | null
          visit_date: string
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          follow_up_status?: string
          id?: string
          patient_id?: string | null
          patient_name: string
          prescriptions?: string | null
          visit_date?: string
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          follow_up_status?: string
          id?: string
          patient_id?: string | null
          patient_name?: string
          prescriptions?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          allergies: string | null
          chat_id: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          register_date: string
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          register_date?: string
        }
        Update: {
          age?: number | null
          allergies?: string | null
          chat_id?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          register_date?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          chat_id: string | null
          created_at: string
          dosage: string | null
          id: string
          medication_name: string
          patient_id: string | null
          patient_name: string
          reminder_active: boolean
        }
        Insert: {
          chat_id?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          medication_name: string
          patient_id?: string | null
          patient_name: string
          reminder_active?: boolean
        }
        Update: {
          chat_id?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          medication_name?: string
          patient_id?: string | null
          patient_name?: string
          reminder_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      queue: {
        Row: {
          id: string
          join_time: string
          patient_id: string | null
          patient_name: string
          position: number
          status: string
        }
        Insert: {
          id?: string
          join_time?: string
          patient_id?: string | null
          patient_name: string
          position: number
          status?: string
        }
        Update: {
          id?: string
          join_time?: string
          patient_id?: string | null
          patient_name?: string
          position?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          id: string
          last_run_at: string | null
          next_run_at: string | null
          status: string
          workflow_key: string
          workflow_name: string
        }
        Insert: {
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          status?: string
          workflow_key: string
          workflow_name: string
        }
        Update: {
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          status?: string
          workflow_key?: string
          workflow_name?: string
        }
        Relationships: []
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
