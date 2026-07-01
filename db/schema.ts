import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  date,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const coinTransactionsEnum = pgEnum("coin_transactions_enum", [
  "checkin",
  "reward",
  "new_user_bonus",
]);

export const transactionDirectionEnum = pgEnum("transaction_direction_enum", [
  "credit",
  "debit",
]);

export const transactionStatus = pgEnum("transaction_status_enum", [
  "pending",
  "completed",
  "failed",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  name: varchar("name", {
    length: 255,
  }).notNull(),

  email: varchar("email", {
    length: 255,
  })
    .notNull()
    .unique(),

  password: varchar("password", {
    length: 255,
  }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userStats = pgTable("user_stats", {
  userId: integer("user_id")
    .notNull()
    .references(() => users.id)
    .primaryKey(),

  streak: integer("streak").default(0).notNull(),

  coinBalance: integer("coin_balance").default(0).notNull(),

  lastCheckinDate: date("last_checkin_date"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkins = pgTable(
  "checkins",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id),

    streakCount: integer("streak_count").default(0).notNull(),

    checkinDate: date("checkin_date").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("unique_user_checkin_date").on(t.userId, t.checkinDate)],
);

export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),

  checkinId: integer("checkin_id").references(() => checkins.id),

  amount: integer("amount").notNull(),

  userId: integer("user_id")
    .notNull()
    .references(() => users.id),

  transactionType: coinTransactionsEnum("transaction_type").notNull(),

  transactionDirection: transactionDirectionEnum("transaction_direction").notNull(),

  transactionStatus: transactionStatus("transaction_status").default("completed").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
