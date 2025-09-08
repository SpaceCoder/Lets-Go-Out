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

  const [isSecondUser, setIsSecondUser] = useState(false);
  const [me, setMe] = useState({ dates: {}, neighborhoods: [], name: "You" });
  const [other, setOther] = useState(null);
  const [overlap, setOverlap] = useState({ dates: {}, neighborhoods: [] });

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

  function onSeeOptions() {
    const p1 = other || me;
    const p2 = other ? me : null;
    if (!p2) {
      alert("Share your link with the other person first, or enter both people's data in sequence.");
      return;
    }
    const ov = computeOverlap(p1, p2);
    setOverlap(ov);
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
              
              {/* Hidden React Day Picker */}
              <div style={{ display: 'none' }}>
                <DayPicker
                  mode="multiple"
                  selected={Object.keys(meDates).map((d) => new Date(d))}
                  onSelect={(days) => setMe((prev) => ({ ...prev, dates: daysToDatesMap(days) }))}
                />
              </div>

              {/* iOS style date input */}
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mb-2"
                onChange={handleDateSelect}
              />

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
                              active 
                                ? "bg-gray-800 text-white border-gray-800" 
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                            }`}
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              userSelect: 'none',
                              cursor: 'pointer'
                            }}
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
                        active 
                          ? "bg-gray-800 text-white border-gray-800" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onSeeOptions} className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold">
                See Available Options
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
              
              {/* Hidden React Day Picker */}
              <div style={{ display: 'none' }}>
                <DayPicker
                  mode="multiple"
                  selected={Object.keys(meDates).map((d) => new Date(d))}
                  onSelect={(days) => setMe((prev) => ({ ...prev, dates: daysToDatesMap(days) }))}
                />
              </div>

              {/* iOS style date input */}
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mb-2"
                onChange={handleDateSelect}
              />

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
                              active 
                                ? "bg-gray-800 text-white border-gray-800" 
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                            }`}
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              userSelect: 'none',
                              cursor: 'pointer'
                            }}
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
                        active 
                          ? "bg-gray-800 text-white border-gray-800" 
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        cursor: 'pointer'
                      }}
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
            <div className="mb-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <h2 className="text-lg font-semibold text-green-800 mb-2">It's a Match! 🎉</h2>
              <p className="text-sm text-green-700 font-medium">Here are the times and places that work for both of you:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                {Object.entries(overlapDates).map(([d, ranges]) => (
                  <li key={d}>
                    <strong>{d}:</strong> {(Array.isArray(ranges) ? ranges : []).join(", ")}
                  </li>
                ))}
              </ul>
              {Array.isArray(overlap.neighborhoods) && overlap.neighborhoods.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-green-700 font-medium">Common Neighborhoods:</p>
                  <div className="text-sm text-green-900 font-semibold mt-1">
                    {overlap.neighborhoods.join(", ")}
                  </div>
                </div>
              )}
            </div>
          )}
          {Object.keys(overlapDates).length === 0 && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
              No matching dates, times, or neighborhoods found. Maybe one of you can be a little more flexible!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}