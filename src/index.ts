// src/index.ts
console.log("Backend gestartet");

import express from "express";

type DomainEvent = {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entityId: string;
  payload?: unknown;
  timestamp: string;
};

const eventLog: DomainEvent[] = [];

function isEntityDeleted(entityId: string): boolean {
  return eventLog.some(
    e => e.entityId === entityId && e.type === "DELETE"
  );
}

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "kekw123", timestamp: Date.now() || 0 });
});

app.get("/events", (_req, res) => {
  res.json({
    total: eventLog.length,
    events: eventLog
  });
});

app.post("/sync", (req, res) => {
  const events = req.body as DomainEvent[];

  let accepted = 0;
  let rejected = 0;

  events.forEach(event => {
    const exists = eventLog.some(e => e.id === event.id);
    if (exists) return;

    if (event.type !== "DELETE" && isEntityDeleted(event.entityId)) {
      rejected++;
      return;
    }

    eventLog.push(event);
    accepted++;
  });

  res.json({
    status: "ok",
    receivedEvents: events.length,
    acceptedEvents: accepted,
    rejectedEvents: rejected,
    totalEvents: eventLog.length
  });
});


app.listen(3000, () => {
  console.log("Backend läuft auf Port 3000");
});