import { useState, useEffect } from 'react';
import type { Recipe } from '../types/recipe';
import './RecipeDisplay.css';

interface RecipeDisplayProps {
  recipe: Recipe;
  onNewRecipe: () => void;
}

export default function RecipeDisplay({ recipe, onNewRecipe }: RecipeDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Load checked steps from localStorage when recipe changes
  useEffect(() => {
    const savedSteps = localStorage.getItem(`recipe-steps-${recipe.id}`);
    if (savedSteps) {
      setCheckedSteps(new Set(JSON.parse(savedSteps)));
    } else {
      setCheckedSteps(new Set());
    }
  }, [recipe.id]);

  // Save checked steps to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`recipe-steps-${recipe.id}`, JSON.stringify([...checkedSteps]));
  }, [checkedSteps, recipe.id]);

  // Toggle step completion
  const toggleStep = (stepIndex: number) => {
    const newCheckedSteps = new Set(checkedSteps);
    
    if (newCheckedSteps.has(stepIndex)) {
      // If unchecking a step, uncheck all steps from this one onwards
      for (let i = stepIndex; i < steps.length; i++) {
        newCheckedSteps.delete(i);
      }
    } else {
      // If checking a step, check all steps up to and including this one
      for (let i = 0; i <= stepIndex; i++) {
        newCheckedSteps.add(i);
      }
    }
    
    setCheckedSteps(newCheckedSteps);
  };

  // Copy recipe to clipboard
  const copyToClipboard = async () => {
    const recipeText = `${recipe.name}

Ingredients:
${recipe.ingredients.map(ing => `• ${ing.measure} ${ing.name}`).join('\n')}

Instructions:
${getInstructionSteps(recipe.instructions).map((step, i) => `${i + 1}. ${step}`).join('\n')}

Source: ${window.location.href}`;

    try {
      await navigator.clipboard.writeText(recipeText);
      alert('Recipe copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy recipe to clipboard');
    }
  };

  // Download recipe as text file
  const downloadRecipe = () => {
    const recipeText = `${recipe.name}

Category: ${recipe.category}
Area: ${recipe.area}

Ingredients:
${recipe.ingredients.map(ing => `• ${ing.measure} ${ing.name}`).join('\n')}

Instructions:
${getInstructionSteps(recipe.instructions).map((step, i) => `${i + 1}. ${step}`).join('\n')}

${recipe.youtubeUrl ? `Video: ${recipe.youtubeUrl}\n` : ''}
Source: ${window.location.href}`;

    const blob = new Blob([recipeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Split instructions into logical steps
  const getInstructionSteps = (instructions: string): string[] => {
    // First try to split by numbered steps (1., 2., etc.)
    const numberedSteps = instructions.match(/\d+\.\s*[^0-9]*?(?=\d+\.|$)/g);
    if (numberedSteps && numberedSteps.length > 1) {
      return numberedSteps.map(step => 
        step.replace(/^\d+\.\s*/, '').trim()
      ).filter(step => step.length > 0);
    }
    
    // Fall back to splitting by sentences, but keep longer chunks
    return instructions
      .split(/\.\s+(?=[A-Z])|\n\n+/)
      .map(step => step.trim())
      .filter(step => step.length > 20) // Filter out very short fragments
      .map(step => step.endsWith('.') ? step : step + '.');
  };

  const steps = getInstructionSteps(recipe.instructions);

  return (
    <div className="recipe-display">
      <div className="recipe-content">
        <div className="recipe-image-section">
          <div className={`recipe-image-container ${imageLoaded ? 'loaded' : ''}`}>
            <img
              src={recipe.image}
              alt={recipe.name}
              className="recipe-image"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true); // Show the alt state
              }}
            />
            {!imageLoaded && <div className="image-placeholder">Loading image...</div>}
            {imageError && (
              <div className="image-fallback">
                <svg className="fallback-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <p>Image not available</p>
              </div>
            )}
            <div className={`image-overlay ${imageError ? 'no-image' : ''}`}>
              <h1 className="recipe-title">{recipe.name}</h1>
              <div className="recipe-meta">
                <span className="recipe-category">{recipe.category}</span>
                {recipe.area && <span className="recipe-area">{recipe.area}</span>}
                {recipe.tags && (
                  <div className="recipe-tags">
                    {recipe.tags.map((tag, index) => (
                      <span key={index} className="recipe-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="recipe-actions">
            <button className="action-btn new-recipe-btn" onClick={onNewRecipe}>
              <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              New Recipe
            </button>
            {recipe.youtubeUrl && (
              <a
                href={recipe.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn youtube-link"
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Watch Video
              </a>
            )}
            
            <button onClick={copyToClipboard} className="action-btn copy-btn">
              <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              Copy Recipe
            </button>
            
            <button onClick={downloadRecipe} className="action-btn download-btn">
              <svg className="button-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Download
            </button>
          </div>
        </div>

        <section className="ingredients-section mobile-ingredients">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="ingredient-item">
                <span className="ingredient-measure">{ingredient.measure}</span>
                <span className="ingredient-name">{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="recipe-details">
          <section className="instructions-section">
            <h2>Instructions</h2>
            <ol className="instructions-list">
              {steps.map((step, index) => (
                <li key={index} className={`instruction-step ${checkedSteps.has(index) ? 'completed' : ''}`}>
                  <button
                    className="step-number"
                    onClick={() => toggleStep(index)}
                    title={checkedSteps.has(index) ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {checkedSteps.has(index) ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="check-icon">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>
                  <div className="step-content">
                    {step}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="ingredients-section desktop-ingredients">
            <h2>Ingredients</h2>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span className="ingredient-measure">{ingredient.measure}</span>
                  <span className="ingredient-name">{ingredient.name}</span>
              </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      
      <footer className="recipe-footer">
        <div className="footer-content">
          <span className="app-name">Lyss Random Baking Thing</span> • <span className="footer-credits">Recipe data from <a href="https://www.themealdb.com/" target="_blank" rel="noopener noreferrer">TheMealDB</a></span> • <span className="footer-author">Created by Joshua Stevenson</span>
        </div>
      </footer>
    </div>
  );
}