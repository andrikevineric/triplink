import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/cities/[cityId]/suggest - Get AI suggestions for activities
export async function POST(
  request: NextRequest,
  { params }: { params: { cityId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const city = await prisma.city.findUnique({
    where: { id: params.cityId },
    include: {
      trip: {
        include: { members: true },
      },
    },
  });

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  const isMember = city.trip.members.some((m) => m.userId === user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiKey) {
    // Return sample suggestions if no API key
    return NextResponse.json({
      suggestions: getSampleSuggestions(city.name, city.country),
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel assistant. Provide activity suggestions in JSON format.',
          },
          {
            role: 'user',
            content: `Suggest 5 must-do activities or places to visit in ${city.name}, ${city.country}. 
            Return as JSON array with objects containing "name" (activity name, max 50 chars) and "description" (brief description, max 100 chars).
            Example: [{"name": "Visit the Eiffel Tower", "description": "Iconic iron lattice tower with stunning city views"}]
            Only return the JSON array, no other text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = getSampleSuggestions(city.name, city.country);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('AI suggestion error:', error);
    // Fallback to sample suggestions
    return NextResponse.json({
      suggestions: getSampleSuggestions(city.name, city.country),
    });
  }
}

function getSampleSuggestions(cityName: string, country: string) {
  // Generic suggestions based on common travel activities
  const genericSuggestions = [
    { name: `Explore ${cityName} Old Town`, description: 'Walk through historic streets and discover local architecture' },
    { name: 'Visit Local Markets', description: 'Experience authentic local food and crafts' },
    { name: 'Try Local Cuisine', description: `Sample traditional ${country} dishes at recommended restaurants` },
    { name: 'Cultural Museum Visit', description: 'Learn about local history and culture' },
    { name: 'Scenic Viewpoint', description: 'Find the best panoramic views of the city' },
  ];
  
  return genericSuggestions;
}
