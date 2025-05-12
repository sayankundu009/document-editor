export const models = {
    quality: 'gemini-2.0-flash',
}

export async function generateText(prompt, model = models.quality) {
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt, }] }],
        }),
    }).then((response) => response.json()).then((data) => {
        const result = data.candidates[0].content.parts[0].text;

        return result;
    });
}

export async function generateWriting({ message, context, selection, isFull = false }) {
    const isFullCondition = isFull && !selection ? ` The article should one heading and one or more paragraphs.` : '';

    const prompt = `
        You are a professional writer and editor. Your task is to help improve text while maintaining a clear and engaging style.

        Rules:
        - Write in plain text without markdown
        - Use third person perspective
        - Keep the original tone and intent
        - Ensure proper grammar and punctuation
        - Be concise but thorough

        Instruction: ${message}
        Text: ${selection}

        ${isFullCondition}

        Format the response as a JSON array of content blocks. Each block should be a paragraph with this structure:
        {
          "type": "paragraph", 
          "content": "text content"
        }

        If the response is a single paragraph, return just one block. For multiple paragraphs or sections, return multiple blocks.
    `.trim();

    let result = await generateText(prompt);

    if (result.includes('```json')) {
        result = result.replace('```json', '').replace('```', '');
    }

    const json = JSON.parse(result);

    if(json.length == 1) {
        return json[0].content;
    }

    return json;
}

export function convertToContentCollection(json) {
    const result = [];

    json.forEach((item) => {
        let content = {
            type: 'text',
            text: item.content,
        };

        if (item.type === 'listItem') {
            content = {
                type: 'paragraph',
                content: [
                    {
                        type: 'text',
                        text: item.content,
                    },
                ],
            }
        }

        result.push({
            type: item.type,
            content: [content]
        });
    });

    // return result;

    return {
        type: 'fragment',
        content: result,
    };
}