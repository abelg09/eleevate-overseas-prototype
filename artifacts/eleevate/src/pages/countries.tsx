import { useState } from "react";
import { useListCountries, getListCountriesQueryKey } from "@workspace/api-client-react";
import type { Country } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { PageHeader } from "@/components/common/page-shell";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { DEMO_COUNTRIES } from "@/lib/demo-catalog";
import { getComparableCountries, getCountryInsight } from "@/lib/product-demo";
import { cn } from "@/lib/utils";

const ACCOMMODATION_TYPES = [
  { key: "shared_room",     label: "Shared Room",      multiplier: 0.55, desc: "Room in a shared house or flat" },
  { key: "student_halls",   label: "Student Halls",    multiplier: 0.80, desc: "University-managed accommodation" },
  { key: "studio",          label: "Studio Apartment", multiplier: 1.20, desc: "Private self-contained studio" },
  { key: "one_bed",         label: "1-Bed Apartment",  multiplier: 1.50, desc: "Private 1-bedroom flat" },
];

const BUDGET_CATEGORIES = [
  { key: "food",      label: "Food (monthly)",         placeholder: "e.g. 300" },
  { key: "transport", label: "Transport (monthly)",    placeholder: "e.g. 80" },
  { key: "misc",      label: "Misc / Entertainment",  placeholder: "e.g. 150" },
];

const CITY_DATA: Record<string, { name: string; baseRent: number; costIndex: number; highlights: string[] }[]> = {
  GB: [
    { name: "London",     baseRent: 1200, costIndex: 1.40, highlights: ["Global financial hub", "World-class museums", "Multicultural"] },
    { name: "Manchester", baseRent: 750,  costIndex: 0.85, highlights: ["Student city", "Tech & media scene", "Northern culture"] },
    { name: "Edinburgh",  baseRent: 850,  costIndex: 0.95, highlights: ["Historic capital", "Festival city", "Top universities"] },
  ],
  US: [
    { name: "Boston",        baseRent: 1800, costIndex: 1.30, highlights: ["Ivy League cluster", "Innovation hub", "Colonial history"] },
    { name: "New York",      baseRent: 2500, costIndex: 1.55, highlights: ["Finance & arts", "Global networking", "Endless opportunities"] },
    { name: "San Francisco", baseRent: 2800, costIndex: 1.60, highlights: ["Silicon Valley", "Tech & startup hub", "Bay Area lifestyle"] },
  ],
  CA: [
    { name: "Toronto",   baseRent: 1400, costIndex: 1.05, highlights: ["Canada's largest city", "Diverse & multicultural", "Finance hub"] },
    { name: "Vancouver", baseRent: 1600, costIndex: 1.15, highlights: ["Pacific gateway", "Stunning nature", "Film & tech industry"] },
    { name: "Montreal",  baseRent: 900,  costIndex: 0.85, highlights: ["Bilingual city", "Arts & culture", "Most affordable major city"] },
  ],
  AU: [
    { name: "Sydney",    baseRent: 1800, costIndex: 1.25, highlights: ["Harbour city", "Beach lifestyle", "Global commerce"] },
    { name: "Melbourne", baseRent: 1500, costIndex: 1.10, highlights: ["Cultural capital", "Coffee culture", "Sports & arts"] },
    { name: "Brisbane",  baseRent: 1100, costIndex: 0.90, highlights: ["Sunny climate", "Growing tech scene", "Outdoor lifestyle"] },
  ],
  DE: [
    { name: "Berlin",    baseRent: 900,  costIndex: 0.85, highlights: ["Tech & startup hub", "Low tuition", "Rich history & arts"] },
    { name: "Munich",    baseRent: 1200, costIndex: 1.00, highlights: ["Engineering powerhouse", "High quality of life", "Global brands"] },
    { name: "Frankfurt", baseRent: 1100, costIndex: 0.95, highlights: ["European finance hub", "Strong logistics sector", "Central location"] },
  ],
  NL: [
    { name: "Amsterdam", baseRent: 1400, costIndex: 1.15, highlights: ["Cycling city", "International atmosphere", "Top research universities"] },
    { name: "Delft",     baseRent: 1000, costIndex: 0.95, highlights: ["TU Delft campus town", "Engineering excellence", "Canals & culture"] },
  ],
  SG: [
    { name: "Singapore City", baseRent: 1800, costIndex: 1.35, highlights: ["Global finance hub", "Safe & clean", "Multicultural melting pot"] },
  ],
  IE: [
    { name: "Dublin", baseRent: 1600, costIndex: 1.10, highlights: ["Tech multinationals", "English-speaking", "Lively cultural scene"] },
    { name: "Galway", baseRent: 900,  costIndex: 0.80, highlights: ["Charming student city", "Atlantic coast", "Arts & language festivals"] },
  ],
};

export default function CountriesPage() {
  const demoMode = isDemoMode();
  const { data: countries, isLoading } = useListCountries({
    query: { queryKey: getListCountriesQueryKey(), enabled: !demoMode }
  });

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [compareOpen, setCompareOpen] = useState(() => typeof window !== "undefined" && window.location.search.includes("compare=true"));
  const [compareCodes, setCompareCodes] = useState<string[]>(["CA", "GB", "US"]);
  const [budget, setBudget] = useState<Record<string, string>>({ food: "", transport: "", misc: "" });
  const [accomType, setAccomType] = useState<string>("shared_room");

  const apiCountries = listFromApi<Country>(countries);
  const baseCountries = demoMode || apiCountries.length === 0 ? DEMO_COUNTRIES : apiCountries;
  const countriesArr = baseCountries;
  const activeSelectedCountry = selectedCountry;
  const selected = countriesArr.find(c => c.code === activeSelectedCountry);
  const allCities = CITY_DATA[activeSelectedCountry ?? ""] ?? [];
  const cities = allCities;
  const selectedAccom = ACCOMMODATION_TYPES.find(a => a.key === accomType) ?? ACCOMMODATION_TYPES[0];
  const comparableCountries = getComparableCountries();
  const selectedCompareCountries = comparableCountries.filter((country) => compareCodes.includes(country.code));

  const nonRentBudget = Object.values(budget).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const totalCityCount = Object.values(CITY_DATA).reduce((sum, list) => sum + list.length, 0);
  const avgMonthlyCost = Math.round(
    countriesArr.reduce((sum, country) => sum + (country.avgCostOfLivingUsd ?? 0), 0) / Math.max(countriesArr.length, 1),
  );

  const getMonthlyEstimate = (city: typeof cities[number]) => {
    const rent = Math.round(city.baseRent * selectedAccom.multiplier * city.costIndex);
    const other = Math.round(nonRentBudget > 0 ? nonRentBudget * city.costIndex : 0);
    return { rent, other, total: rent + other };
  };

  return (
    <AppLayout>
      <div data-testid="countries-page">
        <PageHeader
          eyebrow="Discovery"
          title="Destinations & City Guides"
          description="Compare study countries by visa pathway, living cost, city fit, and budget readiness before you lock your shortlist."
          actions={(
            <Button variant="outline" className="rounded-full border-secondary font-serif text-secondary" onClick={() => setCompareOpen(true)} data-testid="btn-country-compare">
              Compare countries
            </Button>
          )}
        />

        {compareOpen && (
          <div className="fixed inset-0 z-50 bg-secondary/40 backdrop-blur-sm" data-testid="country-compare-drawer">
            <div className="absolute right-0 top-0 flex h-full w-full max-w-[980px] flex-col overflow-y-auto border-l border-border bg-white shadow-2xl">
              <div className="sticky top-0 z-10 border-b border-border bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="eyebrow mb-2">Country compare</div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Compare route fit before locking the journey.</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Pick up to four destinations. ELEE compares tuition, visa risk, post-study work, family readiness, and route fit.</p>
                  </div>
                  <button className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setCompareOpen(false)} aria-label="Close country compare">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {comparableCountries.map((country) => {
                    const selectedForCompare = compareCodes.includes(country.code);
                    return (
                      <button
                        key={country.code}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                          selectedForCompare ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/40",
                        )}
                        onClick={() => {
                          setCompareCodes((codes) => {
                            if (codes.includes(country.code)) return codes.filter((code) => code !== country.code);
                            if (codes.length >= 4) return [country.code, ...codes.slice(0, 3)];
                            return [...codes, country.code];
                          });
                        }}
                      >
                        {country.flagEmoji} {country.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  {selectedCompareCountries.map((country) => {
                    const insight = getCountryInsight(country);
                    if (!insight) return null;
                    return (
                      <Card key={country.code} className="app-card overflow-hidden p-0">
                        <div className="brand-gradient-bg h-1" />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-2xl">{country.flagEmoji}</div>
                              <h3 className="mt-2 font-serif text-xl font-bold text-foreground">{country.name}</h3>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">{insight.pathway}</p>
                            </div>
                            <Badge className="rounded-full bg-secondary text-white hover:bg-secondary">{insight.visaRisk} visa risk</Badge>
                          </div>
                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                              <span>ELEE route fit</span>
                              <span>Profile pending</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-3">
                            {[
                              ["Tuition", insight.tuitionRange],
                              ["Living", insight.livingCost],
                              ["Post-study", insight.postStudyWork],
                              ["Family", insight.familyReadiness],
                            ].map(([label, value]) => (
                              <div key={label} className="rounded-lg border border-border bg-muted/35 p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
                                <div className="mt-1 font-serif text-sm font-bold leading-5 text-foreground">{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                <Card className="app-card mt-5 border-primary/20 bg-primary/5 p-4">
                  <div className="font-serif text-lg font-bold text-foreground">ELEE recommendation</div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Complete AI Profile & Test to generate a personalized route recommendation. Until then, compare public signals such as tuition, visa rules, work pathways, and living costs.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="rounded-full font-serif" onClick={() => setCompareOpen(false)}>Complete profile</Button>
                    <Button variant="outline" className="rounded-full font-serif" onClick={() => setCompareOpen(false)}>Continue exploring</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        <section className="mb-5 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-5">
              <div className="eyebrow mb-2">Destination intelligence</div>
              <h2 className="font-serif text-2xl font-bold leading-tight text-foreground">
                Find the country that matches your profile, budget, and visa story.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Each destination combines university depth, city costs, visa proof points, and work pathway notes so the student journey moves from research to action.
              </p>
            </div>
            <aside className="grid grid-cols-3 gap-2 border-t border-border bg-muted/35 p-4 lg:grid-cols-1 lg:border-l lg:border-t-0">
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Countries</div>
                <div className="mt-1 font-serif text-xl font-bold text-foreground">{countriesArr.length}</div>
              </div>
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cities</div>
                <div className="mt-1 font-serif text-xl font-bold text-foreground">{totalCityCount}</div>
              </div>
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Avg cost</div>
                <div className="mt-1 font-serif text-xl font-bold text-foreground">${avgMonthlyCost}</div>
              </div>
            </aside>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {!demoMode && isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
            : countriesArr.map((country: Country) => (
              <Card
                key={country.code}
                className={cn(
                  "cursor-pointer overflow-hidden border bg-white p-0 transition-all hover:-translate-y-0.5 hover:shadow-md",
                  activeSelectedCountry === country.code ? "border-primary shadow-sm" : "border-border hover:border-primary/30",
                )}
                onClick={() => {
                  setSelectedCountry(selectedCountry === country.code ? null : country.code);
                }}
                data-testid={`country-card-${country.code}`}
              >
                <div className={cn("h-1", activeSelectedCountry === country.code ? "brand-gradient-bg" : "bg-border")} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{country.flagEmoji}</span>
                        <Badge variant="secondary" className="rounded-full text-xs">{country.continent}</Badge>
                        {activeSelectedCountry === country.code && <Badge className="rounded-full text-xs">Selected</Badge>}
                      </div>
                      <h2 className="mt-3 font-serif text-xl font-bold leading-tight text-foreground">{country.name}</h2>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{country.popularCities?.slice(0, 3).join(" · ")}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Living cost</div>
                      <div className="mt-1 font-serif text-lg font-bold text-foreground">${country.avgCostOfLivingUsd?.toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">monthly avg</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Universities</div>
                      <div className="mt-1 text-sm font-bold text-foreground">{country.universityCount}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Currency</div>
                      <div className="mt-1 text-sm font-bold text-foreground">{country.currency}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cities</div>
                      <div className="mt-1 text-sm font-bold text-foreground">{country.popularCities?.length ?? 0}</div>
                    </div>
                  </div>
                  {country.visaInfo && (
                    <div className="mt-4 rounded-lg border border-border bg-white p-3 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Visa pathway: </span>{country.visaInfo}
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>

        {selected && (
          <div className="space-y-5 mb-8" data-testid="country-detail">
            {/* City Guides */}
            {cities.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="eyebrow mb-1">Selected destination</div>
                    <h2 className="font-serif text-lg font-bold text-foreground">City Guides · {selected.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Compare student lifestyle, affordability, and local advantages.
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full">{selected.currency}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {cities.map(city => (
                    <Card key={city.name} className="overflow-hidden border border-border bg-white p-0" data-testid={`city-card-${city.name}`}>
                      <div className={cn(
                        "h-1",
                        city.costIndex > 1.2 ? "bg-red-400" : city.costIndex < 0.9 ? "bg-emerald-400" : "bg-[#F8B133]",
                      )} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-base font-bold text-foreground">{city.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">Cost index {city.costIndex.toFixed(2)}</p>
                          </div>
                          <Badge variant={city.costIndex > 1.2 ? "destructive" : city.costIndex < 0.9 ? "secondary" : "outline"} className="rounded-full text-xs">
                            {city.costIndex > 1.2 ? "High" : city.costIndex < 0.9 ? "Affordable" : "Moderate"}
                          </Badge>
                        </div>
                        <ul className="mt-4 space-y-2">
                          {city.highlights.map(h => (
                            <li key={h} className="flex gap-2 text-xs leading-5 text-muted-foreground">
                              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />{h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Cost of Living Calculator */}
            <Card className="overflow-hidden border border-border bg-white p-0 shadow-sm" data-testid="cost-calculator">
              <div className="brand-gradient-bg h-1" />
              <div
                className="flex cursor-pointer items-center justify-between p-5"
                onClick={() => setShowCalc(v => !v)}
              >
                <div>
                  <h2 className="font-serif text-lg font-bold text-foreground">Cost of Living Calculator</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Estimate monthly rent and core expenses across selected cities.</p>
                </div>
                {showCalc ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>

              {showCalc && (
                <div className="border-t border-border p-5">
                  <p className="mb-5 text-sm text-muted-foreground">
                    Choose your accommodation type and add monthly expenses to compare estimated costs across cities in {selected.name}.
                  </p>

                  {/* Accommodation type selector */}
                  <div className="mb-5">
                    <Label className="mb-3 block text-sm font-semibold">Accommodation type</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ACCOMMODATION_TYPES.map(type => (
                        <button
                          key={type.key}
                          onClick={() => setAccomType(type.key)}
                          className={cn(
                            "rounded-lg border p-3 text-left transition-all",
                            accomType === type.key ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30",
                          )}
                          data-testid={`accom-${type.key}`}
                        >
                          <div className="text-xs font-semibold text-foreground">{type.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{type.desc}</div>
                          <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{Math.round(type.multiplier * 100)}% rent factor</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other expenses */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {BUDGET_CATEGORIES.map(cat => (
                      <div key={cat.key}>
                        <Label className="text-xs mb-1.5 block">{cat.label}</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                          <Input
                            type="number"
                            className="pl-6 text-sm"
                            placeholder={cat.placeholder}
                            value={budget[cat.key]}
                            onChange={e => setBudget(prev => ({ ...prev, [cat.key]: e.target.value }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* City comparison */}
                  {cities.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-foreground">{selectedAccom.label} estimates by city</span>
                        {nonRentBudget > 0 && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setBudget({ food: "", transport: "", misc: "" })}>
                            <X className="h-3 w-3 mr-1" />Reset other
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {cities.map(city => {
                          const { rent, other, total } = getMonthlyEstimate(city);
                          const maxTotal = Math.max(...cities.map(c => getMonthlyEstimate(c).total));
                          return (
                            <div key={city.name} className="border border-border rounded-xl p-4" data-testid={`city-estimate-${city.name}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">{city.name}</span>
                                <span className="text-sm font-bold text-foreground">${total.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 mb-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${city.costIndex > 1.2 ? "bg-red-400" : city.costIndex < 0.9 ? "bg-emerald-400" : "bg-[#F8B133]"}`}
                                  style={{ width: `${(total / maxTotal) * 100}%` }}
                                />
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Rent: ${rent.toLocaleString()}</span>
                                {other > 0 && <span>Other: ${other.toLocaleString()}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        * Rent estimates based on {selectedAccom.label.toLowerCase()} ({selectedAccom.desc}). Actual costs vary by specific location and availability.
                      </p>
                    </div>
                  )}

                  {/* Accommodation comparison table */}
                  <div className="mt-6 border-t border-border pt-5">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Accommodation type comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                            {cities.map(c => (
                              <th key={c.name} className="text-right py-2 text-muted-foreground font-medium">{c.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ACCOMMODATION_TYPES.map(type => (
                            <tr
                              key={type.key}
                              className={`border-b border-border last:border-0 ${accomType === type.key ? "bg-primary/5 font-semibold" : ""}`}
                            >
                              <td className="py-2 text-foreground">
                                {type.label}
                                {accomType === type.key && <Badge variant="default" className="text-xs ml-2">Selected</Badge>}
                              </td>
                              {cities.map(city => {
                                const rent = Math.round(city.baseRent * type.multiplier * city.costIndex);
                                return (
                                  <td key={city.name} className="text-right py-2 text-foreground">${rent.toLocaleString()}</td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
