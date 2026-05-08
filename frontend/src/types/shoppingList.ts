export interface ShoppingListItem {
  id: number;
  user_id: number;
  ingredient_name: string;
  quantity: string | null;   // pg returns DECIMAL as string
  unit: string | null;
  is_checked: boolean;
  source_recipe_id: number | null;
  source_recipe_title: string | null;
  created_at: string;
}
