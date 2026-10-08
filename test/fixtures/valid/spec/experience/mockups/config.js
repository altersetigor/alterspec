/* global window */
// Your application as people will see it: name, logo, icons and the demo accounts on the sign-in page.
// Edit freely; it must stay valid JSON after `window.UX_APP =`.
window.UX_APP = {
  "name": "Fixture People",
  "logo": "",
  "storeKey": "fixture-people",
  "currency": "$",
  "locale": "en-US",
  "images": "https://picsum.photos/seed/{keywords}-{n}/{w}/{h}",
  "icons": {
    "modules": {
      "MOD-GLB": "home",
      "MOD-HR": "folder",
      "MOD-PAY": "folder"
    },
    "screens": {}
  },
  "nav": [],
  "users": [
    {
      "id": "u1",
      "name": "Emma Clarke",
      "persona": "Accountant",
      "role": "ROLE-ACCOUNTANT"
    },
    {
      "id": "u2",
      "name": "James Walker",
      "persona": "Employee",
      "role": "ROLE-EMPLOYEE"
    },
    {
      "id": "u3",
      "name": "Olivia Bennett",
      "persona": "HR lead",
      "role": "ROLE-HR-MANAGER"
    }
  ]
};
