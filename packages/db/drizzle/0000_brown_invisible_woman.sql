CREATE TABLE "cpi" (
	"year" integer NOT NULL,
	"month" smallint,
	"value" double precision NOT NULL,
	"is_provisional" boolean DEFAULT false NOT NULL,
	"provisional_note" text,
	CONSTRAINT "cpi_period_key" UNIQUE NULLS NOT DISTINCT("year","month")
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingest_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"series_id" text NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"rows_written" integer NOT NULL,
	"fetched_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"label_attributive" text NOT NULL,
	"unit" text NOT NULL,
	"series_id" text NOT NULL,
	"series_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "items_series_id_unique" UNIQUE("series_id")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"item_slug" text NOT NULL,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	"value" double precision NOT NULL,
	CONSTRAINT "prices_item_period_key" UNIQUE("item_slug","year","month")
);
--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_item_slug_items_slug_fk" FOREIGN KEY ("item_slug") REFERENCES "public"."items"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prices_item_year_idx" ON "prices" USING btree ("item_slug","year");