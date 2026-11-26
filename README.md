# HARVESTIQ

**Intelligence That Grows With You.**
*From monitoring crops to predicting harvests.*

HARVESTIQ is a predictive harvest intelligence and crop growth monitoring web application designed for hydroponic and vertical lettuce farms.

## Stage 1 Scope
Stage 1 delivers the complete responsive frontend experience backed by deterministic demonstration datasets and browser `localStorage` persistence:

- **Landing Page (`/`)**: Product positioning, operational problem/solution framing, capabilities overview, and workflow walkthrough.
- **Farm Operations Overview (`/dashboard`)**: Interactive KPIs, zone/status/horizon filters, harvest yield forecast, canopy height overview, zone distribution, climate trends, upcoming harvest queue, and anomaly alerts.
- **Crop Batch Management (`/batches`)**: Full batch CRUD (create, edit, delete with confirmation), multi-filter search, column sorting, and CSV export.
- **Individual Batch Details (`/batches/:id`)**: Prominent harvest prediction summary card, plant height & leaf count progression charts, zone telemetry history, growth observation logging, and prediction snapshots.
- **Harvest Predictions (`/predictions`)**: Readiness distribution across configurable maturity stages (`Early Growth`, `Vegetative Growth`, `Approaching Maturity`, `Ready for Harvest`), expected yield envelopes, predicted harvest calendar, and live maturity criteria tuning.
- **Environmental Monitoring (`/environment`)**: Zone-by-zone simulated telemetry (`°C`, `% RH`, `PPFD`, `pH`, `EC`), 14-day multi-metric trends, target band alerts, and crop uniformity correlation.
- **Harvest Management (`/harvest`)**: Upcoming harvest queue, harvest calendar, validated harvest completion modal (`Mark Harvested`), expected vs. actual yield comparison, and CSV export.
- **Analytics & Reports (`/analytics`)**: Cultivar growth comparisons, zone performance breakdown, predicted vs. actual date/yield variance, and honest ML validation readiness notice.
- **Settings (`/settings`)**: Farm profile persistence, default maturity criteria configuration, zone specifications, and demonstration data reset.

## Local Development

```bash
npm install
npm run dev
```

Type-check and build for production:

```bash
npm run lint
npm run build
```
