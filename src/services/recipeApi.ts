import type { MealResponse, MealDetail, Recipe, Ingredient } from '../types/recipe';

// Unit expansion mapping for better recipe readability
const expandUnits = (measure: string): string => {
  return measure
    .replace(/\btsp\b/gi, 'teaspoon')
    .replace(/\btbsp\b/gi, 'tablespoon')
    .replace(/\bcup\b/gi, 'cup')
    .replace(/\boz\b/gi, 'ounce')
    .replace(/\blb\b/gi, 'pound')
    .replace(/\bg\b/gi, 'gram')
    .replace(/\bkg\b/gi, 'kilogram')
    .replace(/\bml\b/gi, 'milliliter')
    .replace(/\bl\b/gi, 'liter')
    .trim();
};

// Function to get fallback images from Wikimedia Commons
const getWikimediaImage = async (searchTerm: string): Promise<string | null> => {
  try {
    console.log(`Searching Wikimedia for: ${searchTerm}`);
    
    // Search for images related to the recipe
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm + ' food')}&srnamespace=6&format=json&origin=*&srlimit=5`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (searchData.query?.search?.length > 0) {
      // Get the first search result
      const firstResult = searchData.query.search[0];
      const filename = firstResult.title;
      
      // Get the actual image URL
      const imageUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const imageResponse = await fetch(imageUrl);
      const imageData = await imageResponse.json();
      
      const pages = imageData.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        const imageInfo = page.imageinfo?.[0];
        if (imageInfo?.url) {
          console.log(`Found Wikimedia image: ${imageInfo.url}`);
          return imageInfo.url;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Wikimedia image:', error);
  }
  
  return null;
};

// Convert API response to our Recipe type
const convertToRecipe = async (meal: MealDetail): Promise<Recipe> => {
  const ingredients: Ingredient[] = [];
  
  // Extract ingredients and measures
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof MealDetail] as string;
    const measure = meal[`strMeasure${i}` as keyof MealDetail] as string;
    
    if (ingredient?.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure?.trim() ? expandUnits(measure.trim()) : ''
      });
    }
  }

  // Try to get a better image if the original fails
  let imageUrl = meal.strMealThumb;
  
  // Test if the original image is accessible
  try {
    const response = await fetch(meal.strMealThumb, { method: 'HEAD' });
    if (!response.ok) {
      throw new Error('Original image not accessible');
    }
  } catch (error) {
    console.log('Original image not accessible, trying Wikimedia...');
    const wikimediaImage = await getWikimediaImage(meal.strMeal);
    if (wikimediaImage) {
      imageUrl = wikimediaImage;
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    image: imageUrl,
    tags: meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [],
    youtubeUrl: meal.strYoutube || undefined,
    ingredients
  };
};

export const getRandomDessertRecipe = async (): Promise<Recipe> => {
  console.log('Fetching random dessert recipe...');
  
  try {
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MealResponse = await response.json();
    
    if (!data.meals || data.meals.length === 0) {
      throw new Error('No dessert recipes found');
    }
    
    // Pick a random dessert
    const randomIndex = Math.floor(Math.random() * data.meals.length);
    const randomMeal = data.meals[randomIndex];
    
    console.log(`Selected random dessert: ${randomMeal.strMeal} (ID: ${randomMeal.idMeal})`);
    
    // Fetch full details for the selected meal
    return await fetchRecipeDetails(randomMeal.idMeal);
    
  } catch (error) {
    console.error('Error fetching random dessert recipe:', error);
    throw new Error('Failed to fetch recipe. Please try again.');
  }
};

export const fetchRecipeDetails = async (mealId: string): Promise<Recipe> => {
  console.log(`Fetching details for meal ID: ${mealId}`);
  
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MealResponse = await response.json();
    
    if (!data.meals || data.meals.length === 0) {
      throw new Error('Recipe not found');
    }
    
    const meal = data.meals[0];
    console.log(`Fetched recipe details: ${meal.strMeal}`);
    
    return await convertToRecipe(meal);
    
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    throw new Error('Failed to fetch recipe details. Please try again.');
  }
};
