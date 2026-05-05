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
      consultations: {
        Row: {
          approved_at: string | null
          audio_duration: number | null
          created_at: string
          created_by: string | null
          diagnosis: string | null
          id: string
          labs: Json
          medications: Json
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          recommendations: string | null
          status: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          audio_duration?: number | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          id?: string
          labs?: Json
          medications?: Json
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          recommendations?: string | null
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          audio_duration?: number | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string | null
          id?: string
          labs?: Json
          medications?: Json
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          recommendations?: string | null
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          quantity: number
          service_name: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          quantity?: number
          service_name: string
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          quantity?: number
          service_name?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number
          patient_id: string | null
          patient_name: string
          payment_method: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string | null
          patient_name: string
          payment_method?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          patient_id?: string | null
          patient_name?: string
          payment_method?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
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
      n8n_webhooks: {
        Row: {
          active: boolean
          created_at: string
          event_type: string
          id: string
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_type: string
          id?: string
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_type?: string
          id?: string
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          message: string | null
          notification_type: string
          patient_name: string | null
          recipient: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          notification_type: string
          patient_name?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          notification_type?: string
          patient_name?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          age: number | null
          allergies: string | null
          chat_id: string | null
          created_at: string
          gender: string | null
          id: string
          medical_history: string | null
          name: string
          phone: string | null
          register_date: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          allergies?: string | null
          chat_id?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          name: string
          phone?: string | null
          register_date?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          allergies?: string | null
          chat_id?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          medical_history?: string | null
          name?: string
          phone?: string | null
          register_date?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      generate_invoice_number: { Args: never; Returns: string }
      get_patient_records: {
        Args: { _phone: string }
        Returns: {
          date: string
          diagnosis: string
          id: string
          kind: string
          labs: Json
          medications: Json
          patient_name: string
          recommendations: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "doctor" | "nurse" | "reception" | "patient"
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
    Enums: {
      app_role: ["doctor", "nurse", "reception", "patient"],
    },
  },
} as const
