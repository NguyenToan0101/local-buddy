// IMPORTANT:
// Any data shipped in the frontend bundle is publicly readable by users.
// Keep mock data non-sensitive.

// We import the existing db.json as a seed so the UI keeps working without json-server.
// This does NOT provide security (bundled assets can be inspected).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JSON import support depends on TS/Vite config
import db from '../../db.json';

export const mockData: any = db;

