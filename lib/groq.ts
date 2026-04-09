export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessageToGroq(messages: Message[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    return data.choices[0]?.message?.content || 'কোনো উত্তর পাওয়া যায়নি।';
  } catch (error) {
    console.error('Groq error:', error);
    return 'AI এর সাথে সংযোগ করতে সমস্যা হচ্ছে।';
  }
}
