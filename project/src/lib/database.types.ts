export type Database = {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          name: string;
          pin: number;
          type: string;
          ref_id: string;
          status: boolean;
          description: string;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          pin: number;
          type?: string;
          ref_id: string;
          status?: boolean;
          description?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          pin?: number;
          type?: string;
          ref_id?: string;
          status?: boolean;
          description?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      commands: {
        Row: {
          id: string;
          ref_id: string;
          label: string;
          device_id: string;
          action: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          ref_id: string;
          label: string;
          device_id: string;
          action: string;
          value?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          ref_id?: string;
          label?: string;
          device_id?: string;
          action?: string;
          value?: number;
          created_at?: string;
        };
      };
      logs: {
        Row: {
          id: string;
          user_id: string;
          command_id: string | null;
          device_id: string | null;
          success: boolean;
          error_message: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          command_id?: string | null;
          device_id?: string | null;
          success?: boolean;
          error_message?: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          command_id?: string | null;
          device_id?: string | null;
          success?: boolean;
          error_message?: string;
          timestamp?: string;
        };
      };
    };
  };
};
