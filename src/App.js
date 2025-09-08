import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Let's Go Out - Simplified MVP
// Removed map complexity — neighborhoods are now a simple multi-select list

export default function LetsGoOut() {
  const TIME_RANGES = ["Morning", "Afternoon", "Evening", "Night"];

  const NEIGHBORHOODS = [
    "Battery Park City",
    "Bowery",
    "Central Park",
    "Chelsea",
    "Chinatown",
    "Harlem",
    "East Village",
    "Financial District",
    "Flatiron District",
    "Gramercy",
    "Greenwich Village",
    "Hell's Kitchen",
    "Hudson Yards",
    "Lower East Side",
    "Meatpacking District",
    "Morningside Heights",
    "Murray Hill",
    "NoHo",
    "NoMad",
    "Roosevelt Island",
    "Sutton Place",
    "SoHo",
    "TriBeCa",
    "Upper East Side",
    "Upper West Side",
    "Washington Heights",
    "West Village",
  ];

  const RESTAURANTS = [
    { name: "Lilia", neighborhood: "Williamsburg", cuisine: "Italian", link: "https://resy.com/" },
    { name: "Serra", neighborhood: "SoHo", cuisine: "American", link: "https://www.google.com/search?q=serra+soho" },
    { name: "Loring Place", neighborhood: "Upper West Side", cuisine: "New American", link: "https://resy.com/" },
    { name: "Wildair", neighborhood: "Lower East Side", cuisine: "New American", link: "https://resy.com/" },
    { name: "Katz's Deli", neighborhood: "Lower East Side", cuisine: "Deli", link: "https://www.katzsdelicatessen.com/" },
    { name: "Cafe Mogador", neighborhood: "East Village", cuisine: "Mediterranean", link: "https://cafemogador.com/" },
    { name: "Peter Luger", neighborhood: "Williamsburg", cuisine: "Steakhouse", link: "https://peterluger.com/" },
    { name: "Balthazar", neighborhood: "SoHo", cuisine: "French", link: "https://balthazarny.com/" },
  ];

  const [isSecondUser, setIsSecondUser] = useState(false);
  const [me, setMe] = useState({ dates: {}, neighborhoods: [], name: "You" });
  const [other, setOther] = useState(null);
  const [overlap, setOverlap] = useState({ dates: {}, neighborhoods: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
  const safeDates = (obj) => (obj && isObject(obj.dates) ? obj.dates : {});
  const safeNeighborhoods = (obj) => (obj && Array.isArray(obj.neighborhoods) ? obj.neighborhoods : []);

  function toggleNeighborhood(value) {
    setMe((prev) => {
      const has = Array.isArray(prev.neighborhoods) && prev.neighborhoods.includes(value);
      return { ...prev, neighborhoods: has ? prev.neighborhoods.filter((x) => x !== value) : [...(prev.neighborhoods || []), value] };
    });
  }

  function toggleTimeRange(date, range) {
    setMe((prev) => {
      const dates = isObject(prev.dates) ? { ...prev.dates } : {};
      const current = Array.isArray(dates[date]) ? dates[date] : [];
      const has = current.includes(range);
      const updated = has ? current.filter((r) => r !== range) : [...current, range];
      dates[date] = updated;
      return { ...prev, dates };
    });
  }

  function handleDateSelect(e) {
    const date = e.target.value;
    if (!date) return;
    setMe((prev) => {
      if (prev.dates[date]) return prev; // prevent duplicates
      return { ...prev, dates: { ...prev.dates, [date]: [] } };
    });
    setShowDatePicker(false);
  }

  function encodeSession(obj) {
    try {
      const json = JSON.stringify(obj);
      const uri = encodeURIComponent(json);
      return btoa(uri);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  function decodeSession(str) {
    try {
      const uri = atob(str);
      const json = decodeURIComponent(uri);
      return JSON.parse(json);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session = params.get("session");
    if (session) {
      const parsed = decodeSession(session);
      if (parsed) {
        const normalized = {
          name: parsed.name || "Friend",
          dates: isObject(parsed.dates) ? parsed.dates : {},
          neighborhoods: Array.isArray(parsed.neighborhoods) ? parsed.neighborhoods : [],
        };
        setOther(normalized);
        setIsSecondUser(true);
      }
    }
  }, []);

  function computeOverlap(p1, p2) {
    const p1Dates = safeDates(p1);
    const p2Dates = safeDates(p2);
    const p1Neighborhoods = safeNeighborhoods(p1);
    const p2Neighborhoods = safeNeighborhoods(p2);

    const neighborhoods = p1Neighborhoods.filter((n) => p2Neighborhoods.includes(n));
    const dates = {};

    Object.keys(p1Dates).forEach((d) => {
      if (Array.isArray(p2Dates[d])) {
        const overlapRanges = p1Dates[d].filter((r) => p2Dates[d].includes(r));
        if (overlapRanges.length > 0) dates[d] = overlapRanges;
      }
    });

    return { dates, neighborhoods };
  }

  function makeShareLink() {
    const session = encodeSession(me);
    if (!session) return null;
    const url = `${window.location.origin}${window.location.pathname}?session=${session}`;
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Share link copied to clipboard! Send it to the person you want to invite."))
      .catch(() => prompt("Copy this link and send it:", url));
  }

  function findRestaurants(overlapObj, restaurants, max = 3) {
    if (!overlapObj) return [];
    const byNeighborhood = restaurants.filter((r) => Array.isArray(overlapObj.neighborhoods) && overlapObj.neighborhoods.includes(r.neighborhood));
    const selection = byNeighborhood.length ? byNeighborhood : restaurants;
    return selection.slice(0, max);
  }

  function onSeeOptions() {
    const p1 = other || me;
    const p2 = other ? me : null;
    if (!p2) {
      alert("Share your link with the other person first, or enter both people's data in sequence.");
      return;
    }
    const ov = computeOverlap(p1, p2);
    setOverlap(ov);
    const sug = findRestaurants(ov, RESTAURANTS, 3);
    setSuggestions(sug);
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  function daysToDatesMap(days) {
    const selected = Array.isArray(days) ? days : days ? [days] : [];
    const map = {};
    selected.forEach((day) => {
      if (!(day instanceof Date)) return;
      const iso = day.toISOString().split("T")[0];
      map[iso] = (me && isObject(me.dates) && Array.isArray(me.dates[iso])) ? me.dates[iso] : [];
    });
    return map;
  }

  const meDates = safeDates(me);
  const overlapDates = safeDates(overlap);
  const otherDates = safeDates(other);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Let's Go Out</h1>
          <p className="text-sm text-gray-600">Share when you're free and where you could meet</p>
        </header>

        {isSecondUser && other ? (
          <div>
            <div className="mb-3 p-3 rounded-lg bg-gray-100">
              <div className="text-sm text-gray-700">Invited by:</div>
              <div className="font-medium">{other.name || "Friend"}</div>
              <div className="text-xs text-gray-500 mt-1">
                {Object.keys(otherDates).length > 0 ? (
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(otherDates).map(([d, ranges]) => (
                      <li key={d}>{d}: {(Array.isArray(ranges) ? ranges : []).join(", ")}</li>
                    ))}
                  </ul>
                ) : (
                  <div>No dates selected</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Your name (optional)</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Your name"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Choose dates & times</label>
              
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="mb-3 px-3 py-1 rounded-full border bg-white text-gray-700 text-sm hover:bg-gray-50"
              >
                {showDatePicker ? "Hide Calendar" : "Pick Dates"}
              </button>

              {showDatePicker ? (
                <DayPicker
                  mode="multiple"
                  selected={Object.keys(meDates).map((d) => new Date(d))}
                  onSelect={(days) => setMe((prev) => ({ ...prev, dates: daysToDatesMap(days) }))}
                />
              ) : (
                <div>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 mb-2"
                    onChange={handleDateSelect}
                  />
                </div>
              )}

              <div className="mt-2 space-y-3">
                {Object.keys(meDates).map((d) => (
                  <div key={d} className="border rounded-md p-2">
                    <div className="font-medium text-sm mb-1">{d}</div>
                    <div className="flex flex-wrap gap-2">
                      {TIME_RANGES.map((r) => {
                        const selectedForDate = Array.isArray(meDates[d]) ? meDates[d] : [];
                        const active = selectedForDate.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleTimeRange(d, r)}
                            className={`px-3 py-1 rounded-full border transition-colors ${
                              active ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Neighborhoods</label>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map((n) => {
                  const active = me.neighborhoods.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNeighborhood(n)}
                      className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                        active ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onSeeOptions} className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold">
                See Restaurant Options
              </button>

              <button
                onClick={() => {
                  const base = `${window.location.origin}${window.location.pathname}`;
                  window.history.replaceState({}, "", base);
                  setIsSecondUser(false);
                  setOther(null);
                }}
                className="px-4 py-2 rounded-xl border"
              >
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Your name (optional)</label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Your name"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">Choose dates & times</label>
              
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="mb-3 px-3 py-1 rounded-full border bg-white text-gray-700 text-sm hover:bg-gray-50"
              >
                {showDatePicker ? "Hide Calendar" : "Pick Dates"}
              </button>

              {showDatePicker ? (
                <DayPicker
                  mode="multiple"
                  selected={Object.keys(meDates).map((d) => new Date(d))}
                  onSelect={(days) => setMe((prev) => ({ ...prev, dates: daysToDatesMap(days) }))}
                />
              ) : (
                <div>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 mb-2"
                    onChange={handleDateSelect}
                  />
                </div>
              )}

              <div className="mt-2 space-y-3">
                {Object.keys(meDates).map((d) => (
                  <div key={d} className="border rounded-md p-2">
                    <div className="font-medium text-sm mb-1">{d}</div>
                    <div className="flex flex-wrap gap-2">
                      {TIME_RANGES.map((r) => {
                        const selectedForDate = Array.isArray(meDates[d]) ? meDates[d] : [];
                        const active = selectedForDate.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleTimeRange(d, r)}
                            className={`px-3 py-1 rounded-full border transition-colors ${
                              active ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Neighborhoods</label>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map((n) => {
                  const active = me.neighborhoods.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNeighborhood(n)}
                      className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                        active ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="my-3" />

            <div className="flex gap-2 mb-2">
              <button onClick={makeShareLink} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">
                Save & Share Link
              </button>

              <button
                onClick={() => {
                  const session = encodeSession(me);
                  if (session) {
                    const base = `${window.location.origin}${window.location.pathname}?session=${session}`;
                    window.history.replaceState({}, "", base);
                    setOther(me);
                    setIsSecondUser(true);
                  }
                }}
                className="px-4 py-2 rounded-xl border"
              >
                I'll fill out my date's preference
              </button>
            </div>

            <div className="text-xs text-gray-500">Tip: After clicking Save & Share Link, the link is in your clipboard. Now text your date!</div>
          </div>
        )}

        <div id="results" className="mt-6">
          {Object.keys(overlapDates).length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-gray-100">
              <div className="text-sm">Overlap found</div>
              <ul className="list-disc list-inside text-sm">
                {Object.entries(overlapDates).map(([d, ranges]) => (
                  <li key={d}>{d}: {(Array.isArray(ranges) ? ranges : []).join(", ")}</li>
                ))}
              </ul>
              <div className="text-sm text-gray-600">Neighborhoods: {(Array.isArray(overlap.neighborhoods) ? overlap.neighborhoods : []).join(", ") || "None"}</div>
            </div>
          )}

          {suggestions.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold mb-2">Restaurant Suggestions</h2>
              <div className="space-y-3">
                {suggestions.map((r, i) => (
                  <div key={i} className="border rounded-md p-3">
                    <h3 className="text-md font-bold">{r.name}</h3>
                    <p className="text-sm text-gray-600">{r.neighborhood} - {r.cuisine}</p>
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      Check it out
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            Object.keys(overlapDates).length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-100 text-yellow-800">
                No restaurant suggestions found for the selected neighborhoods.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}