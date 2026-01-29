export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Solo POST', { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      if (!body.image) throw new Error("Falta la imagen");

      const binaryString = atob(body.image);
      const imgArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imgArray[i] = binaryString.charCodeAt(i);
      }

      const response = await env.AI.run('@cf/llava-1.5-7b-hf', {
        image: [...imgArray],
        prompt: "Lista los alimentos en la imagen. Responde estrictamente con un JSON array: [{\"name\": \"alimento\", \"quantity\": 100, \"unit\": \"g\"}]",
        max_tokens: 512
      });

      const resultText = response.description || "";
      
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      const foods = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      return new Response(JSON.stringify({ success: true, foods }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
