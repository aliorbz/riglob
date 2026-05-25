/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LocationSearchResult {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * Searches for places matching the query using OpenStreetMap's Nominatim API.
 * Nominatim does not require API keys, making it perfect for default public search.
 */
export async function searchLocation(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&featuretype=settlement`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'RiGlob-Community-World-Map/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const data = await response.json();

    return data.map((item: any) => {
      const address = item.address || {};
      const city = address.city || address.town || address.village || address.municipality || address.county || '';
      const state = address.state || '';
      const country = address.country || '';
      
      // Construct a clean city, country string
      let displayName = '';
      if (city) {
        displayName += city;
        if (state) displayName += `, ${state}`;
        if (country) displayName += `, ${country}`;
      } else {
        displayName = item.display_name;
      }

      return {
        name: displayName,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch (error) {
    console.error('Error fetching geocoding suggestions:', error);
    
    // Return a mock fallback list if there's an API error
    const lowercaseQuery = query.toLowerCase();
    const fallbackLocations = [
      { name: 'San Francisco, California, United States', latitude: 37.7749, longitude: -122.4194 },
      { name: 'London, Greater London, United Kingdom', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Tokyo, Kanto, Japan', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Paris, Ile-de-France, France', latitude: 48.8566, longitude: 2.3522 },
      { name: 'Berlin, Germany', latitude: 52.5200, longitude: 13.4050 },
      { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
      { name: 'Sydney, New South Wales, Australia', latitude: -33.8688, longitude: 151.2093 },
      { name: 'New York, United States', latitude: 40.7128, longitude: -74.0060 },
    ];

    return fallbackLocations.filter(loc => 
      loc.name.toLowerCase().includes(lowercaseQuery)
    );
  }
}
