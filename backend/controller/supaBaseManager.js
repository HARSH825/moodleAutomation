import supabase from "../supabaseClient.js";

async function saveJsonToSupabase(filename, data, bucket = "assignmentsjson") {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    
    //upload
    const { data: uploadData, error } = await supabase.storage
      .from(bucket)
      .upload(filename, jsonString, {
        contentType: "application/json",
        upsert: true 
      });
      
    if (error) throw error;
    
    //public URL 
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    console.log(`JSON data saved to Supabase storage: ${filename}`);
    return { 
      success: true, 
      url: publicUrlData?.publicUrl || null, 
      error: null 
    };
  } catch (error) {
    console.error(`Error saving JSON to Supabase: ${error.message}`);
    return { success: false, url: null, error: error.message };
  }
}

async function getJsonFromSupabase(filename, bucket = "assignmentsjson") {
  try {
    // Download JSON file
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filename);
      
    if (error) throw error;
    
    // convert blob to text and parse as json
    const jsonText = await data.text();
    const jsonData = JSON.parse(jsonText);
    
    console.log(`JSON data retrieved from Supabase storage: ${filename}`);
    return { data: jsonData, error: null };
  } catch (error) {
    console.error(`Error retrieving JSON from Supabase: ${error.message}`);
    return { data: null, error: error.message };
  }
}

async function listJsonFiles(bucket = "assignmentsjson") {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list();
      
    if (error) throw error;
    
    return { files: data, error: null };
  } catch (error) {
    console.error(`Error listing files in Supabase: ${error.message}`);
    return { files: null, error: error.message };
  }
}

export { saveJsonToSupabase, getJsonFromSupabase, listJsonFiles };