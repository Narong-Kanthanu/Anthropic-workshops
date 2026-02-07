import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getStalePendingOrders } from "./queries/order_queries";
import { sendSlackMessage } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const staleOrders = await getStalePendingOrders(db);

  if (staleOrders.length > 0) {
    const lines = staleOrders.map(
      (o) =>
        `• Order ${o.order_number} — ${o.customer_name}, phone: ${o.phone ?? "N/A"} (pending ${o.days_pending} days, $${o.total_amount})`
    );

    const message = [
      `🚨 *${staleOrders.length} order(s) pending over 3 days:*`,
      ...lines,
    ].join("\n");

    await sendSlackMessage("#order-alerts", message);
  }
}

main();
