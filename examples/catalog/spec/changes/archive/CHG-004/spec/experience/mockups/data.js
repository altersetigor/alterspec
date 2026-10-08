/* global window */
// Demo data the mockups start from (and return to on "Reset demo data"). Make it realistic: real names,
// prices, descriptions and image URLs. Keep ids stable; references point to ids. Bump `version` after editing.
window.UX_DATA = {
  "version": "6c4e9703efd6",
  "entities": {
    "ENT-ARTICLE": [
      {
        "id": "article-1",
        "entity": "ENT-ARTICLE",
        "state": "draft",
        "owner": "u1",
        "values": {
          "Article number": "A-1001",
          "Name": "Article Alpha",
          "Brand": "brand-2",
          "Category": "category-4",
          "Unit of measure": "unit-of-measure-2",
          "Description": "Sample description for article Alpha."
        }
      },
      {
        "id": "article-2",
        "entity": "ENT-ARTICLE",
        "state": "active",
        "owner": "u2",
        "values": {
          "Article number": "A-1002",
          "Name": "Article Nova",
          "Brand": "brand-5",
          "Category": "category-5",
          "Unit of measure": "unit-of-measure-3",
          "Description": "Sample description for article Nova."
        }
      },
      {
        "id": "article-3",
        "entity": "ENT-ARTICLE",
        "state": "discontinued",
        "owner": "u3",
        "values": {
          "Article number": "A-1003",
          "Name": "Article Prime",
          "Brand": "brand-5",
          "Category": "category-4",
          "Unit of measure": "unit-of-measure-6",
          "Description": "Sample description for article Prime."
        }
      },
      {
        "id": "article-4",
        "entity": "ENT-ARTICLE",
        "state": "draft",
        "owner": "u4",
        "values": {
          "Article number": "A-1004",
          "Name": "Article Classic",
          "Brand": "brand-7",
          "Category": "category-7",
          "Unit of measure": "unit-of-measure-5",
          "Description": "Sample description for article Classic."
        }
      },
      {
        "id": "article-5",
        "entity": "ENT-ARTICLE",
        "state": "active",
        "owner": "u1",
        "values": {
          "Article number": "A-1005",
          "Name": "Article Plus",
          "Brand": "brand-7",
          "Category": "category-6",
          "Unit of measure": "unit-of-measure-8",
          "Description": "Sample description for article Plus."
        }
      },
      {
        "id": "article-6",
        "entity": "ENT-ARTICLE",
        "state": "discontinued",
        "owner": "u2",
        "values": {
          "Article number": "A-1006",
          "Name": "Article Studio",
          "Brand": "brand-7",
          "Category": "category-7",
          "Unit of measure": "unit-of-measure-1",
          "Description": "Sample description for article Studio."
        }
      },
      {
        "id": "article-7",
        "entity": "ENT-ARTICLE",
        "state": "draft",
        "owner": "u3",
        "values": {
          "Article number": "A-1007",
          "Name": "Article Home",
          "Brand": "brand-2",
          "Category": "category-1",
          "Unit of measure": "unit-of-measure-1",
          "Description": "Sample description for article Home."
        }
      },
      {
        "id": "article-8",
        "entity": "ENT-ARTICLE",
        "state": "active",
        "owner": "u4",
        "values": {
          "Article number": "A-1008",
          "Name": "Article Select",
          "Brand": "brand-1",
          "Category": "category-1",
          "Unit of measure": "unit-of-measure-1",
          "Description": "Sample description for article Select."
        }
      }
    ],
    "ENT-BRAND": [
      {
        "id": "brand-1",
        "entity": "ENT-BRAND",
        "state": "active",
        "owner": "u1",
        "values": {
          "Name": "Brand Alpha"
        }
      },
      {
        "id": "brand-2",
        "entity": "ENT-BRAND",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Name": "Brand Nova"
        }
      },
      {
        "id": "brand-3",
        "entity": "ENT-BRAND",
        "state": "active",
        "owner": "u3",
        "values": {
          "Name": "Brand Prime"
        }
      },
      {
        "id": "brand-4",
        "entity": "ENT-BRAND",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Name": "Brand Classic"
        }
      },
      {
        "id": "brand-5",
        "entity": "ENT-BRAND",
        "state": "active",
        "owner": "u1",
        "values": {
          "Name": "Brand Plus"
        }
      },
      {
        "id": "brand-6",
        "entity": "ENT-BRAND",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Name": "Brand Studio"
        }
      },
      {
        "id": "brand-7",
        "entity": "ENT-BRAND",
        "state": "active",
        "owner": "u3",
        "values": {
          "Name": "Brand Home"
        }
      },
      {
        "id": "brand-8",
        "entity": "ENT-BRAND",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Name": "Brand Select"
        }
      }
    ],
    "ENT-CATEGORY": [
      {
        "id": "category-1",
        "entity": "ENT-CATEGORY",
        "state": "active",
        "owner": "u1",
        "values": {
          "Name": "Category Alpha",
          "Parent category": "category-3"
        }
      },
      {
        "id": "category-2",
        "entity": "ENT-CATEGORY",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Name": "Category Nova",
          "Parent category": "category-5"
        }
      },
      {
        "id": "category-3",
        "entity": "ENT-CATEGORY",
        "state": "active",
        "owner": "u3",
        "values": {
          "Name": "Category Prime",
          "Parent category": "category-4"
        }
      },
      {
        "id": "category-4",
        "entity": "ENT-CATEGORY",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Name": "Category Classic",
          "Parent category": "category-6"
        }
      },
      {
        "id": "category-5",
        "entity": "ENT-CATEGORY",
        "state": "active",
        "owner": "u1",
        "values": {
          "Name": "Category Plus",
          "Parent category": "category-8"
        }
      },
      {
        "id": "category-6",
        "entity": "ENT-CATEGORY",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Name": "Category Studio",
          "Parent category": "category-7"
        }
      },
      {
        "id": "category-7",
        "entity": "ENT-CATEGORY",
        "state": "active",
        "owner": "u3",
        "values": {
          "Name": "Category Home",
          "Parent category": "category-1"
        }
      },
      {
        "id": "category-8",
        "entity": "ENT-CATEGORY",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Name": "Category Select",
          "Parent category": "category-2"
        }
      }
    ],
    "ENT-PURCHASE-PRICE": [
      {
        "id": "purchase-price-1",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "proposed",
        "owner": "u1",
        "values": {
          "Article": "article-2",
          "Supplier": "supplier-2",
          "Amount": 241.99,
          "Valid from": "2026-06-25"
        }
      },
      {
        "id": "purchase-price-2",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "valid",
        "owner": "u2",
        "values": {
          "Article": "article-5",
          "Supplier": "supplier-3",
          "Amount": 184.99,
          "Valid from": "2026-06-22"
        }
      },
      {
        "id": "purchase-price-3",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "expired",
        "owner": "u3",
        "values": {
          "Article": "article-5",
          "Supplier": "supplier-6",
          "Amount": 603.99,
          "Valid from": "2026-06-19"
        }
      },
      {
        "id": "purchase-price-4",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "proposed",
        "owner": "u4",
        "values": {
          "Article": "article-7",
          "Supplier": "supplier-5",
          "Amount": 546.99,
          "Valid from": "2026-06-07"
        }
      },
      {
        "id": "purchase-price-5",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "valid",
        "owner": "u1",
        "values": {
          "Article": "article-7",
          "Supplier": "supplier-8",
          "Amount": 365.99,
          "Valid from": "2026-06-04"
        }
      },
      {
        "id": "purchase-price-6",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "expired",
        "owner": "u2",
        "values": {
          "Article": "article-7",
          "Supplier": "supplier-1",
          "Amount": 308.99,
          "Valid from": "2026-06-01"
        }
      },
      {
        "id": "purchase-price-7",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "proposed",
        "owner": "u3",
        "values": {
          "Article": "article-2",
          "Supplier": "supplier-1",
          "Amount": 127.99,
          "Valid from": "2026-05-29"
        }
      },
      {
        "id": "purchase-price-8",
        "entity": "ENT-PURCHASE-PRICE",
        "state": "valid",
        "owner": "u4",
        "values": {
          "Article": "article-3",
          "Supplier": "supplier-3",
          "Amount": 70.99,
          "Valid from": "2026-05-26"
        }
      }
    ],
    "ENT-SALES-PRICE": [
      {
        "id": "sales-price-1",
        "entity": "ENT-SALES-PRICE",
        "state": "proposed",
        "owner": "u1",
        "values": {
          "Article": "article-3",
          "Amount": 306.99,
          "Valid from": "2026-06-25"
        }
      },
      {
        "id": "sales-price-2",
        "entity": "ENT-SALES-PRICE",
        "state": "valid",
        "owner": "u2",
        "values": {
          "Article": "article-5",
          "Amount": 487.99,
          "Valid from": "2026-06-15"
        }
      },
      {
        "id": "sales-price-3",
        "entity": "ENT-SALES-PRICE",
        "state": "expired",
        "owner": "u3",
        "values": {
          "Article": "article-4",
          "Amount": 68.99,
          "Valid from": "2026-06-19"
        }
      },
      {
        "id": "sales-price-4",
        "entity": "ENT-SALES-PRICE",
        "state": "proposed",
        "owner": "u4",
        "values": {
          "Article": "article-7",
          "Amount": 601.99,
          "Valid from": "2026-06-10"
        }
      },
      {
        "id": "sales-price-5",
        "entity": "ENT-SALES-PRICE",
        "state": "valid",
        "owner": "u1",
        "values": {
          "Article": "article-6",
          "Amount": 182.99,
          "Valid from": "2026-06-05"
        }
      },
      {
        "id": "sales-price-6",
        "entity": "ENT-SALES-PRICE",
        "state": "expired",
        "owner": "u2",
        "values": {
          "Article": "article-8",
          "Amount": 363.99,
          "Valid from": "2026-06-04"
        }
      },
      {
        "id": "sales-price-7",
        "entity": "ENT-SALES-PRICE",
        "state": "proposed",
        "owner": "u3",
        "values": {
          "Article": "article-2",
          "Amount": 544.99,
          "Valid from": "2026-05-30"
        }
      },
      {
        "id": "sales-price-8",
        "entity": "ENT-SALES-PRICE",
        "state": "valid",
        "owner": "u4",
        "values": {
          "Article": "article-2",
          "Amount": 373.99,
          "Valid from": "2026-05-30"
        }
      }
    ],
    "ENT-SUPPLIER": [
      {
        "id": "supplier-1",
        "entity": "ENT-SUPPLIER",
        "state": "prospective",
        "owner": "u1",
        "values": {
          "Name": "Supplier Alpha",
          "Registration number": "S-1001",
          "Contact person": "Emma Clarke"
        }
      },
      {
        "id": "supplier-2",
        "entity": "ENT-SUPPLIER",
        "state": "approved",
        "owner": "u2",
        "values": {
          "Name": "Supplier Nova",
          "Registration number": "S-1002",
          "Contact person": "James Walker"
        }
      },
      {
        "id": "supplier-3",
        "entity": "ENT-SUPPLIER",
        "state": "blocked",
        "owner": "u3",
        "values": {
          "Name": "Supplier Prime",
          "Registration number": "S-1003",
          "Contact person": "Olivia Bennett"
        }
      },
      {
        "id": "supplier-4",
        "entity": "ENT-SUPPLIER",
        "state": "prospective",
        "owner": "u4",
        "values": {
          "Name": "Supplier Classic",
          "Registration number": "S-1004",
          "Contact person": "Liam Turner"
        }
      },
      {
        "id": "supplier-5",
        "entity": "ENT-SUPPLIER",
        "state": "approved",
        "owner": "u1",
        "values": {
          "Name": "Supplier Plus",
          "Registration number": "S-1005",
          "Contact person": "Sophie Hughes"
        }
      },
      {
        "id": "supplier-6",
        "entity": "ENT-SUPPLIER",
        "state": "blocked",
        "owner": "u2",
        "values": {
          "Name": "Supplier Studio",
          "Registration number": "S-1006",
          "Contact person": "Noah Mitchell"
        }
      },
      {
        "id": "supplier-7",
        "entity": "ENT-SUPPLIER",
        "state": "prospective",
        "owner": "u3",
        "values": {
          "Name": "Supplier Home",
          "Registration number": "S-1007",
          "Contact person": "Grace Parker"
        }
      },
      {
        "id": "supplier-8",
        "entity": "ENT-SUPPLIER",
        "state": "approved",
        "owner": "u4",
        "values": {
          "Name": "Supplier Select",
          "Registration number": "S-1008",
          "Contact person": "Oliver Reed"
        }
      }
    ],
    "ENT-UNIT-OF-MEASURE": [
      {
        "id": "unit-of-measure-1",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "active",
        "owner": "u1",
        "values": {
          "Code": "UOM-1001",
          "Name": "Unit of measure Alpha"
        }
      },
      {
        "id": "unit-of-measure-2",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Code": "UOM-1002",
          "Name": "Unit of measure Nova"
        }
      },
      {
        "id": "unit-of-measure-3",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "active",
        "owner": "u3",
        "values": {
          "Code": "UOM-1003",
          "Name": "Unit of measure Prime"
        }
      },
      {
        "id": "unit-of-measure-4",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Code": "UOM-1004",
          "Name": "Unit of measure Classic"
        }
      },
      {
        "id": "unit-of-measure-5",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "active",
        "owner": "u1",
        "values": {
          "Code": "UOM-1005",
          "Name": "Unit of measure Plus"
        }
      },
      {
        "id": "unit-of-measure-6",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "archived",
        "owner": "u2",
        "values": {
          "Code": "UOM-1006",
          "Name": "Unit of measure Studio"
        }
      },
      {
        "id": "unit-of-measure-7",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "active",
        "owner": "u3",
        "values": {
          "Code": "UOM-1007",
          "Name": "Unit of measure Home"
        }
      },
      {
        "id": "unit-of-measure-8",
        "entity": "ENT-UNIT-OF-MEASURE",
        "state": "archived",
        "owner": "u4",
        "values": {
          "Code": "UOM-1008",
          "Name": "Unit of measure Select"
        }
      }
    ]
  }
};
