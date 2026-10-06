<!-- GENERATED:file hash=25dbf08563b4 — written by `alterspec views`; do not edit -->

# Coverage

## Entity lifecycle

| Entity | C | R | U | D | A | Missing | Uncovered transitions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [ENT-ARTICLE](../application/entities/ENT-ARTICLE.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-BRAND](../application/entities/ENT-BRAND.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-CATEGORY](../application/entities/ENT-CATEGORY.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-PURCHASE-PRICE](../application/entities/ENT-PURCHASE-PRICE.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-SALES-PRICE](../application/entities/ENT-SALES-PRICE.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-SUPPLIER](../application/entities/ENT-SUPPLIER.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |
| [ENT-UNIT-OF-MEASURE](../application/entities/ENT-UNIT-OF-MEASURE.md) | ✓ | ✓ | ✓ |  | ✓ | — | — |

## Events

| Event | Emitted by | Consumed by | External |
| --- | --- | --- | --- |
| EVT-ARTICLE-ACTIVATED | CAP-CAT-005 | CAP-PRC-001 | no |
| EVT-ARTICLE-DISCONTINUED | CAP-CAT-006 | CAP-PRC-003 | no |
| EVT-PURCHASE-PRICE-CHANGED | CAP-SUP-006 | CAP-PRC-001 | no |
| EVT-SUPPLIER-PRICE-LIST-RECEIVED | — | CAP-SUP-005 | yes |
