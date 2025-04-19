import supabase from "../supabaseClient.js";

async function saveCookiesToSupabase(username, cookies) {
  try {
    const cookiesString = JSON.stringify(cookies);
    const cookieFileName = `cookies-${username}.json`;
    
    const { data, error } = await supabase.storage
      .from("cookies")
      .upload(cookieFileName, cookiesString, {
        contentType: "application/json",
        upsert: true
      });
      
    if (error) throw error;
    
    console.log(`Cookies for ${username} saved to Supabase storage`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error saving cookies to Supabase: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getCookiesFromSupabase(username) {
  try {
    const cookieFileName = `cookies-${username}.json`;
    
    const { data, error } = await supabase.storage
      .from("cookies")
      .download(cookieFileName);
      
    if (error) throw error;
    
    // blob to text and parse as json
    const cookiesText = await data.text();
    const cookies = JSON.parse(cookiesText);
    
    console.log(`Cookies for ${username} retrieved from Supabase storage`);
    return { cookies, error: null };
  } catch (error) {
    console.error(`Error retrieving cookies from Supabase: ${error.message}`);
    return { cookies: null, error: error.message };
  }
}

export { saveCookiesToSupabase, getCookiesFromSupabase };