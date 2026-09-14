export type PriceCol = {
  label?: string;
  inches?: string;
  price: string;
};

export type ItemCondiment = {
  id: string;
  name: string;
  price: string;
  extraPrice: string;
  maxQty: string;
};

export type MenuItem = {
  id?: string;
  name: string;
  description?: string;
  prices: PriceCol[];
  highlight?: boolean;
  image?: string;
  hideImage?: boolean;
  condiments?: ItemCondiment[];
  /** Explicit modifier groups. Missing = infer from name/category. [] = detached. */
  groups?: string[];
};

export type CategoryKind = "pizza" | "split" | "single";

export type MenuCategory = {
  id: string;
  name: string;
  note?: string;
  kind: CategoryKind;
  icon?: string;
  items: MenuItem[];
};

export type RestaurantInfo = {
  name: string;
  shortName: string;
  address: string;
  city: string;
  phone: string;
  phoneHref: string;
  hours: string;
  established: string;
};

export const RESTAURANT: RestaurantInfo = {
  name: "South End Pizza III",
  shortName: "South End Pizza 3",
  address: "443 Zion Rd",
  city: "Egg Harbor Township, NJ 08234",
  phone: "(609) 788-8512",
  phoneHref: "tel:+16097888512",
  hours: "Open Daily 11:00 AM – 8:00 PM",
  established: "2005",
};

export const DEFAULT_FOOTER =
  "Ask about extra toppings, wing sauces, and dressing. Prices may change.";

function extras(...rows: [string, string, string?][]): ItemCondiment[] {
  return rows.map(([name, price, extra], i) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cond";
    const id = /extra ranch/i.test(name)
      ? "wing-extra-ranch"
      : /extra blue/i.test(name)
        ? "wing-extra-blue"
        : /extra dressing/i.test(name)
          ? "salad-extra"
          : `${slug}-${i + 1}`;
    return {
      id,
      name,
      price,
      extraPrice: extra ?? price,
      maxQty: "9",
    };
  });
}

const DIP_CUPS = extras(["Ranch", "0.75"], ["Blue cheese", "0.75"], ["BBQ", "0.75"], ["Honey mustard", "0.75"]);
const SALAD_DRESSING = extras(["Extra dressing", "0.75"]);
const MARINARA = extras(["Extra marinara", "0.75"]);

export const MENU: MenuCategory[] = [
  {
    id: "pizza",
    name: "Pizza",
    note: "",
    kind: "pizza",
    items: [
      {
        name: "Cheese Pizza",
        description: "Classic cheese or create your own pizza",
        prices: [{ label: "SM", inches: "12\"", price: "14.75" }, { label: "MD", inches: "14\"", price: "15.75" }, { label: "LG", inches: "16\"", price: "16.75" }],
      },
      {
        name: "Extra Cheese Pizza",
        description: "Classic cheese or create your own pizza",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Pepperoni Pizza",
        description: "Topped with classic cheese and pepperoni",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Sausage Pizza",
        description: "Topped with classic cheese and sausage",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Beef Pizza",
        description: "Topped with classic cheese and beef",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Ham Pizza",
        description: "Topped with classic cheese and ham",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Bacon Pizza",
        description: "Classic cheese and bacon",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Mushrooms Pizza",
        description: "Classic cheese and mushrooms",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Green Peppers Pizza",
        description: "Classic cheese and green peppers",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Olives Pizza",
        description: "Topped with classic cheese and olives",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Onions Pizza",
        description: "Topped with classic cheese and onions",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Spinach Pizza",
        description: "Topped with classic cheese and spinach",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
      {
        name: "Broccoli Pizza",
        description: "Topped with classic cheese and broccoli",
        prices: [{ label: "SM", inches: "12\"", price: "16.75" }, { label: "MD", inches: "14\"", price: "17.75" }, { label: "LG", inches: "16\"", price: "18.75" }],
      },
    ],
  },
  {
    id: "gourmet",
    name: "Gourmet Pizza",
    note: "",
    kind: "pizza",
    items: [
      {
        name: "White Combo Pizza",
        description: "Tomatoes, spinach, broccoli & ricotta cheese",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Richie's Special Pizza",
        description: "White pizza with tomatoes, garlic, oil & oregano",
        prices: [{ label: "SM", inches: "12\"", price: "18.00" }, { label: "MD", inches: "14\"", price: "19.00" }, { label: "LG", inches: "16\"", price: "20.00" }],
      },
      {
        name: "Buffalo Chicken Pizza",
        description: "Chicken, hot or mild sauce & mozzarella",
        highlight: true,
        prices: [{ label: "SM", inches: "12\"", price: "19.00" }, { label: "MD", inches: "14\"", price: "21.00" }, { label: "LG", inches: "16\"", price: "23.00" }],
        condiments: extras(["Extra Ranch", "0.75"], ["Extra Blue cheese", "0.75"]),
        groups: ["buffalo_dip"],
      },
      {
        name: "BBQ Chicken Pizza",
        description: "Chicken, BBQ sauce & mozzarella cheese",
        prices: [{ label: "SM", inches: "12\"", price: "19.00" }, { label: "MD", inches: "14\"", price: "21.00" }, { label: "LG", inches: "16\"", price: "23.00" }],
      },
      {
        name: "Bonzano Italiano Pizza",
        description: "Cappicola, salami, pepperoni & provolone cheese",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Greek Pizza",
        description: "Feta, garlic, olives & spinach. Red or white",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Grilled Chicken Pizza",
        description: "Chicken, sauce & cheese",
        prices: [{ label: "SM", inches: "12\"", price: "18.00" }, { label: "MD", inches: "14\"", price: "20.00" }, { label: "LG", inches: "16\"", price: "22.00" }],
      },
      {
        name: "Mexicana Pizza",
        description: "Tomatoes, onions, beef & jalapenos",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Hawaiian Pizza",
        description: "Ham & pineapple. White or red",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Veggie Pizza",
        description: "Mushrooms, broccoli, green peppers & onions",
        prices: [{ label: "SM", inches: "12\"", price: "18.00" }, { label: "MD", inches: "14\"", price: "20.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "Meat Lovers Pizza",
        description: "Sausage, pepperoni & bacon",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
      {
        name: "C.B.R. Pizza",
        description: "Chicken, bacon & Ranch",
        prices: [{ label: "SM", inches: "12\"", price: "20.00" }, { label: "MD", inches: "14\"", price: "22.00" }, { label: "LG", inches: "16\"", price: "24.00" }],
      },
    ],
  },
  {
    id: "appetizers",
    name: "Appetizers",
    kind: "split",
    items: [
      {
        name: "French Fries",
        description: "Deep fried till golden brown",
        prices: [{ price: "7.25" }],
      },
      {
        name: "Curly Fries",
        description: "Spiraled potatoes, deep fried and seasoned",
        prices: [{ price: "7.50" }],
      },
      {
        name: "Onion Rings",
        description: "Crispy onion slices deep-fried until golden-brown",
        prices: [{ price: "7.50" }],
      },
      {
        name: "Cheesy French Fries",
        description: "Melted cheese over our delicious fries",
        prices: [{ price: "8.50" }],
      },
      {
        name: "Mozzarella Sticks",
        description: "Deep fried cheese sticks. Served with sauce",
        prices: [{ label: "5 pc", price: "8.50" }],
        condiments: MARINARA,
      },
      {
        name: "Jalapeno Poppers",
        description: "Juicy jalapeno poppers breaded and filled with cheese and fried to golden perfection",
        prices: [{ label: "5 pc", price: "9.75" }],
      },
      {
        name: "South End Style Fries",
        description: "Bacon, cheddar cheese & Mozzarella cheese",
        prices: [{ price: "12.75" }],
      },
      {
        name: "Chicken Fingers",
        description: "With french fries. Breaded and fried chicken strips",
        prices: [{ price: "14.95" }],
        condiments: extras(["Extra Ranch", "0.75"], ["Extra Blue cheese", "0.75"]),
        groups: ["sauce_dip"],
      },
      {
        name: "Buffalo Fries",
        prices: [{ price: "12.75" }],
      },
      {
        name: "Buffalo Chicken Tenders",
        description: "Tossed in hot sauce or Mild sauce",
        prices: [{ label: "6 pc", price: "11.50" }, { label: "12 pc", price: "16.50" }, { label: "18 pc", price: "24.50" }],
        condiments: extras(["Extra Ranch", "0.75"], ["Extra Blue cheese", "0.75"]),
        groups: ["sauce_dip"],
      },
      {
        name: "Pizza Bread",
        description: "Cheesy pizza bread",
        prices: [{ label: "Half", price: "8.00" }],
      },
    ],
  },
  {
    id: "salads",
    name: "Salads",
    note: "Pick a dressing. Extra dressings sell in 2s at the editor price.",
    kind: "single",
    items: [
      {
        name: "Antipasto Salad",
        description: "Genoa salami, capicola, provolone cheese, and ham. Served with lettuce, tomatoes, onions, cucumbers, green peppers, and black olives",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Chef Salad",
        description: "Crispy greens with sliced ham, turkey, cheese, tomato, cucumber, and hard-boiled egg",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Tuna Salad",
        description: "House salad with a big scoop of white tuna",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Caesar Salad",
        description: "Crisp romaine tossed with croutons, Caesar dressing, and grated cheese",
        prices: [{ label: "LG", price: "10.00" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Grilled Chicken Caesar Salad",
        description: "Romaine lettuce, croutons, red onions & Romano cheese in Roma Caesar dressing",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Tossed Salad",
        description: "House salad with your choice of dressing",
        prices: [{ label: "LG", price: "11.25" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Turkey & Cheese Salad",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Greek Salad",
        description: "Feta cheese, olives",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Blackened Chicken Caesar Salad",
        prices: [{ label: "LG", price: "14.75" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Cajun Chicken Caesar Salad",
        prices: [{ label: "LG", price: "14.75" }],
        condiments: SALAD_DRESSING,
      },
      {
        name: "Chicken Tender Salad",
        prices: [{ label: "LG", price: "14.95" }],
        condiments: SALAD_DRESSING,
      },
    ],
  },
  {
    id: "sides",
    name: "Side Orders",
    kind: "split",
    items: [
      {
        name: "Side of Meatballs",
        description: "Ground meat rolled into small spheres, prepared with bread crumbs, minced onion, eggs, butter, and seasoning",
        prices: [{ price: "9.00" }],
      },
      {
        name: "Garlic Bread",
        description: "Bread, topped with garlic & olive oil or butter, herb seasoning, baked to perfection",
        prices: [{ label: "Half", price: "7.75" }],
      },
      {
        name: "Side of Sausage",
        description: "Italian sausage",
        prices: [{ price: "9.00" }],
      },
      {
        name: "Side of Pasta",
        prices: [{ price: "10.00" }],
      },
      {
        name: "Cheesy Garlic Bread",
        description: "French garlic bread with cheese",
        prices: [{ label: "Half", price: "8.75" }],
      },
    ],
  },
  {
    id: "wings",
    name: "Wings",
    note: "Tossed in Hot, Mild, Dry, or BBQ. Includes 2 Ranch, 2 Blue cheese, or none. Extra dressings priced per 2 cups.",
    kind: "split",
    items: [
      {
        name: "Fresh Wings",
        description: "Deep-fried chicken wings with your choice of sauce",
        prices: [{ label: "10 pc", price: "14.00" }],
        condiments: extras(["Extra Ranch", "0.75"], ["Extra Blue cheese", "0.75"]),
      },
      {
        name: "Chicken Nuggets with Fries",
        description: "Breaded & fried chicken strips. Served with fries",
        prices: [{ label: "9 pc", price: "14.95" }],
      },
    ],
  },
  {
    id: "turnovers",
    name: "Pizza Turnovers",
    kind: "single",
    items: [
      {
        name: "Stromboli",
        description: "Pepperoni, sausage & mozzarella cheese",
        prices: [{ label: "LG", price: "18.50" }],
      },
      {
        name: "Steak Stromboli",
        description: "Steak & cheese",
        prices: [{ label: "LG", price: "18.50" }],
      },
      {
        name: "Vegetable Stromboli",
        description: "Sweet peppers, mushrooms, broccoli, onions & cheese",
        prices: [{ label: "LG", price: "19.50" }],
      },
      {
        name: "Calzone",
        description: "Ham, ricotta & mozzarella",
        prices: [{ label: "LG", price: "18.50" }],
      },
      {
        name: "Spinach Calzone",
        description: "With ricotta and mozzarella cheese",
        prices: [{ label: "LG", price: "18.50" }],
      },
      {
        name: "Chicken Steak Stromboli",
        prices: [{ label: "LG", price: "18.50" }],
      },
      {
        name: "Panzarotti",
        description: "Sauce & cheese",
        prices: [{ label: "LG", price: "15.50" }],
      },
    ],
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    note: "White, wheat, rye, or Kaiser roll.",
    kind: "single",
    items: [
      {
        name: "Turkey & Cheese Sandwich",
        prices: [{ price: "11.00" }],
      },
      {
        name: "Ham & Cheese Sandwich",
        description: "Classic ham & cheese sandwich",
        prices: [{ price: "11.00" }],
      },
      {
        name: "Tuna & Cheese Sandwich",
        prices: [{ price: "11.00" }],
      },
      {
        name: "Chicken Breast Sandwich",
        description: "On a kaiser roll with roasted peppers & cheese",
        prices: [{ price: "11.00" }],
      },
    ],
  },
  {
    id: "clubs",
    name: "Club Sandwiches",
    note: "Served with French fries & onion rings.",
    kind: "single",
    items: [
      {
        name: "Turkey Club Sandwich",
        description: "Cheese, bacon, lettuce, tomato & mayo on toasted bread",
        prices: [{ price: "14.50" }],
      },
      {
        name: "Ham & Cheese Club Sandwich",
        description: "Ham, cheese, bacon, lettuce, tomato & mayo on toasted bread",
        prices: [{ price: "14.50" }],
      },
      {
        name: "Tuna Club Sandwich",
        description: "Tuna, bacon & cheese, lettuce, tomato & mayo on toasted bread",
        prices: [{ price: "14.50" }],
      },
      {
        name: "BLT Club Sandwich",
        description: "Crisp bacon, lettuce, tomato, and mayonnaise",
        prices: [{ price: "14.50" }],
      },
    ],
  },
  {
    id: "hot-subs",
    name: "Hot Subs",
    note: "Half or whole where listed.",
    kind: "split",
    items: [
      {
        name: "Veal Parmigiana Hot Sub",
        description: "Veal cutlets, tomato sauce, and parmesan cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Chicken Parmigiana Hot Sub",
        description: "Chicken, parmesan and classic cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Sausage Hot Sub",
        prices: [{ label: "Half", price: "11.50" }, { label: "Whole", price: "17.00" }],
      },
      {
        name: "Sausage Parmigiana Hot Sub",
        description: "Topped with sausage and parmesan cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Meatball Parmigiana Hot Sub",
        description: "Topped with homemade meatballs and cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Eggplant Hot Sub",
        prices: [{ label: "Half", price: "11.50" }, { label: "Whole", price: "17.50" }],
      },
      {
        name: "Eggplant Parmigiana Hot Sub",
        prices: [{ label: "Half", price: "12.95" }],
      },
    ],
  },
  {
    id: "cold-subs",
    name: "Cold Subs",
    note: "Lettuce, tomato, onion, oil & vinegar on request.",
    kind: "split",
    items: [
      {
        name: "Italian Cold Sub",
        description: "Ham, salami, capicola, onions, lettuce, tomato, cheese",
        prices: [{ label: "Half", price: "13.95" }],
      },
      {
        name: "Ham & Cheese Cold Sub",
        description: "Topped with ham and classic cheese",
        prices: [{ label: "Half", price: "11.50" }],
      },
      {
        name: "Salami & Cheese Cold Sub",
        prices: [{ label: "Half", price: "11.50" }],
      },
      {
        name: "Turkey Cold Sub",
        description: "Topped with sliced turkey meat",
        prices: [{ label: "Half", price: "11.00" }],
      },
      {
        name: "Turkey & Cheese Cold Sub",
        description: "Topped with turkey and classic cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Tuna Cold Sub",
        description: "White meat. Delicious tuna fish salad, veggies in a satisfying sub",
        prices: [{ label: "Half", price: "11.75" }],
      },
      {
        name: "Tuna & Cheese Cold Sub",
        description: "White meat. Delicious tuna fish salad, & cheese, veggies in a satisfying sub",
        prices: [{ label: "Half", price: "12.95" }],
      },
    ],
  },
  {
    id: "steak-subs",
    name: "Steak Subs",
    note: "Lettuce, tomato, mayo, onions & hot peppers on request.",
    kind: "split",
    items: [
      {
        name: "Buffalo Chicken Cheesesteak Sub",
        description: "Bleu cheese & mild or hot sauce",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Steak Sub",
        description: "Shaved steak",
        prices: [{ label: "Half", price: "11.50" }],
      },
      {
        name: "Cheesesteak Sub",
        description: "Shredded steak topped with classic cheese",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Bacon Cheesesteak Sub",
        prices: [{ label: "Half", price: "13.50" }],
      },
      {
        name: "Mushroom Steak Sub",
        prices: [{ label: "Half", price: "13.50" }],
      },
      {
        name: "Mushroom Cheesesteak Sub",
        prices: [{ label: "Half", price: "13.50" }],
      },
      {
        name: "Pepper Steak Sub",
        prices: [{ label: "Half", price: "12.00" }, { label: "Whole", price: "18.00" }],
      },
      {
        name: "Pepper Cheesesteak Sub",
        prices: [{ label: "Half", price: "12.50" }],
      },
      {
        name: "Pizza Steak Sub",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Pepperoni Cheesesteak Sub",
        prices: [{ label: "Half", price: "13.95" }],
      },
      {
        name: "Chicken Cheesesteak Sub",
        prices: [{ label: "Half", price: "12.95" }],
      },
      {
        name: "Chicken Steak Sub",
        prices: [{ label: "Half", price: "11.50" }, { label: "Whole", price: "18.00" }],
      },
      {
        name: "Veggie Sub",
        prices: [{ label: "Half", price: "13.00" }],
      },
    ],
  },
  {
    id: "burgers",
    name: "Burgers",
    note: "Served with lettuce, tomato & onion.",
    kind: "single",
    items: [
      {
        name: "Hamburger",
        description: "Plain hamburger",
        prices: [{ price: "9.25" }],
      },
      {
        name: "Cheeseburger",
        prices: [{ price: "10.50" }],
      },
      {
        name: "Bacon Cheeseburger",
        description: "Delicious cheeseburger topped with fresh crispy bacon",
        prices: [{ price: "11.00" }],
      },
      {
        name: "Pizza Burger",
        description: "Beef, cheese, and red sauce",
        prices: [{ price: "11.00" }],
      },
      {
        name: "Double Cheeseburger",
        description: "Double patty with cheese",
        prices: [{ price: "15.00" }],
      },
      {
        name: "Western Burger",
        description: "Mushrooms, onions & BBQ sauce",
        prices: [{ price: "13.75" }],
      },
    ],
  },
  {
    id: "wraps",
    name: "Wraps",
    note: "Served with chips where noted.",
    kind: "single",
    items: [
      {
        name: "Fresh Grilled Chicken Wrap",
        prices: [{ price: "12.00" }],
      },
      {
        name: "Ham Wrap",
        prices: [{ price: "10.00" }],
      },
      {
        name: "Turkey Wrap",
        description: "Turkey, lettuce, tomatoes and onions",
        prices: [{ price: "10.00" }],
      },
      {
        name: "Tuna Wrap",
        description: "Lettuce, tomatoes, onions, and melted cheese",
        prices: [{ price: "12.00" }],
      },
      {
        name: "California Cobb Wrap",
        description: "Mixed greens, cucumbers, black olives, boiled egg, diced chicken & bacon",
        prices: [{ price: "13.95" }],
      },
      {
        name: "Chicken Balsamic Wrap",
        description: "Mixed greens, red onions, roasted peppers, grilled chicken, fresh basil & Balsamic Vinaigrette",
        prices: [{ price: "13.95" }],
      },
      {
        name: "Black & Bleu Chicken Wrap",
        description: "Lettuce, bacon, Bleu cheese & blackened chicken",
        prices: [{ price: "13.95" }],
      },
      {
        name: "Chicken BLT Wrap",
        description: "Bacon, lettuce, tomato & grilled chicken, served with chips",
        prices: [{ price: "13.95" }],
      },
      {
        name: "Chicken Fajita Wrap",
        description: "Peppers, onions, Cajun spices, lime, salsa, lettuce & grilled chicken, served with chips",
        prices: [{ price: "13.95" }],
      },
    ],
  },
  {
    id: "gyros",
    name: "Gyro Sandwiches",
    kind: "single",
    items: [
      {
        name: "Gyro Sandwich",
        description: "Juicy gyro meat with lettuce, onions, tomatoes, and tzatziki sauce",
        prices: [{ price: "11.50" }],
      },
    ],
  },
  {
    id: "pasta",
    name: "Pasta Dishes",
    note: "Platters served with salad, bread & butter. Pick Penne or Spaghetti and a salad dressing — stuffed pastas skip the shape.",
    kind: "single",
    items: [
      {
        name: "Pasta with Tomato Sauce",
        description: "Pasta tossed in our homemade tomato sauce",
        prices: [{ price: "14.50" }],
      },
      {
        name: "Pasta with Meatballs",
        description: "Spaghetti topped in our homemade meatballs",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Spaghetti",
        prices: [{ price: "15.50" }],
      },
      {
        name: "Pasta with Sausage",
        description: "Pasta topped with sausage",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Ziti",
        prices: [{ price: "10.50" }],
      },
      {
        name: "Baked Ziti",
        description: "Ziti with mozzarella and tomato sauce baked to perfection in our oven",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Spaghetti with Clams",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Manicotti",
        description: "A large tube of fresh pasta stuffed with a blend of soft cheese",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Cheese Ravioli",
        description: "Ravioli stuffed with classic cheese",
        prices: [{ price: "16.50" }],
      },
      {
        name: "Eggplant Parmigiana Pasta",
        description: "Topped with eggplant slices, parmesan cheese, and marinara sauce",
        prices: [{ price: "17.50" }],
      },
      {
        name: "Veal Parmigiana Pasta",
        prices: [{ price: "18.50" }],
      },
      {
        name: "Chicken Parmigiana Pasta",
        prices: [{ price: "18.50" }],
      },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    kind: "single",
    items: [
      {
        name: "New York Style Cheesecake",
        description: "Classic New York cheesecake with a creamy satiny texture",
        prices: [{ price: "6.95" }],
      },
      {
        name: "Chocolate Suicide Cake",
        prices: [{ price: "6.95" }],
      },
      {
        name: "Cannoli",
        description: "Delicious tube of fried dough, filled with a sweet, creamy ricotta filling",
        prices: [{ price: "6.95" }],
      },
    ],
  },
  {
    id: "beverages",
    name: "Beverages",
    kind: "split",
    items: [
      {
        name: "Soda",
        prices: [{ label: "20 oz", price: "4.75" }, { label: "2 Liter", price: "5.50" }],
      },
      {
        name: "Brisk Iced Tea",
        prices: [{ label: "2 Liter", price: "5.50" }],
      },
      {
        name: "Pure Leaf Ice Tea",
        prices: [{ label: "20 oz", price: "4.75" }],
      },
      {
        name: "Apple Juice",
        prices: [{ label: "20 oz", price: "4.75" }],
      },
    ],
  },
];
