/* global window */
// Written by `alterspec views` from the spec. Do not edit: it is rewritten.
window.UX_SPEC = {
  "app": "Product Catalog",
  "roles": {
    "ROLE-CATALOG-MANAGER": "Catalog manager",
    "ROLE-PRICING-MANAGER": "Pricing manager",
    "ROLE-PURCHASER": "Purchaser",
    "ROLE-SALES-STAFF": "Sales staff"
  },
  "modules": [
    {
      "id": "MOD-CAT",
      "title": "Catalog"
    },
    {
      "id": "MOD-GLB",
      "title": "Shared"
    },
    {
      "id": "MOD-PRC",
      "title": "Pricing"
    },
    {
      "id": "MOD-SUP",
      "title": "Suppliers"
    }
  ],
  "screens": {
    "SCR-CAT-01": {
      "title": "Article record",
      "module": "MOD-CAT",
      "roles": [
        "ROLE-CATALOG-MANAGER"
      ],
      "top": false,
      "parents": [
        "SCR-GLB-01"
      ],
      "record": false,
      "scopes": {
        "ROLE-CATALOG-MANAGER": "org"
      }
    },
    "SCR-CAT-02": {
      "title": "Master data",
      "module": "MOD-CAT",
      "roles": [
        "ROLE-CATALOG-MANAGER"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-CATALOG-MANAGER": "org"
      }
    },
    "SCR-GLB-01": {
      "title": "Article search",
      "module": "MOD-GLB",
      "roles": [
        "ROLE-SALES-STAFF"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-SALES-STAFF": "all"
      }
    },
    "SCR-PRC-01": {
      "title": "Sales price review",
      "module": "MOD-PRC",
      "roles": [
        "ROLE-PRICING-MANAGER"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-PRICING-MANAGER": "org"
      }
    },
    "SCR-SUP-01": {
      "title": "Supplier record",
      "module": "MOD-SUP",
      "roles": [
        "ROLE-PURCHASER"
      ],
      "top": true,
      "parents": [],
      "record": false,
      "scopes": {
        "ROLE-PURCHASER": "org"
      }
    },
    "SCR-SUP-02": {
      "title": "Purchase prices",
      "module": "MOD-SUP",
      "roles": [
        "ROLE-PURCHASER"
      ],
      "top": false,
      "parents": [
        "SCR-SUP-01"
      ],
      "record": false,
      "scopes": {
        "ROLE-PURCHASER": "org"
      }
    }
  },
  "entities": {
    "ENT-ARTICLE": {
      "title": "Article",
      "prefix": "article",
      "label": "Name",
      "initialState": "draft",
      "states": [
        "draft",
        "active",
        "discontinued"
      ],
      "attributes": {
        "Article number": {
          "kind": "text",
          "required": true
        },
        "Name": {
          "kind": "text",
          "required": true
        },
        "Brand": {
          "kind": "reference",
          "required": false,
          "references": "ENT-BRAND"
        },
        "Category": {
          "kind": "reference",
          "required": true,
          "references": "ENT-CATEGORY"
        },
        "Unit of measure": {
          "kind": "reference",
          "required": true,
          "references": "ENT-UNIT-OF-MEASURE"
        },
        "Description": {
          "kind": "text",
          "required": false
        }
      }
    },
    "ENT-BRAND": {
      "title": "Brand",
      "prefix": "brand",
      "label": "Name",
      "initialState": "active",
      "states": [
        "active",
        "archived"
      ],
      "attributes": {
        "Name": {
          "kind": "text",
          "required": true
        }
      }
    },
    "ENT-CATEGORY": {
      "title": "Category",
      "prefix": "category",
      "label": "Name",
      "initialState": "active",
      "states": [
        "active",
        "archived"
      ],
      "attributes": {
        "Name": {
          "kind": "text",
          "required": true
        },
        "Parent category": {
          "kind": "reference",
          "required": false,
          "references": "ENT-CATEGORY"
        }
      }
    },
    "ENT-PURCHASE-PRICE": {
      "title": "Purchase price",
      "prefix": "purchase-price",
      "initialState": "proposed",
      "states": [
        "proposed",
        "valid",
        "expired"
      ],
      "attributes": {
        "Article": {
          "kind": "reference",
          "required": true,
          "references": "ENT-ARTICLE"
        },
        "Supplier": {
          "kind": "reference",
          "required": true,
          "references": "ENT-SUPPLIER"
        },
        "Amount": {
          "kind": "amount",
          "required": true
        },
        "Valid from": {
          "kind": "date",
          "required": true
        }
      }
    },
    "ENT-SALES-PRICE": {
      "title": "Sales price",
      "prefix": "sales-price",
      "initialState": "proposed",
      "states": [
        "proposed",
        "valid",
        "expired"
      ],
      "attributes": {
        "Article": {
          "kind": "reference",
          "required": true,
          "references": "ENT-ARTICLE"
        },
        "Amount": {
          "kind": "amount",
          "required": true
        },
        "Valid from": {
          "kind": "date",
          "required": true
        }
      }
    },
    "ENT-SUPPLIER": {
      "title": "Supplier",
      "prefix": "supplier",
      "label": "Name",
      "initialState": "prospective",
      "states": [
        "prospective",
        "approved",
        "blocked"
      ],
      "attributes": {
        "Name": {
          "kind": "text",
          "required": true
        },
        "Registration number": {
          "kind": "text",
          "required": true
        },
        "Contact person": {
          "kind": "text",
          "required": false
        }
      }
    },
    "ENT-UNIT-OF-MEASURE": {
      "title": "Unit of measure",
      "prefix": "unit-of-measure",
      "label": "Name",
      "initialState": "active",
      "states": [
        "active",
        "archived"
      ],
      "attributes": {
        "Code": {
          "kind": "text",
          "required": true
        },
        "Name": {
          "kind": "text",
          "required": true
        }
      }
    }
  },
  "tones": {
    "active": "success",
    "approved": "success",
    "archived": "muted",
    "blocked": "danger",
    "discontinued": "muted",
    "draft": "info",
    "expired": "muted",
    "proposed": "info",
    "prospective": "info",
    "valid": "success"
  }
};
