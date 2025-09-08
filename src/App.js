import React, { useState, useEffect } from "react";
import "react-day-picker/dist/style.css";

// --- Material UI Imports ---
import {
  Button,
  TextField,
  Box,
  Paper,
  ThemeProvider,
  createTheme,
  Typography,
} from "@mui/material";

// Create a basic Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#4caf50",
    },
  },
});

// Let's Go Out - Simplified MVP
// Removed map complexity — neighborhoods are now a simple multi-select list

const NEIGHBORHOOD_EATER_LINKS = {
  "Battery Park City": "https://ny.eater.com/neighborhood/1392/battery-park-city",
  "Chinatown": "https://ny.eater.com/neighborhood/1387/chinatown",
  "Chelsea": "https://ny.eater.com/neighborhood/1375/chelsea",
  "East Village": "https://ny.eater.com/neighborhood/1377/east-village",
  "Financial District": "https://ny.eater.com/neighborhood/1393/financial-district",
  "Flatiron District": "https://ny.eater.com/neighborhood/1376/flatiron-district",
  "Greenwich Village": "https://ny.eater.com/neighborhood/1378/greenwich-village",
  "Harlem": "https://ny.eater.com/neighborhood/1388/east-harlem",
  "Hell's Kitchen": "https://ny.eater.com/neighborhood/1397/hell-s-kitchen",
  "Hudson Yards": "https://ny.eater.com/neighborhood/1398/hudson-yards",
  "Lower East Side": "https://ny.eater.com/neighborhood/1381/lower-east-side",
  "Meatpacking District": "https://ny.eater.com/neighborhood/1384/meatpacking-district",
  "Morningside Heights": "https://ny.eater.com/neighborhood/1396/harlem-morningside-heights",
  "NoHo": "https://ny.eater.com/neighborhood/1405/noho",
  "Roosevelt Island": "https://ny.eater.com/neighborhood/1382/roosevelt-island",
  "SoHo": "https://ny.eater.com/neighborhood/1379/soho",
  "TriBeCa": "https://ny.eater.com/neighborhood/1380/tribeca",
  "Upper East Side": "https://ny.eater.com/neighborhood/1373/upper-east-side",
  "Upper West Side": "https://ny.eater.com/neighborhood/1374/upper-west-side",
  "Washington Heights": "https://ny.eater.com/neighborhood/1399/inwood-washington-heights",
  "West Village": "https://ny.eater.com/neighborhood/1385/west-village",
};

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
  const [me, setMe] = useState({ dates: {}, neighborhoods: [], name: "You", deniedDates: {}, deniedNeighborhoods: {} });
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

  function handleDateRemove(dateToRemove) {
    setMe((prev) => {
      const newDates = { ...prev.dates };
      delete newDates[dateToRemove];
      return { ...prev, dates: newDates };
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

  const createICalendarString = (date, range) => {
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

    icsString += `END:VCALENDAR`;
    return icsString;
  };

  const downloadICalendarEvent = (date, range) => {
    const icsContent = createICalendarString(date, range);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lets-go-out-${date}-${range}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const meDates = safeDates(me);
  const otherDates = safeDates(other);

  const handleYesNoTime = (date, range, confirm) => {
    setMe(prev => {
      const newDates = { ...prev.dates };
      const newDeniedDates = { ...prev.deniedDates };
      if (confirm) {
        const current = Array.isArray(newDates[date]) ? newDates[date] : [];
        if (!current.includes(range)) {
          newDates[date] = [...current, range];
        }
        delete newDeniedDates[date]?.[range];
      } else {
        const current = Array.isArray(newDates[date]) ? newDates[date] : [];
        newDates[date] = current.filter(r => r !== range);
        if (!newDeniedDates[date]) {
          newDeniedDates[date] = {};
        }
        newDeniedDates[date][range] = true;
      }
      return { ...prev, dates: newDates, deniedDates: newDeniedDates };
    });
  };

  const handleYesNoNeighborhood = (neighborhood, confirm) => {
    setMe(prev => {
      const newNeighborhoods = prev.neighborhoods || [];
      const newDeniedNeighborhoods = { ...prev.deniedNeighborhoods };
      if (confirm) {
        if (!newNeighborhoods.includes(neighborhood)) {
          newNeighborhoods.push(neighborhood);
        }
        delete newDeniedNeighborhoods[neighborhood];
      } else {
        const filtered = newNeighborhoods.filter(n => n !== neighborhood);
        newDeniedNeighborhoods[neighborhood] = true;
        return { ...prev, neighborhoods: filtered, deniedNeighborhoods: newDeniedNeighborhoods };
      }
      return { ...prev, neighborhoods: newNeighborhoods, deniedNeighborhoods: newDeniedNeighborhoods };
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-gray-50 flex items-start justify-center p-4">
        <Paper className="w-full max-w-md" sx={{ p: 4, borderRadius: 2 }}>
          <Box mb={2}>
            <Typography variant="h5" component="h1" gutterBottom>
              Let's Go Out
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share when you're free and where you could meet
            </Typography>
          </Box>

          {isResultsPage ? (
            <Box className="flex flex-col items-center">
              {Object.keys(overlap.dates).length > 0 || overlap.neighborhoods.length > 0 ? (
                <>
                  <Box className="w-full text-center" mb={2}>
                    <Typography variant="h6" component="h2" color="secondary" sx={{ fontWeight: 'bold' }}>
                      It's a Match! 🎉
                    </Typography>
                  </Box>
                  <Box className="w-full space-y-4">
                    {Object.entries(overlap.dates).map(([d, ranges]) => (
                      <Paper key={d} sx={{ p: 2, borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            📅 {formatDate(d)}
                          </Typography>
                        </Box>
                        <Box className="space-y-1">
                          {ranges.map((r, index) => (
                            <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
                              <Typography variant="body2" color="text.secondary">
                                ⏰ {r}
                              </Typography>
                              <Button
                                onClick={() => downloadICalendarEvent(d, r)}
                                variant="text"
                                size="small"
                                sx={{ textTransform: 'none' }}
                              >
                                🗓️ Add to Calendar
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                  {overlap.neighborhoods.length > 0 && (
                    <Box sx={{ mt: 2, p: 2, borderRadius: 2, backgroundColor: 'grey.100' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Explore Restaurants in a Common Neighborhood:
                      </Typography>
                      <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                        {overlap.neighborhoods.map((n) => {
                          const eaterLink = NEIGHBORHOOD_EATER_LINKS[n];
                          if (eaterLink) {
                            return (
                              <li key={n}>
                                <a href={eaterLink} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                                  Eater Guide: {n}
                                </a>
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    </Box>
                  )}
                </>
              ) : (
                <Paper sx={{ p: 2, borderRadius: 2, backgroundColor: 'warning.light' }}>
                  <Typography variant="body2" color="warning.contrastText" sx={{ textAlign: 'center' }}>
                    No matching dates, times, or neighborhoods found. Maybe one of you can be a little more flexible!
                  </Typography>
                </Paper>
              )}
              <Button onClick={startOver} variant="text" sx={{ mt: 2 }}>
                Start Over
              </Button>
            </Box>
          ) : isSecondUser && other ? (
            <Box>
              <Paper sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: 'grey.100' }}>
                <Typography variant="h6" component="h2" mb={2}>
                  {other.name || "A friend"} is available during the following times:
                </Typography>
                <Box className="space-y-3">
                  {Object.entries(otherDates).map(([d, ranges]) => (
                    <Box key={d} mb={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{formatDate(d)}</Typography>
                      <Box className="flex flex-wrap gap-2 mt-1">
                        {ranges.map((r, index) => {
                          const isConfirmed = meDates[d]?.includes(r);
                          const isDenied = me.deniedDates[d]?.[r];
                          return (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">{r}</Typography>
                              <Button
                                onClick={() => handleYesNoTime(d, r, true)}
                                variant={isConfirmed ? "contained" : "outlined"}
                                size="small"
                                sx={{ textTransform: 'none' }}
                              >
                                Yes
                              </Button>
                              <Button
                                onClick={() => handleYesNoTime(d, r, false)}
                                variant={isDenied ? "contained" : "outlined"}
                                size="small"
                                color="error"
                                sx={{ textTransform: 'none' }}
                              >
                                No
                              </Button>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Typography variant="h6" component="h2" mt={4} mb={2}>
                  and can meet in the following neighborhoods:
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {other.neighborhoods.map((n) => {
                    const isConfirmed = me.neighborhoods.includes(n);
                    const isDenied = me.deniedNeighborhoods[n];
                    return (
                      <Box key={n} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">{n}</Typography>
                        <Button
                          onClick={() => handleYesNoNeighborhood(n, true)}
                          variant={isConfirmed ? "contained" : "outlined"}
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          Yes
                        </Button>
                        <Button
                          onClick={() => handleYesNoNeighborhood(n, false)}
                          variant={isDenied ? "contained" : "outlined"}
                          size="small"
                          color="error"
                          sx={{ textTransform: 'none' }}
                        >
                          No
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>

              <TextField
                fullWidth
                label="Your name (optional)"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
                sx={{ mb: 2 }}
              />

              <Box mb={2}>
                <Typography variant="body1" sx={{ mb: 1 }}>Choose dates & times</Typography>
                <TextField
                  fullWidth
                  type="date"
                  onChange={handleDateSelect}
                  sx={{ mb: 2 }}
                />
                <Box className="space-y-3">
                  {Object.keys(meDates).map((d) => (
                    <Paper key={d} sx={{ p: 2, borderRadius: 2, border: '1px solid #ddd' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>{d}</Typography>
                        <Button
                          onClick={() => handleDateRemove(d)}
                          variant="text"
                          color="error"
                          size="small"
                        >
                          Remove
                        </Button>
                      </Box>
                      <Box className="flex flex-wrap gap-2">
                        {TIME_RANGES.map((r) => {
                          const selectedForDate = Array.isArray(meDates[d]) ? meDates[d] : [];
                          const active = selectedForDate.includes(r);
                          return (
                            <Button
                              key={r}
                              onClick={() => toggleTimeRange(d, r)}
                              variant={active ? "contained" : "outlined"}
                              color="primary"
                              size="small"
                              sx={{ textTransform: 'none' }}
                            >
                              {r}
                            </Button>
                          );
                        })}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body1" sx={{ mb: 1 }}>Neighborhoods</Typography>
                <Box className="flex flex-wrap gap-2">
                  {NEIGHBORHOODS.map((n) => {
                    const active = me.neighborhoods.includes(n);
                    return (
                      <Button
                        key={n}
                        onClick={() => toggleNeighborhood(n)}
                        variant={active ? "contained" : "outlined"}
                        color="primary"
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        {n}
                      </Button>
                    );
                  })}
                </Box>
              </Box>

              <hr className="my-3" />

              <Box display="flex" gap={2} mt={2}>
                <Button
                  onClick={makeResultsLink}
                  variant="contained"
                  color="secondary"
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Get Shareable Results Link
                </Button>
                <Button onClick={startOver} variant="outlined" sx={{ textTransform: 'none' }}>
                  Start Over
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <TextField
                fullWidth
                label="Your name (optional)"
                value={me.name}
                onChange={(e) => setMe((s) => ({ ...s, name: e.target.value }))}
                sx={{ mb: 2 }}
              />

              <Box mb={2}>
                <Typography variant="body1" sx={{ mb: 1 }}>Choose dates & times</Typography>
                <TextField
                  fullWidth
                  type="date"
                  onChange={handleDateSelect}
                  sx={{ mb: 2 }}
                />
                <Box className="space-y-3">
                  {Object.keys(meDates).map((d) => (
                    <Paper key={d} sx={{ p: 2, borderRadius: 2, border: '1px solid #ddd' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>{d}</Typography>
                        <Button
                          onClick={() => handleDateRemove(d)}
                          variant="text"
                          color="error"
                          size="small"
                        >
                          Remove
                        </Button>
                      </Box>
                      <Box className="flex flex-wrap gap-2">
                        {TIME_RANGES.map((r) => {
                          const selectedForDate = Array.isArray(meDates[d]) ? meDates[d] : [];
                          const active = selectedForDate.includes(r);
                          return (
                            <Button
                              key={r}
                              onClick={() => toggleTimeRange(d, r)}
                              variant={active ? "contained" : "outlined"}
                              color="primary"
                              size="small"
                              sx={{ textTransform: 'none' }}
                            >
                              {r}
                            </Button>
                          );
                        })}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="body1" sx={{ mb: 1 }}>Neighborhoods</Typography>
                <Box className="flex flex-wrap gap-2">
                  {NEIGHBORHOODS.map((n) => {
                    const active = me.neighborhoods.includes(n);
                    return (
                      <Button
                        key={n}
                        onClick={() => toggleNeighborhood(n)}
                        variant={active ? "contained" : "outlined"}
                        color="primary"
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        {n}
                      </Button>
                    );
                  })}
                </Box>
              </Box>

              <hr className="my-3" />

              <Box display="flex" gap={2} mb={1}>
                <Button
                  onClick={makeShareLink}
                  variant="contained"
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Save & Share Link
                </Button>
                <Button
                  onClick={() => {
                    const session = encodeSession(me);
                    if (session) {
                      const base = `${window.location.origin}${window.location.pathname}?session=${session}`;
                      window.history.replaceState({}, "", base);
                      setOther(me);
                      setIsSecondUser(true);
                    }
                  }}
                  variant="outlined"
                  sx={{ textTransform: 'none' }}
                >
                  I'll fill out my date's preference
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Tip: After clicking Save & Share Link, the link is in your clipboard. Now text your date!
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </ThemeProvider>
  );
}