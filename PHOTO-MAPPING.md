# Photo wedding mapping

Original images: `public/images/`. No renaming is needed.

Assign each stable photo ID in `src/content/photo-weddings.json`. Valid wedding IDs are `gaia-jan` (Gaia & Jan) and `edcelyn-rok` (Edcelyn & Rok). Use `null` for an unconfirmed photo. To add another wedding, first add its name and URL ID in `src/lib/weddings.ts`.

These assignments control homepage links, Work section names, and wedding gallery contents. Unassigned homepage photos stay visible without linking to an incorrect gallery. Once assigned, they automatically appear in that wedding gallery.

Select exactly four photos per wedding in `src/content/work-settings.json`. The `photoIds` list controls the Work preview only; every selected photo must belong to that wedding in the mapping file. The full gallery still includes all assigned photos. `reviewSide` controls whether its review appears on the `left` or `right` of the centered name/button.

Current Work selections are Gaia & Jan: P04, P08, P13, P14 (review on the right); Edcelyn & Rok: P05, P12, P02, P01 (review on the left). The website arranges them in two varied columns, adds a gap between weddings, and switches the active name/review when the middle of that gap passes the viewport center. Layouts remain stable while scrolling and during server/client rendering.

The transition style is selected in `src/content/work-transition.json`. `review-only` keeps the original button design centered and slides each review toward/from its outer edge. Set the mode to `slide-all` to restore the original transition where the entire caption moves from left to right. Both modes use the same gap-midpoint trigger.

The table below records the assignments confirmed in chat. The JSON file is the editable source; this table is a reference. `work-*.png` duplicates do not need separate IDs.

| Photo ID | Original file | Wedding ID |
| --- | --- | --- |
| P01 | [couple_1__05.png](public/images/couple_1__05.png) | edcelyn-rok |
| P02 | [couple_1__06.png](public/images/couple_1__06.png) | edcelyn-rok |
| P03 | [couple_2_3__02.png](public/images/couple_2_3__02.png) | gaia-jan |
| P04 | [couple_2_3__03.png](public/images/couple_2_3__03.png) | gaia-jan |
| P05 | [couple_2_3__07.png](public/images/couple_2_3__07.png) | edcelyn-rok |
| P06 | [couple_2_3__13.png](public/images/couple_2_3__13.png) | Unassigned |
| P07 | [couple_2_3__14.png](public/images/couple_2_3__14.png) | Unassigned |
| P08 | [couple_3_2__01.png](public/images/couple_3_2__01.png) | gaia-jan |
| P09 | [couple_3_2__04.png](public/images/couple_3_2__04.png) | edcelyn-rok |
| P10 | [couple_3_2__08.png](public/images/couple_3_2__08.png) | edcelyn-rok |
| P11 | [couple_3_2__09.png](public/images/couple_3_2__09.png) | gaia-jan |
| P12 | [couple_3_2__11.png](public/images/couple_3_2__11.png) | edcelyn-rok |
| P13 | [couple_3_2__12.png](public/images/couple_3_2__12.png) | gaia-jan |
| P14 | [work-gaia-jan-bride-detail.png](public/images/work-gaia-jan-bride-detail.png) | gaia-jan |

You can also send assignments in chat, for example: `P03 = Gaia & Jan`.
