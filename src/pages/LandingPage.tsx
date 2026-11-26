import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sprout, CalendarClock, ThermometerSun, AlertTriangle, TrendingUp } from 'lucide-react';
import { useFarmData } from '../context/FarmDataContext';
import { formatWeightKg } from '../utils/formatters';
import HERO_IMG from '../assets/images/hero_vertical_farm_1795698952444.jpg';
import CLOSEUP_IMG from '../assets/images/zone_hydroponic_closeup_1795698952002.jpg';

export function LandingPage() {
  const { activeBatches, predictions, state } = useFarmData();

  const totalEstimatedKg = activeBatches.reduce(
    (sum, b) => sum + (predictions[b.id]?.estimatedYieldKg ?? 0),
    0,
  );
  const readyCount = activeBatches.filter((b) => {
    const stage = predictions[b.id]?.growthStage;
    return stage === 'Ready for Harvest' || stage === 'Approaching Maturity';
  }).length;

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] text-[#202923]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 border-b border-[#DFE6DD] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#153F32] whitespace-nowrap shrink-0"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#153F32] text-white">
              <Sprout className="h-4 w-4" />
            </span>
            <span>HARVESTIQ</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-[#5B6660] md:flex">
            <a
              href="#problem"
              onClick={(e) => scrollToSection(e, 'problem')}
              className="transition-colors hover:text-[#153F32] whitespace-nowrap shrink-0"
            >
              Problem
            </a>
            <a
              href="#solution"
              onClick={(e) => scrollToSection(e, 'solution')}
              className="transition-colors hover:text-[#153F32] whitespace-nowrap shrink-0"
            >
              Solution
            </a>
            <a
              href="#capabilities"
              onClick={(e) => scrollToSection(e, 'capabilities')}
              className="transition-colors hover:text-[#153F32] whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="transition-colors hover:text-[#153F32] whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
          </nav>

          <div className="shrink-0">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F2F25] whitespace-nowrap shrink-0"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-[#DFE6DD] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium text-[#287A55]">
                Vertical Farming Intelligence · Hydroponic Lettuce Operations
              </p>
              <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-[#202923] sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
                Grow Smarter. Harvest Better.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#5B6660] sm:text-lg">
                Predictive intelligence for the next generation of vertical farming. Monitor crop
                growth, forecast harvest readiness and make data-driven farming decisions.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#153F32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F2F25] whitespace-nowrap"
                >
                  <span>Explore Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                  className="inline-flex items-center rounded-lg border border-[#DFE6DD] bg-white px-5 py-3 text-sm font-semibold text-[#202923] transition-colors hover:bg-[#F7F9F5] whitespace-nowrap"
                >
                  Discover How It Works
                </a>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-[#EDF2EB] pt-6">
                <div>
                  <p className="font-mono text-xl font-semibold text-[#153F32] tabular-nums">
                    {activeBatches.length}
                  </p>
                  <p className="mt-1 text-xs text-[#78847D]">Active Lettuce Batches</p>
                </div>
                <div>
                  <p className="font-mono text-xl font-semibold text-[#153F32] tabular-nums">
                    {readyCount}
                  </p>
                  <p className="mt-1 text-xs text-[#78847D]">Near Harvest Window</p>
                </div>
                <div>
                  <p className="font-mono text-xl font-semibold text-[#153F32] tabular-nums">
                    {formatWeightKg(totalEstimatedKg, 0)}
                  </p>
                  <p className="mt-1 text-xs text-[#78847D]">Forecasted Cycle Yield</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-[#DFE6DD] bg-[#153F32]">
                <img
                  src={HERO_IMG}
                  alt="Modern multi-tier indoor hydroponic vertical farm cultivating green lettuce"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#153F32]/85 via-[#153F32]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <div className="rounded-lg border border-white/15 bg-[#153F32]/85 p-4 text-white backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#CFE2D4]">
                      <span>{state.farmProfile.name}</span>
                      <span className="font-mono tabular-nums">4 Growing Zones</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold">
                      From monitoring crops to predicting harvests.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-xs">
                      <div>
                        <span className="block text-[#A6C4B5]">Zone D Finishing</span>
                        <span className="font-mono font-semibold tabular-nums">18.2 °C · 56% RH</span>
                      </div>
                      <div>
                        <span className="block text-[#A6C4B5]">Nutrient Solution</span>
                        <span className="font-mono font-semibold tabular-nums">pH 6.0 · 1.58 EC</span>
                      </div>
                      <div>
                        <span className="block text-[#A6C4B5]">Next Harvest</span>
                        <span className="font-mono font-semibold tabular-nums">BT-2601 (1 day)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Problem Identification */}
      <section id="problem" className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-[#287A55]">The Operational Bottleneck</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[#202923] sm:text-3xl">
              Fixed harvest calendars miss microclimate reality.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5B6660]">
              Even inside controlled-environment hydroponic farms, subtle shifts in vapor pressure
              deficit, EC conductivity, and rack airflow cause batches planted on the same day to
              mature at different rates.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
            <div className="rounded-xl border border-[#DFE6DD] bg-white p-5">
              <p className="font-mono text-xs font-semibold text-[#9E6816]">01. Blind Timing</p>
              <h3 className="mt-2 text-sm font-semibold text-[#202923]">
                Spreadsheet guesswork
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#78847D]">
                Static day-count schedules overlook morphological lag, forcing last-minute labor
                reallocation or under-weight heads.
              </p>
            </div>
            <div className="rounded-xl border border-[#DFE6DD] bg-white p-5">
              <p className="font-mono text-xs font-semibold text-[#9E6816]">02. Late Detection</p>
              <h3 className="mt-2 text-sm font-semibold text-[#202923]">
                Unseen stress signals
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#78847D]">
                Tipburn risk from overnight humidity spikes or EC drift is often noticed visually
                only after canopy quality declines.
              </p>
            </div>
            <div className="rounded-xl border border-[#DFE6DD] bg-white p-5">
              <p className="font-mono text-xs font-semibold text-[#9E6816]">03. Yield Variance</p>
              <h3 className="mt-2 text-sm font-semibold text-[#202923]">
                Disconnected records
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#78847D]">
                Without linking environmental history to actual harvested kilograms, growers cannot
                tighten future yield commitments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Solution */}
      <section id="solution" className="border-y border-[#DFE6DD] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-xl border border-[#DFE6DD] bg-[#E8F0E8]">
                <img
                  src={CLOSEUP_IMG}
                  alt="Hydroponic lettuce heads inside NFT growing channels with sensor probe"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold text-[#287A55]">Our Solution</p>
              <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-[#202923] sm:text-3xl">
                Batch-level harvest intelligence across every growing zone.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5B6660]">
                HARVESTIQ unifies crop registration, canopy progression logs, zone telemetry, and
                harvest scheduling in one calm operational workspace built specifically for
                hydroponic lettuce production.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#EDF2EB] pt-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#153F32]">
                    Transparent readiness windows
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#78847D]">
                    Track every batch from Early Growth to Ready for Harvest with clear day-count
                    windows and configurable maturity thresholds.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#153F32]">
                    Closed-loop harvest feedback
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#78847D]">
                    Compare expected versus actual yield in kilograms to build clean historical
                    datasets ready for predictive model calibration.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities (Asymmetric Bento Grid) */}
      <section id="capabilities" className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold text-[#287A55]">Core Capabilities</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202923] sm:text-3xl">
            Built for commercial indoor growers and farm managers.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#DFE6DD] bg-white p-6 md:col-span-2">
            <div className="flex items-center gap-2.5 text-[#153F32]">
              <CalendarClock className="h-5 w-5" />
              <h3 className="text-base font-semibold">Harvest Readiness & Yield Forecasting</h3>
            </div>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#5B6660]">
              Organize active lettuce batches by growth stage, view predicted harvest windows with
              confidence intervals, and plan packaging and cold-chain dispatch days ahead.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#EDF2EB] pt-4 sm:grid-cols-4">
              <div>
                <p className="font-mono text-sm font-semibold text-[#202923]">Early Growth</p>
                <p className="text-xs text-[#78847D]">Zone A propagation</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#202923]">Vegetative</p>
                <p className="text-xs text-[#78847D]">Zone B expansion</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#202923]">Approaching</p>
                <p className="text-xs text-[#78847D]">Within 7 days</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#153F32]">Ready</p>
                <p className="text-xs text-[#78847D]">Harvest window open</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-6">
            <div className="flex items-center gap-2.5 text-[#153F32]">
              <AlertTriangle className="h-5 w-5 text-[#D7A65B]" />
              <h3 className="text-base font-semibold">Anomaly & Stress Alerts</h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#5B6660]">
              Surface batches lagging behind target leaf counts or exposed to elevated humidity and
              EC drift before quality drops.
            </p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-6">
            <div className="flex items-center gap-2.5 text-[#153F32]">
              <ThermometerSun className="h-5 w-5" />
              <h3 className="text-base font-semibold">Environmental Monitoring</h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-[#5B6660]">
              Compare temperature (°C), relative humidity (%), light PPFD, pH, and EC across Zones
              A through D against target agronomic bands.
            </p>
          </div>

          <div className="rounded-xl border border-[#DFE6DD] bg-white p-6 md:col-span-2">
            <div className="flex items-center gap-2.5 text-[#153F32]">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-base font-semibold">Batch-to-Harvest Traceability & CSV Reporting</h3>
            </div>
            <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-[#5B6660]">
              Track every lettuce cultivar from seeding date through leaf count checkpoints to
              actual harvested kilograms, with one-click CSV exports for operations reviews.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How HARVESTIQ Works */}
      <section id="how-it-works" className="border-t border-[#DFE6DD] bg-white">
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold text-[#287A55]">How HARVESTIQ Works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202923] sm:text-3xl">
              Four structured steps from planting to harvest log.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01. Register Batches',
                desc: 'Log cultivar, growing zone, rack number, planting date, and plant count.',
              },
              {
                step: '02. Track Growth & Climate',
                desc: 'Monitor canopy height, leaf counts, temperature, RH, PPFD, pH, and EC.',
              },
              {
                step: '03. Forecast Maturity',
                desc: 'Review readiness stages, expected harvest dates, and estimated yield ranges.',
              },
              {
                step: '04. Record & Improve',
                desc: 'Capture actual harvested weights to evaluate expected vs. actual performance.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-[#DFE6DD] bg-[#F7F9F5] p-5"
              >
                <p className="font-mono text-xs font-semibold text-[#153F32]">{item.step}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5B6660]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Predictive Harvesting Matters */}
      <section className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-[#153F32] bg-[#153F32] p-8 text-white lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#A6C4B5]">Why Predictive Harvesting Matters</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Harvest every rack at peak weight, not a day too early or too late.
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-[#D8E6DC]">
              Align labor shifts, cold-storage capacity, and buyer delivery commitments around
              accurate batch-level harvest windows.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-[#D7A65B] px-5 py-3 text-sm font-semibold text-[#202923] transition-colors hover:bg-[#C6954B] whitespace-nowrap shrink-0"
          >
            <span>Open Live Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="border-t border-[#DFE6DD] bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-4 py-8 text-xs text-[#78847D] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <span className="font-semibold text-[#153F32]">HARVESTIQ</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Intelligence That Grows With You.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/dashboard" className="hover:text-[#153F32]">
              Dashboard
            </Link>
            <Link to="/batches" className="hover:text-[#153F32]">
              Crop Batches
            </Link>
            <Link to="/predictions" className="hover:text-[#153F32]">
              Predictions
            </Link>
            <Link to="/environment" className="hover:text-[#153F32]">
              Environment
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
