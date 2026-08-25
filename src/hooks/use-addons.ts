import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Addon, AddonCategory, MenuItemAddon } from "@/lib/database.types";

/** All add-on categories, admin-managed. */
export function useAddonCategories() {
  return useQuery<AddonCategory[]>({
    queryKey: ["addon_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addon_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** All add-ons, admin-managed. Public consumers rely on RLS to filter active ones. */
export function useAddons() {
  return useQuery<Addon[]>({
    queryKey: ["addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("addons").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** menu_item_id -> addon_id mapping. */
export function useMenuItemAddons() {
  return useQuery<MenuItemAddon[]>({
    queryKey: ["menu_item_addons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_item_addons").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Shape used by the AddToCartModal — add-ons for one menu item, grouped by category. */
export interface MenuItemAddonGroup {
  category: AddonCategory;
  addons: Addon[];
}

/**
 * The "Drinks" add-on category's items, independent of any menu_item_addons
 * link — reused for the "choose your drink" picker on combo meals, where
 * the drink is included free with the combo rather than an extra add-on.
 */
export function useDrinksAddons() {
  const categoriesQ = useAddonCategories();
  const addonsQ = useAddons();

  const isLoading = categoriesQ.isLoading || addonsQ.isLoading;

  if (!categoriesQ.data || !addonsQ.data) {
    return { data: [] as Addon[], isLoading };
  }

  const drinksCategory = categoriesQ.data.find((c) => c.name.trim().toLowerCase() === "drinks");
  if (!drinksCategory) return { data: [] as Addon[], isLoading };

  const data = addonsQ.data
    .filter((a) => a.category_id === drinksCategory.id && a.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return { data, isLoading };
}

/** Compose the previous three queries into per-item grouped add-ons for the modal. */
export function useMenuItemAddonsGrouped(menuItemId: string | null | undefined) {
  const categoriesQ = useAddonCategories();
  const addonsQ = useAddons();
  const linksQ = useMenuItemAddons();

  const isLoading = categoriesQ.isLoading || addonsQ.isLoading || linksQ.isLoading;

  if (!menuItemId || !categoriesQ.data || !addonsQ.data || !linksQ.data) {
    return { data: [] as MenuItemAddonGroup[], isLoading };
  }

  const linkedAddonIds = new Set(
    linksQ.data.filter((l) => l.menu_item_id === menuItemId).map((l) => l.addon_id),
  );

  const activeCategories = categoriesQ.data.filter((c) => c.is_active);
  const activeAddons = addonsQ.data.filter((a) => a.is_active && linkedAddonIds.has(a.id));

  const groups: MenuItemAddonGroup[] = activeCategories
    .map((cat) => ({
      category: cat,
      addons: activeAddons
        .filter((a) => a.category_id === cat.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((g) => g.addons.length > 0);

  return { data: groups, isLoading };
}
