/* global window */
// Your application as people will see it: name, logo, icons and the demo accounts on the sign-in page.
// Edit freely; it must stay valid JSON after `window.UX_APP =`.
window.UX_APP = {
  "name": "Product Catalog",
  "logo": "",
  "storeKey": "product-catalog",
  "currency": "$",
  "locale": "en-US",
  "images": "https://picsum.photos/seed/{keywords}-{n}/{w}/{h}",
  "icons": {
    "modules": {
      "MOD-CAT": "tag",
      "MOD-GLB": "home",
      "MOD-PRC": "euro",
      "MOD-SUP": "truck"
    },
    "screens": {}
  },
  "nav": [],
  "users": [
    {
      "id": "u1",
      "name": "Emma Clarke",
      "persona": "Buyer",
      "role": "ROLE-PURCHASER"
    },
    {
      "id": "u2",
      "name": "James Walker",
      "persona": "Catalog lead",
      "role": "ROLE-CATALOG-MANAGER"
    },
    {
      "id": "u3",
      "name": "Olivia Bennett",
      "persona": "Pricing analyst",
      "role": "ROLE-PRICING-MANAGER"
    },
    {
      "id": "u4",
      "name": "Liam Turner",
      "persona": "Sales representative",
      "role": "ROLE-SALES-STAFF"
    }
  ]
};
