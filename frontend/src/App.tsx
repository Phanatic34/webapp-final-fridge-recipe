import { Routes, Route, Navigate } from "react-router-dom";
import FridgePage from "./pages/FridgePage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FridgePage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
