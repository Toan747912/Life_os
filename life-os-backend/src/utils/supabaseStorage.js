const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'uploads';

let supabase;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

const uploadFileToSupabase = async (filePath, originalName, mimeType) => {
    if (!supabase) {
        throw new Error("Supabase is not configured. Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
    }

    try {
        const fileContent = fs.readFileSync(filePath);
        // Xóa ký tự đặc biệt khỏi tên file
        const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${cleanName}`;

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileContent, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error details:', error);
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error('Error uploading to Supabase:', error);
        throw error;
    }
}

module.exports = { supabase, uploadFileToSupabase };
