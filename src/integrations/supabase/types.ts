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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      case_images: {
        Row: {
          case_id: string
          created_at: string
          id: string
          image_type: string
          quality_note: string | null
          quality_status: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          image_type?: string
          quality_note?: string | null
          quality_status?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          image_type?: string
          quality_note?: string | null
          quality_status?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_images_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "screening_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_tasks: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          details: string | null
          due_at: string | null
          id: string
          patient_id: string
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          patient_id: string
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          due_at?: string | null
          id?: string
          patient_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "screening_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          auth_user_id: string | null
          consent_at: string | null
          consent_given: boolean
          created_at: string
          created_by: string | null
          district: string | null
          full_name: string
          gender: string | null
          id: string
          language: string
          patient_code: string
          phone: string | null
          village: string | null
        }
        Insert: {
          age?: number | null
          auth_user_id?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          created_by?: string | null
          district?: string | null
          full_name: string
          gender?: string | null
          id?: string
          language?: string
          patient_code: string
          phone?: string | null
          village?: string | null
        }
        Update: {
          age?: number | null
          auth_user_id?: string | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          created_by?: string | null
          district?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          language?: string
          patient_code?: string
          phone?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          language: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          language?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          language?: string
          phone?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          appointment_at: string | null
          case_id: string
          created_at: string
          created_by: string | null
          facility: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_at?: string | null
          case_id: string
          created_at?: string
          created_by?: string | null
          facility: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_at?: string | null
          case_id?: string
          created_at?: string
          created_by?: string | null
          facility?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "screening_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      screening_cases: {
        Row: {
          assigned_doctor: string | null
          created_at: string
          created_by: string | null
          doctor_observation: string | null
          id: string
          patient_id: string
          recommendation: string | null
          reviewed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_doctor?: string | null
          created_at?: string
          created_by?: string | null
          doctor_observation?: string | null
          id?: string
          patient_id: string
          recommendation?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_doctor?: string | null
          created_at?: string
          created_by?: string | null
          doctor_observation?: string | null
          id?: string
          patient_id?: string
          recommendation?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screening_cases_assigned_doctor_fkey"
            columns: ["assigned_doctor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screening_cases_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "health_worker" | "patient"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "doctor", "health_worker", "patient"],
    },
  },
} as const
