import React, { useState, useEffect } from "react";
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
  const [isResultsPage, setIsResultsPage] = useState(false);
  const [me, setMe] = useState({ dates: {}, neighborhoods: [], name: "You" });
  const [other, setOther] = useState(null);
  const [overlap, setOverlap] = useState({ dates: {}, neighborhoods: [] });

  const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);
  const safeDates = (obj) => (obj && isObject(obj.dates) ? obj.dates : {});
  const safeNeighborhoods = (obj) =>
    obj && Array.isArray(obj.neighborhoods) ? obj.neighborhoods : [];

  function toggleNeighborhood(value) {
    setMe((prev) => {
      const has =
        Array.isArray(prev.neighborhoods) && prev.neighborhoods.includes(value);
      return {
        ...prev,
        neighborhoods: has
          ? prev.neighborhoods.filter((x) => x !== value)
          : [...(prev.neighborhoods || []), value],
      };
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
    const resultsSession = params.get("resultsSession");

    if (resultsSession) {
      const parsed = decodeSession(resultsSession);
      if (parsed) {
        setOverlap(parsed);
        setIsResultsPage(true);
      }
    } else if (session) {
      const parsed = decodeSession(session);
      if (parsed) {
        const normalized = {
          name: parsed.name || "Friend",
          dates: isObject(parsed.dates) ? parsed.dates : {},
          neighborhoods: Array.isArray(parsed.neighborhoods)
            ? parsed.neighborhoods
            : [],
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

    const neighborhoods = p1Neighborhoods.filter((n) =>
      p2Neighborhoods.includes(n)
    );
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
      .then(() =>
        alert("Share link copied to clipboard! Send it to the person you want to invite.")
      )
      .catch(() => prompt("Copy this link and send it:", url));
  }

  function makeResultsLink() {
    const p1 = other;
    const p2 = me;
    const ov = computeOverlap(p1, p2);

    if (Object.keys(ov.dates).length === 0 && ov.neighborhoods.length === 0) {
      alert("There's no overlap. Try being more flexible!");
      return;
    }

    const resultsSession = encodeSession(ov);
    if (!resultsSession) return null;
    const url = `${window.location.origin}${window.location.pathname}?resultsSession=${resultsSession}`;

    navigator.clipboard
      .writeText(url)
      .then(() => alert("Results link copied to clipboard!"))
      .catch(() => prompt("Copy this link and send it:", url));

    // Also update the URL and display results immediately for the second user
    window.history.replaceState({}, "", url);
    setOverlap(ov);
    setIsResultsPage(true);
  }

  function startOver() {
    const base = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, "", base);
    setMe({ dates: {}, neighborhoods: [], name: "You" });
    setOther(null);
    setOverlap({ dates: {}, neighborhoods: [] });
    setIsSecondUser(false);
    setIsResultsPage(false);
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); 
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  const createICalendarString = (overlap) => {
    let icsString = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lets Go Out//NONSGML v1.0//EN
`;

    const getEventTimes = (date, timeRange) => {
      let start, end;
      const baseDate = new Date(date);
      baseDate.setUTCHours(0, 0, 0, 0); // Start of the day in UTC

      switch (timeRange) {
        case "Morning":
          start = new Date(baseDate.setUTCHours(9));
          end = new Date(baseDate.setUTCHours(11));
          break;
        case "Afternoon":
          start = new Date(baseDate.setUTCHours(13));
          end = new Date(baseDate.setUTCHours(15));
          break;
        case "Evening":
          start = new Date(baseDate.setUTCHours(16));
          end = new Date(baseDate.setUTCHours(18));
          break;
        case "Night":
          start = new Date(baseDate.setUTCHours(19));
          end = new Date(baseDate.setUTCHours(22));
          break;
        default:
          return null;
      }

      return {
        start: start.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z',
        end: end.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z'
      };
    };

    Object.entries(overlap.dates).forEach(([date, ranges]) => {
      ranges.forEach((range) => {
        const eventTimes = getEventTimes(date, range);
        if (eventTimes) {
          const summary = `Lets Go Out - ${range}`;
          const location = overlap.neighborhoods.join(", ") || "Undecided Neighborhood";
          const description = `Matched time: ${range}\nCommon Neighborhoods: ${location}`;

          icsString += `BEGIN:VEVENT
UID:${Date.now()}-${date}-${range}@letsgoout.app
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, -5)}Z
DTSTART:${eventTimes.start}
DTEND:${eventTimes.end}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
`;
        }
      });
    });

    icsString += `END:VCALENDAR`;
    return icsString;
  };
  
  const downloadICalendar = () => {
    const icsContent = createICalendarString(overlap);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lets-go-out-matches.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const meDates = safeDates(me);
  const otherDates = safeDates(other);

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Let's Go Out</h1>
          <p className="text-sm text-gray-600">
            Share when you're free and where you could meet
          </p>
        </header>
        
        {isResultsPage ? (
          <div className="flex flex-col items-center">
            {Object.keys(overlap.dates).length > 0 ? (
              <>
                <div className="w-full text-center">
                  <h2 className="text-xl font-semibold text-green-800 mb-4">
                    It's a Match! 🎉
                  </h2>
                </div>
                <div className="w-full space-y-4">
                  {Object.entries(overlap.dates).map(([d, ranges]) => (
                    <div key={d} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex items-center text-lg font-bold mb-2">
                        <span className="text-gray-500 mr-2">📅</span>
                        {formatDate(d)}
                      </div>
                      <div className="space-y-1">
                        {ranges.map((r, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <span className="text-gray-500 mr-2">⏰</span>
                            {r}
                          </div>
                        ))}
                      </div>
                      {overlap.neighborhoods.length > 0 && (
                        <div className="mt-3 text-sm text-gray-700">
                          <span className="text-gray-500 mr-2">📍</span>
                          {overlap.neighborhoods.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadICalendar}
                  className="px-4 py-2 mt-6 rounded-xl bg-gray-200 text-gray-800 font-semibold flex items-center"
                >
                  <span className="mr-2">🗓️</span> Add to Calendar
                </button>
              </>
            ) : (
              <div className="w-full p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800">
                <p className="text-center">
                  No matching dates, times, or neighborhoods found. Maybe one of you can be a little more flexible!
                </p>
              </div>
            )}
            <button onClick={startOver} className="px-4 py-2 mt-6 rounded-xl border">
              Start Over
            </button>
          </div>
        ) : isSecondUser && other ? (
          <div>
            <div className="mb-3 p-3 rounded-lg bg-gray-100">
              <div className="text-sm text-gray-700">Invited by:</div>
              <div className="font-medium">{other.name || "Friend"}</div>
              <div className="text-xs text-gray-500 mt-1">
                {Object.keys(otherDates).length > 0 ? (
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(otherDates).map(([d, ranges]) => (
                      <li key={d}>
                        {d}: {(Array.isArray(ranges) ? ranges : []).join(", ")}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>No dates selected</div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Your name (optional)
              </label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Your name"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Choose dates & times
              </label>

              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mb-2"
                onChange={handleDateSelect}
              />

              <div className="mt-2 space-y-3">
                {Object.keys(meDates).map((d) => (
                  <div key={d} className="border rounded-md p-2">
                    <div className="font-medium text-sm mb-1">{d}</div>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {TIME_RANGES.map((r) => {
                        const selectedForDate = Array.isArray(meDates[d])
                          ? meDates[d]
                          : [];
                        const active = selectedForDate.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleTimeRange(d, r)}
                            className={`flex items-center px-4 py-2 rounded-full border text-sm transition-colors whitespace-nowrap
                              ${
                                active
                                  ? "bg-blue-50 text-blue-700 border-blue-400"
                                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                              }`}
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              userSelect: "none",
                              cursor: "pointer",
                            }}
                          >
                            {active && <span className="mr-2">✓</span>}
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
              <label className="block text-sm font-medium mb-2">
                Neighborhoods
              </label>
              <div className="flex flex-wrap gap-2 justify-start">
                {NEIGHBORHOODS.map((n) => {
                  const active = me.neighborhoods.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNeighborhood(n)}
                      className={`flex items-center px-4 py-2 rounded-full border text-sm transition-colors whitespace-nowrap
                        ${
                          active
                            ? "bg-blue-50 text-blue-700 border-blue-400"
                            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                        }`}
                      style={{
                        WebkitTapHighlightColor: "transparent",
                        userSelect: "none",
                        cursor: "pointer",
                      }}
                    >
                      {active && <span className="mr-2">✓</span>}
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={makeResultsLink}
                className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold"
              >
                Get Shareable Results Link
              </button>

              <button onClick={startOver} className="px-4 py-2 rounded-xl border">
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Your name (optional)
              </label>
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Your name"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-2">
                Choose dates & times
              </label>

              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mb-2"
                onChange={handleDateSelect}
              />

              <div className="mt-2 space-y-3">
                {Object.keys(meDates).map((d) => (
                  <div key={d} className="border rounded-md p-2">
                    <div className="font-medium text-sm mb-1">{d}</div>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {TIME_RANGES.map((r) => {
                        const selectedForDate = Array.isArray(meDates[d])
                          ? meDates[d]
                          : [];
                        const active = selectedForDate.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleTimeRange(d, r)}
                            className={`flex items-center px-4 py-2 rounded-full border text-sm transition-colors whitespace-nowrap
                              ${
                                active
                                  ? "bg-blue-50 text-blue-700 border-blue-400"
                                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                              }`}
                            style={{
                              WebkitTapHighlightColor: "transparent",
                              userSelect: "none",
                              cursor: "pointer",
                            }}
                          >
                            {active && <span className="mr-2">✓</span>}
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
              <label className="block text-sm font-medium mb-2">
                Neighborhoods
              </label>
              <div className="flex flex-wrap gap-2 justify-start">
                {NEIGHBORHOODS.map((n) => {
                  const active = me.neighborhoods.includes(n);
                  return (
                    <button
                      key={n}
                      onClick={() => toggleNeighborhood(n)}
                      className={`flex items-center px-4 py-2 rounded-full border text-sm transition-colors whitespace-nowrap
                        ${
                          active
                            ? "bg-blue-50 text-blue-700 border-blue-400"
                            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                        }`}
                      style={{
                        WebkitTapHighlightColor: "transparent",
                        userSelect: "none",
                        cursor: "pointer",
                      }}
                    >
                      {active && <span className="mr-2">✓</span>}
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr className="my-3" />

            <div className="flex gap-2 mb-2">
              <button
                onClick={makeShareLink}
                className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
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

            <div className="text-xs text-gray-500">
              Tip: After clicking Save & Share Link, the link is in your clipboard.
              Now text your date!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}