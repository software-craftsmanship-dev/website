#!/usr/bin/env node
// Load .env variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const outFile = path.resolve(__dirname, '..', 'src', 'data', 'cachedSignatories.json');

async function fetchSignatories() {
    // Try to load Supabase credentials from environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('⚠️  SUPABASE_URL or SUPABASE_ANON_KEY not found in environment');
        console.warn('⚠️  Skipping signatories cache generation');
        return null;
    }

    try {
        console.log('🔄 Fetching signatories from Supabase...');

        // Use fetch API to query Supabase REST API directly
        const response = await fetch(
            `${supabaseUrl}/rest/v1/signatures?select=id,name,avatar_url,profile_url,created_at,privacy_level,auth_provider,name_only_location&order=created_at.desc&limit=100`,
            {
                headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Successfully fetched ${data.length} signatories`);
        return data;
    } catch (error) {
        console.error('❌ Failed to fetch signatories from Supabase:', error.message);
        return null;
    }
}

async function run() {
    const signatories = await fetchSignatories();

    // Create output directory
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    if (signatories) {
        // Write successful cache with metadata
        const cacheData = {
            cached_at: new Date().toISOString(),
            count: signatories.length,
            signatories: signatories,
        };
        fs.writeFileSync(outFile, JSON.stringify(cacheData, null, 2), 'utf8');
        console.log(`✅ Cached ${signatories.length} signatories to ${outFile}`);
    } else {
        // Write empty cache with error flag
        const cacheData = {
            cached_at: new Date().toISOString(),
            count: 0,
            error: 'Failed to fetch from Supabase',
            signatories: [],
        };
        fs.writeFileSync(outFile, JSON.stringify(cacheData, null, 2), 'utf8');
        console.log('⚠️  Created empty cache file');
    }
}

run().catch((err) => {
    console.error('❌ Cache script failed:', err);
    process.exit(1);
});
