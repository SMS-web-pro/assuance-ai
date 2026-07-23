export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      assurance_auto: {
        Row: {
          annee_circulation: number | null
          antecedents_assurance: string | null
          bonus_malus: string | null
          created_at: string
          demande_id: string
          id: string
          marque_vehicule: string | null
          modele_vehicule: string | null
          options_souhaitees: string[] | null
          type_carburant: string | null
          usage_vehicule: string | null
        }
        Insert: {
          annee_circulation?: number | null
          antecedents_assurance?: string | null
          bonus_malus?: string | null
          created_at?: string
          demande_id: string
          id?: string
          marque_vehicule?: string | null
          modele_vehicule?: string | null
          options_souhaitees?: string[] | null
          type_carburant?: string | null
          usage_vehicule?: string | null
        }
        Update: {
          annee_circulation?: number | null
          antecedents_assurance?: string | null
          bonus_malus?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          marque_vehicule?: string | null
          modele_vehicule?: string | null
          options_souhaitees?: string[] | null
          type_carburant?: string | null
          usage_vehicule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_auto_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_emprunteur: {
        Row: {
          couvertures_souhaitees: string[] | null
          created_at: string
          demande_id: string
          duree_pret_mois: number | null
          etat_sante: string | null
          id: string
          montant_pret: number | null
          situation_professionnelle: string | null
          type_bien_finance: string | null
        }
        Insert: {
          couvertures_souhaitees?: string[] | null
          created_at?: string
          demande_id: string
          duree_pret_mois?: number | null
          etat_sante?: string | null
          id?: string
          montant_pret?: number | null
          situation_professionnelle?: string | null
          type_bien_finance?: string | null
        }
        Update: {
          couvertures_souhaitees?: string[] | null
          created_at?: string
          demande_id?: string
          duree_pret_mois?: number | null
          etat_sante?: string | null
          id?: string
          montant_pret?: number | null
          situation_professionnelle?: string | null
          type_bien_finance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_emprunteur_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_habitation: {
        Row: {
          annee_construction: number | null
          antecedents_sinistres: string | null
          created_at: string
          demande_id: string
          id: string
          nombre_pieces: number | null
          superficie_m2: number | null
          systeme_securite: boolean | null
          type_logement: string | null
          usage_logement: string | null
          valeur_biens_euros: number | null
        }
        Insert: {
          annee_construction?: number | null
          antecedents_sinistres?: string | null
          created_at?: string
          demande_id: string
          id?: string
          nombre_pieces?: number | null
          superficie_m2?: number | null
          systeme_securite?: boolean | null
          type_logement?: string | null
          usage_logement?: string | null
          valeur_biens_euros?: number | null
        }
        Update: {
          annee_construction?: number | null
          antecedents_sinistres?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          nombre_pieces?: number | null
          superficie_m2?: number | null
          systeme_securite?: boolean | null
          type_logement?: string | null
          usage_logement?: string | null
          valeur_biens_euros?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_habitation_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_moto: {
        Row: {
          annee_circulation: number | null
          antecedents_assurance: string | null
          bonus_malus: string | null
          created_at: string
          cylindree: number | null
          demande_id: string
          id: string
          marque_modele: string | null
          type_deux_roues: string | null
          usage_moto: string | null
        }
        Insert: {
          annee_circulation?: number | null
          antecedents_assurance?: string | null
          bonus_malus?: string | null
          created_at?: string
          cylindree?: number | null
          demande_id: string
          id?: string
          marque_modele?: string | null
          type_deux_roues?: string | null
          usage_moto?: string | null
        }
        Update: {
          annee_circulation?: number | null
          antecedents_assurance?: string | null
          bonus_malus?: string | null
          created_at?: string
          cylindree?: number | null
          demande_id?: string
          id?: string
          marque_modele?: string | null
          type_deux_roues?: string | null
          usage_moto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_moto_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_sante: {
        Row: {
          besoins_specifiques: string[] | null
          couverture_actuelle: string | null
          created_at: string
          demande_id: string
          id: string
          nombre_personnes_assurer: number | null
          profession: string | null
          regime_securite_sociale: string | null
          situation_familiale: string | null
        }
        Insert: {
          besoins_specifiques?: string[] | null
          couverture_actuelle?: string | null
          created_at?: string
          demande_id: string
          id?: string
          nombre_personnes_assurer?: number | null
          profession?: string | null
          regime_securite_sociale?: string | null
          situation_familiale?: string | null
        }
        Update: {
          besoins_specifiques?: string[] | null
          couverture_actuelle?: string | null
          created_at?: string
          demande_id?: string
          id?: string
          nombre_personnes_assurer?: number | null
          profession?: string | null
          regime_securite_sociale?: string | null
          situation_familiale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_sante_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      assurance_voyage: {
        Row: {
          ages_voyageurs: number[] | null
          couvertures_souhaitees: string[] | null
          created_at: string
          date_depart: string | null
          date_retour: string | null
          demande_id: string
          destination: string | null
          id: string
          motif_voyage: string | null
          nombre_voyageurs: number | null
        }
        Insert: {
          ages_voyageurs?: number[] | null
          couvertures_souhaitees?: string[] | null
          created_at?: string
          date_depart?: string | null
          date_retour?: string | null
          demande_id: string
          destination?: string | null
          id?: string
          motif_voyage?: string | null
          nombre_voyageurs?: number | null
        }
        Update: {
          ages_voyageurs?: number[] | null
          couvertures_souhaitees?: string[] | null
          created_at?: string
          date_depart?: string | null
          date_retour?: string | null
          demande_id?: string
          destination?: string | null
          id?: string
          motif_voyage?: string | null
          nombre_voyageurs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_voyage_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      conseillers: {
        Row: {
          competences: string[] | null
          created_at: string
          date_embauche: string | null
          demandsactuelles: number | null
          email: string
          id: number
          nom: string
          objectif_mensuel: number | null
          specialite: string | null
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          competences?: string[] | null
          created_at?: string
          date_embauche?: string | null
          demandsactuelles?: number | null
          email: string
          id?: number
          nom: string
          objectif_mensuel?: number | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          competences?: string[] | null
          created_at?: string
          date_embauche?: string | null
          demandsactuelles?: number | null
          email?: string
          id?: number
          nom?: string
          objectif_mensuel?: number | null
          specialite?: string | null
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      demandes_assurance: {
        Row: {
          adresse_complete: string | null
          code_postal: string | null
          consentement_rgpd: Json | null
          conseiller_assigne: string | null
          date_contact: string | null
          date_creation: string
          date_modification: string
          date_naissance: string | null
          donnees_specifiques: Json
          email: string | null
          id: string
          nom: string | null
          notes_conseiller: string | null
          prenom: string | null
          priorite: string | null
          statut: string
          telephone: string | null
          type_assurance: string
        }
        Insert: {
          adresse_complete?: string | null
          code_postal?: string | null
          consentement_rgpd?: Json | null
          conseiller_assigne?: string | null
          date_contact?: string | null
          date_creation?: string
          date_modification?: string
          date_naissance?: string | null
          donnees_specifiques?: Json
          email?: string | null
          id?: string
          nom?: string | null
          notes_conseiller?: string | null
          prenom?: string | null
          priorite?: string | null
          statut?: string
          telephone?: string | null
          type_assurance: string
        }
        Update: {
          adresse_complete?: string | null
          code_postal?: string | null
          consentement_rgpd?: Json | null
          conseiller_assigne?: string | null
          date_contact?: string | null
          date_creation?: string
          date_modification?: string
          date_naissance?: string | null
          donnees_specifiques?: Json
          email?: string | null
          id?: string
          nom?: string | null
          notes_conseiller?: string | null
          prenom?: string | null
          priorite?: string | null
          statut?: string
          telephone?: string | null
          type_assurance?: string
        }
        Relationships: []
      }
      rappels_clients: {
        Row: {
          created_at: string
          created_by: string | null
          date_rappel: string
          demande_id: string
          description: string | null
          email_content: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          email_subject: string | null
          id: string
          send_automatically: boolean | null
          statut: string
          titre: string
          type_rappel: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_rappel: string
          demande_id: string
          description?: string | null
          email_content?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_subject?: string | null
          id?: string
          send_automatically?: boolean | null
          statut?: string
          titre: string
          type_rappel?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_rappel?: string
          demande_id?: string
          description?: string | null
          email_content?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          email_subject?: string | null
          id?: string
          send_automatically?: boolean | null
          statut?: string
          titre?: string
          type_rappel?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rappels_clients_demande_id_fkey"
            columns: ["demande_id"]
            isOneToOne: false
            referencedRelation: "demandes_assurance"
            referencedColumns: ["id"]
          },
        ]
      }
      smtp_configs: {
        Row: {
          created_at: string
          enabled: boolean | null
          host: string
          id: string
          is_default: boolean | null
          name: string
          password: string
          port: string
          security: string
          sender_email: string | null
          sender_name: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          host: string
          id?: string
          is_default?: boolean | null
          name: string
          password: string
          port: string
          security?: string
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          host?: string
          id?: string
          is_default?: boolean | null
          name?: string
          password?: string
          port?: string
          security?: string
          sender_email?: string | null
          sender_name?: string | null
          updated_at?: string
          username?: string
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
