import { Routes, Route, Navigate } from "react-router-dom";
import FridgePage from "./pages/FridgePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecipeCreatePage from "./pages/RecipeCreatePage";
import FavoritesPage from "./pages/FavoritesPage";
import { SettingsPage } from "./pages/SettingsPage";
import ShoppingListPage from "./pages/ShoppingListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FridgePage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/new" element={<RecipeCreatePage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/shopping-list" element={<ShoppingListPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
