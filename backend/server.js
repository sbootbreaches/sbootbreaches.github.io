addEventListener('fetch', event => {
    if (event.request.method === 'OPTIONS') {
      // Handle CORS preflight requests
      event.respondWith(handleOptions(event.request));
    } else {
      event.respondWith(handleRequest(event.request));
    }
  });
  
  function handleOptions(request) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  async function handleRequest(request) {
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    };
  
    const url = new URL(request.url);
    const path = url.pathname;
  
    if (request.method === 'GET') {
      try {
        // Check for passcode authentication
        const providedPasscode = url.searchParams.get('passcode');
        const expectedPasscode = LIST_VERBOSE_PASSCODE; // Environment variable
        
        if (!expectedPasscode) {
          return new Response(JSON.stringify({
            error: 'Password not configured on server'
          }), { 
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (!providedPasscode || providedPasscode !== expectedPasscode) {
          return new Response(JSON.stringify({
            error: 'Invalid or missing password',
            message: 'Please provide a valid password'
          }), { 
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
  
        // List all keys in the SECUREBOOT_DATA KV store
        const keys = await SECUREBOOT_DATA.list();
        const storageList = [];
  
        // Fetch detailed information for each key
        for (const key of keys.keys) {
          const value = await SECUREBOOT_DATA.get(key.name);
          if (value) {
            const data = JSON.parse(value);
            storageList.push({
              key: key.name,
              metadata: key.metadata,
              ...data
            });
          }
        }
  
        return new Response(JSON.stringify({
          total_entries: storageList.length,
          entries: storageList
        }, null, 2), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: error.message
        }), { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
  
    if (request.method === 'POST') {
      try {
        const clientIP = request.headers.get('CF-Connecting-IP');
        const data = await request.json();
        
        const key = `${Date.now()}_${clientIP}`;
        
        await SECUREBOOT_DATA.put(key, JSON.stringify({
          timestamp: data.timestamp,
          osInfo: data.osInfo,
          flag: data.flag,
          data: data.data,
          country: request.cf.country,
          city: request.cf.city,
          region: request.cf.region
        }));
  
        return new Response('OK', {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain'
          }
        });
      } catch (error) {
        return new Response(error.message, { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain'
          }
        });
      }
    }
  
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }