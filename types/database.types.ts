export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DocumentLink = {
  document_id: string
  label: string
}

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          name: string
          category: string
          company_name: string | null
          email: string
          phone: string
          industry: string | null
          requested_document: string | null
          position: string | null
          purpose: string | null
          concerns: string[] | null
          instagram_id: string | null
          status: string
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          company_name?: string | null
          email: string
          phone: string
          industry?: string | null
          requested_document?: string | null
          position?: string | null
          purpose?: string | null
          concerns?: string[] | null
          instagram_id?: string | null
          status?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          company_name?: string | null
          email?: string
          phone?: string
          industry?: string | null
          requested_document?: string | null
          position?: string | null
          purpose?: string | null
          concerns?: string[] | null
          instagram_id?: string | null
          status?: string
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          subject: string
          body_html: string
          document_type: string | null
          document_links: DocumentLink[]
          download_url: string
          is_published: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          subject: string
          body_html: string
          document_type?: string | null
          document_links?: DocumentLink[]
          download_url: string
          is_published?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          subject?: string
          body_html?: string
          document_type?: string | null
          document_links?: DocumentLink[]
          download_url?: string
          is_published?: boolean
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          download_url: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          download_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          download_url?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      site_settings: {
        Row: { key: string; value: string }
        Insert: { key: string; value?: string }
        Update: { key?: string; value?: string }
      }
    }
  }
}
