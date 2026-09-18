import { drinks, food, wines } from "@/data/officialMenu";

type CatalogProduct = { id: string; name: string; priceInCents: number; category: string };

const priceInCents = (price: string) => Math.round(Number(price.replace(/[^0-9.]/g, "")) * 100);

export const menuCatalog = new Map<string, CatalogProduct>(
  [food, drinks, wines].flat().flatMap(category => category.items.map(item => [
    `${category.id}:${item.name}`,
    { id: `${category.id}:${item.name}`, name: item.name, priceInCents: priceInCents(item.price), category: category.title },
  ] as const)),
);

export const getOfficialProduct = (id: string) => menuCatalog.get(id);
