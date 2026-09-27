exports.handler = async function (event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Método não permitido"
      })
    };
  }

  try {
    let query = "";

    if (event.httpMethod === "GET") {
      query = event.queryStringParameters?.q || "";
    } else {
      const body = JSON.parse(event.body || "{}");
      query = body.q || "";
    }

    query = String(query).trim();

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Digite algo para pesquisar."
        })
      };
    }

    // Instância pública do SearXNG para teste
    const url =
      "https://search.bus-hit.me/search?q=" +
      encodeURIComponent(query) +
      "&format=json&language=pt-BR";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("A pesquisa não respondeu.");
    }

    const data = await response.json();

    const results = (data.results || [])
      .slice(0, 8)
      .map(result => ({
        title: result.title || "",
        url: result.url || "",
        content: result.content || ""
      }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        results
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Não foi possível pesquisar na internet agora."
      })
    };
  }
};
