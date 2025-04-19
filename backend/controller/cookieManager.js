import supabase from "../supabaseClient.js";

/**
 * Saves user cookies to Supabase storage
 * @param {string} username - The username associated with the cookies
 * @param {Array} cookies - The cookies array to store
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
async function saveCookiesToSupabase(username, cookies) {
  try {
    // Convert cookies to JSON string
    const cookiesString = JSON.stringify(cookies);
    const cookieFileName = `cookies-${username}.json`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("cookies")
      .upload(cookieFileName, cookiesString, {
        contentType: "application/json",
        upsert: true // Overwrite if exists
      });
      
    if (error) throw error;
    
    console.log(`Cookies for ${username} saved to Supabase storage`);
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error saving cookies to Supabase: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves user cookies from Supabase storage
 * @param {string} username - The username whose cookies to retrieve
 * @returns {Promise<{cookies: Array|null, error: string|null}>}
 */
async function getCookiesFromSupabase(username) {
  try {
    const cookieFileName = `cookies-${username}.json`;
    
    // Download cookies file from Supabase
    const { data, error } = await supabase.storage
      .from("cookies")
      .download(cookieFileName);
      
    if (error) throw error;
    
    // Convert blob to text and parse as JSON
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