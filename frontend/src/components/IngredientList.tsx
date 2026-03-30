import type { Ingredient } from "../types/ingredient";
import { IngredientCard } from "./IngredientCard";

type Props = {
  ingredients: Ingredient[];
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
};

export function IngredientList({ ingredients, onEdit, onDelete }: Props) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ingredients.map((ing) => (
        <li key={ing.id}>
          <IngredientCard
            ingredient={ing}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
