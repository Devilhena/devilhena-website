import type { MenuCategory, MenuItem } from "./officialMenu";

const item = (name: string, price: string, description?: string): MenuItem => ({
  name,
  price,
  ...(description ? { description } : {}),
});

export const food: MenuCategory[] = [
  {
    id: "antipasti",
    title: "Antipasti",
    items: [
      item("Octopus in Garlic", "€13.95"),
      item("Mushrooms Cooked in Garlic and White Wine", "€12.50"),
      item("Calamari Fritti", "€14.50"),
      item("Prawn Cocktail", "€14.50"),
      item("Pinsa with Smoked Salmon", "€13.00"),
      item("Pinsa Parma, Grana and Rucola", "€13.00"),
      item("Pinsa Napolitana, Anchovies, Capers, Garlic and Rucola", "€11.00"),
    ],
  },
  {
    id: "salads",
    title: "Salads",
    items: [
      item("Grilled Chicken Salad", "€15.50", "Grilled chicken fillet set on a crispy salad, Caesar dressing and croutons."),
      item("Baked Salmon Salad", "€18.50", "Baked salmon, mixed leaves, cherry tomatoes, cucumber, avocado, red onion, olives and lemon dressing."),
      item("Parma Grana Salad", "€17.50", "Mixed leaves, Parma ham, Grana Padano shavings, cherry tomatoes, rocket and balsamic glaze."),
      item("Tuna Nicoise Salad", "€16.50", "Tuna, capers, olives, hard-boiled egg, set on a crispy salad and a light vinaigrette."),
    ],
  },
  {
    id: "pasta",
    title: "Pasta",
    items: [
      item("Penne Maltese", "€18.50", "Maltese sausage, garlic, bacon, tomato chunks and cream."),
      item("Linguine Swordfish", "€17.00", "Swordfish, basil, white wine, cherry tomatoes and garlic."),
      item("Penne De Vilhena", "€18.95", "Chicken, garlic and bacon in a truffle cream sauce."),
      item("Linguine Allo Scoglio", "€19.75", "Mix of seafood, cherry tomatoes, white wine and olive oil."),
      item("Spaghetti Beef Ragout", "€16.75", "Beef mince, celery, carrots, onion and red wine."),
      item("Spaghetti Rabbit Liver", "€16.75", "Rabbit liver, garlic, red wine and cherry tomatoes."),
      item("Pappardelle Bosco", "€19.95", "Wild and porcini mushroom cream topped with Black Angus ribeye."),
      item("Spaghetti Carbonara", "€17.95", "Guanciale, Pecorino Romano, pepper and egg yolk."),
    ],
  },
  {
    id: "fish",
    title: "Fish",
    items: [
      item("Octopus in Garlic", "€24.95"),
      item("Grilled Swordfish", "€23.75"),
      item("Grilled Tuna Steaks", "€24.95"),
      item("Grilled Salmon in Lemon and Mustard Cream Sauce", "€25.95"),
      item("Shallow Fried or Grilled Fillet Seabass", "€22.50"),
      item("Shallow Fried or Grilled Fillet Red Bream", "€24.00"),
    ],
  },
  {
    id: "meat-poultry",
    title: "Meat & Poultry",
    items: [
      item("Grilled Beef T-Bone Steak 450g", "€34.95"),
      item("Grilled Argentinian Grass Fed Rib Eye 300g", "€33.95"),
      item("Slow Cooked Full Rack Pork Ribs", "€33.95"),
      item("Beef Tagliata 400g Topped with Rucola and Parmigiano Flakes", "€28.45"),
      item("Chicken Roll Breast with Provolone Cheese Wrapped in Pancetta Served on a Light Gorgonzola Sauce", "€23.00"),
      item("Shallow Fried Breaded Cheese and Parma Ham Chicken Schnitzel Served with Fried Egg", "€26.75"),
      item("Slow Cooked Braised Lamb Shank Served on Mashed Potato", "€26.45"),
      item("Shallow Fried Duck Breast with Star Anise Orange Sauce", "€27.45"),
      item("Fried Local Rabbit in Garlic and White Wine Reduction Jus", "€24.00"),
      item("Angus Beef Burger 200g Beef Patty Char Grilled Served with House Dressing Cheesy Sauce", "€18.45"),
      item("Sauces", "€3.50", "Pepper, gorgonzola or mushroom."),
    ],
  },
  {
    id: "asian",
    title: "Asian",
    items: [
      item("Biryani Rice", "€15.50", "Aromatic basmati rice cooked with traditional biryani spices, ghee and herbs, served with a choice of chicken or beef masala."),
      item("Traditional Naan Bread", "€4.10", "Soft oven-baked flatbread with butter and aromatic spices."),
      item("Vegetable Noodles", "€10.60", "Stir-fried noodles with fresh vegetables in a savoury Asian sauce."),
      item("Duck Noodles", "€15.30", "Stir-fried noodles with tender duck, fresh vegetables and Asian sauces."),
      item("Chicken Noodles", "€12.90", "Stir-fried noodles with chicken, fresh vegetables and savoury Asian sauces."),
      item("Beef Noodles", "€16.25", "Stir-fried noodles with tender beef, fresh vegetables and a rich Asian sauce."),
      item("Duck Fried Rice", "€13.85", "Fragrant fried rice with tender duck, vegetables and Asian seasonings."),
    ],
  },
  {
    id: "vegetarian",
    title: "Vegetarian",
    items: [
      item("Penne V", "€15.50", "Ricotta, shredded carrots and cherry tomatoes."),
      item("Arancini Norma", "€16.50", "Aubergines and mozzarella."),
      item("Penne Fungi Porcini and Cream", "€16.50"),
      item("Vegetable Noodles", "€10.60", "Stir-fried noodles with fresh vegetables in a savoury Asian sauce."),
    ],
  },
];
