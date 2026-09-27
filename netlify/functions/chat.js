exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método não permitido" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Mensagem vazia" })
      };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://minha-ia.netlify.app",
        "X-Title": "Minha IA"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content:
              "Você é a Minha IA, uma assistente pessoal amigável. " +
              "Responda sempre em português do Brasil, de forma clara e útil."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data?.error?.message || "Erro ao consultar a IA"
        })
      };
    }

    const answer =
      data?.choices?.[0]?.message?.content ||
      "Não consegui obter uma resposta.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answer })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro interno ao conversar com a IA."
      })
    };
  }
};
