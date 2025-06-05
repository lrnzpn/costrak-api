import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('health_check').select('*').limit(1);

    if (error) {
      console.error('Database connection error:', error.message);
    } else {
      // eslint-disable-next-line no-console
      console.log('Database connection successful');
    }

    return { data, error };
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    throw error;
  }
};
