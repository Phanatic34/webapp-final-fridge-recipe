import { motion } from "framer-motion";
import type { Ingredient } from "../types/ingredient";
import { IngredientCard } from "./IngredientCard";

type Props = {
  ingredients: Ingredient[];
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export function IngredientList({ ingredients, onEdit, onDelete }: Props) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {ingredients.map((ing) => (
        <motion.li key={ing.id} variants={itemVariants}>
          <IngredientCard
            ingredient={ing}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </motion.li>
      ))}
    </ul>
  );
}
