// 9ONE Café menu — transcribed from the in-house menu (prices in USD).
// Pizza prices are [small, medium, large].
export const MENU = [
  {
    id: "coffee",
    name: "Coffee",
    tag: "Espresso bar",
    img: "assets/img/latte-cup",
    groups: [
      {
        title: "Hot Coffee",
        items: [
          ["Espresso", 1.5], ["Espresso Macchiato", 1.5], ["Cortado", 1.5],
          ["Cappuccino", 2], ["Latte", 2], ["Americano", 1.5], ["Flat White", 2],
          ["Doppio", 1], ["Lungo", 1], ["Vanilla Latte", 2.5], ["Caramel Latte", 2.5],
          ["White Mocha Latte", 2.5], ["Mocha Latte", 2.5], ["Spanish Latte", 2.5, "", true],
          ["Salted Caramel Latte", 2.5], ["Chai Tea Latte", 2.5], ["V60", 2.5, "Hand-poured, single origin", true],
          ["Affogato", 2], ["Coconut Latte", 2.5],
        ],
      },
      {
        title: "Iced Coffee",
        items: [
          ["Iced Caramel Latte", 2.5], ["Iced Vanilla Latte", 2.5], ["Classic Iced Latte", 2.5],
          ["Iced Spanish Latte", 2.5, "", true], ["Iced Mocha", 2.5], ["Iced Coconut Latte", 2.5],
          ["Iced White Mocha", 2.5], ["Iced Chai Tea Latte", 2.5], ["Iced Americano", 2], ["Iced V60", 3],
        ],
      },
    ],
  },
  {
    id: "tea",
    name: "Tea",
    tag: "Shaah & more",
    img: "assets/img/hibiscus",
    groups: [
      {
        title: "Hot Tea",
        items: [
          ["Somali Tea", 1, "Shaah, the way it should be", true], ["Camel Tea", 1.5], ["Karak Tea", 1.5],
          ["Masala Tea", 1], ["Spanish Tea", 1.5], ["Fresh 91 Tea", 1], ["Matcha Latte", 2],
          ["Dawa Tea", 1.5], ["Hibiscus Tea", 1.5], ["Ginger Tea", 1],
        ],
      },
      {
        title: "Iced Tea",
        items: [
          ["Raspberry Iced Tea", 2.5], ["Peach Iced Tea", 2.5], ["Blueberry Iced Tea", 2.5],
          ["Strawberry Iced Tea", 2.5], ["Lemonade Iced Tea", 3],
        ],
      },
      {
        title: "Hibiscus",
        items: [
          ["Iced Strawberry Hibiscus", 3, "", true], ["Iced Passion Fruit Hibiscus", 3],
          ["Iced Blueberry Hibiscus", 3], ["Ice Berry Hibiscus", 2.5],
        ],
      },
    ],
  },
  {
    id: "matcha",
    name: "Matcha & Shakes",
    tag: "Matcha corner",
    img: "assets/img/matcha",
    groups: [
      {
        title: "Matcha Corner",
        items: [
          ["Matcha Frappe", 3], ["Strawberry Matcha Latte", 3, "", true], ["Mango Matcha Latte", 3],
          ["Dirty Matcha Latte", 2.5], ["Iced Spanish Matcha", 2.5], ["Iced Vanilla Matcha", 2.5],
          ["Iced Caramel Matcha", 2.5], ["Iced White Chocolate Matcha", 2.5],
        ],
      },
      {
        title: "Smoothies",
        items: [["Strawberry Smoothie", 3.5], ["Mango Smoothie", 3.5], ["Banana Smoothie", 3.5]],
      },
      {
        title: "Milkshakes",
        items: [["Strawberry Milkshake", 3], ["Lotus Milkshake", 3, "", true], ["Oreo Milkshake", 3], ["Coffee Milkshake", 3]],
      },
    ],
  },
  {
    id: "juice",
    name: "Juice & Mojitos",
    tag: "Fresh & cold",
    img: "assets/img/mojito",
    groups: [
      {
        title: "Signature Refreshers",
        items: [
          ["Iced 9ONE Refresher", 3, "Our house signature", true], ["Iced Watermelon Refresher", 3],
          ["Iced Peach Refresher", 3], ["Iced Mango Refresher", 3],
        ],
      },
      {
        title: "Mojitos",
        items: [
          ["Mango Mojito", 2.5], ["Passion Fruit Mojito", 2.5], ["Blueberry Mojito", 2.5],
          ["Strawberry Mojito", 2.5], ["Pineapple Mojito", 2.5],
        ],
      },
      {
        title: "Fresh Juice",
        items: [
          ["Orange Juice", 2], ["Watermelon Juice", 2], ["Mango Juice", 2], ["Papaya Juice", 2],
          ["Avocado Juice", 2], ["Fruit Cocktail Juice", 2.5],
        ],
      },
    ],
  },
  {
    id: "breakfast",
    name: "Breakfast",
    tag: "From 7 am",
    img: "assets/img/pancakes",
    groups: [
      {
        title: "Savoury",
        items: [
          ["Liver", 4.5, "Liver, onions, mixed peppers and garlic, served with bread or laxoox"],
          ["Spanish Omelette", 3.5, "Two eggs, toasted bread"],
          ["Cheese Omelette", 4, "Fluffy eggs folded with melted cheese"],
          ["Oatmeal Bowl", 4, "White oats, yoghurt, fruit and honey"],
          ["Suqaar", 4, "Tender beef cubes cooked with Somali spices, served with laxoox or bread", true],
        ],
      },
      {
        title: "Sweet Breakfast",
        items: [
          ["Pancake Stack", 4, "With butter or honey, banana and strawberry", true],
          ["Waffles", 4.5, "Served with fruit, honey or whipped cream"],
          ["Malawax with Honey & Banana", 3.5, "A modern twist — sweet and filling"],
          ["French Toast", 4, "Topped with cinnamon sugar and honey"],
          ["Cambaabur", 4, "Traditional Somali festive pancake"],
        ],
      },
    ],
  },
  {
    id: "mains",
    name: "Main Course",
    tag: "Served with rice, chips or wrap",
    img: "assets/img/curry",
    groups: [
      {
        title: "Main Course",
        note: "All main courses are served with a choice of rice, chips or tortilla wrap.",
        items: [
          ["Somali Goat Hanid", 10, "Slow-cooked perfection — a proud Somali classic", true],
          ["Sweet & Sour Fish", 9, "Crispy fish fillet with sautéed onions, tomatoes, smoky paprika and black pepper in a tangy-sweet sauce"],
          ["Butter Chicken", 7.5, "Tender chicken in a creamy tomato-butter sauce, with basmati or naan and a side salad"],
          ["Grilled Chicken Breast", 8, "Herb-marinated and grilled, with steamed vegetables, rice or muuf"],
          ["Grilled Fish", 8, "Fillet marinated with lemon, garlic and herbs, with rice or fresh salad"],
          ["Goat Meat", 8, "Tender, flavourful goat served with rice or bread"],
          ["Chicken Curry", 7, "Simmered in a rich spiced curry with onion, tomato, garlic and fresh herbs"],
          ["Fish Curry", 7, "Fresh fillets in a spiced tomato-onion curry with mild heat"],
        ],
      },
    ],
  },
  {
    id: "burgers",
    name: "Burgers & Wraps",
    tag: "With fries & sauce",
    img: "assets/img/burgers",
    groups: [
      {
        title: "Burgers",
        note: "All burgers come with French fries and a complimentary sauce.",
        items: [
          ["Double Smash Burger", 7.5, "Beef", true], ["Smash Burger", 5, "Beef"],
          ["BBQ Chicken Burger", 6, "Chicken"], ["Stacker Burger", 5, "Chicken"], ["Grilled Chicken Burger", 4.5, "Chicken"],
        ],
      },
      {
        title: "Sandwiches & Wraps",
        items: [
          ["9ONE Sandwich", 6.5, "Toasted, with chicken, cheese, fried egg, tomato and lettuce", true],
          ["Fish Wrap", 6, "Fish fillet in lemon and garlic with peppers and onions. Chips on the side"],
          ["Chicken Wrap", 6, "Marinated chicken breast, cucumber pickles and fries. Chips on the side"],
          ["Meat Wrap", 6, "Marinated beef strips, cucumber pickles and fries. Chips on the side"],
        ],
      },
    ],
  },
  {
    id: "pizza",
    name: "Pizza",
    tag: "Small · Medium · Large",
    img: "assets/img/pizza",
    groups: [
      {
        title: "Pizza",
        sizes: true,
        items: [
          ["9ONE Pizza", 15, "The house pizza — one size, fully loaded", true],
          ["Chicken Pizza", [5, 8, 10]], ["Fish Pizza", [5, 8, 10]], ["Tuna Pizza", [5, 8, 10]],
          ["Meat Pizza", [6, 9, 12]], ["Hawaiian Pizza", [5, 8, 10]], ["Margherita Pizza", [5, 8, 10]],
        ],
      },
    ],
  },
  {
    id: "pasta",
    name: "Pasta & Salads",
    tag: "Light & fresh",
    img: "assets/img/pasta",
    groups: [
      {
        title: "Pasta",
        items: [
          ["Spaghetti Matriciana", 6.5, "Spaghetti in pomodoro sauce with beef strips"],
          ["9ONE Pasta", 6, "Spicy fried tomato sauce with chicken, penne or spaghetti", true],
          ["Pasta Alfredo", 5.5, "Creamy pasta with chicken, green peas and mushrooms"],
          ["Pasta Bolognese", 5, "Minced beef in pomodoro sauce, served with spaghetti"],
        ],
      },
      {
        title: "Salads",
        items: [
          ["Fish Salad", 4, "Grilled fish over greens, cucumber and tomato with lemon dressing"],
          ["Chicken Breast Salad", 4, "Grilled chicken, lettuce, tomato, cucumber and sweet corn"],
          ["Tuna Light Salad", 3.5, "Tuna, sweet corn, tomato, green pepper, black olives, lemon-mustard"],
          ["Green Garden Salad", 3, "Lettuce, spinach, cucumber, tomato, onion and parsley"],
        ],
      },
    ],
  },
  {
    id: "soups",
    name: "Soups & Sides",
    tag: "Warm & comforting",
    img: "assets/img/fries",
    groups: [
      {
        title: "Soups",
        items: [
          ["Chicken Soup", 3.5, "Shredded chicken in a light vegetable broth, with bread or salad"],
          ["Fish Soup", 3.5, "Fish fillet in a mildly spiced broth with potato and herbs, with chapati"],
          ["Creamy Vegetable Soup", 3, "Blended vegetables with herbs and light cream"],
          ["Tomato Basil Soup", 3, "Fresh tomatoes simmered with basil and garlic, with toast"],
          ["Lentil Soup", 3, "Slow-cooked lentils with carrot, onion and Somali spices", true],
        ],
      },
      {
        title: "Sides & Sauces",
        items: [
          ["Chips Masala", 5, "", true], ["Cheesy Fries", 4], ["French Fries", 3],
          ["Mayonnaise", 0.5], ["Attack Sauce", 0.5], ["Chilli Sauce", 0.5], ["BBQ Sauce", 0.5],
        ],
      },
    ],
  },
  {
    id: "cakes",
    name: "Cakes & Pastry",
    tag: "Baked daily",
    img: "assets/img/latte-art",
    groups: [
      {
        title: "Cakes & Croissants",
        items: [
          ["Basbusa", 3, "", true], ["Brownies", 3], ["Coconut Cake", 3], ["Date Cake", 2.5],
          ["Croissant", 1.2], ["Almond Croissant", 2], ["Cookies", 1.6],
        ],
      },
    ],
  },
];
