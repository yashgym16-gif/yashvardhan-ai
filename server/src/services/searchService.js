/**
 * Modular Web Search Service for Yashvardhan AI
 * Fetches real-time web context to ground assistant responses.
 */

export async function performWebSearch(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = encodeURIComponent(query.trim());
  const results = [];

  try {
    // 1. Fetch Instant Answers & Related Topics from DuckDuckGo API
    const instantUrl = `https://api.duckduckgo.com/?q=${cleanQuery}&format=json&no_html=1&skip_disambig=1`;
    const instantRes = await fetch(instantUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) YashvardhanAI/1.0' }
    });

    if (instantRes.ok) {
      const data = await instantRes.json();
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL,
          source: data.AbstractSource || 'Instant Answer'
        });
      }

      if (Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (topic.Text && topic.FirstURL && results.length < 5) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Topic',
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo'
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Instant answer search notice:', err.message);
  }

  // 2. If results are sparse, try DuckDuckGo HTML Lite search parsing
  if (results.length < 3) {
    try {
      const htmlUrl = `https://html.duckduckgo.com/html/?q=${cleanQuery}`;
      const htmlRes = await fetch(htmlUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml'
        }
      });

      if (htmlRes.ok) {
        const text = await htmlRes.text();
        // Regex to extract result links and snippets from DuckDuckGo lite HTML
        const resultRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet"[^>]*href="[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        const titleRegex = /<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

        const titles = [];
        let match;
        while ((match = titleRegex.exec(text)) !== null && titles.length < 5) {
          const rawUrl = match[1];
          // DuckDuckGo redirects wrapped in //duckduckgo.com/l/?uddg=...
          let finalUrl = rawUrl;
          if (rawUrl.includes('uddg=')) {
            const uddg = new URL('https:' + (rawUrl.startsWith('//') ? '' : '//') + rawUrl).searchParams.get('uddg');
            if (uddg) finalUrl = decodeURIComponent(uddg);
          }
          const cleanTitle = match[2].replace(/<[^>]*>/g, '').trim();
          titles.push({ title: cleanTitle, url: finalUrl });
        }

        const snippets = [];
        const snipRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        while ((match = snipRegex.exec(text)) !== null && snippets.length < 5) {
          const cleanSnippet = match[1].replace(/<[^>]*>/g, '').trim();
          snippets.push(cleanSnippet);
        }

        for (let i = 0; i < titles.length; i++) {
          if (!results.some((r) => r.url === titles[i].url) && results.length < 5) {
            results.push({
              title: titles[i].title,
              snippet: snippets[i] || 'No summary available.',
              url: titles[i].url,
              source: new URL(titles[i].url).hostname.replace('www.', '')
            });
          }
        }
      }
    } catch (err) {
      console.warn('HTML web search fallback notice:', err.message);
    }
  }

  // 3. Fallback to Wikipedia summary search if still empty
  if (results.length === 0) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${cleanQuery}&limit=3&namespace=0&format=json`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const [, titles, descriptions, urls] = await wikiRes.json();
        for (let i = 0; i < titles.length; i++) {
          if (titles[i] && urls[i]) {
            results.push({
              title: titles[i],
              snippet: descriptions[i] || `Information regarding ${titles[i]}`,
              url: urls[i],
              source: 'Wikipedia'
            });
          }
        }
      }
    } catch (err) {
      console.warn('Wikipedia search notice:', err.message);
    }
  }

  return results;
}

/**
 * Formats search results into a clean markdown prompt context
 */
export function formatSearchResultsForPrompt(results) {
  if (!results || results.length === 0) return '';

  let context = `\n\n[REAL-TIME WEB SEARCH CONTEXT]\nThe following up-to-date web information was retrieved:\n`;
  results.forEach((r, idx) => {
    context += `\n[Source ${idx + 1}]: ${r.title}\nURL: ${r.url}\nSummary: ${r.snippet}\n`;
  });
  context += `\nInstructions: Use the above web sources to provide accurate, up-to-date answers. Cite sources where appropriate.\n`;
  return context;
}
