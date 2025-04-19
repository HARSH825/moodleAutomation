// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://shhuiqmeuzrrnvgavxzu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoaHVpcW1ldXpycm52Z2F2eHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzQyNDIsImV4cCI6MjA2MDQ1MDI0Mn0.w6p2Uusd2jqWg6lraI5hBAJRtwbV23UL5M4V6m8n0kk";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
