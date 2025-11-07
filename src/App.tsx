import { useState, useEffect } from 'react'
import RecipeDisplay from './components/RecipeDisplay'
import { getRandomDessertRecipe, fetchRecipeDetails } from './services/recipeApi'
import type { Recipe } from './types/recipe'
import './App.css'

function App() {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRandomRecipe = async () => {
    setLoading(true)
    setError(null)
    try {
      const randomRecipe = await getRandomDessertRecipe()
      setRecipe(randomRecipe)
      // Update URL with recipe ID
      const url = new URL(window.location.href)
      url.searchParams.set('recipe', randomRecipe.id)
      window.history.pushState({}, '', url.toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe')
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecificRecipe = async (recipeId: string) => {
    setLoading(true)
    setError(null)
    try {
      const specificRecipe = await fetchRecipeDetails(recipeId)
      setRecipe(specificRecipe)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe')
      // If specific recipe fails, try random recipe
      fetchRandomRecipe()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check if there's a recipe ID in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const recipeId = urlParams.get('recipe')
    
    if (recipeId) {
      fetchSpecificRecipe(recipeId)
    } else {
      fetchRandomRecipe()
    }
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <svg viewBox="0 0 24 24" fill="currentColor" className="spinner-icon">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
          </svg>
        </div>
        <h2>Finding a delicious dessert recipe...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={fetchRandomRecipe} className="retry-btn">
          Try Again
        </button>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="app-error">
        <h2>No recipe found</h2>
        <button onClick={fetchRandomRecipe} className="retry-btn">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      <RecipeDisplay recipe={recipe} onNewRecipe={fetchRandomRecipe} />
    </div>
  )
}

export default App
