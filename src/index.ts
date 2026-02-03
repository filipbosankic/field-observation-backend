// src/index.ts
console.log("Backend gestartet");

import cors from "cors";
import express from "express";

type DomainEvent = {
    id: string;
    type: 'OBS_CREATED' | 'OBS_UPDATED' | 'OBS_DELETED' | 'CAT_CREATED';
    aggregateId: string;
    payload?: unknown;
    occurredAt: string;
};

const eventLog: DomainEvent[] = [];

function isEntityDeleted(entityId: string): boolean {
    return eventLog.some(
        e => e.aggregateId === entityId && e.type === "OBS_DELETED"
    );
}

const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "field-observation-backend",
        version: "1.0.0",
        time: new Date().toISOString()
    });
});

app.get("/events", (req, res) => {
    const since = req.query.since as string | undefined;

    const filteredEvents = since
        ? eventLog.filter(e => e.occurredAt > since)
        : eventLog;

    res.json({
        total: filteredEvents.length,
        events: filteredEvents
    });
});

app.post("/sync", (req, res) => {
    const events = req.body as DomainEvent[];

    let accepted = 0;
    let rejected = 0;

    events.forEach(event => {
        const exists = eventLog.some(e => e.id === event.id);
        if (exists) return;

        if (event.type !== "OBS_DELETED" && isEntityDeleted(event.aggregateId)) {
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend läuft auf Port ${PORT}`);
});
