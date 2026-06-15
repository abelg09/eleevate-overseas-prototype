import { useState } from "react";
import { Link } from "wouter";
import {
  useListUniversities, getListUniversitiesQueryKey,
  useGetShortlistIds, useToggleShortlist,
  getGetShortlistIdsQueryKey, getGetShortlistQueryKey,
} from "@workspace/api-client-react";
import type { University, UniversityListResponse } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Search, Bookmark, BookmarkCheck, SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "@/components/common/page-shell";
import { UniversityLogo } from "@/components/common/university-logo";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, listFromApi } from "@/lib/demo-mode";
import { DEMO_UNIVERSITIES } from "@/lib/demo-catalog";
import { ensureDemoApplicationForUniversity, readDemoShortlistIds, writeDemoShortlistIds } from "@/lib/demo-flow";
import { hasStudentWorkspaceProfile, useStudentWorkspaceProfile } from "@/lib/student-workspace";
import { cn } from "@/lib/utils";

const COUNTRIES = ["All", "GB", "US", "CA", "AU", "DE", "NL", "SG", "IE"];
const COUNTRY_NAMES: Record<string, string> = {
  GB: "UK", US: "USA", CA: "Canada", AU: "Australia", DE: "Germany",
  NL: "Netherlands", SG: "Singapore", IE: "Ireland",
};
const COUNTRY_MATCHES: Record<string, string[]> = {
  GB: ["United Kingdom", "UK", "Great Britain"],
  US: ["United States", "USA", "United States of America"],
  CA: ["Canada"],
  AU: ["Australia"],
  DE: ["Germany"],
  NL: ["Netherlands"],
  SG: ["Singapore"],
  IE: ["Ireland"],
};
const PAGE_SIZE = 12;

function getElleMatchScore(uni: University): number {
  const countryBase: Record<string, number> = {
    Canada: 92,
    "United Kingdom": 89,
    UK: 89,
    Germany: 84,
    Australia: 82,
    Netherlands: 79,
    Singapore: 76,
    Ireland: 74,
    "United States": 72,
    USA: 72,
  };
  const base = countryBase[uni.country] ?? 70;
  const rankLift = uni.ranking != null ? Math.max(0, 8 - Math.floor(uni.ranking / 40)) : 2;
  const affordabilityLift = uni.avgTuitionUsd != null && uni.avgTuitionUsd <= 40000 ? 3 : 0;
  return Math.min(96, base + rankLift + affordabilityLift);
}

interface Filters {
  minRanking: string;
  maxRanking: string;
  maxTuitionK: string;
  maxAcceptanceRate: string;
}

const DEFAULT_FILTERS: Filters = { minRanking: "", maxRanking: "", maxTuitionK: "", maxAcceptanceRate: "" };

function getInitialCountryFilter() {
  if (typeof window === "undefined") return "All";
  const value = new URLSearchParams(window.location.search).get("country");
  if (!value) return "All";
  const normalized = value.trim().toLowerCase();
  const directCode = COUNTRIES.find((code) => code.toLowerCase() === normalized);
  if (directCode) return directCode;
  const byLabel = Object.entries(COUNTRY_NAMES).find(([, label]) => label.toLowerCase() === normalized);
  if (byLabel) return byLabel[0];
  const byMatch = Object.entries(COUNTRY_MATCHES).find(([, aliases]) => aliases.some((alias) => alias.toLowerCase() === normalized));
  return byMatch?.[0] ?? "All";
}

export default function UniversitiesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(() => getInitialCountryFilter());
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [demoSavedIds, setDemoSavedIds] = useState<Set<string>>(() => new Set(readDemoShortlistIds()));
  const profile = useStudentWorkspaceProfile();
  const hasProfile = hasStudentWorkspaceProfile(profile);

  const params = {
    search: search || undefined,
    country: country === "All" ? undefined : country,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading } = useListUniversities(params, {
    query: { queryKey: getListUniversitiesQueryKey(params), enabled: !demoMode }
  });

  const { data: shortlistIds } = useGetShortlistIds({
    query: { queryKey: getGetShortlistIdsQueryKey(), enabled: !demoMode }
  });

  const toggle = useToggleShortlist();

  const result: UniversityListResponse | undefined = data;
  const savedIds = demoMode ? demoSavedIds : new Set<string>(listFromApi<string>(shortlistIds));

  // Client-side filter for ranking, tuition, acceptance rate
  const minR = filters.minRanking ? parseInt(filters.minRanking) : null;
  const maxR = filters.maxRanking ? parseInt(filters.maxRanking) : null;
  const maxT = filters.maxTuitionK ? parseInt(filters.maxTuitionK) * 1000 : null;
  const maxA = filters.maxAcceptanceRate ? parseFloat(filters.maxAcceptanceRate) : null;

  const matchesSearch = (uni: University) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [uni.name, uni.city, uni.country, uni.description ?? ""].join(" ").toLowerCase().includes(q);
  };
  const matchesCountry = (uni: University) => {
    if (country === "All") return true;
    return (COUNTRY_MATCHES[country] ?? [country]).includes(uni.country);
  };
  const matchesAdvancedFilters = (uni: University) => {
    if (minR !== null && (uni.ranking == null || uni.ranking < minR)) return false;
    if (maxR !== null && (uni.ranking == null || uni.ranking > maxR)) return false;
    if (maxT !== null && (uni.avgTuitionUsd == null || uni.avgTuitionUsd > maxT)) return false;
    if (maxA !== null && (uni.acceptanceRate == null || uni.acceptanceRate > maxA)) return false;
    return true;
  };

  const apiUnis = result?.data ?? [];
  const demoUniversities = DEMO_UNIVERSITIES;
  const filteredDemoUnis = demoUniversities
    .filter(matchesSearch)
    .filter(matchesCountry)
    .filter(matchesAdvancedFilters);
  const filteredApiUnis = apiUnis.filter(matchesAdvancedFilters);
  const total = demoMode ? filteredDemoUnis.length : result?.total ?? filteredApiUnis.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const unis = demoMode
    ? filteredDemoUnis.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : filteredApiUnis;
  const showLoading = !demoMode && isLoading;

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const catalogue = demoMode ? filteredDemoUnis : filteredApiUnis;
  const topMatch = [...catalogue].sort((a, b) => hasProfile ? getElleMatchScore(b) - getElleMatchScore(a) : (a.ranking ?? 9999) - (b.ranking ?? 9999))[0];
  const affordableCount = catalogue.filter((uni) => (uni.avgTuitionUsd ?? 0) > 0 && (uni.avgTuitionUsd ?? 0) <= 35000).length;
  const countryCount = new Set(catalogue.map((uni) => uni.country)).size;
  const savedCount = savedIds.size;

  const handleBookmark = async (e: React.MouseEvent, uniId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const wasShortlisted = savedIds.has(uniId);
    if (demoMode) {
      setDemoSavedIds((current) => {
        const next = new Set(current);
        if (next.has(uniId)) next.delete(uniId);
        else {
          next.add(uniId);
          ensureDemoApplicationForUniversity(uniId, "shortlist");
        }
        return new Set(writeDemoShortlistIds(next));
      });
      toast({
        title: wasShortlisted ? "Removed from shortlist" : "Added to shortlist and Applications",
        description: wasShortlisted ? undefined : "A research-stage application has been started for this university.",
      });
      return;
    }

    await toggle.mutateAsync({ universityId: uniId, data: {} });
    queryClient.invalidateQueries({ queryKey: getGetShortlistIdsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetShortlistQueryKey() });
    toast({ title: wasShortlisted ? "Removed from shortlist" : "Added to shortlist" });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <AppLayout>
      <div data-testid="universities-page">
        <PageHeader
          eyebrow="Discovery"
          title="University Finder"
          description="Search, compare, shortlist, and move directly into applications across global study destinations."
          actions={
            <Link href="/shortlist">
              <Button variant="outline" className="rounded-full" data-testid="btn-view-shortlist">
                My Shortlist
                {savedCount > 0 && <Badge variant="secondary" className="ml-2 text-xs">{savedCount}</Badge>}
              </Button>
            </Link>
          }
        />

        <section className="mb-5 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <div className="brand-gradient-bg h-1" />
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by university, city, country, or pathway"
                    className="h-11 rounded-full border-border bg-muted/40 pl-9"
                    data-testid="input-search-universities"
                  />
                </div>
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-full", activeFiltersCount > 0 && "border-primary text-primary")}
                  onClick={() => setShowFilters(v => !v)}
                  data-testid="btn-toggle-filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-1 text-xs">{activeFiltersCount}</Badge>
                  )}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {COUNTRIES.map(c => (
                  <button
                    key={c}
                    onClick={() => { setCountry(c); setPage(1); }}
                    data-testid={`filter-country-${c}`}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      country === c
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {c === "All" ? "All destinations" : COUNTRY_NAMES[c]}
                  </button>
                ))}
              </div>
            </div>

            <aside className="border-t border-border bg-muted/35 p-4 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Results</div>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{total}</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Countries</div>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{countryCount}</div>
                </div>
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Under $35k</div>
                  <div className="mt-1 font-serif text-xl font-bold text-foreground">{affordableCount}</div>
                </div>
              </div>
              {topMatch && (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Best ELEE match in view</div>
                  <div className="mt-1 text-sm font-semibold leading-5 text-foreground">{topMatch.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {hasProfile ? `${getElleMatchScore(topMatch)}% profile fit` : "Complete profile to calculate fit"} · {topMatch.city}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>

        <Card className="mb-5 border border-border bg-white p-4 shadow-sm" data-testid="university-next-step">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge variant="outline" className="mb-2 rounded-full">{savedCount > 0 ? "Shortlist active" : "Stage 3"}</Badge>
              <h2 className="font-serif text-lg font-bold text-foreground">
                {savedCount > 0 ? "Your saved universities are already in Applications." : "Save a university to start your application path."}
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                {savedCount > 0
                  ? "Each saved university creates a research-stage application so deadlines, documents, and counsellor follow-up can be tracked."
                  : "Use the bookmark on any university card. ELEE will add it to Shortlist and prepare the first application tracker item."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={savedCount > 0 ? "/applications" : "/course-finder"}>
                <Button className="rounded-full font-serif">{savedCount > 0 ? "Open applications" : "Find courses"}</Button>
              </Link>
              <Link href="/shortlist">
                <Button variant="outline" className="rounded-full font-serif">View shortlist</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-5 border border-border p-5 shadow-sm" data-testid="advanced-filters">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-sm font-bold text-foreground">Filter studio</h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5 mr-1" />Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Min Ranking</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={filters.minRanking}
                  onChange={e => setFilters(f => ({ ...f, minRanking: e.target.value }))}
                  className="text-sm"
                  data-testid="filter-min-ranking"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Max Ranking</Label>
                <Input
                  type="number"
                  placeholder="e.g. 200"
                  value={filters.maxRanking}
                  onChange={e => setFilters(f => ({ ...f, maxRanking: e.target.value }))}
                  className="text-sm"
                  data-testid="filter-max-ranking"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Max Tuition (USD/yr, k)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={filters.maxTuitionK}
                  onChange={e => setFilters(f => ({ ...f, maxTuitionK: e.target.value }))}
                  className="text-sm"
                  data-testid="filter-max-tuition"
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5 block text-muted-foreground">Max Acceptance Rate (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  value={filters.maxAcceptanceRate}
                  onChange={e => setFilters(f => ({ ...f, maxAcceptanceRate: e.target.value }))}
                  className="text-sm"
                  data-testid="filter-max-acceptance"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {showLoading
            ? Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </Card>
            ))
            : unis.map((uni: University) => {
              const isBookmarked = savedIds.has(uni.id);
              const matchScore = hasProfile ? getElleMatchScore(uni) : null;
              return (
                <Link href={`/universities/${uni.id}`} key={uni.id}>
                  <Card className="group relative h-full cursor-pointer overflow-hidden border border-border bg-white p-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" data-testid={`uni-card-${uni.id}`}>
                    <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-accent" />
                    <button
                      onClick={e => handleBookmark(e, uni.id)}
                      className={cn(
                        "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all",
                        isBookmarked
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary",
                      )}
                      data-testid={`btn-bookmark-${uni.id}`}
                      aria-label={isBookmarked ? "Remove from shortlist" : "Add to shortlist"}
                    >
                      {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                    <div className="p-4">
                      <div className="mb-4 flex items-start gap-3 pr-8">
                        <UniversityLogo name={uni.name} website={uni.website} className="h-12 w-12" imageClassName="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-secondary text-white hover:bg-secondary text-xs">
                              {matchScore != null ? `${matchScore}% ELEE Match` : "Complete profile"}
                            </Badge>
                            {uni.ranking != null && <Badge variant="outline" className="rounded-full text-xs">Rank #{uni.ranking}</Badge>}
                            <Badge variant="outline" className="rounded-full text-xs">{uni.country}</Badge>
                          </div>
                          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{uni.city}</p>
                        </div>
                      </div>
                      <h3 className="pr-8 font-serif text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{uni.name}</h3>
                      <p className="mt-3 line-clamp-3 min-h-15 text-xs leading-5 text-muted-foreground">{uni.description}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tuition</div>
                          <div className="mt-1 text-sm font-bold text-foreground">
                            {uni.avgTuitionUsd != null ? `$${(uni.avgTuitionUsd / 1000).toFixed(0)}k` : "TBD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Admit</div>
                          <div className="mt-1 text-sm font-bold text-foreground">
                            {uni.acceptanceRate != null ? `${uni.acceptanceRate}%` : "TBD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Programs</div>
                          <div className="mt-1 text-sm font-bold text-foreground">{uni.programCount ?? "TBD"}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
        </div>

        {!showLoading && unis.length === 0 && (
          <div className="text-center py-16" data-testid="no-universities">
            <p className="font-serif text-lg font-bold text-foreground">No universities found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search, country, or advanced filters.</p>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" />Clear filters
              </Button>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10" data-testid="pagination">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
